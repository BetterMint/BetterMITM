import React, { ReactElement, type JSX } from "react";
import { useAppDispatch, useAppSelector } from "../../ducks";
import classnames from "classnames";
import {
    canReplay,
    endTime,
    getTotalSize,
    startTime,
    sortFunctions,
    getIcon,
    mainPath,
    statusCode,
    getMethod,
    getVersion,
} from "../../flow/utils";
import { formatSize, formatTimeDelta, formatTimeStamp, fetchApi } from "../../utils";
import * as flowActions from "../../ducks/flows";
import { Flow } from "../../flow";
import { BookmarkButton, TagEditor } from "./FlowBookmarks";

type FlowColumnProps = {
    flow: Flow;
};

interface FlowColumn {
    (props: FlowColumnProps): JSX.Element;

    headerName: string;
}

export const tls: FlowColumn = ({ flow }) => {
    return (
        <td
            className={classnames(
                "col-tls",
                flow.client_conn.tls_established
                    ? "col-tls-https"
                    : "col-tls-http",
            )}
        />
    );
};
tls.headerName = "";

export const index: FlowColumn = ({ flow }) => {
    const index = useAppSelector(
        (state) => state.flows._listIndex.get(flow.id)!,
    );
    return <td className="col-index">{index + 1}</td>;
};
index.headerName = "#";

export const icon: FlowColumn = ({ flow }) => {
    return (
        <td className="col-icon">
            <div className={classnames("resource-icon", getIcon(flow))} />
        </td>
    );
};
icon.headerName = "";

export const path: FlowColumn = ({ flow }) => {
    let err;
    if (flow.error) {
        if (flow.error.msg === "Connection killed.") {
            err = <i className="fa fa-fw fa-times pull-right" />;
        } else {
            err = <i className="fa fa-fw fa-exclamation pull-right" />;
        }
    }
    return (
        <td className="col-path" style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, paddingLeft: "12px" }}>
            <span style={{ flex: "1", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "4px" }}>
                {mainPath(flow)}
            </span>
            <span className="pull-right" style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "auto" }}>
                {flow.is_replay === "request" && (
                    <i className="fa fa-fw fa-repeat" title="Replay" />
                )}
                {flow.intercepted && <i className="fa fa-fw fa-pause" title="Intercepted" />}
                {err}
                {flow.marked && <span className="marker">{flow.marked}</span>}
                {flow.intercept_state === "paused" || flow.intercept_state === "intercepted" ? (
                    <span
                        style={{
                            display: "inline-block",
                            padding: "2px 6px",
                        backgroundColor: "#ffc107",
                        color: "#000",
                        borderRadius: "3px",
                        fontSize: "10px",
                        fontWeight: "bold",
                    }}
                    title="Paused/Intercepted"
                >
                    ⏸
                </span>
            ) : flow.intercept_state === "blocked" ? (
                    <span
                        style={{
                            display: "inline-block",
                            padding: "2px 6px",
                            backgroundColor: "#dc3545",
                            color: "#fff",
                            borderRadius: "3px",
                            fontSize: "10px",
                            fontWeight: "bold",
                        }}
                        title="Blocked"
                    >
                        🚫
                    </span>
                ) : null}
            </span>
        </td>
    );
};
path.headerName = "Path";

export const method: FlowColumn = ({ flow }) => (
    <td className="col-method">{getMethod(flow)}</td>
);
method.headerName = "Method";

export const version: FlowColumn = ({ flow }) => (
    <td className="col-http-version">{getVersion(flow)}</td>
);
version.headerName = "Version";

export const status: FlowColumn = ({ flow }) => {
    let color = "darkred";

    if ((flow.type !== "http" && flow.type != "dns") || !flow.response)
        return <td className="col-status" />;

    if (100 <= flow.response.status_code && flow.response.status_code < 200) {
        color = "green";
    } else if (
        200 <= flow.response.status_code &&
        flow.response.status_code < 300
    ) {
        color = "darkgreen";
    } else if (
        300 <= flow.response.status_code &&
        flow.response.status_code < 400
    ) {
        color = "lightblue";
    } else if (
        400 <= flow.response.status_code &&
        flow.response.status_code < 500
    ) {
        color = "red";
    } else if (
        500 <= flow.response.status_code &&
        flow.response.status_code < 600
    ) {
        color = "red";
    }

    return (
        <td className="col-status" style={{ color: color }}>
            {statusCode(flow)}
        </td>
    );
};
status.headerName = "Status";

export const size: FlowColumn = ({ flow }) => {
    return <td className="col-size">{formatSize(getTotalSize(flow))}</td>;
};
size.headerName = "Size";

export const time: FlowColumn = ({ flow }) => {
    const start = startTime(flow);
    const end = endTime(flow);
    return (
        <td className="col-time">
            {start && end ? formatTimeDelta(1000 * (end - start)) : "..."}
        </td>
    );
};
time.headerName = "Time";

export const timestamp: FlowColumn = ({ flow }) => {
    const start = startTime(flow);
    return (
        <td className="col-timestamp">
            {start ? formatTimeStamp(start) : "..."}
        </td>
    );
};
timestamp.headerName = "Start time";

export const quickactions: FlowColumn = ({ flow }) => {
    const dispatch = useAppDispatch();
    const interceptUrls = useAppSelector((state) => state.options.advanced_intercept_urls || "");
    const skipDomains = useAppSelector((state) => (state.options as any).advanced_skip_domains || "");

    const handleIntercept = async () => {
        try {
            const response = await fetchApi(`/flows/${flow.id}/state`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "intercept" }),
            });
            if (response.ok) {
                dispatch(flowActions.update(flow, {}));
                if (flow.type === "http" && flow.request) {
                    
                    const host = flow.request.pretty_host || flow.request.host;
                    const path = flow.request.path || "";
                    const urlPattern = host + path;
                    
                    
                    const urlList = interceptUrls.split(",").map(u => u.trim()).filter(Boolean);
                    if (!urlList.includes(urlPattern)) {
                        try {
                            
                            const newUrls = urlList.length > 0 ? `${interceptUrls}, ${urlPattern}` : urlPattern;
                            
                            
                            await fetchApi("/advanced-intercept-rules", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    enabled: true,
                                    intercept_urls: newUrls,
                                }),
                            });
                            
                            
                            const updateResponse = await fetchApi("/advanced-intercept-rules");
                            if (updateResponse.ok) {
                                const rules = await updateResponse.json();
                                const { OPTIONS_UPDATE } = await import("../../ducks/options.js");
                                dispatch(OPTIONS_UPDATE({
                                    advanced_intercept_enabled: { value: true } as any,
                                    advanced_intercept_urls: { value: rules.intercept_urls || "" } as any,
                                }));
                            }
                        } catch (e) {
                            console.error("Failed to update intercept URLs:", e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to intercept flow:", error);
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
                dispatch(flowActions.update(flow, {}));
                if (flow.type === "http") {
                    const url = flow.request.pretty_host + flow.request.path;
                    try {
                        const newUrls = interceptUrls ? `${interceptUrls}, ${url}` : url;
                        await fetchApi("/advanced-intercept-rules", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                intercept_urls: newUrls,
                            }),
                        });
                    } catch (e) {
                        console.error("Failed to update intercept URLs:", e);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to pause flow:", error);
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
                dispatch(flowActions.update(flow, {}));
            }
        } catch (error) {
            console.error("Failed to resume flow:", error);
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
                dispatch(flowActions.update(flow, {}));
            }
        } catch (error) {
            console.error("Failed to block flow:", error);
        }
    };

    const actions: ReactElement[] = [];
    const interceptState = flow.intercept_state;

    if (
        !flow.intercepted &&
        !interceptState &&
        flow.type === "http" &&
        flow.live
    ) {
        actions.push(
            <a
                key="intercept"
                href="#"
                className="quickaction"
                onClick={(e) => {
                    e.preventDefault();
                    handleIntercept();
                }}
                title="Intercept this flow"
            >
                <i className="fa fa-fw fa-pause-circle text-warning" />
            </a>,
        );
    }

    if (
        !flow.intercepted &&
        interceptState !== "paused" &&
        interceptState !== "intercepted" &&
        flow.live &&
        flow.type === "http"
    ) {
        actions.push(
            <a
                key="pause"
                href="#"
                className="quickaction"
                onClick={(e) => {
                    e.preventDefault();
                    handlePause();
                }}
                title="Pause this flow"
            >
                <i className="fa fa-fw fa-pause text-warning" />
            </a>,
        );
    }

    if (flow.intercepted || interceptState === "paused" || interceptState === "intercepted") {
        actions.push(
            <a
                key="resume"
                href="#"
                className="quickaction"
                onClick={(e) => {
                    e.preventDefault();
                    handleResume();
                }}
                title="Resume this flow"
            >
                <i className="fa fa-fw fa-play text-success" />
            </a>,
        );
    }

    if (interceptState !== "blocked" && flow.killable && flow.live) {
        actions.push(
            <a
                key="block"
                href="#"
                className="quickaction"
                onClick={(e) => {
                    e.preventDefault();
                    handleBlock();
                }}
                title="Block this flow"
            >
                <i className="fa fa-fw fa-ban text-danger" />
            </a>,
        );
    }

    if (canReplay(flow) && !flow.intercepted && !interceptState) {
        actions.push(
            <a
                key="replay"
                href="#"
                className="quickaction"
                onClick={() => dispatch(flowActions.replay([flow]))}
                title="Replay this flow"
            >
                <i className="fa fa-fw fa-repeat text-primary" />
            </a>,
        );
    }

    const handleSkipOne = async () => {
        try {
            const url = flow.type === "http" ? flow.request.pretty_host : "";
            if (url) {
                const newSkip = skipDomains ? `${skipDomains}, ${url}:1` : `${url}:1`;
                const response = await fetchApi("/advanced-intercept-rules", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        skip_domains: newSkip,
                    }),
                });
                if (response.ok) {
                    dispatch(flowActions.update(flow, {}));
                }
            }
        } catch (error) {
            console.error("Failed to skip one:", error);
        }
    };

    const handleSkipN = async () => {
        const count = prompt("How many connections to skip before intercepting?", "5");
        if (count && !isNaN(parseInt(count))) {
            try {
                const url = flow.type === "http" ? flow.request.pretty_host : "";
                if (url) {
                    const newSkip = skipDomains ? `${skipDomains}, ${url}:${count}` : `${url}:${count}`;
                    const response = await fetchApi("/advanced-intercept-rules", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            skip_domains: newSkip,
                        }),
                    });
                    if (response.ok) {
                        dispatch(flowActions.update(flow, {}));
                    }
                }
            } catch (error) {
                console.error("Failed to skip N:", error);
            }
        }
    };

    if (flow.type === "http" && flow.live && !flow.intercepted && !interceptState) {
        actions.push(
            <a
                key="skip-one"
                href="#"
                className="quickaction"
                onClick={(e) => {
                    e.preventDefault();
                    handleSkipOne();
                }}
                title="Skip this connection, intercept next"
            >
                <i className="fa fa-fw fa-step-forward text-info" />
            </a>,
            <a
                key="skip-n"
                href="#"
                className="quickaction"
                onClick={(e) => {
                    e.preventDefault();
                    handleSkipN();
                }}
                title="Skip N connections from this domain before intercepting"
            >
                <i className="fa fa-fw fa-fast-forward text-info" />
            </a>,
        );
    }

    return (
        <td className="col-quickactions">
            <div style={{ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
                {actions.length > 0 ? actions : null}
                <BookmarkButton flow={flow} />
            </div>
        </td>
    );
};
quickactions.headerName = "";

export const comment: FlowColumn = ({ flow }) => {
    const text = flow.comment;
    return <td className="col-comment">{text}</td>;
};
comment.headerName = "Comment";

const FlowColumns: { [key in keyof typeof sortFunctions]: FlowColumn } = {
    
    icon,
    index,
    method,
    version,
    path,
    quickactions,
    size,
    status,
    time,
    timestamp,
    tls,
    comment,
};
export default FlowColumns;
