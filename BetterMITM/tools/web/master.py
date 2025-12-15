import errno
import logging
from typing import cast

import tornado.httpserver
import tornado.ioloop

from BetterMITM import addons
from BetterMITM import flow
from BetterMITM import log
from BetterMITM import master
from BetterMITM import options
from BetterMITM import optmanager
from BetterMITM.addons import errorcheck
from BetterMITM.addons import eventstore
from BetterMITM.addons import intercept
from BetterMITM.addons import readfile
from BetterMITM.addons import view
from BetterMITM.addons.proxyserver import Proxyserver
from BetterMITM.tools.web import app
from BetterMITM.tools.web import static_viewer
from BetterMITM.tools.web import webaddons

logger = logging.getLogger(__name__)


class WebMaster(master.Master):
    def __init__(self, opts: options.Options, with_termlog: bool = True):
        super().__init__(opts, with_termlog=with_termlog)
        self.view = view.View()
        self.view.sig_view_add.connect(self._sig_view_add)
        self.view.sig_view_remove.connect(self._sig_view_remove)
        self.view.sig_view_update.connect(self._sig_view_update)
        self.view.sig_view_refresh.connect(self._sig_view_refresh)

        self.events = eventstore.EventStore()
        self.events.sig_add.connect(self._sig_events_add)
        self.events.sig_refresh.connect(self._sig_events_refresh)

        self.options.changed.connect(self._sig_options_update)

        self.addons.add(*addons.default_addons())
        self.addons.add(
            webaddons.WebAddon(),
            webaddons.WebAuth(),
            intercept.Intercept(),
            readfile.ReadFileStdin(),
            static_viewer.StaticViewer(),
            self.view,
            self.events,
            errorcheck.ErrorCheck(),
        )
        self.app = app.Application(self, self.options.web_debug)
        self.proxyserver: Proxyserver = self.addons.get("proxyserver")
        self.proxyserver.servers.changed.connect(self._sig_servers_changed)

    def _sig_view_add(self, flow: flow.Flow) -> None:
        app.ClientConnection.broadcast_flow("flows/add", flow)

    def _sig_view_update(self, flow: flow.Flow) -> None:
        app.ClientConnection.broadcast_flow("flows/update", flow)

    def _sig_view_remove(self, flow: flow.Flow, index: int) -> None:
        app.ClientConnection.broadcast(
            type="flows/remove",
            payload=flow.id,
        )

    def _sig_view_refresh(self) -> None:
        app.ClientConnection.broadcast_flow_reset()

    def _sig_events_add(self, entry: log.LogEntry) -> None:
        app.ClientConnection.broadcast(
            type="events/add",
            payload=app.logentry_to_json(entry),
        )

    def _sig_events_refresh(self) -> None:
        app.ClientConnection.broadcast(
            type="events/reset",
        )

    def _sig_options_update(self, updated: set[str]) -> None:
        options_dict = optmanager.dump_dicts(self.options, updated)
        app.ClientConnection.broadcast(
            type="options/update",
            payload=options_dict,
        )

    def _sig_servers_changed(self) -> None:
        app.ClientConnection.broadcast(
            type="state/update",
            payload={
                "servers": {
                    s.mode.full_spec: s.to_json() for s in self.proxyserver.servers
                }
            },
        )

    @property
    def web_url(self) -> str:
        return cast(webaddons.WebAuth, self.addons.get("webauth")).web_url

    async def running(self):

        tornado.ioloop.IOLoop.current()


        http_server = tornado.httpserver.HTTPServer(
            self.app, max_buffer_size=2**32
        )
        try:
            http_server.listen(self.options.web_port, self.options.web_host)
        except OSError as e:
            message = f"Web server failed to listen on {self.options.web_host or '*'}:{self.options.web_port} with {e}"
            if e.errno == errno.EADDRINUSE:
                message += f"\nTry specifying a different port by using `--set web_port={self.options.web_port + 2}`."
            raise OSError(e.errno, message, e.filename) from e

        logger.info(f"Web server listening at {self.web_url}")

        return await super().running()
