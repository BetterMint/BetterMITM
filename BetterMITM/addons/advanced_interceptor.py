
import logging
import re
from typing import Optional

from BetterMITM import ctx
from BetterMITM import exceptions
from BetterMITM import flow
from BetterMITM import flowfilter
from BetterMITM import http

logger = logging.getLogger(__name__)


def glob_to_regex(glob_pattern: str) -> str:
    r"""
    Convert a glob pattern to a regex pattern optimized for URLs.
    * matches any sequence of characters
    ** matches any sequence including /
    ? matches a single character

    For URL patterns like *.example.com/*:
    - * before the domain matches subdomains (can include dots)
    - * after / matches paths (can include /)

    Examples:
    *.example.com/* -> .*?\.example\.com/.*
    **.example.com/** -> .*\.example\.com/.*
    """

    if '**' in glob_pattern:
        pattern = re.escape(glob_pattern)
        pattern = pattern.replace(r'\*\*', r'.*')
        pattern = pattern.replace(r'\*', r'[^/]*')
        pattern = pattern.replace(r'\?', r'.')
        return pattern



    if '/' in glob_pattern:
        domain_part, path_part = glob_pattern.split('/', 1)

        domain_regex = re.escape(domain_part).replace(r'\*', r'.*?')

        path_regex = re.escape(path_part).replace(r'\*', r'.*')
        pattern = domain_regex + r'/' + path_regex
    else:

        pattern = re.escape(glob_pattern).replace(r'\*', r'.*?')


    pattern = pattern.replace(r'\?', r'.')

    return pattern


class AdvancedInterceptor:

    flow_states: dict[str, str] = {}
    intercept_urls: list[str] = []
    blocked_urls: list[str] = []
    skip_counters: dict[str, int] = {}
    skip_settings: dict[str, tuple[int, int]] = {}
    match_mode: str = "regex"
    case_sensitive: bool = False
    intercept_methods: list[str] = []
    intercept_status_codes: list[int] = []
    max_intercept_queue: int = 100
    auto_resume_after: float = 0.0
    log_interceptions: bool = True
    intercept_headers: dict[str, str] = {}
    intercept_body_patterns: list[str] = []
    paused_connections: set[str] = set()
    paused_ips: set[str] = set()

    def load(self, loader):
        loader.add_option(
            "advanced_intercept_enabled",
            bool,
            False,
            "Enable advanced interception features",
        )
        loader.add_option(
            "advanced_intercept_inbound",
            bool,
            True,
            "Intercept inbound (response) traffic",
        )
        loader.add_option(
            "advanced_intercept_outbound",
            bool,
            True,
            "Intercept outbound (request) traffic",
        )
        loader.add_option(
            "advanced_intercept_urls",
            str,
            "",
            "Comma-separated list of URL patterns to intercept (supports regex)",
        )
        loader.add_option(
            "advanced_block_urls",
            str,
            "",
            "Comma-separated list of URL patterns to block (supports regex)",
        )
        loader.add_option(
            "advanced_intercept_mode",
            str,
            "pause",
            "Interception mode: 'pause' (wait for user) or 'block' (kill connection)",
        )
        loader.add_option(
            "advanced_skip_domains",
            str,
            "",
            "Comma-separated list of domain:skip_count pairs (e.g., 'example.com:5,api.com:10')",
        )
        loader.add_option(
            "advanced_intercept_match_mode",
            str,
            "regex",
            "URL pattern match mode: 'regex', 'exact', or 'contains'",
        )
        loader.add_option(
            "advanced_intercept_case_sensitive",
            bool,
            False,
            "Case-sensitive pattern matching",
        )
        loader.add_option(
            "advanced_intercept_methods",
            str,
            "",
            "Comma-separated list of HTTP methods to intercept (empty = all): GET,POST,PUT,DELETE,etc.",
        )
        loader.add_option(
            "advanced_intercept_status_codes",
            str,
            "",
            "Comma-separated list of status codes to intercept (empty = all): 200,404,500,etc.",
        )
        loader.add_option(
            "advanced_intercept_max_queue",
            int,
            100,
            "Maximum number of intercepted flows to queue",
        )
        loader.add_option(
            "advanced_intercept_auto_resume",
            float,
            0.0,
            "Auto-resume intercepted flows after N seconds (0 = never)",
        )
        loader.add_option(
            "advanced_intercept_log",
            bool,
            True,
            "Log interception events",
        )
        loader.add_option(
            "advanced_intercept_header_filters",
            str,
            "",
            "Header-based interception: header:value pairs (e.g., 'User-Agent:Bot,Content-Type:json')",
        )
        loader.add_option(
            "advanced_intercept_body_patterns",
            str,
            "",
            "Comma-separated body content patterns to intercept (regex)",
        )

    def configure(self, updated):
        if "advanced_intercept_urls" in updated:
            urls_str = ctx.options.advanced_intercept_urls or ""
            self.intercept_urls = [
                url.strip() for url in urls_str.split(",") if url.strip()
            ]

            if self.intercept_urls and not ctx.options.advanced_intercept_enabled:
                ctx.options.advanced_intercept_enabled = True

                if not hasattr(ctx.options, 'advanced_intercept_outbound') or ctx.options.advanced_intercept_outbound is None:
                    ctx.options.advanced_intercept_outbound = True
                if not hasattr(ctx.options, 'advanced_intercept_inbound') or ctx.options.advanced_intercept_inbound is None:
                    ctx.options.advanced_intercept_inbound = True
                logger.info(
                    f"[AdvancedInterceptor] Auto-enabled interceptor (URL patterns configured)"
                )
            logger.info(
                f"[AdvancedInterceptor] Configured {len(self.intercept_urls)} URL patterns for interception"
            )


        if "advanced_intercept_enabled" in updated:
            if ctx.options.advanced_intercept_enabled and (self.intercept_urls or self.blocked_urls):

                if not hasattr(ctx.options, 'advanced_intercept_outbound') or ctx.options.advanced_intercept_outbound is None:
                    ctx.options.advanced_intercept_outbound = True
                if not hasattr(ctx.options, 'advanced_intercept_inbound') or ctx.options.advanced_intercept_inbound is None:
                    ctx.options.advanced_intercept_inbound = True

        if "advanced_block_urls" in updated:
            urls_str = ctx.options.advanced_block_urls or ""
            self.blocked_urls = [
                url.strip() for url in urls_str.split(",") if url.strip()
            ]
            logger.info(
                f"[AdvancedInterceptor] Configured {len(self.blocked_urls)} URL patterns for blocking"
            )

        if "advanced_skip_domains" in updated:
            skip_str = ctx.options.advanced_skip_domains or ""
            self.skip_settings = {}
            for entry in skip_str.split(","):
                entry = entry.strip()
                if ":" in entry:
                    domain, count_str = entry.split(":", 1)
                    domain = domain.strip()
                    try:
                        count = int(count_str.strip())
                        self.skip_settings[domain] = (count, 0)
                    except ValueError:
                        logger.warning(
                            f"[AdvancedInterceptor] Invalid skip count for {domain}: {count_str}"
                        )
            logger.info(
                f"[AdvancedInterceptor] Configured skip settings for {len(self.skip_settings)} domains"
            )

        if "advanced_intercept_match_mode" in updated:
            self.match_mode = ctx.options.advanced_intercept_match_mode or "regex"

        if "advanced_intercept_case_sensitive" in updated:
            self.case_sensitive = ctx.options.advanced_intercept_case_sensitive

        if "advanced_intercept_methods" in updated:
            methods_str = ctx.options.advanced_intercept_methods or ""
            self.intercept_methods = [
                m.strip().upper() for m in methods_str.split(",") if m.strip()
            ]

        if "advanced_intercept_status_codes" in updated:
            codes_str = ctx.options.advanced_intercept_status_codes or ""
            self.intercept_status_codes = []
            for code_str in codes_str.split(","):
                code_str = code_str.strip()
                if code_str:
                    try:
                        self.intercept_status_codes.append(int(code_str))
                    except ValueError:
                        logger.warning(f"[AdvancedInterceptor] Invalid status code: {code_str}")

        if "advanced_intercept_max_queue" in updated:
            self.max_intercept_queue = ctx.options.advanced_intercept_max_queue or 100

        if "advanced_intercept_auto_resume" in updated:
            self.auto_resume_after = ctx.options.advanced_intercept_auto_resume or 0.0

        if "advanced_intercept_log" in updated:
            self.log_interceptions = ctx.options.advanced_intercept_log

        if "advanced_intercept_header_filters" in updated:
            filters_str = ctx.options.advanced_intercept_header_filters or ""
            self.intercept_headers = {}
            for entry in filters_str.split(","):
                entry = entry.strip()
                if ":" in entry:
                    header, value = entry.split(":", 1)
                    self.intercept_headers[header.strip()] = value.strip()

        if "advanced_intercept_body_patterns" in updated:
            patterns_str = ctx.options.advanced_intercept_body_patterns or ""
            self.intercept_body_patterns = [
                p.strip() for p in patterns_str.split(",") if p.strip()
            ]

    def _matches_url_pattern(self, flow: flow.Flow, patterns: list[str]) -> bool:
        if not patterns:
            return False

        url = None
        if isinstance(flow, http.HTTPFlow):
            if flow.request:
                url = flow.request.pretty_url
            elif flow.response:
                url = getattr(flow.request, "pretty_url", None) if hasattr(flow, "request") else None

        if not url:
            return False

        flags = 0 if self.case_sensitive else re.IGNORECASE

        for pattern in patterns:
            try:
                if self.match_mode == "regex":

                    if '*' in pattern or '?' in pattern:

                        regex_pattern = glob_to_regex(pattern)
                        if re.search(regex_pattern, url, flags):
                            if self.log_interceptions:
                                logger.info(f"[AdvancedInterceptor] Matched glob pattern '{pattern}' (converted to '{regex_pattern}') against URL: {url}")
                            return True

                    if re.search(pattern, url, flags):
                        if self.log_interceptions:
                            logger.info(f"[AdvancedInterceptor] Matched regex pattern '{pattern}' against URL: {url}")
                        return True
                elif self.match_mode == "exact":
                    if (self.case_sensitive and url == pattern) or (not self.case_sensitive and url.lower() == pattern.lower()):
                        if self.log_interceptions:
                            logger.info(f"[AdvancedInterceptor] Matched exact pattern '{pattern}' against URL: {url}")
                        return True
                elif self.match_mode == "contains":
                    if (self.case_sensitive and pattern in url) or (not self.case_sensitive and pattern.lower() in url.lower()):
                        if self.log_interceptions:
                            logger.info(f"[AdvancedInterceptor] Matched contains pattern '{pattern}' against URL: {url}")
                        return True
            except re.error as e:

                if (self.case_sensitive and pattern in url) or (not self.case_sensitive and pattern.lower() in url.lower()):
                    if self.log_interceptions:
                        logger.warning(f"[AdvancedInterceptor] Regex error for pattern '{pattern}': {e}, falling back to contains match")
                    return True

        return False

    def _matches_method(self, flow: flow.Flow) -> bool:
        if not self.intercept_methods:
            return True
        if isinstance(flow, http.HTTPFlow) and flow.request:
            return flow.request.method.upper() in self.intercept_methods
        return False

    def _matches_status_code(self, flow: flow.Flow) -> bool:
        if not self.intercept_status_codes:
            return True
        if isinstance(flow, http.HTTPFlow) and flow.response:
            return flow.response.status_code in self.intercept_status_codes
        return True

    def _matches_headers(self, flow: flow.Flow) -> bool:
        if not self.intercept_headers:
            return True
        if isinstance(flow, http.HTTPFlow) and flow.request:
            for header, value in self.intercept_headers.items():
                if header not in flow.request.headers:
                    return False
                flow_value = flow.request.headers[header]
                if (self.case_sensitive and flow_value != value) or (not self.case_sensitive and flow_value.lower() != value.lower()):
                    return False
        return True

    def _matches_body_patterns(self, flow: flow.Flow) -> bool:
        if not self.intercept_body_patterns:
            return True
        if isinstance(flow, http.HTTPFlow) and flow.request and flow.request.content:
            body = flow.request.content.decode("utf-8", errors="ignore")
            flags = 0 if self.case_sensitive else re.IGNORECASE
            for pattern in self.intercept_body_patterns:
                try:
                    if re.search(pattern, body, flags):
                        return True
                except re.error:
                    if (self.case_sensitive and pattern in body) or (not self.case_sensitive and pattern.lower() in body.lower()):
                        return True
        return True

    def _should_intercept(self, flow: flow.Flow, direction: str) -> bool:


        has_url_patterns = bool(self.intercept_urls or self.blocked_urls)
        is_enabled = ctx.options.advanced_intercept_enabled

        if not is_enabled and not has_url_patterns and not self.paused_connections and not self.paused_ips:
            if self.log_interceptions:
                logger.debug(f"[AdvancedInterceptor] Interception disabled and no URL patterns configured")
            return False

        if flow.is_replay:
            return False


        if isinstance(flow, http.HTTPFlow) and flow.request:

            if flow.client_conn and flow.client_conn.peername:
                client_ip = flow.client_conn.peername[0] if isinstance(flow.client_conn.peername, tuple) else str(flow.client_conn.peername)
                if client_ip in self.paused_ips:
                    return True


            domain = flow.request.pretty_host
            if domain in self.paused_connections:
                return True


        if len([s for s in self.flow_states.values() if s in ("paused", "intercepted")]) >= self.max_intercept_queue:
            if self.log_interceptions:
                logger.warning(f"[AdvancedInterceptor] Intercept queue full, skipping flow {flow.id}")
            return False




        if is_enabled or has_url_patterns:


            outbound_enabled = getattr(ctx.options, 'advanced_intercept_outbound', None)
            inbound_enabled = getattr(ctx.options, 'advanced_intercept_inbound', None)


            if outbound_enabled is None:
                outbound_enabled = True
            if inbound_enabled is None:
                inbound_enabled = True

            if direction == "request" and not outbound_enabled:
                return False
            if direction == "response" and not inbound_enabled:
                return False


        if not self._matches_method(flow):
            return False


        if direction == "response" and not self._matches_status_code(flow):
            return False


        if not self._matches_headers(flow):
            return False


        if not self._matches_body_patterns(flow):
            return False


        domain = None
        if isinstance(flow, http.HTTPFlow) and flow.request:
            domain = flow.request.pretty_host

        if domain and domain in self.skip_settings:
            skip_count, current_count = self.skip_settings[domain]
            if current_count < skip_count:
                self.skip_settings[domain] = (skip_count, current_count + 1)
                if self.log_interceptions:
                    logger.info(
                        f"[AdvancedInterceptor] Skipping flow {flow.id} for {domain} "
                        f"({current_count + 1}/{skip_count})"
                    )
                return False
            else:
                self.skip_settings[domain] = (skip_count, 0)


        if self.intercept_urls:
            if self._matches_url_pattern(flow, self.intercept_urls):
                return True


        if flow.id in self.flow_states:
            state = self.flow_states[flow.id]
            if state in ("paused", "intercepted"):
                return True

        return False

    def _should_block(self, flow: flow.Flow) -> bool:

        has_blocked_urls = bool(self.blocked_urls)
        is_enabled = ctx.options.advanced_intercept_enabled

        if not is_enabled and not has_blocked_urls:
            return False

        if self.blocked_urls:
            if self._matches_url_pattern(flow, self.blocked_urls):
                return True

        if flow.id in self.flow_states:
            if self.flow_states[flow.id] == "blocked":
                return True

        return False

    def _process_flow(self, flow: flow.Flow, direction: str) -> None:
        if self._should_block(flow):
            if flow.killable:
                self.flow_states[flow.id] = "blocked"
                flow.kill()
                if self.log_interceptions:
                    logger.info(
                        f"[AdvancedInterceptor] Blocked {direction} flow: {flow.id}"
                    )
            return

        if self._should_intercept(flow, direction):
            mode = ctx.options.advanced_intercept_mode
            if mode == "block":
                if flow.killable:
                    self.flow_states[flow.id] = "blocked"
                    flow.kill()
                    if self.log_interceptions:
                        logger.info(
                            f"[AdvancedInterceptor] Blocked {direction} flow: {flow.id}"
                        )
            else:
                self.flow_states[flow.id] = "paused"
                flow.intercept()
                if self.log_interceptions:
                    url = getattr(flow.request, "pretty_url", "unknown") if hasattr(flow, "request") and flow.request else "unknown"
                    logger.info(
                        f"[AdvancedInterceptor] Paused {direction} flow: {flow.id} (URL: {url})"
                    )


                if self.auto_resume_after > 0:
                    import asyncio
                    async def auto_resume():
                        await asyncio.sleep(self.auto_resume_after)
                        if flow.id in self.flow_states and self.flow_states[flow.id] == "paused":
                            self.flow_states[flow.id] = "resumed"
                            if flow.resumable:
                                flow.resume()
                    try:
                        loop = asyncio.get_event_loop()
                        loop.create_task(auto_resume())
                    except:
                        pass
        else:

            if self.log_interceptions and (self.intercept_urls or self.blocked_urls):
                url = getattr(flow.request, "pretty_url", "unknown") if hasattr(flow, "request") and flow.request else "unknown"
                if isinstance(flow, http.HTTPFlow) and flow.request:
                    logger.debug(
                        f"[AdvancedInterceptor] Flow {flow.id} (URL: {url}) did not match interception criteria"
                    )

    def request(self, f: http.HTTPFlow) -> None:
        """Called when a request is received - intercept BEFORE it's sent."""
        if self.log_interceptions and (self.intercept_urls or self.blocked_urls or ctx.options.advanced_intercept_enabled):
            url = f.request.pretty_url if f.request else "unknown"
            logger.debug(f"[AdvancedInterceptor] Processing request for flow {f.id} (URL: {url})")

        self._process_flow(f, "request")

    def response(self, f: http.HTTPFlow) -> None:
        """Called when a response is received - intercept BEFORE it's sent to client."""
        if self.log_interceptions and (self.intercept_urls or self.blocked_urls or ctx.options.advanced_intercept_enabled):
            url = f.request.pretty_url if f.request else "unknown"
            logger.debug(f"[AdvancedInterceptor] Processing response for flow {f.id} (URL: {url})")

        self._process_flow(f, "response")

    def tcp_message(self, f):
        if self._should_intercept(f, "request") or self._should_intercept(f, "response"):
            self._process_flow(f, "tcp")

    def udp_message(self, f):
        if self._should_intercept(f, "request") or self._should_intercept(f, "response"):
            self._process_flow(f, "udp")

    def dns_request(self, f):
        self._process_flow(f, "request")

    def dns_response(self, f):
        self._process_flow(f, "response")

    def websocket_message(self, f):
        if self._should_intercept(f, "request") or self._should_intercept(f, "response"):
            self._process_flow(f, "websocket")

    def get_flow_state(self, flow_id: str) -> Optional[str]:
        return self.flow_states.get(flow_id)

    def set_flow_state(self, flow_id: str, state: str) -> None:
        self.flow_states[flow_id] = state

    def clear_flow_state(self, flow_id: str) -> None:
        self.flow_states.pop(flow_id, None)

    def add_paused_connection(self, domain_or_ip: str) -> None:
        """Add a domain or IP to the paused connections list."""
        self.paused_connections.add(domain_or_ip)

        import ipaddress
        try:
            ipaddress.ip_address(domain_or_ip)
            self.paused_ips.add(domain_or_ip)
        except ValueError:
            pass

    def remove_paused_connection(self, domain_or_ip: str) -> None:
        """Remove a domain or IP from the paused connections list."""
        self.paused_connections.discard(domain_or_ip)
        self.paused_ips.discard(domain_or_ip)

    def get_paused_connections(self) -> list[str]:
        """Get list of paused connections (domains and IPs)."""
        return sorted(list(self.paused_connections))


addons = [AdvancedInterceptor()]
