import * as React from "react";
import { useState } from "react";
import InteractiveTutorials from "./InteractiveTutorials";
import ContextualHelp from "./ContextualHelp";

export default function HelpView() {
    const [selectedView, setSelectedView] = useState<"tutorials" | "help" | "features" | "shortcuts">("tutorials");

    return (
        <div className="help-view">
            {}
            <div className="card-sleek glint-effect" style={{ 
                padding: "clamp(12px, 1.5vw, 18px)", 
                background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)", 
                flexShrink: 0,
                borderRadius: "12px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                animation: "fadeIn 0.3s ease-in"
            }}>
                <h2 style={{ 
                    fontSize: "clamp(18px, 2vw, 24px)", 
                    fontWeight: "700", 
                    margin: 0, 
                    marginBottom: "6px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                }}>
                    <i className="fa fa-question-circle" style={{ color: "var(--accent-primary)", fontSize: "clamp(20px, 2.5vw, 26px)" }}></i>
                    Help & Documentation
                </h2>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "clamp(11px, 1.3vw, 13px)" }}>
                    Get help, tutorials, and learn about all features
                </p>
            </div>

            {}
            <div className="help-content">
                {}
                <div className="help-navigation card-sleek glint-effect" style={{
                    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderRadius: "12px",
                    animation: "slideInLeft 0.4s ease-out"
                }}>
                        <div className="help-nav-header">
                            <i className="fa fa-list" style={{ color: "var(--accent-primary)", fontSize: "20px" }}></i>
                            Navigation
                        </div>
                    <div className="help-nav-list widget-scrollable">
                        {[
                            { id: "tutorials", label: "Tutorials", icon: "graduation-cap", desc: "Interactive tutorials and guides" },
                            { id: "help", label: "Help Topics", icon: "book", desc: "Contextual help and documentation" },
                            { id: "features", label: "Features Guide", icon: "star", desc: "Complete feature overview" },
                            { id: "shortcuts", label: "Keyboard Shortcuts", icon: "keyboard-o", desc: "All keyboard shortcuts" },
                        ].map((item, index) => (
                            <div key={item.id} className="help-nav-item">
                                <button
                                    className={`btn-sleek glint-effect ${selectedView === item.id ? "btn-sleek-success" : ""}`}
                                    onClick={() => setSelectedView(item.id as any)}
                                >
                                    <div className="nav-item-header">
                                        <div className="nav-item-icon">
                                            <i className={`fa fa-${item.icon}`}></i>
                                        </div>
                                        <div>
                                            <div className="nav-item-title">
                                                {item.label}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="nav-item-desc">
                                        {item.desc}
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {}
                <div className="help-main-content card-sleek glint-effect" style={{
                    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "12px"
                }}>
                    <div className="help-content-body widget-scrollable">
                        {selectedView === "tutorials" && <InteractiveTutorials />}
                        {selectedView === "help" && <ContextualHelp />}
                        {selectedView === "features" && <FeaturesGuide />}
                        {selectedView === "shortcuts" && <KeyboardShortcuts />}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
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

function FeaturesGuide() {
    const features = [
        {
            category: "Interception & Traffic Control",
            items: [
                { name: "Smart Interception Rules Engine", description: "Create complex interception rules with visual builder or JSON/YAML. Set priorities, conditions, and actions.", icon: "filter" },
                { name: "Traffic Replay with Modifications", description: "Replay requests with modifications. Change headers, body, method, or apply transformations before replaying.", icon: "repeat" },
                { name: "Connection Pooling & Rate Limiting", description: "Control connection behavior with pool sizes, rate limits per domain, and throttling options.", icon: "tachometer" },
            ],
        },
        {
            category: "Analytics & Visualization",
            items: [
                { name: "Traffic Analytics Dashboard", description: "Real-time graphs, statistics, top domains, response times, error rates. Export data as CSV or JSON.", icon: "bar-chart" },
                { name: "Flow Comparison Tool", description: "Compare two flows side-by-side. Highlight differences in headers, body, and timing. Export comparison reports.", icon: "code-fork" },
                { name: "Traffic Timeline Visualization", description: "Interactive timeline showing all flows with relationships, timing, and color-coded status codes.", icon: "clock-o" },
            ],
        },
        {
            category: "Modification & Transformation",
            items: [
                { name: "Request/Response Transformers", description: "Pre-built and custom transformers for JSON path, headers, URL rewriting, encoding/decoding, and more.", icon: "exchange" },
                { name: "Scriptable Interception", description: "Write JavaScript or Python scripts to control interception logic dynamically with full API access.", icon: "code" },
                { name: "Body Editor with Syntax Highlighting", description: "Monaco Editor integration with syntax highlighting, auto-formatting, validation, and search/replace.", icon: "file-text" },
            ],
        },
        {
            category: "Security & Testing",
            items: [
                { name: "Security Testing Suite", description: "Test for SQL injection, XSS, CSRF, authentication bypass, header security, and SSL/TLS configuration.", icon: "shield" },
                { name: "Certificate Management", description: "Import custom CAs, detect certificate pinning, bypass pinning, view certificate chains, and expiration warnings.", icon: "certificate" },
                { name: "Authentication Testing Tools", description: "Extract tokens, decode/edit JWTs, visualize OAuth flows, test token rotation, and MFA testing.", icon: "key" },
            ],
        },
        {
            category: "Network & Protocol",
            items: [
                { name: "WebSocket Message Interception", description: "Full WebSocket support with message interception, modification, injection, filtering, and replay.", icon: "plug" },
                { name: "gRPC/Protobuf Enhanced Support", description: "Visual protobuf editor, import .proto files, auto-decode messages, type-safe editing, and stream handling.", icon: "cogs" },
                { name: "HTTP/3 and QUIC Support", description: "Full HTTP/3 interception, QUIC connection details, stream visualization, and message modification.", icon: "globe" },
            ],
        },
        {
            category: "UI/UX & Workflow",
            items: [
                { name: "Customizable Dashboard", description: "Drag-and-drop widgets, save layouts, export/import configurations. Stats, charts, flow lists, and filters.", icon: "dashboard" },
                { name: "Keyboard Shortcuts & Macros", description: "Custom shortcuts, macro recording/playback, conflict detection, and shareable macros.", icon: "keyboard-o" },
                { name: "Flow Bookmarks & Tags", description: "Bookmark important flows, organize with tags, filter by tags, export bookmarked flows.", icon: "bookmark" },
                { name: "Dark Mode Auto-Switch", description: "Follow system preference or schedule theme changes. Smooth transitions between themes.", icon: "moon-o" },
            ],
        },
        {
            category: "Export & Integration",
            items: [
                { name: "Advanced Export Options", description: "Export to Postman, Insomnia, OpenAPI/Swagger. Custom templates, batch export, scheduled exports.", icon: "download" },
                { name: "API for External Tools", description: "REST API endpoints, WebSocket API, authentication, OpenAPI docs, rate limiting, webhook support.", icon: "plug" },
            ],
        },
        {
            category: "Testing & Quality",
            items: [
                { name: "Automated Testing Framework", description: "Create test cases from flows, assertion builder, test execution, reports, CI/CD integration.", icon: "flask" },
                { name: "Performance Profiling", description: "CPU/memory monitoring, slow operation detection, performance recommendations, and reports.", icon: "tachometer" },
            ],
        },
        {
            category: "Workflow & Automation",
            items: [
                { name: "Flow Templates", description: "Save and reuse flow templates with variables. Template library and sharing.", icon: "file-text" },
                { name: "Automated Response Generation", description: "Generate mock responses based on request patterns. Templates, dynamic generation, pattern matching.", icon: "magic" },
                { name: "Create Request Feature", description: "Build and send custom HTTP requests. Templates, import/export, request history.", icon: "paper-plane" },
                { name: "Fake Response Creator", description: "Build fake responses with templates. Apply to flows, pattern matching, and response library.", icon: "magic" },
            ],
        },
    ];

    return (
        <div style={{ display: "grid", gap: "24px", paddingBottom: "24px" }}>
            {features.map((category, catIndex) => (
                <div 
                    key={catIndex} 
                    className="card-sleek glint-effect" 
                    style={{ 
                        padding: "clamp(16px, 2vw, 24px)", 
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        borderRadius: "16px",
                        animation: `fadeIn 0.4s ease-in ${catIndex * 0.1}s both`
                    }}
                >
                    <h3 style={{ 
                        fontSize: "clamp(18px, 2vw, 22px)", 
                        fontWeight: "600", 
                        marginBottom: "20px", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px", 
                        color: "var(--accent-primary)" 
                    }}>
                        <i className="fa fa-folder" style={{ fontSize: "22px" }}></i> {category.category}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
                        {category.items.map((item, itemIndex) => (
                            <div
                                key={itemIndex}
                                className="glint-effect"
                                style={{
                                    padding: "18px",
                                    backgroundColor: "var(--bg-secondary)",
                                    borderRadius: "12px",
                                    border: "2px solid var(--border-color)",
                                    transition: "all 0.3s ease",
                                    animation: `fadeIn 0.3s ease-in ${itemIndex * 0.05}s both`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-4px)";
                                    e.currentTarget.style.borderColor = "var(--accent-primary)";
                                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.borderColor = "var(--border-color)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                                    <div style={{ 
                                        padding: "12px", 
                                        backgroundColor: "var(--accent-primary)", 
                                        borderRadius: "10px", 
                                        color: "white", 
                                        fontSize: "20px", 
                                        flexShrink: 0,
                                        width: "44px",
                                        height: "44px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <i className={`fa fa-${item.icon}`}></i>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ fontSize: "clamp(15px, 2vw, 16px)", fontWeight: "600", marginBottom: "8px", margin: 0 }}>{item.name}</h4>
                                        <p style={{ fontSize: "clamp(12px, 1.5vw, 14px)", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0, wordWrap: "break-word" }}>{item.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function KeyboardShortcuts() {
    const shortcuts = [
        {
            category: "Navigation",
            items: [
                { keys: ["Ctrl", "1"], action: "Switch to Capture tab" },
                { keys: ["Ctrl", "2"], action: "Switch to Flow List tab" },
                { keys: ["Ctrl", "3"], action: "Switch to Analytics tab" },
                { keys: ["Ctrl", "4"], action: "Switch to Tools tab" },
                { keys: ["Ctrl", "K"], action: "Open keyboard shortcuts" },
            ],
        },
        {
            category: "Flow Operations",
            items: [
                { keys: ["Enter"], action: "View selected flow details" },
                { keys: ["R"], action: "Replay selected flow" },
                { keys: ["D"], action: "Duplicate flow" },
                { keys: ["Delete"], action: "Delete selected flow(s)" },
                { keys: ["B"], action: "Bookmark selected flow" },
                { keys: ["T"], action: "Add tag to selected flow" },
            ],
        },
        {
            category: "Interception",
            items: [
                { keys: ["I"], action: "Toggle interception for selected flow" },
                { keys: ["P"], action: "Pause/Resume intercepted flow" },
                { keys: ["M"], action: "Modify intercepted flow" },
            ],
        },
        {
            category: "Search & Filter",
            items: [
                { keys: ["Ctrl", "F"], action: "Focus search/filter input" },
                { keys: ["Esc"], action: "Clear search/filter" },
            ],
        },
        {
            category: "View",
            items: [
                { keys: ["Ctrl", "+"], action: "Zoom in" },
                { keys: ["Ctrl", "-"], action: "Zoom out" },
                { keys: ["Ctrl", "0"], action: "Reset zoom" },
                { keys: ["Ctrl", "D"], action: "Toggle dark mode" },
            ],
        },
    ];

    return (
        <div style={{ display: "grid", gap: "24px", paddingBottom: "24px" }}>
            {shortcuts.map((category, index) => (
                <div 
                    key={index} 
                    className="card-sleek glint-effect" 
                    style={{ 
                        padding: "clamp(16px, 2vw, 24px)", 
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        borderRadius: "16px",
                        animation: `fadeIn 0.4s ease-in ${index * 0.1}s both`
                    }}
                >
                    <h3 style={{ 
                        fontSize: "clamp(18px, 2vw, 22px)", 
                        fontWeight: "600", 
                        marginBottom: "20px", 
                        color: "var(--accent-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                    }}>
                        <i className="fa fa-keyboard-o" style={{ fontSize: "22px" }}></i>
                        {category.category}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
                        {category.items.map((item, itemIndex) => (
                            <div
                                key={itemIndex}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    padding: "14px",
                                    backgroundColor: "var(--bg-secondary)",
                                    borderRadius: "10px",
                                    transition: "all 0.3s ease",
                                    animation: `fadeIn 0.3s ease-in ${itemIndex * 0.05}s both`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateX(4px)";
                                    e.currentTarget.style.borderLeft = "3px solid var(--accent-primary)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateX(0)";
                                    e.currentTarget.style.borderLeft = "none";
                                }}
                            >
                                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                                    {item.keys.map((key, keyIndex) => (
                                        <React.Fragment key={keyIndex}>
                                            <kbd
                                                style={{
                                                    padding: "8px 14px",
                                                    backgroundColor: "var(--bg-tertiary)",
                                                    border: "2px solid var(--border-color)",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: "600",
                                                    fontFamily: "monospace",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                                    transition: "all 0.2s ease"
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                            >
                                                {key}
                                            </kbd>
                                            {keyIndex < item.keys.length - 1 && <span style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: "600" }}>+</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div style={{ fontSize: "clamp(13px, 1.5vw, 14px)", color: "var(--text-primary)", display: "flex", alignItems: "center", flex: 1 }}>
                                    {item.action}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
