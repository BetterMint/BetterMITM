import * as React from "react";
import { useState } from "react";
import FlowComparison from "./FlowComparison";
import AdvancedExport from "./AdvancedExport";
import FlowTemplates from "../FlowTable/FlowTemplates";

export default function ToolsView() {
    const [selectedTool, setSelectedTool] = useState<string | null>("comparison");

    const tools: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        component: React.ComponentType;
    }> = [
        { id: "comparison", name: "Flow Comparison", description: "Compare two flows side-by-side", icon: "code-fork", component: FlowComparison },
        { id: "export", name: "Advanced Export", description: "Export flows to various formats", icon: "download", component: AdvancedExport },
        { id: "templates", name: "Flow Templates", description: "Create and apply flow templates", icon: "file-text", component: FlowTemplates },
    ];

    const SelectedComponent = selectedTool ? tools.find((t) => t.id === selectedTool)?.component : null;

    return (
        <div className="tools-view" style={{ 
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
                padding: "clamp(16px, 2vw, 24px)", 
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                flexShrink: 0,
                background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
                borderRadius: "16px",
                animation: "fadeIn 0.3s ease-in"
            }}>
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
                        <i className="fa fa-wrench" style={{ color: "var(--accent-primary)", fontSize: "clamp(24px, 3vw, 32px)" }}></i>
                        Tools & Utilities
                    </h2>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "clamp(12px, 1.5vw, 14px)" }}>
                        Powerful tools for flow analysis, export, and templates
                    </p>
                </div>
            </div>

            {}
            <div style={{ 
                display: "grid",
                gridTemplateColumns: "300px 1fr",
                gap: "24px",
                flex: 1, 
                minHeight: 0, 
                overflow: "hidden"
            }}>
                {}
                <div className="card-sleek glint-effect" style={{ 
                    padding: "clamp(16px, 2vw, 24px)", 
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                    display: "flex", 
                    flexDirection: "column",
                    overflow: "hidden",
                    borderRadius: "16px",
                    animation: "slideInLeft 0.4s ease-out"
                }}>
                    <h3 style={{ 
                        fontSize: "clamp(18px, 2vw, 22px)", 
                        fontWeight: "600", 
                        marginBottom: "20px", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px",
                        flexShrink: 0
                    }}>
                        <i className="fa fa-list" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                        Tools
                    </h3>
                    <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "12px",
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        paddingRight: "8px"
                    }}>
                        {tools.map((tool, index) => (
                            <button
                                key={tool.id}
                                className={`btn-sleek glint-effect ${selectedTool === tool.id ? "btn-sleek-success" : ""}`}
                                onClick={() => setSelectedTool(tool.id)}
                                style={{ 
                                    textAlign: "left", 
                                    padding: "16px", 
                                    borderRadius: "12px",
                                    border: selectedTool === tool.id ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                    backgroundColor: selectedTool === tool.id ? "var(--bg-secondary)" : "transparent",
                                    transition: "all 0.3s ease",
                                    animation: `fadeIn 0.4s ease-in ${index * 0.1}s both`
                                }}
                            >
                                <div style={{ fontWeight: "600", fontSize: "15px", marginBottom: "4px" }}>
                                    {tool.name}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                                    {tool.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {}
                <div style={{ 
                    flex: 1, 
                    minHeight: 0, 
                    overflow: "hidden"
                }}>
                    {SelectedComponent ? (
                        <div style={{ 
                            height: "100%",
                            animation: "fadeIn 0.4s ease-in"
                        }}>
                            <SelectedComponent />
                        </div>
                    ) : (
                        <div className="card-sleek glint-effect" style={{ 
                            padding: "clamp(40px, 8vw, 80px)", 
                            textAlign: "center", 
                            color: "var(--text-secondary)", 
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "16px",
                            animation: "fadeIn 0.4s ease-in"
                        }}>
                            <i className="fa fa-wrench" style={{ fontSize: "clamp(48px, 8vw, 80px)", opacity: 0.3, marginBottom: "24px" }}></i>
                            <p style={{ fontSize: "clamp(16px, 2vw, 20px)", fontWeight: "500", margin: 0 }}>Select a tool from above to get started</p>
                            <p style={{ fontSize: "clamp(13px, 1.5vw, 15px)", marginTop: "12px", opacity: 0.7 }}>Choose from Flow Comparison, Advanced Export, or Flow Templates</p>
                        </div>
                    )}
                </div>
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
