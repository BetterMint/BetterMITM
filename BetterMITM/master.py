import asyncio
import logging

from . import ctx as mitmproxy_ctx
from .addons import termlog
from .proxy.mode_specs import ReverseMode
from .utils import asyncio_utils
from BetterMITM import addonmanager
from BetterMITM import command
from BetterMITM import eventsequence
from BetterMITM import hooks
from BetterMITM import http
from BetterMITM import log
from BetterMITM import options

logger = logging.getLogger(__name__)


class Master:
    """
    The master handles mitmproxy's main event loop.
    """

    event_loop: asyncio.AbstractEventLoop
    _termlog_addon: termlog.TermLog | None = None

    def __init__(
        self,
        opts: options.Options | None,
        event_loop: asyncio.AbstractEventLoop | None = None,
        with_termlog: bool = False,
    ):
        self.options: options.Options = opts or options.Options()
        self.commands = command.CommandManager(self)
        self.addons = addonmanager.AddonManager(self)

        if with_termlog:
            self._termlog_addon = termlog.TermLog()
            self.addons.add(self._termlog_addon)

        self.log = log.Log(self)
        self._legacy_log_events = log.LegacyLogEvents(self)
        self._legacy_log_events.install()




        self.event_loop = event_loop or asyncio.get_running_loop()
        self.should_exit = asyncio.Event()
        mitmproxy_ctx.master = self
        mitmproxy_ctx.log = self.log
        mitmproxy_ctx.options = self.options

    async def run(self) -> None:
        with (
            asyncio_utils.install_exception_handler(self._asyncio_exception_handler),
            asyncio_utils.set_eager_task_factory(),
        ):
            self.should_exit.clear()


            if ec := self.addons.get("errorcheck"):
                await ec.shutdown_if_errored()
            if ps := self.addons.get("proxyserver"):

                await asyncio.wait(
                    [
                        asyncio_utils.create_task(
                            ps.setup_servers(), name="setup_servers", keep_ref=False
                        ),
                        asyncio_utils.create_task(
                            self.should_exit.wait(), name="should_exit", keep_ref=False
                        ),
                    ],
                    return_when=asyncio.FIRST_COMPLETED,
                )
                if self.should_exit.is_set():
                    return

                if ec := self.addons.get("errorcheck"):
                    await ec.shutdown_if_errored()

            try:
                await self.running()

                if ec := self.addons.get("errorcheck"):
                    await ec.shutdown_if_errored()
                    ec.finish()

                await self.should_exit.wait()
            finally:


                await self.done()

    def shutdown(self):
        """
        Shut down the proxy. This method is thread-safe.
        """

        self.event_loop.call_soon_threadsafe(self.should_exit.set)

    async def running(self) -> None:
        await self.addons.trigger_event(hooks.RunningHook())

    async def done(self) -> None:
        await self.addons.trigger_event(hooks.DoneHook())
        self._legacy_log_events.uninstall()
        if self._termlog_addon is not None:
            self._termlog_addon.uninstall()

    def _asyncio_exception_handler(self, loop, context) -> None:
        try:
            exc: Exception = context["exception"]
        except KeyError:
            logger.error(f"Unhandled asyncio error: {context}")
        else:
            if isinstance(exc, OSError) and exc.errno == 10038:
                return
            logger.error(
                "Unhandled error in task.",
                exc_info=(type(exc), exc, exc.__traceback__),
            )

    async def load_flow(self, f):
        """
        Loads a flow
        """

        if (
            isinstance(f, http.HTTPFlow)
            and len(self.options.mode) == 1
            and self.options.mode[0].startswith("reverse:")
        ):




            mode = ReverseMode.parse(self.options.mode[0])
            assert isinstance(mode, ReverseMode)
            f.request.host, f.request.port, *_ = mode.address
            f.request.scheme = mode.scheme

        for e in eventsequence.iterate(f):
            await self.addons.handle_lifecycle(e)
