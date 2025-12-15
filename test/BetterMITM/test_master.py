import asyncio
import gc

from mitmproxy.master import Master


async def err():
    raise RuntimeError


async def test_exception_handler(caplog_async):
    caplog_async.set_level("ERROR")


    master = Master(None)
    running = asyncio.create_task(master.run())
    await asyncio.sleep(0)


    task = asyncio.create_task(err())

    await asyncio.sleep(0)


    assert task
    del task
    gc.collect()


    await caplog_async.await_log("Traceback")

    master.shutdown()
    await running
