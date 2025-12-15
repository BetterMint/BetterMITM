import logging
import json
import yaml
import re
from typing import Optional, Dict, Any, List
from BetterMITM import ctx
from BetterMITM import flow
from BetterMITM import http

logger = logging.getLogger(__name__)


class SmartRulesEngine:
    rules: List[Dict[str, Any]] = []
    rule_priorities: Dict[str, int] = {}
    execution_order: str = "priority"
    stop_on_first_match: bool = False
    log_rule_execution: bool = True
    rule_timeout: float = 5.0
    max_rules: int = 1000
    enable_rule_caching: bool = True
    rule_cache: Dict[str, bool] = {}

    def load(self, loader):
        loader.add_option(
            "smart_rules_enabled",
            bool,
            False,
            "Enable smart interception rules engine",
        )
        loader.add_option(
            "smart_rules_config",
            str,
            "",
            "JSON/YAML configuration for smart interception rules",
        )
        loader.add_option(
            "smart_rules_execution_order",
            str,
            "priority",
            "Rule execution order: 'priority' (highest first), 'first' (order defined), or 'last' (reverse order)",
        )
        loader.add_option(
            "smart_rules_stop_on_match",
            bool,
            False,
            "Stop evaluating rules after first match",
        )
        loader.add_option(
            "smart_rules_log",
            bool,
            True,
            "Log rule execution",
        )
        loader.add_option(
            "smart_rules_timeout",
            float,
            5.0,
            "Maximum time (seconds) to evaluate a rule before timing out",
        )
        loader.add_option(
            "smart_rules_max_count",
            int,
            1000,
            "Maximum number of rules",
        )
        loader.add_option(
            "smart_rules_cache",
            bool,
            True,
            "Enable rule evaluation caching",
        )

    def configure(self, updated):
        if "smart_rules_config" in updated:
            config_str = ctx.options.smart_rules_config or ""
            if config_str:
                try:
                    if config_str.strip().startswith("{"):
                        self.rules = json.loads(config_str)
                    else:
                        self.rules = yaml.safe_load(config_str)
                    if not isinstance(self.rules, list):
                        self.rules = [self.rules]


                    if len(self.rules) > self.max_rules:
                        logger.warning(f"[SmartRulesEngine] Too many rules ({len(self.rules)}), limiting to {self.max_rules}")
                        self.rules = self.rules[:self.max_rules]

                    logger.info(f"[SmartRulesEngine] Loaded {len(self.rules)} rules")
                except Exception as e:
                    logger.error(f"[SmartRulesEngine] Failed to parse rules: {e}")
                    self.rules = []

        if "smart_rules_execution_order" in updated:
            self.execution_order = ctx.options.smart_rules_execution_order or "priority"

        if "smart_rules_stop_on_match" in updated:
            self.stop_on_first_match = ctx.options.smart_rules_stop_on_match

        if "smart_rules_log" in updated:
            self.log_rule_execution = ctx.options.smart_rules_log

        if "smart_rules_timeout" in updated:
            self.rule_timeout = ctx.options.smart_rules_timeout or 5.0

        if "smart_rules_max_count" in updated:
            self.max_rules = ctx.options.smart_rules_max_count or 1000

        if "smart_rules_cache" in updated:
            self.enable_rule_caching = ctx.options.smart_rules_cache
            if not self.enable_rule_caching:
                self.rule_cache.clear()

    def evaluate_rule(self, rule: Dict[str, Any], flow: flow.Flow) -> bool:
        if not rule.get("enabled", True):
            return False


        cache_key = f"{rule.get('id', '')}:{flow.id}"
        if self.enable_rule_caching and cache_key in self.rule_cache:
            return self.rule_cache[cache_key]

        conditions = rule.get("conditions", [])
        if not conditions:
            result = True
        else:

            condition_logic = rule.get("condition_logic", "AND")
            results = []

            for condition in conditions:
                condition_type = condition.get("type")
                condition_value = condition.get("value", "")
                condition_operator = condition.get("operator", "equals")
                condition_case_sensitive = condition.get("case_sensitive", False)

                condition_result = False

                if condition_type == "url":
                    url = None
                    if isinstance(flow, http.HTTPFlow) and flow.request:
                        url = flow.request.pretty_url
                    if url:
                        if condition_operator == "matches":
                            flags = 0 if condition_case_sensitive else re.IGNORECASE
                            try:
                                condition_result = bool(re.search(condition_value, url, flags))
                            except re.error:
                                condition_result = False
                        elif condition_operator == "contains":
                            if condition_case_sensitive:
                                condition_result = condition_value in url
                            else:
                                condition_result = condition_value.lower() in url.lower()
                        elif condition_operator == "equals":
                            if condition_case_sensitive:
                                condition_result = url == condition_value
                            else:
                                condition_result = url.lower() == condition_value.lower()
                        elif condition_operator == "starts_with":
                            if condition_case_sensitive:
                                condition_result = url.startswith(condition_value)
                            else:
                                condition_result = url.lower().startswith(condition_value.lower())
                        elif condition_operator == "ends_with":
                            if condition_case_sensitive:
                                condition_result = url.endswith(condition_value)
                            else:
                                condition_result = url.lower().endswith(condition_value.lower())

                elif condition_type == "method":
                    if isinstance(flow, http.HTTPFlow) and flow.request:
                        method = flow.request.method.upper()
                        value_upper = condition_value.upper()
                        if condition_operator == "equals":
                            condition_result = method == value_upper
                        elif condition_operator == "in":
                            condition_result = method in [m.strip().upper() for m in condition_value.split(",")]
                        elif condition_operator == "not_in":
                            condition_result = method not in [m.strip().upper() for m in condition_value.split(",")]

                elif condition_type == "header":
                    header_name = condition.get("name", "")
                    header_value = condition.get("value", "")
                    if isinstance(flow, http.HTTPFlow) and flow.request:
                        if header_name in flow.request.headers:
                            flow_header_value = flow.request.headers[header_name]
                            if condition_operator == "equals":
                                if condition_case_sensitive:
                                    condition_result = flow_header_value == header_value
                                else:
                                    condition_result = flow_header_value.lower() == header_value.lower()
                            elif condition_operator == "contains":
                                if condition_case_sensitive:
                                    condition_result = header_value in flow_header_value
                                else:
                                    condition_result = header_value.lower() in flow_header_value.lower()
                            elif condition_operator == "matches":
                                flags = 0 if condition_case_sensitive else re.IGNORECASE
                                try:
                                    condition_result = bool(re.search(header_value, flow_header_value, flags))
                                except re.error:
                                    condition_result = False
                        elif condition_operator == "not_exists":
                            condition_result = True

                elif condition_type == "status_code":
                    if isinstance(flow, http.HTTPFlow) and flow.response:
                        status = flow.response.status_code
                        try:
                            value_int = int(condition_value)
                            if condition_operator == "equals":
                                condition_result = status == value_int
                            elif condition_operator == "greater_than":
                                condition_result = status > value_int
                            elif condition_operator == "less_than":
                                condition_result = status < value_int
                            elif condition_operator == "in_range":
                                if "-" in condition_value:
                                    start, end = condition_value.split("-", 1)
                                    condition_result = int(start.strip()) <= status <= int(end.strip())
                        except ValueError:
                            condition_result = False

                elif condition_type == "body":
                    body = ""
                    if isinstance(flow, http.HTTPFlow):
                        if flow.request and flow.request.content:
                            body = flow.request.content.decode("utf-8", errors="ignore")
                        elif flow.response and flow.response.content:
                            body = flow.response.content.decode("utf-8", errors="ignore")

                    if condition_operator == "contains":
                        if condition_case_sensitive:
                            condition_result = condition_value in body
                        else:
                            condition_result = condition_value.lower() in body.lower()
                    elif condition_operator == "matches":
                        flags = 0 if condition_case_sensitive else re.IGNORECASE | re.DOTALL
                        try:
                            condition_result = bool(re.search(condition_value, body, flags))
                        except re.error:
                            condition_result = False
                    elif condition_operator == "equals":
                        if condition_case_sensitive:
                            condition_result = body == condition_value
                        else:
                            condition_result = body.lower() == condition_value.lower()

                elif condition_type == "domain":
                    domain = None
                    if isinstance(flow, http.HTTPFlow) and flow.request:
                        domain = flow.request.pretty_host
                    if domain:
                        if condition_operator == "equals":
                            if condition_case_sensitive:
                                condition_result = domain == condition_value
                            else:
                                condition_result = domain.lower() == condition_value.lower()
                        elif condition_operator == "contains":
                            if condition_case_sensitive:
                                condition_result = condition_value in domain
                            else:
                                condition_result = condition_value.lower() in domain.lower()
                        elif condition_operator == "matches":
                            flags = 0 if condition_case_sensitive else re.IGNORECASE
                            try:
                                condition_result = bool(re.search(condition_value, domain, flags))
                            except re.error:
                                condition_result = False

                results.append(condition_result)

            if condition_logic == "AND":
                result = all(results)
            else:
                result = any(results)


        if self.enable_rule_caching:
            self.rule_cache[cache_key] = result

            if len(self.rule_cache) > 10000:
                self.rule_cache.clear()

        return result

    def should_intercept(self, flow: flow.Flow, direction: str) -> Optional[Dict[str, Any]]:
        if not ctx.options.smart_rules_enabled:
            return None

        matching_rules = []
        for rule in self.rules:
            try:
                if self.evaluate_rule(rule, flow):
                    matching_rules.append(rule)
                    if self.stop_on_first_match:
                        break
            except Exception as e:
                if self.log_rule_execution:
                    logger.error(f"[SmartRulesEngine] Error evaluating rule {rule.get('name', 'unknown')}: {e}")
                continue

        if not matching_rules:
            return None


        if self.execution_order == "priority":
            matching_rules.sort(key=lambda r: r.get("priority", 0), reverse=True)
        elif self.execution_order == "last":
            matching_rules.sort(key=lambda r: r.get("priority", 0))

        if self.log_rule_execution:
            logger.info(f"[SmartRulesEngine] Matched rule: {matching_rules[0].get('name', 'unknown')} for flow {flow.id}")

        return matching_rules[0]

    def get_action(self, rule: Dict[str, Any]) -> str:
        return rule.get("action", "intercept")

    def apply_modifications(self, flow: flow.Flow, rule: Dict[str, Any]) -> None:
        """Apply rule modifications to flow"""
        modifications = rule.get("modifications", {})
        if not modifications:
            return

        if isinstance(flow, http.HTTPFlow):

            if "headers" in modifications:
                for header_mod in modifications["headers"]:
                    header_name = header_mod.get("name", "")
                    header_value = header_mod.get("value", "")
                    action = header_mod.get("action", "add")

                    if action == "add" or action == "modify":
                        if flow.request:
                            flow.request.headers[header_name] = header_value
                        if flow.response:
                            flow.response.headers[header_name] = header_value
                    elif action == "remove":
                        if flow.request and header_name in flow.request.headers:
                            del flow.request.headers[header_name]
                        if flow.response and header_name in flow.response.headers:
                            del flow.response.headers[header_name]


            if "body" in modifications:
                body = modifications["body"]
                if isinstance(body, str):
                    body_bytes = body.encode("utf-8")
                else:
                    body_bytes = body

                if flow.request:
                    flow.request.content = body_bytes
                if flow.response:
                    flow.response.content = body_bytes


            if "method" in modifications and flow.request:
                flow.request.method = modifications["method"].upper().encode("ascii")


addons = [SmartRulesEngine()]
