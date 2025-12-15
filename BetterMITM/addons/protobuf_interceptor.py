
import binascii
import logging
from pathlib import Path

from BetterMITM import ctx
from BetterMITM import http
from BetterMITM.addons import intercept

logger = logging.getLogger(__name__)


class ProtobufInterceptor:

    def __init__(self):
        self.protobuf_data: bytes | None = None
        self.protobuf_file_path: Path | None = None

    def load(self, loader):

        default_path = Path.cwd() / "protobuf.txt"
        loader.add_option(
            "protobuf_file",
            str,
            str(default_path),
            "Path to the protobuf.txt file containing replacement protobuf data.",
        )
        loader.add_option(
            "protobuf_interceptor_enabled",
            bool,
            False,
            "Enable Vanguard Protobuf Interceptor to replace protobuf content in POST requests to *.vg.ac.pvp.net.",
        )

    def configure(self, updated):
        if "protobuf_file" in updated or not updated:

            self.protobuf_file_path = Path(ctx.options.protobuf_file)
            self._load_protobuf_data()

    def _load_protobuf_data(self):
        if not self.protobuf_file_path or not self.protobuf_file_path.exists():
            logger.warning(
                f"[ProtobufInterceptor] Protobuf file not found: {self.protobuf_file_path}. "
                "Protobuf interception will be disabled."
            )
            self.protobuf_data = None
            return

        try:
            logger.info(
                f"[ProtobufInterceptor] Loading protobuf file: {self.protobuf_file_path}"
            )
            with open(self.protobuf_file_path, "r", encoding="utf-8") as f:
                content = f.read()



            if "!binary" not in content:
                logger.error(
                    "[ProtobufInterceptor] No !binary marker found in file"
                )
                self.protobuf_data = None
                return


            parts = content.split("!binary", 1)
            if len(parts) < 2:
                logger.error(
                    "[ProtobufInterceptor] Could not find hex data after !binary marker"
                )
                self.protobuf_data = None
                return



            hex_part = parts[1]


            if '#' in hex_part:

                lines = hex_part.split('\n')
                cleaned_lines = []
                for line in lines:

                    if '#' in line and line.strip().startswith('#'):
                        continue

                    if '#' in line:
                        line = line.split('#')[0]
                    cleaned_lines.append(line)
                hex_part = '\n'.join(cleaned_lines)


            hex_str_raw = "".join(hex_part.split())



            hex_str = "".join(c for c in hex_str_raw if c in "0123456789abcdefABCDEF")


            invalid_chars = set(c for c in hex_str_raw if c not in "0123456789abcdefABCDEF" and c.strip())
            if invalid_chars:
                logger.warning(
                    f"[ProtobufInterceptor] Removed invalid hex characters: {invalid_chars}. "
                    f"Original length: {len(hex_str_raw)}, Valid hex length: {len(hex_str)}"
                )


            if len(hex_str) % 2 != 0:
                logger.warning(
                    f"[ProtobufInterceptor] Hex string length is odd ({len(hex_str)} chars). "
                    f"Truncating to {len(hex_str) - 1} chars to get even length."
                )
                hex_str = hex_str[:-1]


            self.protobuf_data = binascii.unhexlify(hex_str)

            logger.info(
                f"[ProtobufInterceptor] ✓ Successfully loaded protobuf data: "
                f"{len(self.protobuf_data)} bytes from {self.protobuf_file_path}\n"
                f"  Hex string length: {len(hex_str)} chars (should be 6366 for 3183 bytes)\n"
                f"  First 32 hex chars: {hex_str[:32]}...\n"
                f"  Last 32 hex chars: ...{hex_str[-32:]}\n"
                f"  First 16 bytes (hex): {self.protobuf_data[:16].hex()}\n"
                f"  Last 16 bytes (hex): {self.protobuf_data[-16:].hex()}"
            )

        except Exception as e:
            logger.error(
                f"[ProtobufInterceptor] ✗ Failed to load protobuf file: {e}"
            )
            self.protobuf_data = None

    def _is_from_selected_process(self, flow: http.HTTPFlow) -> bool:

        intercept_addon = ctx.master.addons.get("intercept")
        if not intercept_addon:
            logger.warning("[ProtobufInterceptor] Intercept addon not found - cannot check if flow is from selected process")
            return False

        if not isinstance(intercept_addon, intercept.Intercept):
            logger.warning("[ProtobufInterceptor] Intercept addon is not the expected type")
            return False

        try:

            if not intercept_addon.filt:
                logger.info("[ProtobufInterceptor] No intercept filter configured - no process selected for interception")
                return False


            if flow.is_replay:
                logger.debug("[ProtobufInterceptor] Flow is a replay, skipping")
                return False

            matches = intercept_addon.filt(flow)
            intercept_filter_str = getattr(ctx.options, 'intercept', 'N/A')
            intercept_active = getattr(ctx.options, 'intercept_active', False)
            logger.info(
                f"[ProtobufInterceptor] Process check: filter='{intercept_filter_str}', "
                f"intercept_active={intercept_active}, matches={matches}"
            )
            return matches
        except Exception as e:
            logger.error(f"[ProtobufInterceptor] Error checking if flow is from selected process: {e}")
            return False

    def request(self, flow: http.HTTPFlow) -> None:

        if not ctx.options.protobuf_interceptor_enabled:
            return


        if not flow.live:
            return


        if flow.request.method != "POST":
            return


        host = flow.request.pretty_host
        if not host.endswith(".vg.ac.pvp.net"):
            return

        logger.info(
            f"[ProtobufInterceptor] Checking POST request to {flow.request.pretty_host}{flow.request.path}"
        )



        if flow.intercepted:
            logger.info(
                "[ProtobufInterceptor] Flow is already intercepted - skipping auto-replacement. "
                "User can manually edit the content in the UI."
            )
            return


        if self.protobuf_data is None:
            logger.warning(
                "[ProtobufInterceptor] Protobuf data not loaded - skipping interception"
            )
            return


        original_size = len(flow.request.content) if flow.request.content else 0
        original_content_hash = (
            flow.request.content[:16].hex() if flow.request.content and len(flow.request.content) >= 16 else "N/A"
        )


        try:

            flow.request.content = self.protobuf_data

            flow.request.headers["content-length"] = str(len(self.protobuf_data))

            logger.info(
                f"[ProtobufInterceptor] ✓ SUCCESS: Replaced protobuf content in request to "
                f"{flow.request.pretty_host}{flow.request.path}\n"
                f"  Original: {original_size} bytes (hash: {original_content_hash}...)\n"
                f"  Replaced: {len(self.protobuf_data)} bytes\n"
                f"  Request will continue with modified content"
            )




        except Exception as e:
            logger.error(
                f"[ProtobufInterceptor] ✗ ERROR: Failed to replace protobuf content: {e}\n"
                f"  Request will continue with original content"
            )


addons = [ProtobufInterceptor()]
