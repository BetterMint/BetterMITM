from unittest import mock

import pytest

from mitmproxy.contentviews import _compat
from mitmproxy.contentviews.base import View

with pytest.deprecated_call():

    class MockView(View):
        def __init__(self, name: str = "mock"):
            self._name = name
            self.syntax_highlight = "python"

        def __call__(self, data, content_type=None, flow=None, http_message=None):
            return "description", [[("text", "content")]]

        @property
        def name(self) -> str:
            return self._name

        def render_priority(
            self, data, content_type=None, flow=None, http_message=None
        ):
            return 1.0


def test_legacy_contentview():
    mock_view = MockView()
    legacy_view = _compat.LegacyContentview(mock_view)


    assert legacy_view.name == "mock"


    assert legacy_view.syntax_highlight == "python"


    data = b"test data"
    metadata = _compat.Metadata(content_type="text/plain", flow=None, http_message=None)
    assert legacy_view.render_priority(data, metadata) == 1.0


    result = legacy_view.prettify(data, metadata)
    assert result == "content"


def test_get():
    mock_view = MockView()

    with mock.patch("mitmproxy.contentviews.registry", {"mock": mock_view}):
        with pytest.deprecated_call():
            view = _compat.get("mock")
        assert view == mock_view


    with mock.patch("mitmproxy.contentviews.registry", {}):
        with pytest.deprecated_call():
            view = _compat.get("nonexistent")
        assert view is None


def test_remove():

    mock_view = MockView()
    with pytest.deprecated_call():
        _compat.remove(mock_view)
