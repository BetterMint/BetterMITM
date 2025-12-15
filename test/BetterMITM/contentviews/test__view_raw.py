from mitmproxy.contentviews._api import Metadata
from mitmproxy.contentviews._view_raw import raw


def test_view_raw():
    meta = Metadata()
    assert raw.prettify(b"foo", meta)

    assert raw.prettify("🫠".encode(), meta) == "🫠"

    assert raw.prettify(b"\xff", meta) == r"\xff"


def test_render_priority():
    assert raw.render_priority(b"data", Metadata()) == 0.1
