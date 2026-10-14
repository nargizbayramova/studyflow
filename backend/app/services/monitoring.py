"""Monitoring & Telegram alerting (see "Monitoring Matrix" in Project_Proposal.md).

shortcut: counters live in process memory, so each uvicorn worker alerts independently and
state resets on restart; move windows to Redis/Postgres when running more than one worker.
"""
import asyncio
import logging
import time
from collections import deque

import httpx
from sqlalchemy import exc as sa_exc
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine

logger = logging.getLogger("studyflow.monitoring")

ALERT_COOLDOWN_S = 300  # same rule re-alerts at most every 5 min, so an outage doesn't spam the channel
HEALTH_INTERVAL_S = 60
HEALTH_FAILS = 3
LATENCY_WINDOW_S, LATENCY_THRESHOLD_S, LATENCY_MIN_SAMPLES = 300, 3.5, 5
DB_ERRORS, DB_WINDOW_S = 2, 60
SERVER_ERRORS, SERVER_WINDOW_S = 3, 120
LOGIN_FAILS, LOGIN_WINDOW_S = 5, 180


class SlidingWindow:
    """Counts events per key over the last `seconds`."""

    def __init__(self, seconds: float) -> None:
        self.seconds = seconds
        self.hits: dict[str, deque[float]] = {}

    def hit(self, key: str = "*", now: float | None = None) -> int:
        now = time.monotonic() if now is None else now
        q = self.hits.setdefault(key, deque())
        q.append(now)
        while q[0] <= now - self.seconds:
            q.popleft()
        return len(q)

    def reset(self, key: str) -> None:
        self.hits.pop(key, None)

    def sweep(self, now: float | None = None) -> None:
        """Drop stale keys so sprayed keys (e.g. random emails) can't grow memory forever."""
        cutoff = (time.monotonic() if now is None else now) - self.seconds
        for key in [k for k, q in self.hits.items() if q[-1] <= cutoff]:
            del self.hits[key]


class RollingAverage:
    """Average of values recorded over the last `seconds`, O(1) amortized per sample."""

    def __init__(self, seconds: float) -> None:
        self.seconds = seconds
        self.samples: deque[tuple[float, float]] = deque()
        self.total = 0.0

    def add(self, value: float, now: float | None = None) -> tuple[float, int]:
        now = time.monotonic() if now is None else now
        self.samples.append((now, value))
        self.total += value
        while self.samples[0][0] <= now - self.seconds:
            self.total -= self.samples.popleft()[1]
        return self.total / len(self.samples), len(self.samples)


server_errors = SlidingWindow(SERVER_WINDOW_S)
db_errors = SlidingWindow(DB_WINDOW_S)
failed_logins = SlidingWindow(LOGIN_WINDOW_S)
latency = RollingAverage(LATENCY_WINDOW_S)
_last_alert: dict[str, float] = {}
_bg_tasks: set[asyncio.Task] = set()
_client: httpx.AsyncClient | None = None


def _utc_now() -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())


def alert(rule: str, message: str) -> None:
    """Log and fire-and-forget a Telegram message, rate-limited per rule."""
    now = time.monotonic()
    if now - _last_alert.get(rule, -ALERT_COOLDOWN_S) < ALERT_COOLDOWN_S:
        return
    _last_alert[rule] = now
    logger.warning(message)
    if _client and settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID:
        task = asyncio.create_task(_send_telegram(message))
        _bg_tasks.add(task)  # keep a reference so the task isn't garbage-collected mid-flight
        task.add_done_callback(_bg_tasks.discard)


async def _send_telegram(message: str) -> None:
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        r = await _client.post(url, json={"chat_id": settings.TELEGRAM_CHAT_ID, "text": message})
        r.raise_for_status()
    except httpx.HTTPError as e:
        logger.error("Telegram alert failed: %s", type(e).__name__)  # never log the URL: it holds the token


# --- Rules -----------------------------------------------------------------------------------

def record_latency(seconds: float) -> None:
    avg, n = latency.add(seconds)
    if n >= LATENCY_MIN_SAMPLES and avg > LATENCY_THRESHOLD_S:
        alert("latency", f"[WARNING] High API Latency: Average response time reached {avg:.1f}s "
                         f"over the last 5 minutes (threshold: {LATENCY_THRESHOLD_S}s).")


def record_exception(e: Exception) -> None:
    if isinstance(e, (sa_exc.OperationalError, sa_exc.InterfaceError, sa_exc.TimeoutError)):
        if db_errors.hit() >= DB_ERRORS:
            alert("database", "[CRITICAL] Database Connection Error: PostgreSQL connection pool "
                              f"exhausted or database unreachable ({DB_ERRORS} errors in 1 min).")
    if server_errors.hit() >= SERVER_ERRORS:
        alert("server_errors", f"[ALERT] Unhandled Exceptions: {SERVER_ERRORS} HTTP 500 errors "
                               "recorded in the last 2 minutes. Inspect backend error logs immediately.")


def record_login(email: str, ip: str, success: bool) -> None:
    if success:
        failed_logins.reset(f"email:{email}")
        return
    for key in (f"email:{email}", f"ip:{ip}"):
        if failed_logins.hit(key) >= LOGIN_FAILS:
            alert(f"login:{key}", f"[SECURITY] Brute-Force Alert: {LOGIN_FAILS} failed login attempts "
                                  f"detected for {key} within 3 minutes.")


# --- Background health probe -----------------------------------------------------------------

async def _health_loop() -> None:
    fails = 0
    while True:
        await asyncio.sleep(HEALTH_INTERVAL_S)
        failed_logins.sweep()
        try:
            async with asyncio.timeout(10):
                async with engine.connect() as conn:
                    await conn.execute(text("SELECT 1"))
            fails = 0
        except Exception:
            fails += 1
            logger.exception("Health probe failed (%d in a row)", fails)
            if fails >= HEALTH_FAILS:
                alert("health", "[CRITICAL] Backend Health Check Failed: Server is unreachable or "
                                f"unresponsive at {_utc_now()}.")


async def start() -> None:
    global _client
    _client = httpx.AsyncClient(timeout=5)
    task = asyncio.create_task(_health_loop())
    _bg_tasks.add(task)


async def stop() -> None:
    for task in list(_bg_tasks):
        task.cancel()
    await asyncio.gather(*_bg_tasks, return_exceptions=True)
    if _client:
        await _client.aclose()
