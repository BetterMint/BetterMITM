import * as React from "react";
import { FunctionComponent, useState } from "react";
import { Request, Response } from "./FlowView/HttpMessages";
import {
    Request as DnsRequest,
    Response as DnsResponse,
} from "./FlowView/DnsMessages";
import Connection from "./FlowView/Connection";
import Error from "./FlowView/Error";
import Timing from "./FlowView/Timing";
import WebSocket from "./FlowView/WebSocket";
import Comment from "./FlowView/Comment";
import { selectTab } from "../ducks/ui/flow";
import { useAppDispatch, useAppSelector } from "../ducks";
import { Flow } from "../flow";
import classnames from "classnames";
import TcpMessages from "./FlowView/TcpMessages";
import UdpMessages from "./FlowView/UdpMessages";
import * as flowsActions from "../ducks/flows";
import { fetchApi } from "../utils";
import { canReplay } from "../flow/utils";
import ReplayWithModifications from "./FlowView/ReplayWithModifications";
import ProtobufEditor from "./FlowView/ProtobufEditor";

type TabProps = {
    flow: Flow;
};

export const allTabs: {
    [name: string]: FunctionComponent<TabProps> & { displayName: string };
} = {
    request: Request,
    response: Response,
    error: Error,
    connection: Connection,
    timing: Timing,
    websocket: WebSocket,
    tcpmessages: TcpMessages,
    udpmessages: UdpMessages,
    dnsrequest: DnsRequest,
    dnsresponse: DnsResponse,
    comment: Comment,
    protobuf: ProtobufEditor,
};


function getHeader(headers: [string, string][], name: string): string | null {
    const header = headers.find(([key]) => key.toLowerCase() === name.toLowerCase());
    return header ? header[1] : null;
}

export function tabsForFlow(flow: Flow): string[] {
    let tabs;
    switch (flow.type) {
        case "http":
            tabs = ["request", "response", "websocket"].filter((k) => flow[k]);
            if (flow.request) {
                const contentType = (getHeader(flow.request.headers, "content-type") || "").toLowerCase();
                if (contentType.includes("protobuf") || 
                    contentType.includes("grpc") ||
                    contentType.includes("application/x-protobuf")) {
                    tabs.push("protobuf");
                }
            }
            break;
        case "tcp":
            tabs = ["tcpmessages"];
            break;
        case "udp":
            tabs = ["udpmessages"];
            break;
        case "dns":
            tabs = ["request", "response"]
                .filter((k) => flow[k])
                .map((s) => "dns" + s);
            break;
    }

    if (flow.error) tabs.push("error");
    tabs.push("connection");
    tabs.push("timing");
    tabs.push("comment");
    return tabs;
}

export default function FlowView() {
    const dispatch = useAppDispatch();
    const flow = useAppSelector((state) => state.flows.selected[0]);
    const interceptUrls = useAppSelector((state) => state.options.advanced_intercept_urls || "");
    let active = useAppSelector((state) => state.ui.flow.tab);
    const [showReplayModal, setShowReplayModal] = useState(false);

    if (flow == undefined) {
        return <></>;
    }

    const tabs = tabsForFlow(flow);

    if (tabs.indexOf(active) < 0) {
        if (active === "response" && flow.error) {
            active = "error";
        } else if (active === "error" && "response" in flow) {
            active = "response";
        } else {
            active = tabs[0];
        }
    }
    const Tab = allTabs[active];

    const handleIntercept = async () => {
        try {
            const response = await fetchApi(`/flows/${flow.id}/state`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "intercept" }),
            });
            if (response.ok) {
                dispatch(flowsActions.update(flow, {}));
                if (flow.type === "http") {
                    
                    const host = flow.request.pretty_host;
                    const formattedUrl = `*${host}/*`;
                    
                    try {
                        
                        await fetchApi("/advanced-intercept-rules/paused-connections", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ domain_or_ip: host }),
                        });
                        
                        
                        const existingUrls = interceptUrls ? interceptUrls.split(",").map(u => u.trim()) : [];
                        if (!existingUrls.includes(formattedUrl)) {
                            const newUrls = interceptUrls ? `${interceptUrls}, ${formattedUrl}` : formattedUrl;
                            const updateResponse = await fetchApi("/advanced-intercept-rules", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    enabled: true,
                                    intercept_urls: newUrls,
                                }),
                            });
                            if (updateResponse.ok) {
                                const rules = await updateResponse.json();
                                const { OPTIONS_UPDATE } = await import("../ducks/options.js");
                                dispatch(OPTIONS_UPDATE({
                                    advanced_intercept_urls: { value: rules.intercept_urls || "" } as any,
                                }));
                            }
                        }
                    } catch (e) {
                        console.error("Failed to update intercept URLs:", e);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to intercept flow:", error);
        }
    };

    const handleResume = async () => {
        try {
            const response = await fetchApi(`/flows/${flow.id}/state`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "resume" }),
            });
            if (response.ok) {
                dispatch(flowsActions.update(flow, {}));
            }
        } catch (error) {
            console.error("Failed to resume flow:", error);
        }
    };

    const handlePause = async () => {
        try {
            const response = await fetchApi(`/flows/${flow.id}/state`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "pause" }),
            });
            if (response.ok) {
                dispatch(flowsActions.update(flow, {}));
            }
        } catch (error) {
            console.error("Failed to pause flow:", error);
        }
    };

    const handleBlock = async () => {
        try {
            const response = await fetchApi(`/flows/${flow.id}/state`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "block" }),
            });
            if (response.ok) {
                dispatch(flowsActions.update(flow, {}));
            }
        } catch (error) {
            console.error("Failed to block flow:", error);
        }
    };

    const handleReplay = async () => {
        try {
            await dispatch(flowsActions.replay([flow]));
        } catch (error) {
            console.error("Failed to replay flow:", error);
        }
    };

    const isIntercepted = flow.intercepted || flow.intercept_state === "paused" || flow.intercept_state === "intercepted";
    const isBlocked = flow.intercept_state === "blocked";

    return (
        <div className="flow-detail">
            <div style={{
                padding: "6px 10px",
                backgroundColor: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexWrap: "wrap",
            }}>
                {isIntercepted ? (
                    <button
                        onClick={handleResume}
                        className="btn-sleek btn-sleek-success glint-effect"
                        style={{
                            padding: "5px 10px",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                        title="Resume this flow"
                    >
                        <i className="fa fa-play"></i> Resume
                    </button>
                ) : (
                    <>
                        <button
                            className="btn-sleek btn-sleek-warning glint-effect"
                            onClick={handleIntercept}
                            style={{
                                padding: "5px 10px",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                            title="Intercept this flow"
                        >
                            <i className="fa fa-pause-circle"></i> Intercept
                        </button>
                        <button
                            className="btn-sleek btn-sleek-warning glint-effect"
                            onClick={handlePause}
                            style={{
                                padding: "5px 10px",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                            title="Pause this flow"
                        >
                            <i className="fa fa-pause"></i> Pause
                        </button>
                    </>
                )}
                {flow.killable && !isBlocked && (
                    <button
                        onClick={handleBlock}
                        className="btn-sleek btn-sleek-danger glint-effect"
                        style={{
                            padding: "5px 10px",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                        title="Block this flow"
                    >
                        <i className="fa fa-ban"></i> Block
                    </button>
                )}
                {canReplay(flow) && !isIntercepted && (
                    <>
                        <button
                            onClick={handleReplay}
                            className="btn-sleek btn-sleek-primary glint-effect"
                            style={{
                                padding: "5px 10px",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                            title="Replay this flow (creates a new flow)"
                        >
                            <i className="fa fa-repeat"></i> Replay
                        </button>
                        <button
                            onClick={() => setShowReplayModal(true)}
                            className="btn-sleek btn-sleek-info glint-effect"
                            style={{
                                padding: "5px 10px",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                            title="Replay with modifications"
                        >
                            <i className="fa fa-edit"></i> Replay Modified
                        </button>
                    </>
                )}
            </div>
            <nav className="nav-tabs nav-tabs-sm">
                <button
                    data-testid="close-button-id"
                    className="close-button"
                    onClick={() => dispatch(flowsActions.select([]))}
                >
                    <i className="fa fa-times-circle"></i>
                </button>
                {tabs.map((tabId) => (
                    <a
                        key={tabId}
                        href="#"
                        className={classnames({ active: active === tabId })}
                        onClick={(event) => {
                            event.preventDefault();
                            dispatch(selectTab(tabId));
                        }}
                    >
                        {allTabs[tabId].displayName}
                    </a>
                ))}
            </nav>
            <Tab flow={flow} />
            {showReplayModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }} onClick={() => setShowReplayModal(false)}>
                    <div style={{
                        backgroundColor: "var(--bg-primary)",
                        padding: "20px",
                        borderRadius: "8px",
                        maxWidth: "800px",
                        maxHeight: "90vh",
                        overflow: "auto",
                        width: "90%",
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3>Replay with Modifications</h3>
                            <button
                                className="btn-sleek"
                                onClick={() => setShowReplayModal(false)}
                                style={{ padding: "4px 8px" }}
                            >
                                <i className="fa fa-times"></i>
                            </button>
                        </div>
                        <ReplayWithModifications />
                    </div>
                </div>
            )}
        </div>
    );
}
