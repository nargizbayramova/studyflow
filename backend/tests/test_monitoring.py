from app.services import monitoring as m


def test_sliding_window_expires_and_sweeps():
    w = m.SlidingWindow(10)
    assert [w.hit("a", now=t) for t in (0, 1, 2)] == [1, 2, 3]
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
    sent = []
    monkeypatch.setattr(m, "alert", lambda rule, msg: sent.append(rule))
    for _ in range(m.LOGIN_FAILS):
        m.record_login("x@y.z", "1.2.3.4", success=False)
    assert sent == ["login:email:x@y.z", "login:ip:1.2.3.4"]

    sent.clear()
    m.record_login("x@y.z", "1.2.3.4", success=True)  # resets the account counter
    m.record_login("x@y.z", "1.2.3.4", success=False)
    assert sent == ["login:ip:1.2.3.4"]  # IP is still over the limit; account isn't


def test_alert_cooldown(monkeypatch):
    monkeypatch.setattr(m, "_client", None)  # no network
    m._last_alert.clear()
    logged = []
    monkeypatch.setattr(m.logger, "warning", logged.append)
    m.alert("r", "one")
    m.alert("r", "two")
    assert logged == ["one"]
