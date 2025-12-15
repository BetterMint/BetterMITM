import * as React from "react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../ducks";
import { HTTPFlow } from "../../flow";
import { fetchApi } from "../../utils";
import * as flowActions from "../../ducks/flows";
import KeyValueListEditor from "../editors/KeyValueListEditor";
import CodeEditor from "../contentviews/CodeEditor";
import { SyntaxHighlight } from "../../backends/consts";

export default function ReplayWithModifications() {
    const dispatch = useAppDispatch();
    const flow = useAppSelector((state) => state.flows.selected[0]) as HTTPFlow;
    const [modifyRequest, setModifyRequest] = useState(false);
    const [modifyResponse, setModifyResponse] = useState(false);
    const [modifiedHeaders, setModifiedHeaders] = useState(flow.request.headers || []);
    const [modifiedBody, setModifiedBody] = useState("");
    const [modifiedMethod, setModifiedMethod] = useState(flow.request.method);
    const [delay, setDelay] = useState(0);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [batchReplay, setBatchReplay] = useState(false);
    const [replayCount, setReplayCount] = useState(1);
    const [replayInterval, setReplayInterval] = useState(1000);
    const [applyTransformations, setApplyTransformations] = useState(false);
    const [transformationScript, setTransformationScript] = useState("");

    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE", "CONNECT"];

    const replayWithModifications = async () => {
        try {
            const modifications: any = {};
            if (modifyRequest) {
                modifications.request = {
                    method: modifiedMethod,
                    headers: modifiedHeaders,
                };
                if (modifiedBody) {
                    modifications.request.content = modifiedBody;
                }
            }
            if (modifyResponse && flow.response) {
                modifications.response = {
                    headers: flow.response.headers,
                };
            }

            await fetchApi(`/flows/${flow.id}/replay-modified`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    modifications,
                    delay,
                }),
            });

            dispatch(flowActions.update(flow, {}));
            alert("Flow replayed with modifications");
        } catch (error) {
            console.error("Failed to replay:", error);
            alert("Failed to replay flow");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <div className="card-sleek">
                <h3 style={{ marginBottom: "16px" }}>Replay with Modifications</h3>
                <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                    <label className="checkbox-sleek" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                            type="checkbox"
                            checked={modifyRequest}
                            onChange={(e) => setModifyRequest(e.target.checked)}
                        />
                        <span>Modify Request</span>
                    </label>
                </div>
                {modifyRequest && (
                    <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "4px" }}>
                        <div className="compact-spacing" style={{ marginBottom: "12px" }}>
                            <label className="label-sleek">Method:</label>
                            <select
                                className="select-sleek"
                                value={modifiedMethod}
                                onChange={(e) => setModifiedMethod(e.target.value)}
                                style={{ width: "150px" }}
                            >
                                {methods.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="compact-spacing" style={{ marginBottom: "12px" }}>
                            <label className="label-sleek">Headers:</label>
                            <KeyValueListEditor
                                data={modifiedHeaders}
                                onChange={setModifiedHeaders}
                            />
                        </div>
                        <div className="compact-spacing" style={{ marginBottom: "12px" }}>
                            <label className="label-sleek">Body:</label>
                            <div style={{ height: "200px", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
                                <CodeEditor
                                    initialContent={modifiedBody}
                                    onChange={setModifiedBody}
                                    showControls={true}
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                    <div className="compact-spacing">
                        <label className="label-sleek">Delay (ms):</label>
                        <input
                            type="number"
                            className="input-sleek"
                            value={delay}
                            onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div className="compact-spacing">
                        <label className="label-sleek">Replay Count:</label>
                        <input
                            type="number"
                            className="input-sleek"
                            value={replayCount}
                            onChange={(e) => setReplayCount(parseInt(e.target.value) || 1)}
                            min={1}
                            max={100}
                            style={{ width: "100%" }}
                        />
                    </div>
                </div>
                <div style={{ marginBottom: "16px" }}>
                    <button
                        className="btn-sleek glint-effect"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        style={{ padding: "6px 12px", fontSize: "12px", width: "100%" }}
                    >
                        <i className={`fa fa-${showAdvanced ? "chevron-up" : "chevron-down"}`}></i> {showAdvanced ? "Hide" : "Show"} Advanced Options
                    </button>
                </div>
                {showAdvanced && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "6px", fontSize: "12px" }}>Replay Interval (ms):</label>
                                <input
                                    type="number"
                                    className="input-sleek"
                                    value={replayInterval}
                                    onChange={(e) => setReplayInterval(parseInt(e.target.value) || 1000)}
                                    min={100}
                                    max={60000}
                                    style={{ width: "100%", padding: "8px" }}
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                                <input
                                    type="checkbox"
                                    checked={batchReplay}
                                    onChange={(e) => setBatchReplay(e.target.checked)}
                                />
                                <span style={{ fontSize: "12px" }}>Batch Replay</span>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <input
                                    type="checkbox"
                                    checked={applyTransformations}
                                    onChange={(e) => setApplyTransformations(e.target.checked)}
                                />
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>Apply Transformations (JavaScript)</span>
                            </label>
                            {applyTransformations && (
                                <div style={{ height: "150px", border: "1px solid var(--border-color)", borderRadius: "4px", marginTop: "8px" }}>
                                    <CodeEditor
                                        initialContent={transformationScript}
                                        onChange={setTransformationScript}
                                        language={SyntaxHighlight.JAVASCRIPT}
                                        showControls={true}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <button
                    className="btn-sleek btn-sleek-success glint-effect"
                    onClick={replayWithModifications}
                    style={{ padding: "8px 16px", width: "100%" }}
                >
                    <i className="fa fa-repeat"></i> Replay with Modifications {replayCount > 1 ? `(${replayCount}x)` : ""}
                </button>
            </div>
        </div>
    );
}

