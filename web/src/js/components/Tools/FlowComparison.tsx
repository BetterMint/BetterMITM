import * as React from "react";
import { useState } from "react";
import { useAppSelector } from "../../ducks";
import { Flow, HTTPFlow } from "../../flow";
import DiffMatchPatch from "diff-match-patch";

const dmp = new DiffMatchPatch();


function getHeaderValue(headers: [string, string][], name: string): string | null {
    const header = headers.find(([key]) => key.toLowerCase() === name.toLowerCase());
    return header ? header[1] : null;
}

export default function FlowComparison() {
    const flows = useAppSelector((state) => state.flows.list);
    const [flow1Id, setFlow1Id] = useState<string | null>(null);
    const [flow2Id, setFlow2Id] = useState<string | null>(null);
    const [compareMode, setCompareMode] = useState<"side-by-side" | "unified" | "diff-only">("side-by-side");
    const [activeTab, setActiveTab] = useState<"headers" | "body" | "timing" | "summary">("summary");
    const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
    const [ignoreCase, setIgnoreCase] = useState(false);
    const [ignoreHeaders, setIgnoreHeaders] = useState<string[]>([]);
    const [diffAlgorithm, setDiffAlgorithm] = useState<"semantic" | "character" | "word">("semantic");
    const [contextLines, setContextLines] = useState(3);

    const flow1 = flow1Id ? flows.find((f) => f.id === flow1Id) : null;
    const flow2 = flow2Id ? flows.find((f) => f.id === flow2Id) : null;

    const httpFlow1 = flow1 && flow1.type === "http" ? (flow1 as HTTPFlow) : null;
    const httpFlow2 = flow2 && flow2.type === "http" ? (flow2 as HTTPFlow) : null;

    const compareHeaders = (headers1: [string, string][] | undefined, headers2: [string, string][] | undefined) => {
        const h1 = Object.fromEntries((headers1 || []).map((h) => [h[0].toLowerCase(), h[1]]));
        const h2 = Object.fromEntries((headers2 || []).map((h) => [h[0].toLowerCase(), h[1]]));
        const allKeys = new Set([...Object.keys(h1), ...Object.keys(h2)]);
        const diff: Array<{ key: string; value1: string; value2: string; changed: boolean; added: boolean; removed: boolean }> = [];
        allKeys.forEach((key) => {
            
            if (ignoreHeaders.some(ignored => ignored.toLowerCase() === key.toLowerCase())) {
                return;
            }
            const v1 = h1[key] || "";
            const v2 = h2[key] || "";
            diff.push({
                key,
                value1: v1,
                value2: v2,
                changed: v1 !== v2 && v1 !== "" && v2 !== "",
                added: v1 === "" && v2 !== "",
                removed: v1 !== "" && v2 === "",
            });
        });
        return diff;
    };

    const compareBody = (body1: string, body2: string) => {
        const diffs = dmp.diff_main(body1 || "", body2 || "");
        dmp.diff_cleanupSemantic(diffs);
        return diffs;
    };

    const exportComparison = (format: "json" | "html" | "markdown") => {
        if (!httpFlow1 || !httpFlow2) return;
        
        const comparison = {
            flow1: { id: flow1Id, method: httpFlow1.request.method, url: httpFlow1.request.path },
            flow2: { id: flow2Id, method: httpFlow2.request.method, url: httpFlow2.request.path },
            differences: {
                requestHeaders: compareHeaders(httpFlow1.request.headers, httpFlow2.request.headers).filter(d => d.changed || d.added || d.removed),
                responseHeaders: httpFlow1.response && httpFlow2.response ? compareHeaders(httpFlow1.response.headers, httpFlow2.response.headers).filter(d => d.changed || d.added || d.removed) : [],
            },
        };

        if (format === "json") {
            const blob = new Blob([JSON.stringify(comparison, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `flow-comparison-${Date.now()}.json`;
            a.click();
        }
    };

    const requestHeaderDiffs = httpFlow1 && httpFlow2 ? compareHeaders(httpFlow1.request.headers, httpFlow2.request.headers) : [];
    const responseHeaderDiffs = httpFlow1?.response && httpFlow2?.response ? compareHeaders(httpFlow1.response.headers, httpFlow2.response.headers) : [];
    
    
    const requestBodyDiffs = httpFlow1 && httpFlow2 ? compareBody("", "") : [];
    const responseBodyDiffs = httpFlow1?.response && httpFlow2?.response ? compareBody("", "") : [];

    const totalDiffs = 
        requestHeaderDiffs.filter(d => d.changed || d.added || d.removed).length +
        responseHeaderDiffs.filter(d => d.changed || d.added || d.removed).length +
        requestBodyDiffs.filter(d => d[0] !== 0).length +
        responseBodyDiffs.filter(d => d[0] !== 0).length;

    return (
        <div style={{ padding: "32px", maxWidth: "1920px", margin: "0 auto", height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
            <div className="card-sleek glint-effect" style={{ marginBottom: "24px", padding: "20px", background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                        <i className="fa fa-code-fork" style={{ color: "var(--accent-primary)", fontSize: "28px" }}></i>
                        Flow Comparison Tool
                    </h2>
                    <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>
                        Compare two flows side-by-side with detailed diff analysis
                    </p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                            className={`btn-sleek glint-effect ${compareMode === "side-by-side" ? "btn-sleek-success" : ""}`}
                            onClick={() => setCompareMode("side-by-side")}
                            style={{ padding: "8px 16px", fontSize: "13px" }}
                        >
                            <i className="fa fa-columns"></i> Side-by-Side
                        </button>
                        <button
                            className={`btn-sleek glint-effect ${compareMode === "unified" ? "btn-sleek-success" : ""}`}
                            onClick={() => setCompareMode("unified")}
                            style={{ padding: "8px 16px", fontSize: "13px" }}
                        >
                            <i className="fa fa-align-center"></i> Unified
                        </button>
                        <button
                            className={`btn-sleek glint-effect ${compareMode === "diff-only" ? "btn-sleek-success" : ""}`}
                            onClick={() => setCompareMode("diff-only")}
                            style={{ padding: "8px 16px", fontSize: "13px" }}
                        >
                            <i className="fa fa-filter"></i> Diffs Only
                        </button>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "16px", alignItems: "center" }}>
                    <div>
                        <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                            <i className="fa fa-file-o"></i> Flow 1:
                        </label>
                        <select
                            className="select-sleek"
                            value={flow1Id || ""}
                            onChange={(e) => setFlow1Id(e.target.value || null)}
                            style={{ width: "100%", padding: "10px", fontSize: "14px" }}
                        >
                            <option value="">Select flow...</option>
                            {flows.filter(f => f.type === "http").map((f) => {
                                const httpF = f as HTTPFlow;
                                return (
                                    <option key={f.id} value={f.id}>
                                        {httpF.request?.method} {httpF.request?.path} - {f.id.substring(0, 8)}
                                    </option>
                                );
                            })}
                        </select>
                        {httpFlow1 && (
                            <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                                <i className="fa fa-clock-o"></i> {new Date(httpFlow1.timestamp_created * 1000).toLocaleString()}
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: "center", fontSize: "24px", color: "var(--accent-primary)" }}>
                        <i className="fa fa-exchange"></i>
                    </div>
                    <div>
                        <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                            <i className="fa fa-file-o"></i> Flow 2:
                        </label>
                        <select
                            className="select-sleek"
                            value={flow2Id || ""}
                            onChange={(e) => setFlow2Id(e.target.value || null)}
                            style={{ width: "100%", padding: "10px", fontSize: "14px" }}
                        >
                            <option value="">Select flow...</option>
                            {flows.filter(f => f.type === "http").map((f) => {
                                const httpF = f as HTTPFlow;
                                return (
                                    <option key={f.id} value={f.id}>
                                        {httpF.request?.method} {httpF.request?.path} - {f.id.substring(0, 8)}
                                    </option>
                                );
                            })}
                        </select>
                        {httpFlow2 && (
                            <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                                <i className="fa fa-clock-o"></i> {new Date(httpFlow2.timestamp_created * 1000).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                {httpFlow1 && httpFlow2 && (
                    <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <i className="fa fa-info-circle" style={{ color: "var(--accent-primary)" }}></i>
                                <span style={{ fontWeight: "600" }}>Total Differences:</span>
                                <span style={{ padding: "4px 12px", backgroundColor: totalDiffs > 0 ? "var(--accent-warning)" : "var(--accent-secondary)", color: "white", borderRadius: "12px", fontSize: "14px", fontWeight: "700" }}>
                                    {totalDiffs}
                                </span>
                            </div>
                            <label className="checkbox-sleek" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={showOnlyDiffs}
                                    onChange={(e) => setShowOnlyDiffs(e.target.checked)}
                                />
                                <span>Show only differences</span>
                            </label>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                                className="btn-sleek glint-effect"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                style={{ padding: "8px 16px", fontSize: "13px" }}
                            >
                                <i className={`fa fa-${showAdvanced ? "chevron-up" : "chevron-down"}`}></i> {showAdvanced ? "Hide" : "Show"} Options
                            </button>
                            <button
                                className="btn-sleek glint-effect"
                                onClick={() => exportComparison("json")}
                                style={{ padding: "8px 16px", fontSize: "13px" }}
                            >
                                <i className="fa fa-download"></i> Export JSON
                            </button>
                            <button
                                className="btn-sleek glint-effect"
                                onClick={() => exportComparison("html")}
                                style={{ padding: "8px 16px", fontSize: "13px" }}
                            >
                                <i className="fa fa-download"></i> Export HTML
                            </button>
                        </div>
                        {showAdvanced && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "12px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", width: "100%" }}>
                                <div>
                                    <label className="label-sleek" style={{ display: "block", marginBottom: "6px", fontSize: "12px" }}>Diff Algorithm:</label>
                                    <select
                                        className="select-sleek"
                                        value={diffAlgorithm}
                                        onChange={(e) => setDiffAlgorithm(e.target.value as any)}
                                        style={{ width: "100%", padding: "8px" }}
                                    >
                                        <option value="semantic">Semantic (Recommended)</option>
                                        <option value="character">Character-based</option>
                                        <option value="word">Word-based</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label-sleek" style={{ display: "block", marginBottom: "6px", fontSize: "12px" }}>Context Lines:</label>
                                    <input
                                        type="number"
                                        className="input-sleek"
                                        value={contextLines}
                                        onChange={(e) => setContextLines(parseInt(e.target.value) || 3)}
                                        min={0}
                                        max={20}
                                        style={{ width: "100%", padding: "8px" }}
                                    />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "20px" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <input
                                            type="checkbox"
                                            checked={ignoreWhitespace}
                                            onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                                        />
                                        <span style={{ fontSize: "12px" }}>Ignore Whitespace</span>
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <input
                                            type="checkbox"
                                            checked={ignoreCase}
                                            onChange={(e) => setIgnoreCase(e.target.checked)}
                                        />
                                        <span style={{ fontSize: "12px" }}>Ignore Case</span>
                                    </label>
                                </div>
                                <div style={{ marginTop: "12px" }}>
                                    <label className="label-sleek" style={{ display: "block", marginBottom: "6px", fontSize: "12px" }}>
                                        Ignore Headers:
                                    </label>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                                        {ignoreHeaders.map((header, index) => (
                                            <div key={index} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                <input
                                                    type="text"
                                                    className="input-sleek"
                                                    value={header}
                                                    onChange={(e) => {
                                                        const newHeaders = [...ignoreHeaders];
                                                        newHeaders[index] = e.target.value;
                                                        setIgnoreHeaders(newHeaders);
                                                    }}
                                                    placeholder="Header name (e.g., User-Agent)"
                                                    style={{ flex: 1, padding: "6px", fontSize: "12px" }}
                                                />
                                                <button
                                                    className="btn-sleek btn-sleek-danger"
                                                    onClick={() => setIgnoreHeaders(ignoreHeaders.filter((_, i) => i !== index))}
                                                    style={{ padding: "6px 10px", fontSize: "11px" }}
                                                >
                                                    <i className="fa fa-times"></i>
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            className="btn-sleek"
                                            onClick={() => setIgnoreHeaders([...ignoreHeaders, ""])}
                                            style={{ alignSelf: "flex-start", padding: "6px 12px", fontSize: "11px" }}
                                        >
                                            <i className="fa fa-plus"></i> Add Header to Ignore
                                        </button>
                                    </div>
                                    <small style={{ color: "var(--text-secondary)", fontSize: "11px", display: "block", marginTop: "4px" }}>
                                        Headers in this list will be excluded from comparison (case-insensitive)
                                    </small>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            {httpFlow1 && httpFlow2 && (
                <>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "2px solid var(--border-color)", paddingBottom: "12px" }}>
                        {(["summary", "headers", "body", "timing"] as const).map((tab) => (
                            <button
                                key={tab}
                                className={`btn-sleek glint-effect ${activeTab === tab ? "btn-sleek-success" : ""}`}
                                onClick={() => setActiveTab(tab)}
                                style={{ padding: "10px 20px", fontSize: "14px", textTransform: "capitalize", fontWeight: activeTab === tab ? "600" : "400" }}
                            >
                                <i className={`fa fa-${tab === "summary" ? "dashboard" : tab === "headers" ? "header" : tab === "body" ? "file-text" : "clock-o"}`}></i> {tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === "summary" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                            <div className="card-sleek glint-effect" style={{ padding: "20px" }}>
                                <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <i className="fa fa-header" style={{ color: "var(--accent-primary)" }}></i>
                                    Request Headers
                                </h3>
                                <div style={{ fontSize: "48px", fontWeight: "700", color: "var(--accent-primary)", marginBottom: "8px" }}>
                                    {requestHeaderDiffs.filter(d => d.changed || d.added || d.removed).length}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                    {requestHeaderDiffs.length} total headers
                                </div>
                            </div>
                            <div className="card-sleek glint-effect" style={{ padding: "20px" }}>
                                <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <i className="fa fa-file-text" style={{ color: "var(--accent-primary)" }}></i>
                                    Request Body
                                </h3>
                                <div style={{ fontSize: "48px", fontWeight: "700", color: "var(--accent-primary)", marginBottom: "8px" }}>
                                    {requestBodyDiffs.filter(d => d[0] !== 0).length}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                    {requestBodyDiffs.length} total changes
                                </div>
                            </div>
                            {httpFlow1.response && httpFlow2.response && (
                                <>
                                    <div className="card-sleek glint-effect" style={{ padding: "20px" }}>
                                        <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <i className="fa fa-header" style={{ color: "var(--accent-primary)" }}></i>
                                            Response Headers
                                        </h3>
                                        <div style={{ fontSize: "48px", fontWeight: "700", color: "var(--accent-primary)", marginBottom: "8px" }}>
                                            {responseHeaderDiffs.filter(d => d.changed || d.added || d.removed).length}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                            {responseHeaderDiffs.length} total headers
                                        </div>
                                    </div>
                                    <div className="card-sleek glint-effect" style={{ padding: "20px" }}>
                                        <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <i className="fa fa-file-text" style={{ color: "var(--accent-primary)" }}></i>
                                            Response Body
                                        </h3>
                                        <div style={{ fontSize: "48px", fontWeight: "700", color: "var(--accent-primary)", marginBottom: "8px" }}>
                                            {responseBodyDiffs.filter(d => d[0] !== 0).length}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                            {responseBodyDiffs.length} total changes
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "headers" && (
                        <div style={{ display: "grid", gridTemplateColumns: compareMode === "side-by-side" ? "1fr 1fr" : "1fr", gap: "20px" }}>
                            <div className="card-sleek glint-effect" style={{ padding: "20px" }}>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <i className="fa fa-arrow-up" style={{ color: "var(--accent-primary)" }}></i>
                                    Request Headers
                                </h3>
                                <div style={{ maxHeight: "500px", overflow: "auto" }}>
                                    <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                                                <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "600" }}>Header</th>
                                                <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "600" }}>Flow 1</th>
                                                {compareMode === "side-by-side" && (
                                                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "600" }}>Flow 2</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requestHeaderDiffs
                                                .filter(d => !showOnlyDiffs || d.changed || d.added || d.removed)
                                                .map((diff, i) => (
                                                <tr
                                                    key={i}
                                                    style={{
                                                        backgroundColor: diff.changed ? "rgba(255, 193, 7, 0.1)" : diff.added ? "rgba(40, 167, 69, 0.1)" : diff.removed ? "rgba(220, 53, 69, 0.1)" : "transparent",
                                                        borderBottom: "1px solid var(--border-color)",
                                                    }}
                                                >
                                                    <td style={{ padding: "10px 8px", fontWeight: "500" }}>{diff.key}</td>
                                                    <td style={{ padding: "10px 8px", fontFamily: "monospace", fontSize: "12px" }}>
                                                        {diff.removed ? <span style={{ textDecoration: "line-through", color: "var(--accent-danger)" }}>{diff.value1}</span> : diff.value1 || <span style={{ color: "var(--text-secondary)" }}>-</span>}
                                                    </td>
                                                    {compareMode === "side-by-side" && (
                                                        <td style={{ padding: "10px 8px", fontFamily: "monospace", fontSize: "12px" }}>
                                                            {diff.added ? <span style={{ color: "var(--accent-secondary)" }}>{diff.value2}</span> : diff.value2 || <span style={{ color: "var(--text-secondary)" }}>-</span>}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {httpFlow1.response && httpFlow2.response && (
                                <div className="card-sleek glint-effect" style={{ padding: "20px" }}>
                                    <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <i className="fa fa-arrow-down" style={{ color: "var(--accent-primary)" }}></i>
                                        Response Headers
                                    </h3>
                                    <div style={{ maxHeight: "500px", overflow: "auto" }}>
                                        <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                                                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "600" }}>Header</th>
                                                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "600" }}>Flow 1</th>
                                                    {compareMode === "side-by-side" && (
                                                        <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "600" }}>Flow 2</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {responseHeaderDiffs
                                                    .filter(d => !showOnlyDiffs || d.changed || d.added || d.removed)
                                                    .map((diff, i) => (
                                                    <tr
                                                        key={i}
                                                        style={{
                                                            backgroundColor: diff.changed ? "rgba(255, 193, 7, 0.1)" : diff.added ? "rgba(40, 167, 69, 0.1)" : diff.removed ? "rgba(220, 53, 69, 0.1)" : "transparent",
                                                            borderBottom: "1px solid var(--border-color)",
                                                        }}
                                                    >
                                                        <td style={{ padding: "10px 8px", fontWeight: "500" }}>{diff.key}</td>
                                                        <td style={{ padding: "10px 8px", fontFamily: "monospace", fontSize: "12px" }}>
                                                            {diff.removed ? <span style={{ textDecoration: "line-through", color: "var(--accent-danger)" }}>{diff.value1}</span> : diff.value1 || <span style={{ color: "var(--text-secondary)" }}>-</span>}
                                                        </td>
                                                        {compareMode === "side-by-side" && (
                                                            <td style={{ padding: "10px 8px", fontFamily: "monospace", fontSize: "12px" }}>
                                                                {diff.added ? <span style={{ color: "var(--accent-secondary)" }}>{diff.value2}</span> : diff.value2 || <span style={{ color: "var(--text-secondary)" }}>-</span>}
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "body" && (
                        <div style={{ display: "grid", gridTemplateColumns: compareMode === "side-by-side" ? "1fr 1fr" : "1fr", gap: "20px" }}>
                            <div className="card-sleek glint-effect" style={{ padding: "20px" }}>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <i className="fa fa-arrow-up" style={{ color: "var(--accent-primary)" }}></i>
                                    Request Body Diff
                                </h3>
                                <div style={{ maxHeight: "600px", overflow: "auto", fontFamily: "monospace", fontSize: "13px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                                    {requestBodyDiffs.map((diff, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                backgroundColor: diff[0] === -1 ? "rgba(220, 53, 69, 0.2)" : diff[0] === 1 ? "rgba(40, 167, 69, 0.2)" : "transparent",
                                                color: diff[0] === -1 ? "var(--accent-danger)" : diff[0] === 1 ? "var(--accent-secondary)" : "inherit",
                                                padding: diff[0] !== 0 ? "2px 4px" : "0",
                                                borderRadius: diff[0] !== 0 ? "3px" : "0",
                                            }}
                                        >
                                            {diff[1]}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {httpFlow1.response && httpFlow2.response && (
                                <div className="card-sleek glint-effect" style={{ padding: "20px" }}>
                                    <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <i className="fa fa-arrow-down" style={{ color: "var(--accent-primary)" }}></i>
                                        Response Body Diff
                                    </h3>
                                    <div style={{ maxHeight: "600px", overflow: "auto", fontFamily: "monospace", fontSize: "13px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                                        {responseBodyDiffs.map((diff, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    backgroundColor: diff[0] === -1 ? "rgba(220, 53, 69, 0.2)" : diff[0] === 1 ? "rgba(40, 167, 69, 0.2)" : "transparent",
                                                    color: diff[0] === -1 ? "var(--accent-danger)" : diff[0] === 1 ? "var(--accent-secondary)" : "inherit",
                                                    padding: diff[0] !== 0 ? "2px 4px" : "0",
                                                    borderRadius: diff[0] !== 0 ? "3px" : "0",
                                                }}
                                            >
                                                {diff[1]}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "timing" && httpFlow1 && httpFlow2 && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div className="card-sleek glint-effect" style={{ padding: "20px" }}>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>Flow 1 Timing</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "6px" }}>
                                        <span style={{ fontWeight: "600" }}>Request Start:</span>
                                        <span style={{ fontFamily: "monospace" }}>{new Date(httpFlow1.timestamp_created * 1000).toLocaleString()}</span>
                                    </div>
                                    {httpFlow1.response && httpFlow1.response.timestamp_end && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "6px" }}>
                                            <span style={{ fontWeight: "600" }}>Response End:</span>
                                            <span style={{ fontFamily: "monospace" }}>{new Date(httpFlow1.response.timestamp_end * 1000).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {httpFlow1.response && httpFlow1.response.timestamp_end && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "6px" }}>
                                            <span style={{ fontWeight: "600" }}>Duration:</span>
                                            <span style={{ fontFamily: "monospace", color: "var(--accent-primary)", fontWeight: "700" }}>
                                                {((httpFlow1.response.timestamp_end - httpFlow1.timestamp_created) * 1000).toFixed(2)} ms
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="card-sleek glint-effect" style={{ padding: "20px" }}>
                                <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>Flow 2 Timing</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "6px" }}>
                                        <span style={{ fontWeight: "600" }}>Request Start:</span>
                                        <span style={{ fontFamily: "monospace" }}>{new Date(httpFlow2.timestamp_created * 1000).toLocaleString()}</span>
                                    </div>
                                    {httpFlow2.response && httpFlow2.response.timestamp_end && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "6px" }}>
                                            <span style={{ fontWeight: "600" }}>Response End:</span>
                                            <span style={{ fontFamily: "monospace" }}>{new Date(httpFlow2.response.timestamp_end * 1000).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {httpFlow2.response && httpFlow2.response.timestamp_end && (
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "6px" }}>
                                            <span style={{ fontWeight: "600" }}>Duration:</span>
                                            <span style={{ fontFamily: "monospace", color: "var(--accent-primary)", fontWeight: "700" }}>
                                                {((httpFlow2.response.timestamp_end - httpFlow2.timestamp_created) * 1000).toFixed(2)} ms
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {(!httpFlow1 || !httpFlow2) && (
                <div className="card-sleek glint-effect" style={{ padding: "60px", textAlign: "center", color: "var(--text-secondary)", boxShadow: "var(--shadow-md)", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <i className="fa fa-code-fork" style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}></i>
                    <p style={{ fontSize: "16px", fontWeight: "500" }}>Select two HTTP flows to compare them side-by-side</p>
                </div>
            )}
            </div>
        </div>
    );
}
