import * as React from "react";
import { useState } from "react";
import { useAppSelector } from "../../ducks";
import { fetchApi } from "../../utils";
import { Flow } from "../../flow";

export default function AdvancedExport() {
    const flows = useAppSelector((state) => state.flows.list);
    const [selectedFormat, setSelectedFormat] = useState<string>("postman");
    const [selectedFlows, setSelectedFlows] = useState<Set<string>>(new Set());
    const [exporting, setExporting] = useState(false);

    const formats = [
        { id: "postman", name: "Postman Collection", ext: "json" },
        { id: "insomnia", name: "Insomnia", ext: "json" },
        { id: "openapi", name: "OpenAPI/Swagger", ext: "yaml" },
        { id: "curl", name: "cURL Commands", ext: "txt" },
        { id: "httpie", name: "HTTPie Commands", ext: "txt" },
        { id: "har", name: "HAR File", ext: "har" },
    ];

    const toggleFlow = (flowId: string) => {
        const newSelected = new Set(selectedFlows);
        if (newSelected.has(flowId)) {
            newSelected.delete(flowId);
        } else {
            newSelected.add(flowId);
        }
        setSelectedFlows(newSelected);
    };

    const selectAll = () => {
        setSelectedFlows(new Set(flows.map((f) => f.id)));
    };

    const deselectAll = () => {
        setSelectedFlows(new Set());
    };

    const exportFlows = async () => {
        if (selectedFlows.size === 0) {
            alert("Please select at least one flow to export");
            return;
        }

        setExporting(true);
        try {
            const response = await fetchApi("/export/flows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    format: selectedFormat,
                    flow_ids: Array.from(selectedFlows),
                }),
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const format = formats.find((f) => f.id === selectedFormat);
            a.download = `flows.${format?.ext || "json"}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div style={{ padding: "32px", maxWidth: "1920px", margin: "0 auto", height: "calc(100vh - 180px)", display: "flex", flexDirection: "column" }}>
            <div className="card-sleek glint-effect" style={{ marginBottom: "24px", padding: "20px", background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)", flexShrink: 0 }}>
                <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                    <i className="fa fa-download" style={{ color: "var(--accent-primary)", fontSize: "28px" }}></i>
                    Advanced Export
                </h2>
                <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>
                    Export flows to various formats for use in other tools
                </p>
            </div>
            <div className="card-sleek glint-effect" style={{ padding: "24px", boxShadow: "var(--shadow-md)", marginBottom: "24px", flexShrink: 0 }}>
                <h3 style={{ marginBottom: "20px", fontSize: "20px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                    <i className="fa fa-cog" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                    Export Configuration
                </h3>
                <div className="compact-spacing" style={{ marginBottom: "16px" }}>
                    <label className="label-sleek">Export Format:</label>
                    <select
                        className="select-sleek"
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                        style={{ width: "300px" }}
                    >
                        {formats.map((format) => (
                            <option key={format.id} value={format.id}>
                                {format.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    <button className="btn-sleek" onClick={selectAll} style={{ padding: "6px 12px" }}>
                        Select All
                    </button>
                    <button className="btn-sleek" onClick={deselectAll} style={{ padding: "6px 12px" }}>
                        Deselect All
                    </button>
                    <button
                        className="btn-sleek btn-sleek-success glint-effect"
                        onClick={exportFlows}
                        disabled={exporting || selectedFlows.size === 0}
                        style={{ padding: "6px 12px", marginLeft: "auto" }}
                    >
                        {exporting ? "Exporting..." : `Export ${selectedFlows.size} Flow(s)`}
                    </button>
                </div>
            </div>

            <div className="card-sleek glint-effect" style={{ padding: "24px", boxShadow: "var(--shadow-md)", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <h3 style={{ marginBottom: "20px", fontSize: "20px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                    <i className="fa fa-list" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                    Select Flows to Export
                </h3>
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                    <table style={{ width: "100%", fontSize: "12px" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "8px", width: "40px" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedFlows.size === flows.length && flows.length > 0}
                                        onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
                                    />
                                </th>
                                <th style={{ textAlign: "left", padding: "8px" }}>Type</th>
                                <th style={{ textAlign: "left", padding: "8px" }}>Method</th>
                                <th style={{ textAlign: "left", padding: "8px" }}>Path</th>
                                <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flows.map((flow) => (
                                <tr
                                    key={flow.id}
                                    style={{
                                        backgroundColor: selectedFlows.has(flow.id) ? "var(--bg-secondary)" : "transparent",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => toggleFlow(flow.id)}
                                >
                                    <td style={{ padding: "8px" }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedFlows.has(flow.id)}
                                            onChange={() => toggleFlow(flow.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td style={{ padding: "8px" }}>{flow.type}</td>
                                    <td style={{ padding: "8px" }}>{flow.type === "http" ? flow.request?.method : "-"}</td>
                                    <td style={{ padding: "8px" }}>{flow.type === "http" ? flow.request?.path : "-"}</td>
                                    <td style={{ padding: "8px" }}>
                                        {flow.type === "http" && flow.response ? flow.response.status_code : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

