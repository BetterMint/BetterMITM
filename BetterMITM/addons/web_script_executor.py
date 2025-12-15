"""
Web Script Executor Addon
Provides script execution capabilities for the web interface with full API access.
"""
import asyncio
import json
import logging
import re
import subprocess
import sys
import tempfile
import os
from typing import Any, Dict, Optional

from BetterMITM import addonmanager
from BetterMITM import command
from BetterMITM import ctx
from BetterMITM import flow
from BetterMITM import hooks
from BetterMITM.net import http

logger = logging.getLogger(__name__)


class WebScriptExecutor:
    """
    Executes scripts from the web interface with full API access to flows.
    This addon hooks into request/response events to execute scripts automatically.
    """

    def __init__(self):
        self.scripts: Dict[str, Dict[str, Any]] = {}
        self.script_contexts: Dict[str, Any] = {}

    def load(self, loader):
        """Initialize the addon."""
        pass

    def running(self):
        """Called when BetterMITM starts."""
        pass

    def request(self, f: http.HTTPFlow) -> None:
        """Execute scripts on request."""
        self._execute_scripts_for_trigger(f, "request")

    def response(self, f: http.HTTPFlow) -> None:
        """Execute scripts on response."""
        self._execute_scripts_for_trigger(f, "response")

    def _execute_scripts_for_trigger(self, flow_obj: flow.Flow, trigger: str) -> None:
        """Execute all scripts that match the trigger."""

        if hasattr(ctx.master, "_scripts"):
            master_scripts = ctx.master._scripts

            for script_id, script_data in master_scripts.items():
                if script_id not in self.scripts or self.scripts[script_id] != script_data:
                    self.scripts[script_id] = script_data

        for script_id, script in self.scripts.items():
            if not script.get("enabled", True):
                continue

            script_trigger = script.get("trigger", "both")
            if script_trigger not in [trigger, "both"]:
                continue


            if not self._check_condition(script, flow_obj):
                continue

            try:
                result = self.execute_script_on_flow(script_id, script, flow_obj, trigger)
                if result.get("error"):
                    logger.warning(f"Script {script_id} error: {result['error']}")

                if result.get("flow_modified"):
                    self._apply_script_modifications(flow_obj, result.get("modifications", {}))
            except Exception as e:
                logger.error(f"Error executing script {script_id}: {e}", exc_info=True)

    def _check_condition(self, script: Dict[str, Any], flow_obj: flow.Flow) -> bool:
        """Check if script condition matches flow."""
        condition = script.get("condition")
        if not condition:
            return True

        cond_type = condition.get("type")
        cond_operator = condition.get("operator", "contains")
        cond_value = condition.get("value", "")

        if not cond_value:
            return True

        if cond_type == "url":
            url = flow_obj.request.pretty_url if flow_obj.request else ""
            return self._match_condition(url, cond_operator, cond_value)
        elif cond_type == "method":
            method = flow_obj.request.method if flow_obj.request else ""
            return self._match_condition(method, cond_operator, cond_value)
        elif cond_type == "header":
            header_name = condition.get("name", "")
            if flow_obj.request and flow_obj.request.headers:
                header_value = flow_obj.request.headers.get(header_name, "")
                return self._match_condition(header_value, cond_operator, cond_value)
        elif cond_type == "domain":
            host = flow_obj.request.host if flow_obj.request else ""
            return self._match_condition(host, cond_operator, cond_value)

        return True

    def _match_condition(self, value: str, operator: str, pattern: str) -> bool:
        """Match condition value against pattern."""
        if operator == "equals":
            return value == pattern
        elif operator == "contains":
            return pattern in value
        elif operator == "matches":
            try:
                return bool(re.search(pattern, value))
            except:
                return False
        return False

    def execute_script_on_flow(self, script_id: str, script: Dict[str, Any], flow_obj: flow.Flow, trigger: str = "both") -> Dict[str, Any]:
        """
        Execute a script on a flow with full API access.

        Args:
            script_id: ID of the script to execute
            script: Script data dictionary
            flow_obj: The flow object to process
            trigger: When to execute ("request", "response", "both")

        Returns:
            Dict with execution results
        """

        if not script:

            if script_id in self.scripts:
                script = self.scripts[script_id]
            else:
                return {"error": f"Script {script_id} not found"}
        if not script.get("enabled", True):
            return {"skipped": True, "reason": "Script disabled"}


        if trigger == "request" and not flow_obj.request:
            return {"skipped": True, "reason": "No request to process"}
        if trigger == "response" and not flow_obj.response:
            return {"skipped": True, "reason": "No response to process"}

        try:
            if script["language"] == "javascript":
                return self._execute_javascript(script, flow_obj, trigger)
            elif script["language"] == "python":
                return self._execute_python(script, flow_obj, trigger)
            else:
                return {"error": f"Unsupported language: {script['language']}"}
        except Exception as e:
            logger.error(f"Error executing script {script_id}: {e}", exc_info=True)
            return {"error": str(e)}

    def _execute_javascript(self, script: Dict[str, Any], flow_obj: flow.Flow, trigger: str) -> Dict[str, Any]:
        """Execute JavaScript script with flow API."""
        code = script.get("code", "")


        js_api_code = f"""
        // Flow API Wrapper
        const flow = {{
            id: "{flow_obj.id}",
            type: "{flow_obj.type}",
            timestamp_created: {flow_obj.timestamp_created},
            intercepted: {str(flow_obj.intercepted).lower()},
            live: {str(flow_obj.live).lower()},
            killable: {str(flow_obj.killable).lower()},
            marked: {json.dumps(flow_obj.marked) if flow_obj.marked else "null"},
            comment: {json.dumps(flow_obj.comment) if flow_obj.comment else "null"},

            request: {self._flow_request_to_json(flow_obj)},
            response: {self._flow_response_to_json(flow_obj)},

            client_conn: {{
                address: {json.dumps(list(flow_obj.client_conn.address)) if flow_obj.client_conn else "null"},
                tls_established: {str(flow_obj.client_conn.tls_established).lower() if flow_obj.client_conn else "false"},
            }},

            server_conn: {{
                address: {json.dumps(list(flow_obj.server_conn.address)) if flow_obj.server_conn else "null"},
                tls_established: {str(flow_obj.server_conn.tls_established).lower() if flow_obj.server_conn else "false"},
            }},

            // Flow modification methods
            intercept: function() {{ flow.intercepted = true; }},
            kill: function() {{ flow.killable = true; }},
            resume: function() {{ flow.intercepted = false; }},

            // Flow metadata
            addTag: function(tag) {{ /* Implement tag addition */ }},
            removeTag: function(tag) {{ /* Implement tag removal */ }},
            setComment: function(comment) {{ flow.comment = comment; }},
            setMarker: function(marker) {{ flow.marked = marker; }},
        }};

        // Utility functions
        const console = {{
            log: function(...args) {{ consoleOutput.push(args.join(' ')); }},
            error: function(...args) {{ consoleError.push(args.join(' ')); }},
            warn: function(...args) {{ consoleWarn.push(args.join(' ')); }},
            debug: function(...args) {{ consoleDebug.push(args.join(' ')); }},
        }};

        const fetch = async function(url, options) {{
            // Basic fetch implementation
            return {{
                json: async () => ({{}}),
                text: async () => "",
            }};
        }};

        const crypto = {{
            createHash: function(algorithm) {{
                return {{
                    update: function(data) {{ return this; }},
                    digest: function(encoding) {{ return ""; }},
                }};
            }},
            randomBytes: function(length) {{
                return {{
                    toString: function(encoding) {{ return ""; }},
                }};
            }},
        }};

        const Buffer = {{
            from: function(data, encoding) {{
                return {{
                    toString: function(encoding) {{ return String(data); }},
                }};
            }},
        }};

        const consoleOutput = [];
        const consoleError = [];
        const consoleWarn = [];
        const consoleDebug = [];

        // User script
        {code}

        // Return results
        JSON.stringify({{
            output: consoleOutput.join('\\n'),
            error: consoleError.join('\\n'),
            warn: consoleWarn.join('\\n'),
            debug: consoleDebug.join('\\n'),
            flow_modified: flow.intercepted || flow.killable,
        }});
        """

        try:

            result = subprocess.run(
                ["node", "-e", js_api_code],
                capture_output=True,
                text=True,
                timeout=script.get("timeout", 5),
            )

            if result.returncode == 0:
                output = json.loads(result.stdout) if result.stdout else {}
                return {
                    "success": True,
                    "output": output.get("output", ""),
                    "error": output.get("error", ""),
                }
            else:
                return {
                    "success": False,
                    "error": result.stderr or "Script execution failed",
                }
        except subprocess.TimeoutExpired:
            return {"error": "Script execution timeout"}
        except Exception as e:
            return {"error": str(e)}

    def _execute_python(self, script: Dict[str, Any], flow_obj: flow.Flow, trigger: str) -> Dict[str, Any]:
        """Execute Python script with flow API that can actually modify flows."""
        code = script.get("code", "")


        console_obj = self._create_python_console()
        flow_api = self._create_python_flow_api(flow_obj)

        exec_globals = {
            "__builtins__": __builtins__,
            "flow": flow_api,
            "console": console_obj,
            "json": json,
            "re": re,
            "import": __import__,
        }

        exec_locals = {}

        try:
            exec(code, exec_globals, exec_locals)


            modifications = flow_api.get_modifications()
            if modifications:
                self._apply_script_modifications(flow_obj, modifications)

            return {
                "success": True,
                "output": "\n".join(console_obj.output) if console_obj.output else "",
                "error": "\n".join(console_obj.errors) if hasattr(console_obj, "errors") and console_obj.errors else "",
                "flow_modified": bool(modifications),
                "modifications": modifications,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    def _flow_request_to_json(self, flow_obj: flow.Flow) -> str:
        """Convert flow request to JSON for JavaScript."""
        if not flow_obj.request:
            return "null"

        try:
            request_data = {
                "method": flow_obj.request.method,
                "url": flow_obj.request.pretty_url,
                "scheme": flow_obj.request.scheme,
                "host": flow_obj.request.host,
                "port": flow_obj.request.port,
                "path": flow_obj.request.path,
                "http_version": flow_obj.request.http_version,
                "headers": dict(flow_obj.request.headers) if flow_obj.request.headers else {},
                "text": flow_obj.request.content.decode("utf-8", errors="ignore") if flow_obj.request.content else "",
            }
            return json.dumps(request_data)
        except Exception:
            return "null"

    def _flow_response_to_json(self, flow_obj: flow.Flow) -> str:
        """Convert flow response to JSON for JavaScript."""
        if not flow_obj.response:
            return "null"

        try:
            response_data = {
                "status_code": flow_obj.response.status_code,
                "reason": flow_obj.response.reason,
                "http_version": flow_obj.response.http_version,
                "headers": dict(flow_obj.response.headers) if flow_obj.response.headers else {},
                "text": flow_obj.response.content.decode("utf-8", errors="ignore") if flow_obj.response.content else "",
            }
            return json.dumps(response_data)
        except Exception:
            return "null"

    def _create_python_flow_api(self, flow_obj: flow.Flow) -> Any:
        """Create Python flow API object that can modify flows."""
        class FlowAPI:
            def __init__(self, flow):
                self._flow = flow
                self._modifications = {}
                self.id = flow.id
                self.type = flow.type
                self.timestamp_created = flow.timestamp_created
                self.intercepted = flow.intercepted
                self.live = flow.live
                self.killable = flow.killable
                self.marked = flow.marked
                self.comment = flow.comment

                if flow.request:
                    self.request = RequestAPI(flow.request, self._modifications)
                else:
                    self.request = None

                if flow.response:
                    self.response = ResponseAPI(flow.response, self._modifications)
                else:
                    self.response = None

            def intercept(self):
                self._flow.intercepted = True
                self._modifications["intercepted"] = True

            def kill(self):
                self._flow.killable = True
                self._modifications["killable"] = True

            def resume(self):
                self._flow.intercepted = False
                self._modifications["intercepted"] = False

            def set_comment(self, comment: str):
                self._flow.comment = comment
                self._modifications["comment"] = comment

            def set_marker(self, marker: str):
                self._flow.marked = marker
                self._modifications["marked"] = marker

            def get_modifications(self):
                return self._modifications

        class RequestAPI:
            def __init__(self, request, modifications):
                self._request = request
                self._modifications = modifications
                self.method = request.method
                self.url = request.pretty_url
                self.scheme = request.scheme
                self.host = request.host
                self.port = request.port
                self.path = request.path
                self.http_version = request.http_version
                self.headers = dict(request.headers) if request.headers else {}
                self.content = request.content or b""
                self.text = self.content.decode("utf-8", errors="ignore")

                try:
                    self.json = json.loads(self.text)
                except:
                    self.json = None

            def set_method(self, method: str):
                self._request.method = method
                if "request" not in self._modifications:
                    self._modifications["request"] = {}
                self._modifications["request"]["method"] = method

            def set_header(self, name: str, value: str):
                self._request.headers[name] = value
                if "request" not in self._modifications:
                    self._modifications["request"] = {}
                if "headers" not in self._modifications["request"]:
                    self._modifications["request"]["headers"] = {}
                self._modifications["request"]["headers"][name] = value

            def set_body(self, body: str):
                self._request.content = body.encode("utf-8")
                if "request" not in self._modifications:
                    self._modifications["request"] = {}
                self._modifications["request"]["body"] = body

            def set_json(self, data: dict):
                self.set_body(json.dumps(data))
                if "request" not in self._modifications:
                    self._modifications["request"] = {}
                self._modifications["request"]["body_type"] = "json"

        class ResponseAPI:
            def __init__(self, response, modifications):
                self._response = response
                self._modifications = modifications
                self.status_code = response.status_code
                self.reason = response.reason
                self.http_version = response.http_version
                self.headers = dict(response.headers) if response.headers else {}
                self.content = response.content or b""
                self.text = self.content.decode("utf-8", errors="ignore")

                try:
                    self.json = json.loads(self.text)
                except:
                    self.json = None

            def set_status_code(self, code: int):
                self._response.status_code = code
                if "response" not in self._modifications:
                    self._modifications["response"] = {}
                self._modifications["response"]["status_code"] = code

            def set_header(self, name: str, value: str):
                self._response.headers[name] = value
                if "response" not in self._modifications:
                    self._modifications["response"] = {}
                if "headers" not in self._modifications["response"]:
                    self._modifications["response"]["headers"] = {}
                self._modifications["response"]["headers"][name] = value

            def set_body(self, body: str):
                self._response.content = body.encode("utf-8")
                if "response" not in self._modifications:
                    self._modifications["response"] = {}
                self._modifications["response"]["body"] = body

            def set_json(self, data: dict):
                self.set_body(json.dumps(data))
                if "response" not in self._modifications:
                    self._modifications["response"] = {}
                self._modifications["response"]["body_type"] = "json"

        return FlowAPI(flow_obj)

    def _create_python_console(self) -> Any:
        """Create Python console API."""
        class Console:
            def __init__(self):
                self.output = []
                self.errors = []

            def log(self, *args):
                msg = " ".join(str(a) for a in args)
                self.output.append(msg)
                logger.info(f"Script output: {msg}")

            def error(self, *args):
                msg = " ".join(str(a) for a in args)
                self.errors.append(msg)
                logger.error(f"Script error: {msg}")

            def warn(self, *args):
                msg = " ".join(str(a) for a in args)
                self.output.append(f"WARNING: {msg}")
                logger.warning(f"Script warning: {msg}")

            def debug(self, *args):
                msg = " ".join(str(a) for a in args)
                self.output.append(f"DEBUG: {msg}")
                logger.debug(f"Script debug: {msg}")

        return Console()

    def register_script(self, script_id: str, script_data: Dict[str, Any]):
        """Register a script for execution."""
        self.scripts[script_id] = script_data

    def unregister_script(self, script_id: str):
        """Unregister a script."""
        if script_id in self.scripts:
            del self.scripts[script_id]

    def _apply_script_modifications(self, flow_obj: flow.Flow, modifications: Dict[str, Any]) -> None:
        """Apply modifications made by script to the flow."""
        if not flow_obj.request:
            return


        if "request" in modifications:
            req_mods = modifications["request"]
            if "headers" in req_mods:
                for key, value in req_mods["headers"].items():
                    flow_obj.request.headers[key] = value
            if "method" in req_mods:
                flow_obj.request.method = req_mods["method"]
            if "body" in req_mods:
                flow_obj.request.content = req_mods["body"].encode("utf-8")


        if flow_obj.response and "response" in modifications:
            resp_mods = modifications["response"]
            if "headers" in resp_mods:
                for key, value in resp_mods["headers"].items():
                    flow_obj.response.headers[key] = value
            if "status_code" in resp_mods:
                flow_obj.response.status_code = resp_mods["status_code"]
            if "body" in resp_mods:
                flow_obj.response.content = resp_mods["body"].encode("utf-8")


        if "intercepted" in modifications:
            flow_obj.intercepted = modifications["intercepted"]
        if "killable" in modifications:
            flow_obj.killable = modifications["killable"]
        if "comment" in modifications:
            flow_obj.comment = modifications["comment"]
        if "marked" in modifications:
            flow_obj.marked = modifications["marked"]



_web_script_executor: Optional[WebScriptExecutor] = None


def get_web_script_executor() -> WebScriptExecutor:
    """Get the global web script executor instance."""
    global _web_script_executor
    if _web_script_executor is None:
        _web_script_executor = WebScriptExecutor()
    return _web_script_executor
