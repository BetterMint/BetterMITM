import logging
import asyncio
import time
from typing import Dict, Optional, Tuple
from collections import defaultdict
from BetterMITM import ctx
from BetterMITM import flow
from BetterMITM import http

logger = logging.getLogger(__name__)


class RateLimiter:
    connection_pools: Dict[str, int] = {}
    rate_limits: Dict[str, Tuple[int, int]] = {}
    request_counts: Dict[str, list[float]] = defaultdict(list)
    throttles: Dict[str, float] = {}
    global_rate_limit: Optional[Tuple[int, int]] = None
    global_throttle: float = 0.0
    burst_allowance: Dict[str, int] = {}
    queue_size: Dict[str, int] = {}
    timeout: float = 30.0
    log_rate_limits: bool = True
    rate_limit_strategy: str = "drop"
    max_queue_size: int = 100
    queue_timeout: float = 60.0

    def load(self, loader):
        loader.add_option(
            "rate_limit_enabled",
            bool,
            False,
            "Enable rate limiting",
        )
        loader.add_option(
            "rate_limit_config",
            str,
            "",
            "Rate limit configuration: domain:requests:seconds (e.g., 'example.com:10:60')",
        )
        loader.add_option(
            "rate_limit_global",
            str,
            "",
            "Global rate limit: requests:seconds (e.g., '100:60' for 100 requests per 60 seconds)",
        )
        loader.add_option(
            "connection_pool_config",
            str,
            "",
            "Connection pool configuration: domain:size (e.g., 'example.com:5')",
        )
        loader.add_option(
            "throttle_config",
            str,
            "",
            "Throttle configuration: domain:delay_ms (e.g., 'example.com:100')",
        )
        loader.add_option(
            "throttle_global",
            float,
            0.0,
            "Global throttle delay in milliseconds",
        )
        loader.add_option(
            "rate_limit_burst",
            str,
            "",
            "Burst allowance: domain:burst_size (e.g., 'example.com:5')",
        )
        loader.add_option(
            "rate_limit_queue_size",
            str,
            "",
            "Queue size per domain: domain:size (e.g., 'example.com:10')",
        )
        loader.add_option(
            "rate_limit_timeout",
            float,
            30.0,
            "Connection timeout in seconds",
        )
        loader.add_option(
            "rate_limit_log",
            bool,
            True,
            "Log rate limit events",
        )
        loader.add_option(
            "rate_limit_strategy",
            str,
            "drop",
            "Rate limit strategy: 'drop' (kill), 'queue' (queue requests), or 'delay' (slow down)",
        )
        loader.add_option(
            "rate_limit_max_queue",
            int,
            100,
            "Maximum queue size for queued requests",
        )
        loader.add_option(
            "rate_limit_queue_timeout",
            float,
            60.0,
            "Maximum time to wait in queue (seconds)",
        )

    def configure(self, updated):
        if "rate_limit_config" in updated:
            config_str = ctx.options.rate_limit_config or ""
            self.rate_limits = {}
            for entry in config_str.split(","):
                entry = entry.strip()
                if ":" in entry:
                    parts = entry.split(":")
                    if len(parts) == 3:
                        domain, requests_str, seconds_str = parts
                        try:
                            requests = int(requests_str.strip())
                            seconds = int(seconds_str.strip())
                            self.rate_limits[domain.strip()] = (requests, seconds)
                        except ValueError:
                            logger.warning(f"[RateLimiter] Invalid config: {entry}")

        if "rate_limit_global" in updated:
            global_str = ctx.options.rate_limit_global or ""
            if global_str and ":" in global_str:
                parts = global_str.split(":")
                try:
                    requests = int(parts[0].strip())
                    seconds = int(parts[1].strip())
                    self.global_rate_limit = (requests, seconds)
                except ValueError:
                    logger.warning(f"[RateLimiter] Invalid global rate limit: {global_str}")

        if "connection_pool_config" in updated:
            config_str = ctx.options.connection_pool_config or ""
            self.connection_pools = {}
            for entry in config_str.split(","):
                entry = entry.strip()
                if ":" in entry:
                    domain, size_str = entry.split(":", 1)
                    try:
                        self.connection_pools[domain.strip()] = int(size_str.strip())
                    except ValueError:
                        logger.warning(f"[RateLimiter] Invalid pool config: {entry}")

        if "throttle_config" in updated:
            config_str = ctx.options.throttle_config or ""
            self.throttles = {}
            for entry in config_str.split(","):
                entry = entry.strip()
                if ":" in entry:
                    domain, delay_str = entry.split(":", 1)
                    try:
                        self.throttles[domain.strip()] = float(delay_str.strip()) / 1000.0
                    except ValueError:
                        logger.warning(f"[RateLimiter] Invalid throttle config: {entry}")

        if "throttle_global" in updated:
            self.global_throttle = (ctx.options.throttle_global or 0.0) / 1000.0

        if "rate_limit_burst" in updated:
            config_str = ctx.options.rate_limit_burst or ""
            self.burst_allowance = {}
            for entry in config_str.split(","):
                entry = entry.strip()
                if ":" in entry:
                    domain, burst_str = entry.split(":", 1)
                    try:
                        self.burst_allowance[domain.strip()] = int(burst_str.strip())
                    except ValueError:
                        logger.warning(f"[RateLimiter] Invalid burst config: {entry}")

        if "rate_limit_queue_size" in updated:
            config_str = ctx.options.rate_limit_queue_size or ""
            self.queue_size = {}
            for entry in config_str.split(","):
                entry = entry.strip()
                if ":" in entry:
                    domain, size_str = entry.split(":", 1)
                    try:
                        self.queue_size[domain.strip()] = int(size_str.strip())
                    except ValueError:
                        logger.warning(f"[RateLimiter] Invalid queue size config: {entry}")

        if "rate_limit_timeout" in updated:
            self.timeout = ctx.options.rate_limit_timeout or 30.0

        if "rate_limit_log" in updated:
            self.log_rate_limits = ctx.options.rate_limit_log

        if "rate_limit_strategy" in updated:
            self.rate_limit_strategy = ctx.options.rate_limit_strategy or "drop"

        if "rate_limit_max_queue" in updated:
            self.max_queue_size = ctx.options.rate_limit_max_queue or 100

        if "rate_limit_queue_timeout" in updated:
            self.queue_timeout = ctx.options.rate_limit_queue_timeout or 60.0

    def _get_domain(self, flow: flow.Flow) -> Optional[str]:
        if isinstance(flow, http.HTTPFlow) and flow.request:
            return flow.request.pretty_host
        return None

    def _check_rate_limit(self, domain: str) -> Tuple[bool, Optional[str]]:
        """Check rate limit, return (allowed, reason)"""
        now = time.time()


        if self.global_rate_limit:
            requests, seconds = self.global_rate_limit
            global_key = "__global__"
            self.request_counts[global_key] = [
                t for t in self.request_counts[global_key]
                if now - t < seconds
            ]
            if len(self.request_counts[global_key]) >= requests:
                return False, "Global rate limit exceeded"
            self.request_counts[global_key].append(now)


        if domain not in self.rate_limits:
            return True, None

        requests, seconds = self.rate_limits[domain]


        self.request_counts[domain] = [
            t for t in self.request_counts[domain]
            if now - t < seconds
        ]


        burst = self.burst_allowance.get(domain, 0)
        current_count = len(self.request_counts[domain])

        if current_count >= requests + burst:
            if self.log_rate_limits:
                logger.warning(f"[RateLimiter] Rate limit exceeded for {domain} ({current_count}/{requests + burst})")
            return False, f"Rate limit exceeded ({current_count}/{requests + burst})"

        self.request_counts[domain].append(now)
        return True, None

    async def _apply_throttle(self, domain: str):
        """Apply throttling delay"""
        delay = 0.0


        if self.global_throttle > 0:
            delay += self.global_throttle


        if domain in self.throttles:
            delay += self.throttles[domain]

        if delay > 0:
            await asyncio.sleep(delay)

    def request(self, f: http.HTTPFlow) -> None:
        if not ctx.options.rate_limit_enabled:
            return

        domain = self._get_domain(f)
        if not domain:
            return


        allowed, reason = self._check_rate_limit(domain)

        if not allowed:
            if self.rate_limit_strategy == "drop":
                if f.killable:
                    f.kill()
                    if self.log_rate_limits:
                        logger.info(f"[RateLimiter] Killed request to {domain} due to rate limit: {reason}")
                return
            elif self.rate_limit_strategy == "queue":
                queue_size = self.queue_size.get(domain, self.max_queue_size)
                current_queue = len([s for s in self.request_counts.get(f"{domain}_queue", [])])
                if current_queue >= queue_size:
                    if f.killable:
                        f.kill()
                        if self.log_rate_limits:
                            logger.warning(f"[RateLimiter] Queue full for {domain}, killing request")
                    return

                if self.log_rate_limits:
                    logger.info(f"[RateLimiter] Queued request to {domain}")
            elif self.rate_limit_strategy == "delay":

                delay = self.timeout
                if self.log_rate_limits:
                    logger.info(f"[RateLimiter] Delaying request to {domain} by {delay}s")


        asyncio.create_task(self._apply_throttle(domain))


addons = [RateLimiter()]
