import * as React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import ProxyApp from "./components/ProxyApp";
import { add as addLog } from "./ducks/eventLog";
import useUrlState from "./urlState";
import WebSocketBackend from "./backends/websocket";
import StaticBackend from "./backends/static";
import { store } from "./ducks";


declare global {
    interface Window {
        MITMWEB_STATIC?: boolean;
    }
}

if (window.MITMWEB_STATIC) {
    
    window.backend = new StaticBackend(store);
} else {
    
    window.backend = new WebSocketBackend(store);
}

useUrlState(store);

window.addEventListener("error", (e: ErrorEvent) => {
    store.dispatch(addLog(`${e.message}\n${e.error.stack}`));
});

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("mitmproxy"); 
    
    
    
    const state = store.getState();
    if (!state || !state.options) {
        console.error("Redux store not properly initialized - missing options state");
    }
    
    const root = createRoot(container!);
    root.render(
        <Provider store={store} children={<ProxyApp />} />,
    );
});
