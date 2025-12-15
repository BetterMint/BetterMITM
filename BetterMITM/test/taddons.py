import asyncio

import BetterMITM.master
import BetterMITM.options
from BetterMITM import command
from BetterMITM import eventsequence
from BetterMITM import hooks
from BetterMITM.addons import core
from BetterMITM.addons import script


class context:
    """
    A context for testing addons, which sets up the BetterMITM.ctx module so
    handlers can run as they would within BetterMITM. The context also
    provides a number of helper methods for common testing scenarios.
    """

    def __init__(self, *addons, options=None, loadcore=True):
        self.owns_loop = False
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            self.owns_loop = True
            loop = asyncio.new_event_loop()

        options = options or BetterMITM.options.Options()
        self.master = BetterMITM.master.Master(options, event_loop=loop)
        self.options = self.master.options

        if loadcore:
            self.master.addons.add(core.Core())

        for a in addons:
            self.master.addons.add(a)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        if self.owns_loop and not self.master.event_loop.is_closed():

            self.master.event_loop.close()
        return False

    async def cycle(self, addon, f):
        """
        Cycles the flow through the events for the flow. Stops if the flow
        is intercepted.
        """
        for evt in eventsequence.iterate(f):
            await self.master.addons.invoke_addon(addon, evt)
            if f.intercepted:
                return

    def configure(self, addon, **kwargs):
        """
        A helper for testing configure methods. Modifies the registered
        Options object with the given keyword arguments, then calls the
        configure method on the addon with the updated value.
        """
        if addon not in self.master.addons:
            self.master.addons.register(addon)
        with self.options.rollback(kwargs.keys(), reraise=True):
            if kwargs:
                self.options.update(**kwargs)
            else:
                self.master.addons.invoke_addon_sync(addon, hooks.ConfigureHook(set()))

    def script(self, path):
        """
        Loads a script from path, and returns the enclosed addon.
        """
        sc = script.Script(path, False)
        return sc.addons[0] if sc.addons else None

    def command(self, func, *args):
        """
        Invoke a command function with a list of string arguments within a command context, mimicking the actual command environment.
        """
        cmd = command.Command(self.master.commands, "test.command", func)
        return cmd.call(args)
