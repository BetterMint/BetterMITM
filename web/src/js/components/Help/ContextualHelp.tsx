import * as React from "react";
import { useState } from "react";

interface HelpItem {
    id: string;
    title: string;
    content: string;
    keywords: string[];
    category: string;
    videoUrl?: string;
    relatedFeatures?: string[];
}

const helpItems: HelpItem[] = [
    {
        id: "interception",
        title: "How to Intercept Traffic",
        category: "Interception",
        content: "BetterMITM provides powerful interception capabilities. Use the Advanced Interceptor in the Capture tab to intercept specific URLs. Add URL patterns (supports regex) and choose between 'pause' mode (manual review) or 'block' mode (automatic blocking). You can also use the Smart Rules Engine in the Rules tab to create complex interception logic with multiple conditions, priorities, and actions.",
        keywords: ["intercept", "capture", "pause", "block", "rules"],
        relatedFeatures: ["Advanced Interceptor", "Smart Rules Engine"],
    },
    {
        id: "modify-request",
        title: "Modifying Requests and Responses",
        category: "Modification",
        content: "Select a flow from the Flow List and click on it to view details. In the Flow Detail view, you can modify headers, body, method, URL, and more. Changes are applied when you resume the flow. For automated modifications, use Transformers (Transformers tab) or Scripts (Scripts tab). Transformers provide pre-built actions like JSON path modification, header injection, URL rewriting, and encoding/decoding. Scripts allow you to write custom JavaScript or Python code with full access to flow data.",
        keywords: ["modify", "request", "response", "headers", "body", "transformers", "scripts"],
        relatedFeatures: ["Body Editor", "Transformers", "Scriptable Interception"],
    },
    {
        id: "mock-responses",
        title: "Creating Mock Responses",
        category: "Testing",
        content: "Go to the Mock tab to create fake responses for testing. Set URL patterns (regex supported), status codes, headers, and body. Enable/disable responses as needed. Mock responses can be applied automatically when requests match the pattern. Use the auto-generation feature to create responses based on request patterns. You can also use templates for common response types.",
        keywords: ["mock", "response", "fake", "test", "template"],
        relatedFeatures: ["Mock Response Creator", "Automated Response Generation"],
    },
    {
        id: "analytics",
        title: "Using Analytics Dashboard",
        category: "Analytics",
        content: "The Analytics tab provides comprehensive real-time statistics about your traffic. View total flows, data transfer, error rates, and average response times. Interactive charts show status code distribution, HTTP method breakdown, and top domains. Switch to Timeline view to see all flows plotted on a timeline with relationships. Use Performance Profiling to monitor BetterMITM's own performance. Export analytics data as CSV or JSON.",
        keywords: ["analytics", "stats", "charts", "statistics", "timeline", "performance"],
        relatedFeatures: ["Traffic Analytics Dashboard", "Timeline Visualization", "Performance Profiling"],
    },
    {
        id: "security-testing",
        title: "Security Testing Suite",
        category: "Security",
        content: "The Security tab provides comprehensive security testing tools. Test for SQL injection, XSS, CSRF, authentication bypass, header security analysis, and SSL/TLS configuration. Select a flow and choose which tests to run. View detailed results with severity levels (high, medium, low) and recommendations for fixing vulnerabilities. Export security reports in JSON or HTML format. Use Certificate Management to handle custom CAs and certificate pinning. Authentication Tools help extract tokens, decode JWTs, and visualize OAuth flows.",
        keywords: ["security", "testing", "vulnerability", "sql injection", "xss", "csrf", "certificate"],
        relatedFeatures: ["Security Testing Suite", "Certificate Management", "Authentication Tools"],
    },
    {
        id: "flow-comparison",
        title: "Comparing Flows",
        category: "Tools",
        content: "Use the Tools tab to compare two flows side-by-side. Select two HTTP flows to see differences in headers, body, and timing. The comparison tool highlights changes with color coding (green for additions, red for removals, yellow for modifications). Switch between side-by-side, unified, and diff-only views. Export comparison reports in JSON or HTML format. This is useful for debugging differences between requests, testing A/B scenarios, and analyzing before/after modifications.",
        keywords: ["compare", "diff", "difference", "flow comparison"],
        relatedFeatures: ["Flow Comparison Tool"],
    },
    {
        id: "export-import",
        title: "Exporting and Importing",
        category: "Export",
        content: "BetterMITM supports multiple export formats. Export flows to Postman collections, Insomnia, OpenAPI/Swagger, HAR, and more. Use custom templates for specialized exports. Batch export with filters. Export comparison reports, analytics data, and security reports. Import dashboard layouts, rule configurations, and flow templates. All exports can be scheduled or triggered manually.",
        keywords: ["export", "import", "postman", "insomnia", "har", "openapi"],
        relatedFeatures: ["Advanced Export Options"],
    },
    {
        id: "dashboard",
        title: "Customizable Dashboard",
        category: "UI/UX",
        content: "The Dashboard tab allows you to create a personalized workspace. Add widgets for statistics, charts, flow lists, and filters. Drag widgets to reposition them. Resize widgets by dragging the bottom-right corner. Save your layout - it will be restored when you reload the page. Export and import dashboard layouts to share with your team. Widgets update in real-time as new flows are captured.",
        keywords: ["dashboard", "widgets", "layout", "customize"],
        relatedFeatures: ["Customizable Dashboard"],
    },
    {
        id: "websocket",
        title: "WebSocket Message Interception",
        category: "Protocols",
        content: "BetterMITM fully supports WebSocket connections. Intercept WebSocket messages in both directions (client to server and server to client). Modify message content, inject new messages, and filter messages based on content. View WebSocket connection details, message history, and replay messages. WebSocket flows appear in the Flow List with a special indicator. Click on a WebSocket flow to view all messages and modify them.",
        keywords: ["websocket", "ws", "message", "intercept"],
        relatedFeatures: ["WebSocket Message Interception"],
    },
    {
        id: "grpc-protobuf",
        title: "gRPC and Protobuf Support",
        category: "Protocols",
        content: "BetterMITM provides enhanced support for gRPC and Protocol Buffers. Import .proto files to enable type-safe message editing. Visual protobuf editor allows you to edit fields with proper type validation. Auto-decode protobuf messages when Content-Type indicates protobuf. View gRPC method calls and stream messages. Protobuf flows automatically get a dedicated Protobuf tab in the Flow Detail view.",
        keywords: ["grpc", "protobuf", "proto", "rpc"],
        relatedFeatures: ["gRPC/Protobuf Enhanced Support"],
    },
    {
        id: "testing-framework",
        title: "Automated Testing Framework",
        category: "Testing",
        content: "Create test cases from flows in the Testing tab. Build assertions for status codes, headers, body content, response times, and custom conditions. Execute test suites and view detailed reports. Integrate with CI/CD pipelines using the REST API. Test cases can be saved, shared, and reused. Run tests on single flows or batch test multiple flows.",
        keywords: ["testing", "test cases", "assertions", "ci/cd"],
        relatedFeatures: ["Automated Testing Framework"],
    },
    {
        id: "bookmarks-tags",
        title: "Flow Bookmarks and Tags",
        category: "Organization",
        content: "Bookmark important flows for quick access. Add tags to organize flows by category, project, or any custom classification. Filter flows by bookmarks or tags. Manage tags - create, edit, delete, and assign colors. Export bookmarked flows. Tags help you organize large numbers of flows and find specific flows quickly.",
        keywords: ["bookmark", "tag", "organize", "filter"],
        relatedFeatures: ["Flow Bookmarks & Tags"],
    },
    {
        id: "keyboard-shortcuts",
        title: "Keyboard Shortcuts",
        category: "Productivity",
        content: "BetterMITM supports many keyboard shortcuts for faster workflow. Use Ctrl+1-4 to switch between main tabs. Press Enter to view selected flow details. Use R to replay, D to duplicate, Delete to remove flows. Press I to toggle interception, P to pause/resume. Use Ctrl+F to focus search. See the Keyboard Shortcuts tab for a complete list. You can also create custom shortcuts in the Settings.",
        keywords: ["shortcuts", "keyboard", "hotkeys", "productivity"],
        relatedFeatures: ["Keyboard Shortcuts & Macros"],
    },
    {
        id: "themes",
        title: "Themes and Appearance",
        category: "UI/UX",
        content: "BetterMITM supports multiple themes including Light, Dark, Blue, Purple, Green, Red, Orange, Cyber, Midnight, and Ocean. Switch themes using the theme selector in the top-right corner. Enable auto-switch to follow your system's dark mode preference or schedule theme changes (e.g., dark at 8PM-6AM). Themes apply smoothly with transitions. Your theme preference is saved automatically.",
        keywords: ["theme", "dark mode", "appearance", "color"],
        relatedFeatures: ["Dark Mode Auto-Switch"],
    },
    {
        id: "api-integration",
        title: "API for External Tools",
        category: "Integration",
        content: "BetterMITM provides a REST API for external tool integration. Access flows, modify them, trigger actions, and get real-time updates via WebSocket. API documentation is available in OpenAPI format. Authenticate using tokens. Rate limiting is configurable. Use webhooks for event notifications. Perfect for CI/CD integration, automated testing, and custom tooling.",
        keywords: ["api", "rest", "websocket", "integration", "ci/cd"],
        relatedFeatures: ["API for External Tools"],
    },
    {
        id: "scripting-basics",
        title: "Scripting Basics",
        category: "Scripting",
        content: "BetterMITM supports JavaScript and Python scripting for advanced automation. Scripts can intercept requests and responses, modify flow data, add headers, transform bodies, and perform complex logic. Use the Scripts tab to create, edit, and manage scripts. Scripts can be triggered on request, response, or both. Set priorities to control execution order. Use the comprehensive API to access flow properties, modify requests/responses, make HTTP calls, perform crypto operations, and more. See the complete API documentation in the Scripts tab.",
        keywords: ["script", "javascript", "python", "automation", "api"],
        relatedFeatures: ["Scriptable Interception"],
    },
    {
        id: "rules-engine",
        title: "Smart Rules Engine",
        category: "Rules",
        content: "The Smart Rules Engine allows you to create complex interception and modification rules with a visual builder or JSON/YAML. Rules can have multiple conditions (URL, method, headers, body, status code) with AND/OR logic. Actions include intercept, block, modify, redirect, and custom transformations. Set rule priorities to control execution order. Rules can be enabled/disabled individually. Import and export rule configurations for sharing. Use templates for common scenarios. Rules are evaluated in priority order and the first matching rule's action is executed.",
        keywords: ["rules", "conditions", "actions", "priority", "visual builder"],
        relatedFeatures: ["Smart Interception Rules Engine"],
    },
    {
        id: "transformers",
        title: "Using Transformers",
        category: "Modification",
        content: "Transformers provide pre-built actions for common request/response modifications. Available transformers include JSON Path (modify JSON fields), Header Injection (add/modify headers), URL Rewriting (modify URLs), Encoding/Decoding (Base64, URL, HTML), and more. Create custom transformers with JavaScript. Apply transformers to specific flows or globally. Chain multiple transformers together. Transformers can be enabled/disabled and have priorities. Use the Transformers tab to manage and configure transformers.",
        keywords: ["transformer", "modify", "json path", "header", "url rewrite"],
        relatedFeatures: ["Request/Response Transformers"],
    },
    {
        id: "request-builder",
        title: "Request Builder",
        category: "Tools",
        content: "The Request Builder allows you to create and send custom HTTP requests. Set method, URL, headers, and body. Use templates for common request types. Import requests from flows. Save requests for reuse. View response details. Request Builder is useful for testing APIs, debugging, and manual request crafting. Responses are captured as flows and appear in the Flow List.",
        keywords: ["request", "builder", "create", "send", "test"],
        relatedFeatures: ["Create Request Feature"],
    },
    {
        id: "performance",
        title: "Performance Optimization",
        category: "Advanced",
        content: "BetterMITM includes performance profiling tools to monitor its own performance. View CPU and memory usage, slow operation detection, and performance recommendations. Use connection pooling and rate limiting to optimize resource usage. Configure timeouts appropriately. Use filters to reduce the number of flows captured. Disable unnecessary features when not in use. Export performance reports for analysis.",
        keywords: ["performance", "profiling", "cpu", "memory", "optimization"],
        relatedFeatures: ["Performance Profiling"],
    },
    {
        id: "troubleshooting",
        title: "Troubleshooting",
        category: "Support",
        content: "If you encounter issues, check the following: 1) Ensure the CA certificate is installed correctly (visit http://mitm.it), 2) Verify proxy settings in your device/browser, 3) Check firewall settings, 4) Review flow errors in the Flow List, 5) Check console logs for errors, 6) Verify rules and scripts are correctly configured, 7) Test with a simple request first. For SSL/TLS issues, check certificate validity. For interception issues, verify URL patterns and rules. For performance issues, check resource usage and disable unnecessary features.",
        keywords: ["troubleshoot", "error", "issue", "problem", "fix"],
        relatedFeatures: [],
    },
    {
        id: "best-practices",
        title: "Best Practices",
        category: "Advanced",
        content: "Follow these best practices for optimal BetterMITM usage: 1) Use filters to reduce captured flows, 2) Bookmark important flows for quick access, 3) Use tags to organize flows, 4) Export important flows regularly, 5) Use rules for automated modifications instead of manual changes, 6) Test scripts in a safe environment first, 7) Keep BetterMITM updated, 8) Review security test results regularly, 9) Use HTTPS for sensitive operations, 10) Document your rules and scripts, 11) Use version control for rule configurations, 12) Monitor performance and optimize as needed.",
        keywords: ["best practices", "tips", "optimization", "workflow"],
        relatedFeatures: [],
    },
];

export default function ContextualHelp() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = Array.from(new Set(helpItems.map(item => item.category)));

    const filteredItems = helpItems.filter((item) => {
        const matchesSearch = !searchQuery || 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = !selectedCategory || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const selectedHelp = selectedItem ? helpItems.find((h) => h.id === selectedItem) : null;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", height: "100%", minHeight: 0 }}>
            <div className="card-sleek glint-effect" style={{ padding: "20px", boxShadow: "var(--shadow-md)", overflowY: "auto" }}>
                <div style={{ marginBottom: "20px" }}>
                    <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Search Help:</label>
                    <input
                        type="text"
                        className="input-sleek"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search topics..."
                        style={{ width: "100%", padding: "10px", fontSize: "13px" }}
                    />
                </div>

                {categories.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                        <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Category:</label>
                        <select
                            className="select-sleek"
                            value={selectedCategory || ""}
                            onChange={(e) => setSelectedCategory(e.target.value || null)}
                            style={{ width: "100%", padding: "10px", fontSize: "13px" }}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                )}

                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa fa-list" style={{ color: "var(--accent-primary)" }}></i>
                    Help Topics ({filteredItems.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {filteredItems.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", fontSize: "13px" }}>
                            No topics found
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <button
                                key={item.id}
                                className={`btn-sleek glint-effect ${selectedItem === item.id ? "btn-sleek-success" : ""}`}
                                onClick={() => setSelectedItem(item.id)}
                                style={{
                                    textAlign: "left",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: selectedItem === item.id ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                    backgroundColor: selectedItem === item.id ? "var(--bg-secondary)" : "transparent",
                                    transition: "all 0.2s",
                                }}
                            >
                                <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "4px" }}>{item.title}</div>
                                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{item.category}</div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="card-sleek glint-effect" style={{ padding: "24px", boxShadow: "var(--shadow-md)", overflowY: "auto" }}>
                {selectedHelp ? (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                            <div>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>{selectedHelp.category}</div>
                                <h3 style={{ fontSize: "24px", fontWeight: "700", margin: 0, marginBottom: "12px" }}>{selectedHelp.title}</h3>
                            </div>
                            {selectedHelp.videoUrl && (
                                <a
                                    href={selectedHelp.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-sleek btn-sleek-success glint-effect"
                                    style={{ padding: "10px 16px", fontSize: "13px" }}
                                >
                                    <i className="fa fa-video-camera"></i> Watch Video
                                </a>
                            )}
                        </div>
                        <div style={{ 
                            fontSize: "clamp(14px, 1.6vw, 16px)", 
                            lineHeight: "1.8", 
                            color: "var(--text-primary)", 
                            marginBottom: "24px", 
                            whiteSpace: "pre-wrap", 
                            wordWrap: "break-word",
                            padding: "clamp(16px, 2vw, 20px)",
                            backgroundColor: "var(--bg-secondary)",
                            borderRadius: "12px",
                            border: "1px solid var(--border-color)",
                            minHeight: "clamp(100px, 15vh, 150px)"
                        }}>
                            {selectedHelp.content}
                        </div>
                        {selectedHelp.relatedFeatures && selectedHelp.relatedFeatures.length > 0 && (
                            <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "var(--accent-primary)" }}>
                                    <i className="fa fa-star"></i> Related Features:
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {selectedHelp.relatedFeatures.map((feature, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                padding: "6px 12px",
                                                backgroundColor: "var(--bg-tertiary)",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                border: "1px solid var(--border-color)",
                                            }}
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "var(--text-primary)" }}>
                                <i className="fa fa-tags"></i> Keywords:
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {selectedHelp.keywords.map((keyword, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            padding: "4px 10px",
                                            backgroundColor: "var(--bg-tertiary)",
                                            borderRadius: "12px",
                                            fontSize: "11px",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <i className="fa fa-book" style={{ fontSize: "64px", opacity: 0.3, marginBottom: "16px" }}></i>
                        <p style={{ fontSize: "16px", fontWeight: "500" }}>Select a help topic from the left</p>
                        <p style={{ fontSize: "13px", marginTop: "8px" }}>Use the search box to find specific topics</p>
                    </div>
                )}
            </div>
        </div>
    );
}
