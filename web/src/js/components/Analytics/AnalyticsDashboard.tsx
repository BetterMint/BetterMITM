import * as React from "react";
import { useState, useEffect } from "react";
import { fetchApi } from "../../utils";
import { useAppSelector } from "../../ducks";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import TimelineVisualization from "./TimelineVisualization";
import PerformanceProfiling from "./PerformanceProfiling";
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

interface AnalyticsData {
    total_flows: number;
    http_flows: number;
    tcp_flows: number;
    udp_flows: number;
    requests_per_second: number[];
    data_transfer: { sent: number; received: number };
    top_domains: Array<{ domain: string; count: number }>;
    status_codes: Array<{ code: number; count: number }>;
    methods: Array<{ method: string; count: number }>;
    response_times: number[];
    error_rate: number;
}

export default function AnalyticsDashboard() {
    const flows = useAppSelector((state) => state.flows.list);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "all">("all");
    const [selectedView, setSelectedView] = useState<"dashboard" | "timeline" | "performance">("dashboard");
    const [refreshInterval, setRefreshInterval] = useState(5000);
    const [chartType, setChartType] = useState<"bar" | "line" | "doughnut">("bar");
    const [topDomainsCount, setTopDomainsCount] = useState(10);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [filterDomain, setFilterDomain] = useState("");
    const [filterMethod, setFilterMethod] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        const calculateAnalytics = () => {
            const httpFlows = flows.filter((f) => f.type === "http");
            const tcpFlows = flows.filter((f) => f.type === "tcp");
            const udpFlows = flows.filter((f) => f.type === "udp");

            const domainCounts: Record<string, number> = {};
            const statusCounts: Record<number, number> = {};
            const methodCounts: Record<string, number> = {};
            let totalSent = 0;
            let totalReceived = 0;
            let errors = 0;
            const responseTimes: number[] = [];

            httpFlows.forEach((flow: any) => {
                if (flow.request?.pretty_host) {
                    domainCounts[flow.request.pretty_host] = (domainCounts[flow.request.pretty_host] || 0) + 1;
                }
                if (flow.request?.method) {
                    methodCounts[flow.request.method] = (methodCounts[flow.request.method] || 0) + 1;
                }
                if (flow.response) {
                    const code = flow.response.status_code;
                    statusCounts[code] = (statusCounts[code] || 0) + 1;
                    if (code >= 400) errors++;
                    if (flow.response.timestamp_end && flow.request.timestamp_start) {
                        responseTimes.push((flow.response.timestamp_end - flow.request.timestamp_start) * 1000);
                    }
                }
                if (flow.request?.contentLength) totalSent += flow.request.contentLength;
                if (flow.response?.contentLength) totalReceived += flow.response.contentLength;
            });

            let filteredFlows = httpFlows;
            if (filterDomain) {
                filteredFlows = filteredFlows.filter((f: any) => 
                    f.request?.pretty_host?.toLowerCase().includes(filterDomain.toLowerCase())
                );
            }
            if (filterMethod) {
                filteredFlows = filteredFlows.filter((f: any) => 
                    f.request?.method?.toUpperCase() === filterMethod.toUpperCase()
                );
            }
            if (filterStatus) {
                filteredFlows = filteredFlows.filter((f: any) => 
                    f.response?.status_code?.toString() === filterStatus
                );
            }

            const filteredDomainCounts: Record<string, number> = {};
            filteredFlows.forEach((flow: any) => {
                if (flow.request?.pretty_host) {
                    filteredDomainCounts[flow.request.pretty_host] = (filteredDomainCounts[flow.request.pretty_host] || 0) + 1;
                }
            });

            const topDomains = Object.entries(filteredDomainCounts)
                .map(([domain, count]) => ({ domain, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, topDomainsCount);

            const statusCodes = Object.entries(statusCounts)
                .map(([code, count]) => ({ code: parseInt(code), count }))
                .sort((a, b) => b.count - a.count);

            const methods = Object.entries(methodCounts)
                .map(([method, count]) => ({ method, count }))
                .sort((a, b) => b.count - a.count);

            const errorRate = httpFlows.length > 0 ? (errors / httpFlows.length) * 100 : 0;

            setAnalytics({
                total_flows: flows.length,
                http_flows: httpFlows.length,
                tcp_flows: tcpFlows.length,
                udp_flows: udpFlows.length,
                requests_per_second: [],
                data_transfer: { sent: totalSent, received: totalReceived },
                top_domains: topDomains,
                status_codes: statusCodes,
                methods: methods,
                response_times: responseTimes,
                error_rate: errorRate,
            });
        };

        calculateAnalytics();
        if (autoRefresh) {
            const interval = setInterval(calculateAnalytics, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [flows, timeRange, refreshInterval, autoRefresh, filterDomain, filterMethod, filterStatus, topDomainsCount]);

    if (!analytics) {
        return (
            <div className="analytics-dashboard" style={{ 
                padding: "20px", 
                maxWidth: "100%", 
                margin: "0 auto", 
                height: "calc(100vh - 180px)", 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <div className="card-sleek glint-effect" style={{ padding: "40px", boxShadow: "var(--shadow-md)", borderRadius: "16px", textAlign: "center" }}>
                    <i className="fa fa-spinner fa-spin" style={{ fontSize: "48px", color: "var(--accent-primary)", marginBottom: "20px" }}></i>
                    <h2 style={{ fontSize: "24px", fontWeight: "600" }}>Loading Analytics...</h2>
                </div>
            </div>
        );
    }

    const statusCodeData = {
        labels: analytics.status_codes.map((s) => s.code.toString()),
        datasets: [{
            label: "Status Codes",
            data: analytics.status_codes.map((s) => s.count),
            backgroundColor: analytics.status_codes.map((s) => {
                if (s.code >= 500) return "#dc3545";
                if (s.code >= 400) return "#ffc107";
                if (s.code >= 300) return "#17a2b8";
                if (s.code >= 200) return "#28a745";
                return "#6c757d";
            }),
        }],
    };

    const methodData = {
        labels: analytics.methods.map((m) => m.method),
        datasets: [{
            label: "HTTP Methods",
            data: analytics.methods.map((m) => m.count),
            backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545", "#17a2b8", "#6f42c1", "#e83e8c"],
        }],
    };

    const domainData = {
        labels: analytics.top_domains.map((d) => d.domain),
        datasets: [{
            label: "Requests",
            data: analytics.top_domains.map((d) => d.count),
            backgroundColor: "#007bff",
        }],
    };

    const avgResponseTime = analytics.response_times.length > 0
        ? analytics.response_times.reduce((a, b) => a + b, 0) / analytics.response_times.length
        : 0;

    if (selectedView === "timeline") {
        return <TimelineVisualization onBack={() => setSelectedView("dashboard")} />;
    }

    if (selectedView === "performance") {
        return <PerformanceProfiling onBack={() => setSelectedView("dashboard")} />;
    }

    const exportAnalytics = (format: "csv" | "json") => {
        const data = format === "json" ? JSON.stringify(analytics, null, 2) : 
            `Metric,Value\nTotal Flows,${analytics.total_flows}\nHTTP Flows,${analytics.http_flows}\nData Sent (MB),${(analytics.data_transfer.sent / 1024 / 1024).toFixed(2)}\nData Received (MB),${(analytics.data_transfer.received / 1024 / 1024).toFixed(2)}\nError Rate (%),${analytics.error_rate.toFixed(1)}\nAvg Response Time (ms),${avgResponseTime.toFixed(0)}`;
        const blob = new Blob([data], { type: format === "json" ? "application/json" : "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${Date.now()}.${format}`;
        a.click();
    };

    return (
        <div className="analytics-dashboard" style={{ 
            padding: "clamp(16px, 2vw, 32px)", 
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: showAdvanced ? "20px" : "0" }}>
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
                            <i className="fa fa-bar-chart" style={{ color: "var(--accent-primary)", fontSize: "clamp(24px, 3vw, 32px)" }}></i>
                            Traffic Analytics
                        </h2>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "clamp(12px, 1.5vw, 14px)" }}>
                            Real-time traffic analysis and insights
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "6px", backgroundColor: "var(--bg-tertiary)", padding: "4px", borderRadius: "10px" }}>
                            <button
                                className={`btn-sleek glint-effect ${selectedView === "dashboard" ? "btn-sleek-success" : ""}`}
                                onClick={() => setSelectedView("dashboard")}
                                style={{ padding: "10px 18px", fontSize: "13px", fontWeight: "500", borderRadius: "8px", transition: "all 0.3s ease" }}
                            >
                                <i className="fa fa-dashboard"></i> Dashboard
                            </button>
                            <button
                                className={`btn-sleek glint-effect ${selectedView === "timeline" ? "btn-sleek-success" : ""}`}
                                onClick={() => setSelectedView("timeline")}
                                style={{ padding: "10px 18px", fontSize: "13px", fontWeight: "500", borderRadius: "8px", transition: "all 0.3s ease" }}
                            >
                                <i className="fa fa-clock-o"></i> Timeline
                            </button>
                            <button
                                className={`btn-sleek glint-effect ${selectedView === "performance" ? "btn-sleek-success" : ""}`}
                                onClick={() => setSelectedView("performance")}
                                style={{ padding: "10px 18px", fontSize: "13px", fontWeight: "500", borderRadius: "8px", transition: "all 0.3s ease" }}
                            >
                                <i className="fa fa-tachometer"></i> Performance
                            </button>
                        </div>
                        <select
                            className="select-sleek"
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            style={{ padding: "10px 16px", fontSize: "13px", borderRadius: "8px", minWidth: "160px" }}
                        >
                            <option value="1h">Last Hour</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="all">All Time</option>
                        </select>
                        <button
                            className="btn-sleek glint-effect"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{ padding: "10px 16px", fontSize: "13px", borderRadius: "8px", transition: "all 0.3s ease" }}
                        >
                            <i className={`fa fa-${showAdvanced ? "chevron-up" : "cog"}`}></i> {showAdvanced ? "Hide" : "Options"}
                        </button>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                className="btn-sleek glint-effect"
                                onClick={() => exportAnalytics("json")}
                                style={{ padding: "10px 16px", fontSize: "13px", borderRadius: "8px", transition: "all 0.3s ease" }}
                                title="Export as JSON"
                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <i className="fa fa-download"></i> JSON
                            </button>
                            <button
                                className="btn-sleek glint-effect"
                                onClick={() => exportAnalytics("csv")}
                                style={{ padding: "10px 16px", fontSize: "13px", borderRadius: "8px", transition: "all 0.3s ease" }}
                                title="Export as CSV"
                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <i className="fa fa-download"></i> CSV
                            </button>
                        </div>
                    </div>
                </div>

                {showAdvanced && (
                    <div style={{ 
                        padding: "20px", 
                        backgroundColor: "var(--bg-secondary)", 
                        borderRadius: "12px", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "16px",
                        animation: "slideDown 0.3s ease-out"
                    }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Customization Options</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                            <div>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px" }}>Refresh Interval (ms):</label>
                                <input
                                    type="number"
                                    className="input-sleek"
                                    value={refreshInterval}
                                    onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 5000)}
                                    min={1000}
                                    max={60000}
                                    step={1000}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                                />
                            </div>
                            <div>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px" }}>Chart Type:</label>
                                <select
                                    className="select-sleek"
                                    value={chartType}
                                    onChange={(e) => setChartType(e.target.value as any)}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                                >
                                    <option value="bar">Bar Chart</option>
                                    <option value="line">Line Chart</option>
                                    <option value="doughnut">Doughnut Chart</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px" }}>Top Domains Count:</label>
                                <input
                                    type="number"
                                    className="input-sleek"
                                    value={topDomainsCount}
                                    onChange={(e) => setTopDomainsCount(parseInt(e.target.value) || 10)}
                                    min={1}
                                    max={50}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                                />
                            </div>
                            <div>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px" }}>Filter Domain:</label>
                                <input
                                    type="text"
                                    className="input-sleek"
                                    value={filterDomain}
                                    onChange={(e) => setFilterDomain(e.target.value)}
                                    placeholder="example.com"
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                                />
                            </div>
                            <div>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px" }}>Filter Method:</label>
                                <select
                                    className="select-sleek"
                                    value={filterMethod}
                                    onChange={(e) => setFilterMethod(e.target.value)}
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
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
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px" }}>Filter Status Code:</label>
                                <input
                                    type="text"
                                    className="input-sleek"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    placeholder="200, 404, etc."
                                    style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                                />
                            </div>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                style={{ width: "18px", height: "18px" }}
                            />
                            <span style={{ fontSize: "13px" }}>Auto Refresh</span>
                        </label>
                    </div>
                )}
            </div>

            {}
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "minmax(400px, 1fr) minmax(500px, 1fr)", 
                gap: "24px", 
                flex: 1, 
                minHeight: 0, 
                overflow: "hidden"
            }}>
                {}
                <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "20px",
                    overflow: "hidden",
                    minHeight: 0,
                    minWidth: 0
                }}>
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(2, 1fr)", 
                        gap: "16px",
                        flexShrink: 0
                    }}>
                        {[
                            { icon: "list", label: "Total Flows", value: analytics.total_flows, unit: "flows", color: "linear-gradient(135deg, var(--accent-primary) 0%, rgba(74, 158, 255, 0.8) 100%)" },
                            { icon: "globe", label: "HTTP Flows", value: analytics.http_flows, unit: "requests", color: "linear-gradient(135deg, var(--accent-secondary) 0%, rgba(74, 222, 128, 0.8) 100%)" },
                            { icon: "upload", label: "Data Sent", value: (analytics.data_transfer.sent / 1024 / 1024).toFixed(2), unit: "MB", color: "linear-gradient(135deg, var(--accent-warning) 0%, rgba(251, 191, 36, 0.8) 100%)" },
                            { icon: "download", label: "Data Received", value: (analytics.data_transfer.received / 1024 / 1024).toFixed(2), unit: "MB", color: "linear-gradient(135deg, #9333ea 0%, rgba(147, 51, 234, 0.8) 100%)" },
                            { icon: "exclamation-triangle", label: "Error Rate", value: analytics.error_rate.toFixed(1), unit: "%", color: analytics.error_rate > 10 ? "linear-gradient(135deg, var(--accent-danger) 0%, rgba(248, 113, 113, 0.8) 100%)" : "linear-gradient(135deg, var(--accent-warning) 0%, rgba(251, 191, 36, 0.8) 100%)" },
                            { icon: "clock-o", label: "Avg Response", value: avgResponseTime.toFixed(0), unit: "ms", color: "linear-gradient(135deg, #17a2b8 0%, rgba(23, 162, 184, 0.8) 100%)" },
                        ].map((stat, index) => (
                            <div 
                                key={index}
                                className="glint-effect" 
                                style={{ 
                                    padding: "20px", 
                                    background: stat.color, 
                                    borderRadius: "14px", 
                                    color: "white", 
                                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                                    transition: "all 0.3s ease",
                                    animation: `fadeIn 0.4s ease-in ${index * 0.1}s both`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
                                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
                                }}
                            >
                                <div style={{ fontSize: "13px", opacity: 0.95, marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
                                    <i className={`fa fa-${stat.icon}`}></i> {stat.label}
                                </div>
                                <div style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: "700", marginBottom: "6px" }}>{stat.value}</div>
                                <div style={{ fontSize: "12px", opacity: 0.85 }}>{stat.unit}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {}
                <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "20px",
                    overflow: "hidden",
                    minHeight: 0,
                    minWidth: 0
                }}>
                    <div className="card-sleek glint-effect" style={{ 
                        padding: "20px", 
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                        display: "flex", 
                        flexDirection: "column",
                        overflow: "hidden",
                        borderRadius: "16px",
                        flex: 1,
                        minHeight: 0,
                        animation: "slideInRight 0.4s ease-out"
                    }}>
                        <h3 style={{ 
                            marginBottom: "20px", 
                            fontSize: "clamp(16px, 2vw, 20px)", 
                            fontWeight: "600", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "10px",
                            flexShrink: 0
                        }}>
                            <i className="fa fa-bar-chart" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                            Status Codes
                        </h3>
                        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Bar
                                data={statusCodeData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            backgroundColor: "var(--bg-primary)",
                                            titleColor: "var(--text-primary)",
                                            bodyColor: "var(--text-primary)",
                                            borderColor: "var(--border-color)",
                                            borderWidth: 1,
                                        },
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: { color: "var(--text-secondary)" },
                                            grid: { color: "var(--border-color)" },
                                        },
                                        x: {
                                            ticks: { color: "var(--text-secondary)" },
                                            grid: { color: "var(--border-color)" },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    <div className="card-sleek glint-effect" style={{ 
                        padding: "20px", 
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                        display: "flex", 
                        flexDirection: "column",
                        overflow: "hidden",
                        borderRadius: "16px",
                        flex: 1,
                        minHeight: 0,
                        animation: "slideInRight 0.5s ease-out"
                    }}>
                        <h3 style={{ 
                            marginBottom: "20px", 
                            fontSize: "clamp(16px, 2vw, 20px)", 
                            fontWeight: "600", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "10px",
                            flexShrink: 0
                        }}>
                            <i className="fa fa-pie-chart" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                            HTTP Methods
                        </h3>
                        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Doughnut
                                data={methodData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        tooltip: {
                                            backgroundColor: "var(--bg-primary)",
                                            titleColor: "var(--text-primary)",
                                            bodyColor: "var(--text-primary)",
                                            borderColor: "var(--border-color)",
                                            borderWidth: 1,
                                        },
                                        legend: {
                                            position: "bottom",
                                            labels: { color: "var(--text-primary)", padding: 15 },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    <div className="card-sleek glint-effect" style={{ 
                        padding: "20px", 
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                        display: "flex", 
                        flexDirection: "column",
                        overflow: "hidden",
                        borderRadius: "16px",
                        flex: 1,
                        minHeight: 0,
                        animation: "slideInRight 0.6s ease-out"
                    }}>
                        <h3 style={{ 
                            marginBottom: "20px", 
                            fontSize: "clamp(16px, 2vw, 20px)", 
                            fontWeight: "600", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "10px",
                            flexShrink: 0
                        }}>
                            <i className="fa fa-globe" style={{ color: "var(--accent-primary)", fontSize: "22px" }}></i>
                            Top Domains
                        </h3>
                        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Bar
                                data={domainData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    indexAxis: "y",
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            backgroundColor: "var(--bg-primary)",
                                            titleColor: "var(--text-primary)",
                                            bodyColor: "var(--text-primary)",
                                            borderColor: "var(--border-color)",
                                            borderWidth: 1,
                                        },
                                    },
                                    scales: {
                                        x: {
                                            beginAtZero: true,
                                            ticks: { color: "var(--text-secondary)" },
                                            grid: { color: "var(--border-color)" },
                                        },
                                        y: {
                                            ticks: { color: "var(--text-secondary)" },
                                            grid: { color: "var(--border-color)" },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @media (max-width: 1024px) {
                    div[style*="gridTemplateColumns"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
