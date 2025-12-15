"""
Base class for protocol layers.
"""

import collections
import textwrap
from abc import abstractmethod
from collections.abc import Callable
from collections.abc import Generator
from dataclasses import dataclass
from logging import DEBUG
from typing import Any
from typing import ClassVar
from typing import NamedTuple
from typing import TypeVar

from BetterMITM.connection import Connection
from BetterMITM.proxy import commands
from BetterMITM.proxy import events
from BetterMITM.proxy.commands import Command
from BetterMITM.proxy.commands import StartHook
from BetterMITM.proxy.context import Context

T = TypeVar("T")
CommandGenerator = Generator[Command, Any, T]
"""
A function annotated with CommandGenerator[bool] may yield commands and ultimately return a boolean value.
"""


MAX_LOG_STATEMENT_SIZE = 2048
"""Maximum size of individual log statements before they will be truncated."""


class Paused(NamedTuple):
    """
    State of a layer that's paused because it is waiting for a command reply.
    """

    command: commands.Command
    generator: CommandGenerator


class Layer:
    """
    The base class for all protocol layers.

    Layers interface with their child layer(s) by calling .handle_event(event),
    which returns a list (more precisely: a generator) of commands.
    Most layers do not implement .directly, but instead implement ._handle_event, which
    is called by the default implementation of .handle_event.
    The default implementation of .handle_event allows layers to emulate blocking code:
    When ._handle_event yields a command that has its blocking attribute set to True, .handle_event pauses
    the execution of ._handle_event and waits until it is called with the corresponding CommandCompleted event.
    All events encountered in the meantime are buffered and replayed after execution is resumed.

    The result is code that looks like blocking code, but is not blocking:

        def _handle_event(self, event):
            err = yield OpenConnection(server)  # execution continues here after a connection has been established.

    Technically this is very similar to how coroutines are implemented.
    """

    __last_debug_message: ClassVar[str] = ""
    context: Context
    _paused: Paused | None
    """
    If execution is currently paused, this attribute stores the paused coroutine
    and the command for which we are expecting a reply.
    """
    _paused_event_queue: collections.deque[events.Event]
    """
    All events that have occurred since execution was paused.
    These will be replayed to ._child_layer once we resume.
    """
    debug: str | None = None
    """
    Enable debug logging by assigning a prefix string for log messages.
    Different amounts of whitespace for different layers work well.
    """

    def __init__(self, context: Context) -> None:
        self.context = context
        self.context.layers.append(self)
        self._paused = None
        self._paused_event_queue = collections.deque()

        show_debug_output = getattr(context.options, "proxy_debug", False)
        if show_debug_output:
            self.debug = "  " * len(context.layers)

    def __repr__(self):
        statefun = getattr(self, "state", self._handle_event)
        state = getattr(statefun, "__name__", "")
        state = state.replace("state_", "")
        if state == "_handle_event":
            state = ""
        else:
            state = f"state: {state}"
        return f"{type(self).__name__}({state})"

    def __debug(self, message):
        """yield a Log command indicating what message is passing through this layer."""
        if len(message) > MAX_LOG_STATEMENT_SIZE:
            message = message[:MAX_LOG_STATEMENT_SIZE] + "…"
        if Layer.__last_debug_message == message:
            message = message.split("\n", 1)[0].strip()
            if len(message) > 256:
                message = message[:256] + "…"
        else:
            Layer.__last_debug_message = message
        assert self.debug is not None
        return commands.Log(textwrap.indent(message, self.debug), DEBUG)

    @property
    def stack_pos(self) -> str:
        """repr() for this layer and all its parent layers, only useful for debugging."""
        try:
            idx = self.context.layers.index(self)
        except ValueError:
            return repr(self)
        else:
            return " >> ".join(repr(x) for x in self.context.layers[: idx + 1])

    @abstractmethod
    def _handle_event(self, event: events.Event) -> CommandGenerator[None]:
        """Handle a proxy server event"""
        yield from ()

    def handle_event(self, event: events.Event) -> CommandGenerator[None]:
        if self._paused:

            pause_finished = (
                isinstance(event, events.CommandCompleted)
                and event.command is self._paused.command
            )
            if self.debug is not None:
                yield self.__debug(f"{'>>' if pause_finished else '>!'} {event}")
            if pause_finished:
                assert isinstance(event, events.CommandCompleted)
                yield from self.__continue(event)
            else:
                self._paused_event_queue.append(event)
        else:
            if self.debug is not None:
                yield self.__debug(f">> {event}")
            command_generator = self._handle_event(event)
            send = None



            try:



                command = command_generator.send(send)
            except StopIteration:
                return

            while True:
                if self.debug is not None:
                    if not isinstance(command, commands.Log):
                        yield self.__debug(f"<< {command}")
                if command.blocking is True:





                    command.blocking = self
                    self._paused = Paused(
                        command,
                        command_generator,
                    )
                    yield command
                    return
                else:
                    yield command
                    try:
                        command = next(command_generator)
                    except StopIteration:
                        return


    def __process(self, command_generator: CommandGenerator, send=None):
        """
        Yield commands from a generator.
        If a command is blocking, execution is paused and this function returns without
        processing any further commands.
        """
        try:



            command = command_generator.send(send)
        except StopIteration:
            return

        while True:
            if self.debug is not None:
                if not isinstance(command, commands.Log):
                    yield self.__debug(f"<< {command}")
            if command.blocking is True:





                command.blocking = self
                self._paused = Paused(
                    command,
                    command_generator,
                )
                yield command
                return
            else:
                yield command
                try:
                    command = next(command_generator)
                except StopIteration:
                    return

    def __continue(self, event: events.CommandCompleted):
        """
        Continue processing events after being paused.
        The tricky part here is that events in the event queue may trigger commands which again pause the execution,
        so we may not be able to process the entire queue.
        """
        assert self._paused is not None
        command_generator = self._paused.generator
        self._paused = None
        yield from self.__process(command_generator, event.reply)

        while not self._paused and self._paused_event_queue:
            ev = self._paused_event_queue.popleft()
            if self.debug is not None:
                yield self.__debug(f"!> {ev}")
            command_generator = self._handle_event(ev)
            yield from self.__process(command_generator)


mevents = (
    events
)


class NextLayer(Layer):
    layer: Layer | None
    """The next layer. To be set by an addon."""

    events: list[mevents.Event]
    """All events that happened before a decision was made."""

    _ask_on_start: bool

    def __init__(self, context: Context, ask_on_start: bool = False) -> None:
        super().__init__(context)
        self.context.layers.remove(self)
        self.layer = None
        self.events = []
        self._ask_on_start = ask_on_start
        self._handle: Callable[[mevents.Event], CommandGenerator[None]] | None = None

    def __repr__(self):
        return f"NextLayer:{self.layer!r}"

    def handle_event(self, event: mevents.Event):
        if self._handle is not None:
            yield from self._handle(event)
        else:
            yield from super().handle_event(event)

    def _handle_event(self, event: mevents.Event):
        self.events.append(event)


        if self._ask_on_start and isinstance(event, events.Start):
            yield from self._ask()
        elif (
            isinstance(event, mevents.ConnectionClosed)
            and event.connection == self.context.client
        ):


            yield commands.CloseConnection(self.context.client)
        elif isinstance(event, mevents.DataReceived):

            yield from self._ask()

    def _ask(self):
        """
        Manually trigger a next_layer hook.
        The only use at the moment is to make sure that the top layer is initialized.
        """
        yield NextLayerHook(self)


        if self.layer:
            if self.debug:
                yield commands.Log(f"{self.debug}[nextlayer] {self.layer!r}", DEBUG)
            for e in self.events:
                yield from self.layer.handle_event(e)
            self.events.clear()







            self.handle_event = self.layer.handle_event
            self._handle_event = self.layer.handle_event
            self._handle = self.layer.handle_event


    def data_client(self):
        return self._data(self.context.client)

    def data_server(self):
        return self._data(self.context.server)

    def _data(self, connection: Connection):
        data = (
            e.data
            for e in self.events
            if isinstance(e, mevents.DataReceived) and e.connection == connection
        )
        return b"".join(data)


@dataclass
class NextLayerHook(StartHook):
    """
    Network layers are being switched. You may change which layer will be used by setting data.layer.

    (by default, this is done by BetterMITM.addons.NextLayer)
    """

    data: NextLayer
