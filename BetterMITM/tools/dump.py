from BetterMITM import addons
from BetterMITM import master
from BetterMITM import options
from BetterMITM.addons import dumper
from BetterMITM.addons import errorcheck
from BetterMITM.addons import keepserving
from BetterMITM.addons import readfile


class DumpMaster(master.Master):
    def __init__(
        self,
        options: options.Options,
        loop=None,
        with_termlog=True,
        with_dumper=True,
    ) -> None:
        super().__init__(options, event_loop=loop, with_termlog=with_termlog)
        self.addons.add(*addons.default_addons())
        if with_dumper:
            self.addons.add(dumper.Dumper())
        self.addons.add(
            keepserving.KeepServing(),
            readfile.ReadFileStdin(),
            errorcheck.ErrorCheck(),
        )
