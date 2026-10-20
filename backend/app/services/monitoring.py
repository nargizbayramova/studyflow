"""Monitoring & Telegram alerting (see "Monitoring Matrix" in Project_Proposal.md).

shortcut: counters live in process memory, so each uvicorn worker alerts independently and
state resets on restart; move windows to Redis/Postgres when running more than one worker.
"""
import asyncio
from collections import deque
import contextlib
import logging
import os
import time

import httpx
from sqlalchemy import exc as sa_exc
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine

logger = logging.getLogger("studyflow.monitoring")

ALERT_COOLDOWN_S = int(os.getenv("ALERT_COOLDOWN_S", "10" if settings.ENVIRONMENT == "development" else "300"))
HEALTH_INTERVAL_S = 60
HEALTH_FAILS = 3
AI_ERRORS, AI_WINDOW_S = 3, 300
LATENCY_WINDOW_S, LATENCY_THRESHOLD_S, LATENCY_MIN_SAMPLES = 300, 3.5, 1
DB_ERRORS, DB_WINDOW_S = 2, 60
SERVER_ERRORS, SERVER_WINDOW_S = 3, 120
LOGIN_FAILS, LOGIN_WINDOW_S = 3, 180


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

    def count(self, key: str = "*", now: float | None = None) -> int:
        now = time.monotonic() if now is None else now
        q = self.hits.get(key)
        if not q:
            return 0
        while q and q[0] <= now - self.seconds:
            q.popleft()
        return len(q)

    def reset(self, key: str = "*") -> None:
        self.hits.pop(key, None)

    def sweep(self, now: float | None = None) -> None:
        """Drop stale keys so sprayed keys (e.g. random emails) can't grow memory forever."""
        cutoff = (time.monotonic() if now is None else now) - self.seconds
        for key in [k for k, q in self.hits.items() if not q or q[-1] <= cutoff]:
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


ai_errors = SlidingWindow(AI_WINDOW_S)
server_errors = SlidingWindow(SERVER_WINDOW_S)
db_errors = SlidingWindow(DB_WINDOW_S)
failed_logins = SlidingWindow(LOGIN_WINDOW_S)
latency = RollingAverage(LATENCY_WINDOW_S)
_last_alert: dict[str, float] = {}
_bg_tasks: set[asyncio.Task] = set()
_client: httpx.AsyncClient | None = None


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=10)
    return _client


def _utc_now() -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())


def _telegram_credentials() -> tuple[str | None, str | None]:
    token = os.getenv("TELEGRAM_BOT_TOKEN") or settings.TELEGRAM_BOT_TOKEN
    chat_id = os.getenv("TELEGRAM_CHAT_ID") or settings.TELEGRAM_CHAT_ID
    return token, chat_id


def alert(rule: str, message: str, cooldown_s: int | None = None) -> None:
    """Log and fire-and-forget a Telegram message, rate-limited per rule."""
    now = time.monotonic()
    limit = cooldown_s if cooldown_s is not None else ALERT_COOLDOWN_S
    if now - _last_alert.get(rule, -limit) < limit:
        return
    _last_alert[rule] = now
    if message.startswith("[SUCCESS]"):
        logger.info(message)
    else:
        logger.warning(message)
    token, chat_id = _telegram_credentials()
    if not (token and chat_id):
        logger.warning("Telegram alert skipped: bot token or chat ID not set in environment.")
        return

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        task = loop.create_task(_send_telegram(token, chat_id, message))
        _bg_tasks.add(task)
        task.add_done_callback(_bg_tasks.discard)
    else:
        # Fallback when alert is invoked outside of an active running loop
        try:
            asyncio.run(_send_telegram(token, chat_id, message))
        except Exception as exc:
            logger.exception("Failed to run sync fallback for Telegram alert: %s", exc)


async def _send_telegram(token: str, chat_id: str, message: str) -> None:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        client = await _get_client()
        r = await client.post(url, json={"chat_id": chat_id, "text": message})
        if r.status_code != 200:
            logger.error("Telegram API returned HTTP %d: %s", r.status_code, r.text)
        else:
            logger.info("Telegram alert delivered successfully: %s", r.json().get("result", {}).get("message_id"))
    except httpx.HTTPError as e:
        detail = f": {e.response.text}" if hasattr(e, "response") and e.response is not None else ""
        logger.error("Telegram alert request failed: %s%s", type(e).__name__, detail)
    except Exception as e:
        logger.exception("Unexpected error in _send_telegram: %s", e)


# --- Rules -----------------------------------------------------------------------------------

def record_ai_success(action: str, details: str, user_id: int | None = None) -> None:
    prior_fails = ai_errors.count()
    ai_errors.reset()
    user_str = f" for user #{user_id}" if user_id is not None else ""
    recovery_note = f" (recovered from {prior_fails} recent failures)" if prior_fails >= AI_ERRORS else ""
    msg = f"[SUCCESS] ✅ AI {action}{user_str}: {details}.{recovery_note}"
    alert(f"ai_success:{action}:{user_id}", msg, cooldown_s=5)


def record_ai_failure(e: Exception | None = None) -> None:
    if e is not None:
        if getattr(e, "_ai_monitored", False):
            return
        with contextlib.suppress(Exception):
            setattr(e, "_ai_monitored", True)
    if ai_errors.hit() >= AI_ERRORS:
        alert(
            "ai_service",
            f"[ALERT] AI Service Degradation: At least {AI_ERRORS} AI scheduling requests "
            "failed or timed out within the last 5 minutes. Check API quota, "
            "provider availability, and network connectivity.",
        )


def record_latency(seconds: float) -> None:
    avg, n = latency.add(seconds)
    if n >= LATENCY_MIN_SAMPLES and avg > LATENCY_THRESHOLD_S:
        alert("latency", f"[WARNING] High API Latency: Average response time reached {avg:.1f}s "
                         f"over the last 5 minutes (threshold: {LATENCY_THRESHOLD_S}s).")


def record_db_error() -> None:
    if db_errors.hit() >= DB_ERRORS:
        alert("database", "[CRITICAL] Database Connection Error: PostgreSQL connection pool "
                          f"exhausted or database unreachable ({DB_ERRORS} errors in 1 min).")


def record_server_error() -> None:
    if server_errors.hit() >= SERVER_ERRORS:
        alert("server_errors", f"[ALERT] Unhandled Exceptions: {SERVER_ERRORS} HTTP 500 errors "
                               "recorded in the last 2 minutes. Inspect backend error logs immediately.")


def record_exception(e: Exception) -> None:
    if isinstance(e, (sa_exc.OperationalError, sa_exc.InterfaceError, sa_exc.TimeoutError)):
        record_db_error()
    record_server_error()


def record_login(email: str, ip: str, success: bool, user_id: int | None = None) -> None:
    account_label = f"account user_id #{user_id}" if user_id is not None else f"account {email}"
    email_key = f"email:{email}"
    ip_key = f"ip:{ip}"
    if success:
        prior_fails = failed_logins.count(email_key)
        failed_logins.reset(email_key)
        _last_alert.pop(f"login:{email_key}", None)
        if prior_fails >= LOGIN_FAILS:
            alert(
                f"login_success:{email_key}",
                f"[SECURITY] Login Alert: Successful login for {account_label} "
                f"following {prior_fails} consecutive failed attempts.",
            )
        return
    if failed_logins.hit(email_key) >= LOGIN_FAILS:
        alert(
            f"login:{email_key}",
            f"[SECURITY] Login Alert: {LOGIN_FAILS} consecutive failed login attempts "
            f"detected for {account_label} within 3 minutes.",
        )
    if failed_logins.hit(ip_key) >= LOGIN_FAILS:
        alert(
            f"login:{ip_key}",
            f"[SECURITY] Login Alert: {LOGIN_FAILS} consecutive failed login attempts "
            f"detected for IP {ip} within 3 minutes.",
        )


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
