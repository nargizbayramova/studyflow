from sqlalchemy import exc as sa_exc

from app.services import monitoring as m


def test_sliding_window_expires_and_sweeps():
    w = m.SlidingWindow(10)
    assert [w.hit("a", now=t) for t in (0, 1, 2)] == [1, 2, 3]
    assert w.count("a", now=2) == 3
    assert w.hit("a", now=11) == 2  # hits at 0 and 1 aged out
    w.hit("b", now=0)
    w.sweep(now=12)
    assert set(w.hits) == {"a"}


def test_rolling_average():
    r = m.RollingAverage(10)
    assert r.add(1, now=0) == (1, 1)
    assert r.add(3, now=5) == (2, 2)
    assert r.add(5, now=12) == (4, 2)  # first sample dropped


def test_alert_rules_and_cooldown(monkeypatch):
    m.failed_logins.hits.clear()
    sent: list[tuple[str, str]] = []
    monkeypatch.setattr(m, "alert", lambda rule, msg: sent.append((rule, msg)))
    for _ in range(m.LOGIN_FAILS):
        m.record_login("x@y.z", "1.2.3.4", success=False, user_id=142)
    assert [r for r, _ in sent] == ["login:email:x@y.z", "login:ip:1.2.3.4"]
    assert "account user_id #142" in sent[0][1]

    sent.clear()
    m.record_login("x@y.z", "1.2.3.4", success=True, user_id=142)  # alerts & resets account counter
    assert [r for r, _ in sent] == ["login_success:email:x@y.z"]
    assert "Successful login for account user_id #142 following 3 consecutive failed attempts." in sent[0][1]

    sent.clear()
    m.record_login("x@y.z", "1.2.3.4", success=False, user_id=142)
    assert [r for r, _ in sent] == ["login:ip:1.2.3.4"]  # IP is still over the limit; account isn't


def test_ai_db_server_and_latency_rules(monkeypatch):
    m.ai_errors.hits.clear()
    m.db_errors.hits.clear()
    m.server_errors.hits.clear()
    m.latency.samples.clear()
    m.latency.total = 0.0

    sent: list[tuple[str, str]] = []
    monkeypatch.setattr(m, "alert", lambda rule, msg: sent.append((rule, msg)))

    # 1. AI Scheduling Service (3 failures in 5 min) + deduplication on same exception instance
    err = TimeoutError("Gemini timed out")
    m.record_ai_failure(err)
    m.record_ai_failure(err)  # duplicate exception object ignored
    m.record_ai_failure(TimeoutError("2"))
    assert sent == []
    m.record_ai_failure(TimeoutError("3"))
    assert [r for r, _ in sent] == ["ai_service"]
    assert "[ALERT] AI Service Degradation" in sent[0][1]

    # 2. Database Connectivity (2 errors in 1 min) & Unhandled Server Errors (3 errors in 2 min)
    sent.clear()
    db_exc = sa_exc.OperationalError("SELECT 1", {}, Exception("conn down"))
    m.record_exception(db_exc)
    assert sent == []
    m.record_exception(db_exc)
    assert [r for r, _ in sent] == ["database"]
    m.record_exception(RuntimeError("boom"))
    assert [r for r, _ in sent] == ["database", "server_errors"]

    # 3. Response Latency (> 3.5s average over 5-min rolling window)
    sent.clear()
    m.record_latency(4.2)
    assert [r for r, _ in sent] == ["latency"]
    assert "4.2s" in sent[0][1]


def test_ai_success_alert(monkeypatch):
    m.ai_errors.hits.clear()
    sent: list[tuple[str, str]] = []
    monkeypatch.setattr(m, "alert", lambda rule, msg, cooldown_s=None: sent.append((rule, msg)))

    # Normal success
    m.record_ai_success("Schedule Generation", "Generated 4 study blocks", user_id=10)
    assert len(sent) == 1
    assert sent[0][0] == "ai_success:Schedule Generation:10"
    assert "[SUCCESS] ✅ AI Schedule Generation for user #10: Generated 4 study blocks." in sent[0][1]

    # Success after failures (recovery)
    for _ in range(m.AI_ERRORS):
        m.record_ai_failure()
    assert m.ai_errors.count() == m.AI_ERRORS
    sent.clear()

    m.record_ai_success("Schedule Rebalance", "Rebalanced 6 blocks", user_id=10)
    assert len(sent) == 1
    assert "recovered from 3 recent failures" in sent[0][1]
    assert m.ai_errors.count() == 0  # failure count reset


def test_alert_cooldown(monkeypatch):
    monkeypatch.setattr(m, "_client", None)  # no network
    m._last_alert.clear()
    logged = []
    monkeypatch.setattr(m.logger, "warning", logged.append)
    m.alert("r", "one")
    m.alert("r", "two")
    assert logged == ["one"]
