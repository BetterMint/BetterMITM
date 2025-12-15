"""
Mock Response Addon - Intercepts requests and sends fake responses
"""
import logging
import re
import json
from typing import Optional, Dict, Any

from BetterMITM import ctx
from BetterMITM import http
from BetterMITM.net.http import status_codes

logger = logging.getLogger(__name__)


class MockResponses:
    """
    Addon that intercepts HTTP requests matching patterns and returns mock responses
    instead of forwarding to the real server.
    """

    def __init__(self):
        self.mock_responses: Dict[str, Dict[str, Any]] = {}
        self.enabled = True
        self.match_mode = "regex"
        self.priority_order = "first"
        self.log_interceptions = True
        self.block_real_requests = True

    def load(self, loader):
        loader.add_option(
            "mock_responses_enabled",
            bool,
            True,
            "Enable mock response interception",
        )
        loader.add_option(
            "mock_responses_match_mode",
            str,
            "regex",
            "Match mode: 'regex', 'exact', or 'contains'",
        )
        loader.add_option(
            "mock_responses_priority_order",
            str,
            "first",
            "Priority order: 'first', 'priority', or 'last'",
        )
        loader.add_option(
            "mock_responses_block_real",
            bool,
            True,
            "Block real requests when mock response is active",
        )
        loader.add_option(
            "mock_responses_log",
            bool,
            True,
            "Log mock response interceptions",
        )

    def configure(self, updated):
        if "mock_responses_enabled" in updated:
            self.enabled = ctx.options.mock_responses_enabled
        if "mock_responses_match_mode" in updated:
            self.match_mode = ctx.options.mock_responses_match_mode
        if "mock_responses_priority_order" in updated:
            self.priority_order = ctx.options.mock_responses_priority_order
        if "mock_responses_block_real" in updated:
            self.block_real_requests = ctx.options.mock_responses_block_real
        if "mock_responses_log" in updated:
            self.log_interceptions = ctx.options.mock_responses_log

    def _load_mock_responses_from_master(self):
        """Load mock responses from the master's storage"""
        if hasattr(ctx.master, "_mock_responses"):
            self.mock_responses = ctx.master._mock_responses
        else:
            self.mock_responses = {}

    def _matches_pattern(self, url: str, pattern: str) -> bool:
        """Check if URL matches the pattern based on match mode"""
        if not pattern:
            return False

        if self.match_mode == "exact":
            return url == pattern
        elif self.match_mode == "contains":
            return pattern.lower() in url.lower()
        else:
            try:
                return bool(re.search(pattern, url, re.IGNORECASE))
            except re.error:
                logger.warning(f"Invalid regex pattern: {pattern}")
                return pattern.lower() in url.lower()

    def _matches_conditions(self, flow: http.HTTPFlow, conditions: list) -> bool:
        """Check if flow matches all conditions"""
        if not conditions:
            return True

        for condition in conditions:
            cond_type = condition.get("type")
            operator = condition.get("operator", "equals")
            value = condition.get("value", "")
            key = condition.get("key", "")

            if cond_type == "method":
                flow_value = flow.request.method if flow.request else ""
                if operator == "equals" and flow_value != value:
                    return False
                elif operator == "contains" and value not in flow_value:
                    return False
            elif cond_type == "header":
                if not flow.request:
                    return False
                header_value = flow.request.headers.get(key, "")
                if operator == "equals" and header_value != value:
                    return False
                elif operator == "contains" and value not in header_value:
                    return False
            elif cond_type == "body":
                body = flow.request.content.decode("utf-8", errors="ignore") if flow.request and flow.request.content else ""
                if operator == "equals" and body != value:
                    return False
                elif operator == "contains" and value not in body:
                    return False

        return True

    def _find_matching_mock(self, flow: http.HTTPFlow) -> Optional[Dict[str, Any]]:
        """Find the best matching mock response for this flow"""
        if not self.enabled or not flow.request:
            return None

        self._load_mock_responses_from_master()

        if not self.mock_responses:
            return None

        url = flow.request.pretty_url
        matches = []


        for mock_id, mock in self.mock_responses.items():
            if not mock.get("enabled", True):
                continue

            pattern = mock.get("pattern", "")
            if not pattern:
                continue


            mock_match_mode = mock.get("matchMode", mock.get("match_mode", self.match_mode))
            original_mode = self.match_mode
            self.match_mode = mock_match_mode

            if not self._matches_pattern(url, pattern):
                self.match_mode = original_mode
                continue

            self.match_mode = original_mode


            conditions = mock.get("conditions", [])
            if not self._matches_conditions(flow, conditions):
                continue

            priority = mock.get("priority", 0)
            matches.append((priority, mock_id, mock))

        if not matches:
            return None


        if self.priority_order == "priority":
            matches.sort(key=lambda x: x[0], reverse=True)
        elif self.priority_order == "last":
            matches.sort(key=lambda x: x[0])


        return matches[0][2]

    def _create_response_from_mock(self, flow: http.HTTPFlow, mock: Dict[str, Any]) -> None:
        """Create and set a fake response from mock data"""
        try:

            status_code = mock.get("statusCode", mock.get("status_code", 200))


            headers_dict = {}
            mock_headers = mock.get("headers", [])
            if isinstance(mock_headers, list):
                for header in mock_headers:
                    if isinstance(header, dict):
                        key = header.get("key", "")
                        value = header.get("value", "")
                        if key:
                            headers_dict[key] = value
                    elif isinstance(header, (list, tuple)) and len(header) >= 2:
                        headers_dict[str(header[0])] = str(header[1])


            if "Content-Type" not in headers_dict and "content-type" not in {k.lower() for k in headers_dict.keys()}:
                body_type = mock.get("bodyType", mock.get("body_type", "json"))
                content_type_map = {
                    "json": "application/json",
                    "html": "text/html",
                    "xml": "application/xml",
                    "text": "text/plain",
                    "raw": "application/octet-stream",
                }
                headers_dict["Content-Type"] = content_type_map.get(body_type, "application/json")


            body = mock.get("body", "")
            body_bytes = b""
            if body:
                if isinstance(body, bytes):
                    body_bytes = body
                elif isinstance(body, str):
                    body_bytes = body.encode("utf-8")


            delay_ms = mock.get("delay", 0)
            if delay_ms and delay_ms > 0:
                import time
                time.sleep(delay_ms / 1000.0)


            flow.response = http.Response.make(
                status_code,
                body_bytes,
                headers_dict
            )


            if self.block_real_requests:
                flow.intercepted = True

            if self.log_interceptions:
                logger.info(
                    f"[MockResponses] Intercepted {flow.request.method} {flow.request.pretty_url} "
                    f"-> Mock response {status_code} (mock: {mock.get('name', 'unnamed')}, "
                    f"priority: {mock.get('priority', 0)}, delay: {delay_ms}ms)"
                )

        except Exception as e:
            logger.error(f"[MockResponses] Failed to create mock response: {e}")


    def request(self, flow: http.HTTPFlow) -> None:
        """Intercept request and check for matching mock response"""
        if not self.enabled or not flow.live or flow.is_replay:
            return

        if not flow.request:
            return

        mock = self._find_matching_mock(flow)
        if mock:
            self._create_response_from_mock(flow, mock)

            return


addons = [MockResponses()]

