import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "../../ducks";
import { Flow } from "../../flow";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface Widget {
    id: string;
    type: "stats" | "flow_chart" | "method_chart" | "status_chart" | "domain_list" | "flow_list";
    position: { x: number; y: number; w: number; h: number };
    config?: any;
    title?: string;
}

export default function DashboardView() {
    const flows = useAppSelector((state) => state.flows.list);
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [dragging, setDragging] = useState<string | null>(null);
    const [resizing, setResizing] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, startX: 0, startY: 0, startW: 0, startH: 0 });
    const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem("dashboard_layout");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setWidgets(parsed);
            } catch (e) {
                console.error("Failed to load dashboard layout:", e);
                setWidgets(getDefaultWidgets());
            }
        } else {
            setWidgets(getDefaultWidgets());
        }
    }, []);

    const getDefaultWidgets = (): Widget[] => {
        
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth - 100 : 1400;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight - 300 : 600;
        const widgetWidth = Math.min(400, (viewportWidth - 60) / 2);
        const widgetHeight = Math.min(280, (viewportHeight - 60) / 2);
        
        return [
            { id: "1", type: "stats", position: { x: 20, y: 20, w: widgetWidth, h: widgetHeight }, title: "Flow Statistics" },
            { id: "2", type: "method_chart", position: { x: widgetWidth + 40, y: 20, w: widgetWidth, h: widgetHeight }, title: "HTTP Methods" },
            { id: "3", type: "status_chart", position: { x: 20, y: widgetHeight + 40, w: widgetWidth, h: widgetHeight }, title: "Status Codes" },
            { id: "4", type: "domain_list", position: { x: widgetWidth + 40, y: widgetHeight + 40, w: widgetWidth, h: widgetHeight }, title: "Top Domains" },
        ];
    };

    const saveLayout = () => {
        localStorage.setItem("dashboard_layout", JSON.stringify(widgets));
        alert("Layout saved! It will be restored when you reload the page.");
    };

    const resetLayout = () => {
        if (confirm("Reset dashboard to default layout? This will remove all customizations.")) {
            setWidgets(getDefaultWidgets());
            localStorage.removeItem("dashboard_layout");
        }
    };

    const exportLayout = () => {
        const blob = new Blob([JSON.stringify(widgets, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dashboard-layout-${Date.now()}.json`;
        a.click();
    };

    const importLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                setWidgets(imported);
                localStorage.setItem("dashboard_layout", JSON.stringify(imported));
                alert("Layout imported successfully!");
            } catch (error) {
                alert("Failed to import layout. Invalid file format.");
            }
        };
        reader.readAsText(file);
    };

    const addWidget = (type: Widget["type"]) => {
        const viewportWidth = containerRef.current?.clientWidth || 1400;
        const viewportHeight = containerRef.current?.clientHeight || 600;
        const widgetWidth = Math.min(400, (viewportWidth - 60) / 2);
        const widgetHeight = Math.min(280, (viewportHeight - 60) / 2);
        
        const newWidget: Widget = {
            id: Date.now().toString(),
            type,
            position: { x: 20, y: 20, w: widgetWidth, h: widgetHeight },
            title: getWidgetTitle(type),
        };
        setWidgets([...widgets, newWidget]);
    };

    const getWidgetTitle = (type: Widget["type"]): string => {
        const titles: Record<Widget["type"], string> = {
            stats: "Flow Statistics",
            flow_chart: "Flow Timeline",
            method_chart: "HTTP Methods",
            status_chart: "Status Codes",
            domain_list: "Top Domains",
            flow_list: "Recent Flows",
        };
        return titles[type] || "Widget";
    };

    const removeWidget = (id: string) => {
        setWidgets(widgets.filter((w) => w.id !== id));
        if (selectedWidget === id) setSelectedWidget(null);
    };

    const handleMouseDown = (e: React.MouseEvent, widgetId: string, type: "drag" | "resize") => {
        e.preventDefault();
        e.stopPropagation();
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget) return;
        
        if (type === "drag") {
            setDragging(widgetId);
            setDragStart({ 
                x: e.clientX, 
                y: e.clientY, 
                startX: widget.position.x, 
                startY: widget.position.y,
                startW: 0,
                startH: 0
            });
        } else {
            setResizing(widgetId);
            setDragStart({ 
                x: e.clientX, 
                y: e.clientY, 
                startX: 0, 
                startY: 0,
                startW: widget.position.w, 
                startH: widget.position.h
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (dragging) {
                const widget = widgets.find(w => w.id === dragging);
                if (widget && containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const deltaX = e.clientX - dragStart.x;
                    const deltaY = e.clientY - dragStart.y;
                    const newX = Math.max(0, Math.min(dragStart.startX + deltaX, rect.width - widget.position.w));
                    const newY = Math.max(0, Math.min(dragStart.startY + deltaY, rect.height - widget.position.h));
                    setWidgets(widgets.map(w => w.id === dragging ? { ...w, position: { ...w.position, x: newX, y: newY } } : w));
                }
            } else if (resizing) {
                const widget = widgets.find(w => w.id === resizing);
                if (widget && containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const deltaX = e.clientX - dragStart.x;
                    const deltaY = e.clientY - dragStart.y;
                    const maxW = Math.min(rect.width - widget.position.x - 20, 800);
                    const maxH = Math.min(rect.height - widget.position.y - 20, 600);
                    const newW = Math.max(250, Math.min(dragStart.startW + deltaX, maxW));
                    const newH = Math.max(180, Math.min(dragStart.startH + deltaY, maxH));
                    setWidgets(widgets.map(w => w.id === resizing ? { ...w, position: { ...w.position, w: newW, h: newH } } : w));
                }
            }
        };

        const handleMouseUp = () => {
            if (dragging || resizing) {
                saveLayout();
            }
            setDragging(null);
            setResizing(null);
        };

        if (dragging || resizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [dragging, resizing, dragStart, widgets]);

    const renderWidget = (widget: Widget) => {
        const httpFlows = flows.filter((f) => f.type === "http");
        
        switch (widget.type) {
            case "stats":
                return (
                    <div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", flex: 1, minHeight: 0 }}>
                            {[
                                { label: "Total", value: flows.length, color: "linear-gradient(135deg, var(--accent-primary) 0%, rgba(74, 158, 255, 0.8) 100%)" },
                                { label: "HTTP", value: httpFlows.length, color: "linear-gradient(135deg, var(--accent-secondary) 0%, rgba(74, 222, 128, 0.8) 100%)" },
                                { label: "TCP", value: flows.filter(f => f.type === "tcp").length, color: "linear-gradient(135deg, #9333ea 0%, rgba(147, 51, 234, 0.8) 100%)" },
                                { label: "UDP", value: flows.filter(f => f.type === "udp").length, color: "linear-gradient(135deg, #e83e8c 0%, rgba(232, 62, 140, 0.8) 100%)" },
                            ].map((stat, i) => (
                                <div key={i} className="glint-effect" style={{ 
                                    padding: "14px", 
                                    background: stat.color, 
                                    borderRadius: "10px", 
                                    color: "white",
                                    transition: "all 0.3s ease",
                                    animation: `fadeIn 0.3s ease-in ${i * 0.1}s both`
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                >
                                    <div style={{ fontSize: "12px", opacity: 0.95, marginBottom: "6px", fontWeight: "500" }}>{stat.label}</div>
                                    <div style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: "700" }}>{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case "method_chart":
                const methodCounts: Record<string, number> = {};
                httpFlows.forEach(f => {
                    const method = f.request?.method || "UNKNOWN";
                    methodCounts[method] = (methodCounts[method] || 0) + 1;
                });
                const methodData = {
                    labels: Object.keys(methodCounts),
                    datasets: [{
                        label: "Methods",
                        data: Object.values(methodCounts),
                        backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545", "#17a2b8", "#6f42c1"],
                    }],
                };
                return (
                    <div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Doughnut data={methodData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
                        </div>
                    </div>
                );
            case "status_chart":
                const statusCounts: Record<number, number> = {};
                httpFlows.forEach(f => {
                    if (f.response) {
                        const status = f.response.status_code;
                        statusCounts[status] = (statusCounts[status] || 0) + 1;
                    }
                });
                const statusData = {
                    labels: Object.keys(statusCounts).map(s => `${s}`),
                    datasets: [{
                        label: "Status Codes",
                        data: Object.values(statusCounts),
                        backgroundColor: Object.keys(statusCounts).map(s => {
                            const code = parseInt(s);
                            if (code >= 500) return "#dc3545";
                            if (code >= 400) return "#ffc107";
                            if (code >= 300) return "#17a2b8";
                            if (code >= 200) return "#28a745";
                            return "#6c757d";
                        }),
                    }],
                };
                return (
                    <div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Bar data={statusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        </div>
                    </div>
                );
            case "domain_list":
                const domainCounts: Record<string, number> = {};
                httpFlows.forEach(f => {
                    const domain = f.request?.pretty_host || "unknown";
                    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
                });
                const topDomains = Object.entries(domainCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);
                return (
                    <div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "8px" }}>
                            {topDomains.map(([domain, count], i) => (
                                <div key={i} style={{ 
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    padding: "10px", 
                                    backgroundColor: i % 2 === 0 ? "var(--bg-secondary)" : "transparent", 
                                    borderRadius: "8px", 
                                    marginBottom: "6px",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                                    e.currentTarget.style.transform = "translateX(4px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = i % 2 === 0 ? "var(--bg-secondary)" : "transparent";
                                    e.currentTarget.style.transform = "translateX(0)";
                                }}
                                >
                                    <span style={{ fontSize: "13px", fontFamily: "monospace" }}>{domain}</span>
                                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--accent-primary)" }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case "flow_list":
                return (
                    <div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "8px" }}>
                            {flows.slice(-20).reverse().map((flow, i) => (
                                <div key={flow.id} style={{ 
                                    padding: "10px", 
                                    backgroundColor: i % 2 === 0 ? "var(--bg-secondary)" : "transparent", 
                                    borderRadius: "8px", 
                                    marginBottom: "6px", 
                                    fontSize: "12px",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                                    e.currentTarget.style.transform = "translateX(4px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = i % 2 === 0 ? "var(--bg-secondary)" : "transparent";
                                    e.currentTarget.style.transform = "translateX(0)";
                                }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontFamily: "monospace" }}>{flow.id.substring(0, 8)}</span>
                                        <span style={{ color: "var(--text-secondary)" }}>{flow.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return <div style={{ padding: "16px" }}>Widget: {widget.type}</div>;
        }
    };

    return (
        <div style={{ 
                padding: "20px",
            maxWidth: "100%", 
            margin: "0 auto", 
            height: "calc(100vh - 180px)", 
            display: "flex", 
            flexDirection: "column",
            overflow: "hidden",
            gap: "24px"
        }}>
            {}
            <div className="card-sleek glint-effect" style={{ 
                padding: "20px", 
                background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)", 
                flexShrink: 0,
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                animation: "fadeIn 0.3s ease-in"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <h2 style={{ 
                            fontSize: "clamp(20px, 2.5vw, 28px)", 
                            fontWeight: "700", 
                            margin: 0, 
                            marginBottom: "8px", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "12px",
                            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            <i className="fa fa-dashboard" style={{ color: "var(--accent-primary)", fontSize: "clamp(24px, 3vw, 32px)" }}></i>
                            Customizable Dashboard
                        </h2>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "clamp(12px, 1.5vw, 14px)" }}>
                            Drag and drop widgets to create your personalized dashboard
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "8px", backgroundColor: "var(--bg-tertiary)", padding: "6px", borderRadius: "10px", flexWrap: "wrap" }}>
                            {[
                                { type: "stats", icon: "bar-chart", label: "Stats" },
                                { type: "method_chart", icon: "pie-chart", label: "Methods" },
                                { type: "status_chart", icon: "bar-chart", label: "Status" },
                                { type: "domain_list", icon: "globe", label: "Domains" },
                                { type: "flow_list", icon: "list", label: "Flows" },
                            ].map((w) => (
                                <button 
                                    key={w.type}
                                    className="btn-sleek glint-effect" 
                                    onClick={() => addWidget(w.type as Widget["type"])} 
                                    style={{ 
                                        padding: "10px 16px", 
                                        fontSize: "13px",
                                        borderRadius: "8px",
                                        transition: "all 0.3s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "scale(1.05)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 158, 255, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    <i className={`fa fa-${w.icon}`}></i> {w.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button 
                                className="btn-sleek btn-sleek-success glint-effect" 
                                onClick={saveLayout} 
                                style={{ padding: "10px 18px", fontSize: "13px", borderRadius: "8px", transition: "all 0.3s ease" }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <i className="fa fa-save"></i> Save
                            </button>
                            <button 
                                className="btn-sleek glint-effect" 
                                onClick={exportLayout} 
                                style={{ padding: "10px 18px", fontSize: "13px", borderRadius: "8px", transition: "all 0.3s ease" }}
                            >
                                <i className="fa fa-download"></i> Export
                            </button>
                            <label 
                                className="btn-sleek glint-effect" 
                                style={{ 
                                    padding: "10px 18px", 
                                    fontSize: "13px", 
                                    cursor: "pointer", 
                                    margin: 0,
                                    borderRadius: "8px",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                <i className="fa fa-upload"></i> Import
                                <input type="file" accept=".json" onChange={importLayout} style={{ display: "none" }} />
                            </label>
                            <button 
                                className="btn-sleek glint-effect" 
                                onClick={resetLayout} 
                                style={{ padding: "10px 18px", fontSize: "13px", borderRadius: "8px", transition: "all 0.3s ease" }}
                            >
                                <i className="fa fa-refresh"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "clamp(12px, 1.5vw, 13px)" }}>
                    <i className="fa fa-info-circle" style={{ marginRight: "8px" }}></i>
                    Click and drag the widget header to move, drag the bottom-right corner to resize. Your layout is automatically saved.
                </p>
            </div>

            {}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    position: "relative",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "16px",
                    padding: "20px",
                    overflow: "auto",
                    minHeight: 0,
                    maxHeight: "100%",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    animation: "fadeIn 0.4s ease-in",
                    width: "100%",
                    height: "100%"
                }}
            >
                {widgets.length === 0 ? (
                    <div style={{ 
                        textAlign: "center", 
                        padding: "clamp(40px, 8vw, 80px)", 
                        color: "var(--text-secondary)",
                        animation: "fadeIn 0.5s ease-in"
                    }}>
                        <i className="fa fa-dashboard" style={{ fontSize: "clamp(48px, 8vw, 80px)", opacity: 0.3, marginBottom: "24px" }}></i>
                        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", fontWeight: "500", margin: 0 }}>No widgets added</p>
                        <p style={{ fontSize: "clamp(13px, 1.5vw, 15px)", marginTop: "12px", opacity: 0.7, margin: "12px 0 0 0" }}>Click the buttons above to add widgets to your dashboard</p>
                    </div>
                ) : (
                    widgets.map((widget, index) => (
                        <div
                            key={widget.id}
                            className="card-sleek glint-effect"
                            style={{
                                position: "absolute",
                                left: `${widget.position.x}px`,
                                top: `${widget.position.y}px`,
                                width: `${widget.position.w}px`,
                                height: `${widget.position.h}px`,
                                boxShadow: selectedWidget === widget.id ? "0 0 0 4px var(--accent-primary), 0 8px 32px rgba(74, 158, 255, 0.3)" : "0 4px 20px rgba(0,0,0,0.15)",
                                border: selectedWidget === widget.id ? "3px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                backgroundColor: "var(--bg-primary)",
                                borderRadius: "14px",
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                                transition: selectedWidget === widget.id ? "all 0.3s ease" : "box-shadow 0.3s ease, border 0.3s ease",
                                animation: `fadeIn 0.4s ease-in ${index * 0.1}s both`
                            }}
                            onClick={() => setSelectedWidget(widget.id)}
                        >
                            <div
                                style={{
                                    padding: "14px",
                                    backgroundColor: "var(--bg-secondary)",
                                    borderBottom: "2px solid var(--border-color)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    cursor: dragging === widget.id ? "grabbing" : "move",
                                    userSelect: "none",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseDown={(e) => handleMouseDown(e, widget.id, "drag")}
                                onMouseEnter={(e) => {
                                    if (dragging !== widget.id) {
                                        e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (dragging !== widget.id) {
                                        e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                                    }
                                }}
                            >
                                <div style={{ fontSize: "15px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <i className={`fa fa-${widget.type === "stats" ? "bar-chart" : widget.type === "method_chart" ? "pie-chart" : widget.type === "status_chart" ? "bar-chart" : widget.type === "domain_list" ? "globe" : "list"}`} style={{ color: "var(--accent-primary)", fontSize: "18px" }}></i>
                                    {widget.title || getWidgetTitle(widget.type)}
                                </div>
                                <button
                                    className="btn-sleek btn-sleek-danger glint-effect"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeWidget(widget.id);
                                    }}
                                    style={{ 
                                        padding: "6px 12px", 
                                        fontSize: "12px",
                                        borderRadius: "6px",
                                        transition: "all 0.2s ease"
                                    }}
                                    title="Remove widget"
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.15)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                >
                                    <i className="fa fa-times"></i>
                                </button>
                            </div>
                            <div style={{ flex: 1, overflow: "auto", position: "relative", minHeight: 0 }}>
                                {renderWidget(widget)}
                            </div>
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    right: 0,
                                    width: "28px",
                                    height: "28px",
                                    cursor: "nwse-resize",
                                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                                    borderRadius: "14px 0 14px 0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 10,
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    handleMouseDown(e, widget.id, "resize");
                                }}
                                title="Resize widget"
                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <i className="fa fa-arrows-alt" style={{ fontSize: "12px", color: "white" }}></i>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @media (max-width: 768px) {
                    div[style*="gridTemplateColumns"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
