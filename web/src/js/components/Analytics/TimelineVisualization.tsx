import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "../../ducks";
import { Flow, HTTPFlow } from "../../flow";

interface TimelineVisualizationProps {
    onBack?: () => void;
}

export default function TimelineVisualization({ onBack }: TimelineVisualizationProps) {
    const flows = useAppSelector((state) => state.flows.list);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [timeRange, setTimeRange] = useState<[number, number] | null>(null);
    const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
    const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [filterDomain, setFilterDomain] = useState<string>("");
    const [filterMethod, setFilterMethod] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [colorScheme, setColorScheme] = useState<"status" | "method" | "domain">("status");
    const [showRelationships, setShowRelationships] = useState(true);
    const [minDuration, setMinDuration] = useState<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || flows.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        
        const container = canvas.parentElement;
        if (container) {
            const containerWidth = container.clientWidth - 40; 
            const baseRowHeight = 50; 
            const minHeight = 600; 
            const calculatedHeight = Math.max(minHeight, flows.length * baseRowHeight * zoom + 200);
            
            
            const dpr = window.devicePixelRatio || 1;
            canvas.width = containerWidth * dpr;
            canvas.height = calculatedHeight * dpr;
            
            
            canvas.style.width = `${containerWidth}px`;
            canvas.style.height = `${calculatedHeight}px`;
            canvas.style.maxHeight = "none";
            
            
            ctx.scale(dpr, dpr);
        }

        const padding = 60;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;

        const times = flows.map((f) => f.timestamp_created).sort((a, b) => a - b);
        const minTime = times[0];
        const maxTime = times[times.length - 1];
        const timeSpan = maxTime - minTime || 1;

        
        ctx.fillStyle = "var(--bg-primary)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        
        ctx.strokeStyle = "var(--border-color)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = padding + (width / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height + padding);
            ctx.stroke();
        }

        
        ctx.strokeStyle = "var(--accent-primary)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height + padding);
        ctx.lineTo(width + padding, height + padding);
        ctx.stroke();

        
        ctx.fillStyle = "var(--text-primary)";
        ctx.font = "bold 14px sans-serif"; 
        ctx.textAlign = "center";
        for (let i = 0; i <= 10; i++) {
            const time = minTime + (timeSpan / 10) * i;
            const x = padding + (width / 10) * i;
            ctx.fillText(new Date(time * 1000).toLocaleTimeString(), x, height + padding + 20);
        }

        
        const flowRows: { [key: string]: number } = {};
        let currentRow = 0;
        const rowHeight = 50 * zoom; 
        const pointRadius = 8 * zoom; 

        flows.forEach((flow) => {
            const x = padding + ((flow.timestamp_created - minTime) / timeSpan) * width;
            
            
            if (!flowRows[flow.id]) {
                flowRows[flow.id] = currentRow;
                currentRow++;
            }
            const row = flowRows[flow.id];
            const y = padding + row * rowHeight + rowHeight / 2;

            const isSelected = flow.id === selectedFlow;
            const isHovered = flow.id === hoveredFlow;

            
            let color = "#6c757d"; 
            if (flow.type === "http") {
                const httpFlow = flow as HTTPFlow;
                if (httpFlow.response) {
                    const status = httpFlow.response.status_code;
                    if (status >= 500) color = "#dc3545"; 
                    else if (status >= 400) color = "#ffc107"; 
                    else if (status >= 300) color = "#17a2b8"; 
                    else if (status >= 200) color = "#28a745"; 
                    else color = "#007bff"; 
                } else {
                    color = "#007bff"; 
                }
            } else if (flow.type === "tcp") {
                color = "#9333ea"; 
            } else if (flow.type === "udp") {
                color = "#e83e8c"; 
            }

            
            ctx.fillStyle = isSelected ? "var(--accent-primary)" : isHovered ? color : color;
            ctx.globalAlpha = isSelected ? 1 : isHovered ? 0.9 : 0.7;
            ctx.beginPath();
            ctx.arc(x, y, isSelected ? pointRadius * 1.3 : isHovered ? pointRadius * 1.2 : pointRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            
            if (isSelected) {
                ctx.strokeStyle = "var(--accent-primary)";
                ctx.lineWidth = 2 * zoom;
                ctx.beginPath();
                ctx.arc(x, y, pointRadius * 2, 0, Math.PI * 2);
                ctx.stroke();
            }

            
            if (isHovered && !isSelected) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5 * zoom;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(x, y, pointRadius * 1.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            
            if (flow.type === "http") {
                const httpFlow = flow as HTTPFlow;
                ctx.fillStyle = "var(--text-primary)";
                ctx.font = `${11 * zoom}px sans-serif`;
                ctx.textAlign = "left";
                const method = httpFlow.request?.method || "?";
                const label = `${method} ${httpFlow.request?.path?.substring(0, 30) || ""}`;
                ctx.fillText(label, x + 15 * zoom, y + 4 * zoom);
            }

            
            if (flow.type === "http") {
                const httpFlow = flow as HTTPFlow;
                if (httpFlow.response && httpFlow.response.timestamp_end) {
                    const endX = padding + ((httpFlow.response.timestamp_end - minTime) / timeSpan) * width;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2 * zoom;
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(endX, y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        });

        
        ctx.fillStyle = "var(--text-primary)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "left";
        const legendY = padding - 30;
        const legends = [
            { color: "#28a745", label: "2xx Success" },
            { color: "#17a2b8", label: "3xx Redirect" },
            { color: "#ffc107", label: "4xx Client Error" },
            { color: "#dc3545", label: "5xx Server Error" },
            { color: "#007bff", label: "Pending" },
        ];
        legends.forEach((legend, i) => {
            const x = padding + i * 120;
            ctx.fillStyle = legend.color;
            ctx.beginPath();
            ctx.arc(x, legendY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "var(--text-primary)";
            ctx.fillText(legend.label, x + 10, legendY + 4);
        });
    }, [flows, zoom, timeRange, selectedFlow, hoveredFlow]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const padding = 60;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;

        const times = flows.map((f) => f.timestamp_created).sort((a, b) => a - b);
        const minTime = times[0];
        const maxTime = times[times.length - 1];
        const timeSpan = maxTime - minTime || 1;

        const clickedTime = minTime + ((x - padding) / width) * timeSpan;
        const clickedFlow = flows.find((f) => {
            const flowX = padding + ((f.timestamp_created - minTime) / timeSpan) * width;
            const distance = Math.abs(flowX - x);
            return distance < 20;
        });

        if (clickedFlow) {
            setSelectedFlow(clickedFlow.id);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const padding = 60;
        const width = canvas.width - padding * 2;

        const times = flows.map((f) => f.timestamp_created).sort((a, b) => a - b);
        const minTime = times[0];
        const maxTime = times[times.length - 1];
        const timeSpan = maxTime - minTime || 1;

        const hoveredTime = minTime + ((x - padding) / width) * timeSpan;
        const hovered = flows.find((f) => {
            const flowX = padding + ((f.timestamp_created - minTime) / timeSpan) * width;
            const distance = Math.abs(flowX - x);
            return distance < 20;
        });

        setHoveredFlow(hovered?.id || null);
    };

    const selectedFlowObj = selectedFlow ? flows.find((f) => f.id === selectedFlow) : null;

    return (
        <div style={{ 
            padding: "clamp(16px, 2vw, 32px)", 
            maxWidth: "100%", 
            margin: "0 auto", 
            height: "calc(100vh - 180px)", 
            display: "flex", 
            flexDirection: "column",
            overflow: "hidden",
            gap: "24px"
        }}>
            <div className="card-sleek glint-effect" style={{ 
                padding: "clamp(16px, 2vw, 24px)", 
                background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
                flexShrink: 0,
                borderRadius: "16px"
            }}>
                <div className="timeline-controls">
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {onBack && (
                            <button
                                className="btn-sleek glint-effect"
                                onClick={onBack}
                                style={{ padding: "10px 16px", fontSize: "14px", borderRadius: "8px" }}
                            >
                                <i className="fa fa-arrow-left"></i> Back
                            </button>
                        )}
                        <h2 style={{ fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                            <i className="fa fa-clock-o" style={{ color: "var(--accent-primary)", fontSize: "clamp(24px, 3vw, 32px)" }}></i>
                            Traffic Timeline Visualization
                        </h2>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <label className="label-sleek" style={{ fontSize: "13px", fontWeight: "600" }}>Zoom:</label>
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            style={{ width: "150px" }}
                        />
                        <span style={{ fontSize: "13px", fontWeight: "600", minWidth: "40px" }}>{zoom.toFixed(1)}x</span>
                        <button
                            className="btn-sleek glint-effect"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                            <i className={`fa fa-${showAdvanced ? "chevron-up" : "chevron-down"}`}></i> {showAdvanced ? "Hide" : "Show"} Options
                        </button>
                    </div>
                </div>
                {showAdvanced && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "16px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
                        <div>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "6px", fontSize: "12px" }}>Filter Domain:</label>
                            <input
                                type="text"
                                className="input-sleek"
                                placeholder="e.g., example.com"
                                value={filterDomain}
                                onChange={(e) => setFilterDomain(e.target.value)}
                                style={{ width: "100%", padding: "8px" }}
                            />
                        </div>
                        <div>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "6px", fontSize: "12px" }}>Filter Method:</label>
                            <select
                                className="select-sleek"
                                value={filterMethod}
                                onChange={(e) => setFilterMethod(e.target.value)}
                                style={{ width: "100%", padding: "8px" }}
                            >
                                <option value="">All Methods</option>
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                                <option value="PATCH">PATCH</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "6px", fontSize: "12px" }}>Filter Status:</label>
                            <select
                                className="select-sleek"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ width: "100%", padding: "8px" }}
                            >
                                <option value="">All Status</option>
                                <option value="2xx">2xx Success</option>
                                <option value="3xx">3xx Redirect</option>
                                <option value="4xx">4xx Client Error</option>
                                <option value="5xx">5xx Server Error</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "6px", fontSize: "12px" }}>Color Scheme:</label>
                            <select
                                className="select-sleek"
                                value={colorScheme}
                                onChange={(e) => setColorScheme(e.target.value as any)}
                                style={{ width: "100%", padding: "8px" }}
                            >
                                <option value="status">By Status Code</option>
                                <option value="method">By HTTP Method</option>
                                <option value="domain">By Domain</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "6px", fontSize: "12px" }}>Min Duration (ms):</label>
                            <input
                                type="number"
                                className="input-sleek"
                                value={minDuration}
                                onChange={(e) => setMinDuration(parseInt(e.target.value) || 0)}
                                min={0}
                                style={{ width: "100%", padding: "8px" }}
                            />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px" }}>
                            <input
                                type="checkbox"
                                checked={showRelationships}
                                onChange={(e) => setShowRelationships(e.target.checked)}
                            />
                            <span style={{ fontSize: "12px" }}>Show Flow Relationships</span>
                        </div>
                    </div>
                )}
                </div>
                <div className="timeline-canvas-container widget-scrollable" style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "auto",
                    border: "2px solid var(--border-color)",
                    borderRadius: "12px",
                    backgroundColor: "var(--bg-primary)",
                    padding: "20px",
                    position: "relative"
                }}>
                    <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseLeave={() => setHoveredFlow(null)}
                        onWheel={(e) => {
                            
                            e.currentTarget.parentElement?.scrollBy({
                                top: e.deltaY,
                                behavior: "auto"
                            });
                        }}
                        style={{
                            width: "100%",
                            cursor: hoveredFlow ? "pointer" : "grab",
                            display: "block",
                            imageRendering: "crisp-edges"
                        }}
                    />
                </div>
                {selectedFlowObj && (
                    <div style={{ 
                        marginTop: "20px", 
                        padding: "16px", 
                        backgroundColor: "var(--bg-secondary)", 
                        borderRadius: "10px", 
                        border: "2px solid var(--accent-primary)",
                        flexShrink: 0
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <strong style={{ fontSize: "15px" }}>Selected Flow: {selectedFlowObj.id.substring(0, 8)}</strong>
                            <button
                                className="btn-sleek glint-effect"
                                onClick={() => setSelectedFlow(null)}
                                style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                                <i className="fa fa-times"></i> Clear Selection
                            </button>
                        </div>
                        {selectedFlowObj.type === "http" && (
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                <span><i className="fa fa-clock-o"></i> {new Date(selectedFlowObj.timestamp_created * 1000).toLocaleString()}</span>
                                <span><i className="fa fa-globe"></i> {(selectedFlowObj as HTTPFlow).request?.pretty_host || "N/A"}</span>
                                <span><i className="fa fa-arrow-right"></i> {(selectedFlowObj as HTTPFlow).request?.method || "N/A"} {(selectedFlowObj as HTTPFlow).request?.path || ""}</span>
                                {(selectedFlowObj as HTTPFlow).response && (
                                    <span><i className="fa fa-check-circle"></i> Status: {(selectedFlowObj as HTTPFlow).response?.status_code || "N/A"}</span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
    );
}
