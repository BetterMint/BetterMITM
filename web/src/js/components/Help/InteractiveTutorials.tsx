import * as React from "react";
import { useState } from "react";
import { useAppDispatch } from "../../ducks";
import { Tab, setCurrent } from "../../ducks/ui/tabs";

interface Tutorial {
    id: string;
    title: string;
    description: string;
    icon: string;
    steps: Array<{ title: string; content: string; action?: { type: "navigate"; tab: Tab } | { type: "click"; selector: string } }>;
}

const tutorials: Tutorial[] = [
    {
        id: "getting-started",
        title: "Getting Started with BetterMITM",
        description: "Learn the basics of using BetterMITM to intercept and analyze network traffic",
        icon: "rocket",
        steps: [
            {
                title: "Welcome to BetterMITM",
                content: "BetterMITM is an advanced HTTP proxy tool for intercepting, analyzing, and modifying network traffic. This tutorial will guide you through the essential features.",
            },
            {
                title: "Start Capturing Traffic",
                content: "Navigate to the Capture tab to configure your proxy. Set up interception rules, connection pooling, and rate limiting options.",
                action: { type: "navigate", tab: Tab.Capture },
            },
            {
                title: "View Captured Flows",
                content: "Go to the Flow List tab to see all captured network traffic. Click on any flow to view detailed request and response information.",
                action: { type: "navigate", tab: Tab.FlowList },
            },
            {
                title: "Analyze Traffic",
                content: "Use the Analytics tab to view real-time statistics, charts, and insights about your traffic patterns.",
                action: { type: "navigate", tab: Tab.Analytics },
            },
        ],
    },
    {
        id: "interception",
        title: "Advanced Interception",
        description: "Learn how to intercept and modify traffic using the Advanced Interceptor",
        icon: "filter",
        steps: [
            {
                title: "Enable Advanced Interceptor",
                content: "Go to the Capture tab and enable the Advanced Interceptor. This allows you to pause and modify requests/responses in real-time.",
                action: { type: "navigate", tab: Tab.Capture },
            },
            {
                title: "Configure Interception Rules",
                content: "Add URL patterns to intercept specific requests. You can use regex patterns for flexible matching. Choose between 'pause' mode (manual review) or 'block' mode (automatic blocking).",
            },
            {
                title: "Modify Intercepted Flows",
                content: "When a flow is intercepted, click on it in the Flow List to view details. You can modify headers, body, method, URL, and more. Click 'Resume' to continue with your changes.",
            },
            {
                title: "Use Smart Rules Engine",
                content: "For complex interception logic, use the Rules tab. Create rules with multiple conditions, priorities, and actions (intercept, block, modify, redirect).",
                action: { type: "navigate", tab: Tab.Rules },
            },
        ],
    },
    {
        id: "analytics",
        title: "Traffic Analytics",
        description: "Master the analytics dashboard and visualization tools",
        icon: "bar-chart",
        steps: [
            {
                title: "View Analytics Dashboard",
                content: "The Analytics tab provides comprehensive statistics including total flows, data transfer, error rates, and average response times.",
                action: { type: "navigate", tab: Tab.Analytics },
            },
            {
                title: "Explore Charts",
                content: "View status code distribution, HTTP method breakdown, and top domains. All charts are interactive and update in real-time.",
            },
            {
                title: "Timeline Visualization",
                content: "Switch to the Timeline view to see all flows plotted on a timeline. Click on flows to see details, and use zoom controls for different time scales.",
            },
            {
                title: "Performance Profiling",
                content: "Use the Performance tab to monitor BetterMITM's own performance. Track CPU and memory usage, identify slow operations, and get recommendations.",
            },
        ],
    },
    {
        id: "modification",
        title: "Modifying Traffic",
        description: "Learn to transform requests and responses using transformers and scripts",
        icon: "exchange",
        steps: [
            {
                title: "Request/Response Transformers",
                content: "Go to the Transformers tab to create transformers that automatically modify traffic. Use pre-built transformers or create custom JavaScript/Python transformers.",
                action: { type: "navigate", tab: Tab.Transformers },
            },
            {
                title: "Scriptable Interception",
                content: "Use the Scripts tab to write custom JavaScript or Python scripts. Scripts have access to flow data and can programmatically modify requests/responses.",
                action: { type: "navigate", tab: Tab.Scripts },
            },
            {
                title: "Replay with Modifications",
                content: "Select a flow and use the 'Replay Modified' button to replay it with changes. Modify headers, body, or method before replaying.",
            },
        ],
    },
    {
        id: "security",
        title: "Security Testing",
        description: "Use BetterMITM's security testing tools to find vulnerabilities",
        icon: "shield",
        steps: [
            {
                title: "Security Testing Suite",
                content: "Go to the Security tab to access security testing tools. Test for SQL injection, XSS, CSRF, authentication bypass, and more.",
                action: { type: "navigate", tab: Tab.Security },
            },
            {
                title: "Run Security Tests",
                content: "Select a flow and choose which tests to run. View detailed results with severity levels and recommendations for fixing vulnerabilities.",
            },
            {
                title: "Certificate Management",
                content: "Manage certificates, detect pinning, and bypass certificate pinning where possible. Import custom CAs and view certificate chains.",
            },
            {
                title: "Authentication Tools",
                content: "Extract tokens from flows, decode/edit JWTs, visualize OAuth flows, and test token rotation mechanisms.",
            },
        ],
    },
    {
        id: "tools",
        title: "Tools & Utilities",
        description: "Explore BetterMITM's powerful utility tools",
        icon: "wrench",
        steps: [
            {
                title: "Flow Comparison",
                content: "Use the Tools tab to compare two flows side-by-side. See differences in headers, body, and timing. Export comparison reports.",
                action: { type: "navigate", tab: Tab.Tools },
            },
            {
                title: "Advanced Export",
                content: "Export flows to various formats: Postman collections, Insomnia, OpenAPI/Swagger, HAR, and more. Use custom templates for specialized exports.",
            },
            {
                title: "Request Builder",
                content: "Build and send custom HTTP requests from scratch. Set method, URL, headers, and body. Save requests as templates for reuse.",
                action: { type: "navigate", tab: Tab.RequestBuilder },
            },
            {
                title: "Mock Response Creator",
                content: "Create fake responses for testing. Set URL patterns, status codes, headers, and body. Enable/disable responses as needed.",
                action: { type: "navigate", tab: Tab.Mock },
            },
        ],
    },
];

export default function InteractiveTutorials() {
    const dispatch = useAppDispatch();
    const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [completed, setCompleted] = useState<Set<string>>(new Set());

    const tutorial = selectedTutorial ? tutorials.find((t) => t.id === selectedTutorial) : null;
    const currentStepData = tutorial && tutorial.steps[currentStep];

    const nextStep = () => {
        if (tutorial && currentStep < tutorial.steps.length - 1) {
            setCurrentStep(currentStep + 1);
            
            if (tutorial.steps[currentStep + 1]?.action) {
                const action = tutorial.steps[currentStep + 1].action!;
                if (action.type === "navigate") {
                    dispatch(setCurrent(action.tab));
                }
            }
        } else if (tutorial) {
            setCompleted(new Set([...completed, tutorial.id]));
            setSelectedTutorial(null);
            setCurrentStep(0);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            
            if (tutorial && tutorial.steps[currentStep - 1]?.action) {
                const action = tutorial.steps[currentStep - 1].action!;
                if (action.type === "navigate") {
                    dispatch(setCurrent(action.tab));
                }
            }
        }
    };

    const startTutorial = (tutorialId: string) => {
        setSelectedTutorial(tutorialId);
        setCurrentStep(0);
        const tut = tutorials.find(t => t.id === tutorialId);
        if (tut?.steps[0]?.action) {
            const action = tut.steps[0].action!;
            if (action.type === "navigate") {
                dispatch(setCurrent(action.tab));
            }
        }
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 350px) 1fr", gap: "20px", minHeight: 0, width: "100%" }}>
            <div className="card-sleek glint-effect" style={{ padding: "clamp(14px, 1.8vw, 20px)", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", overflowY: "auto", borderRadius: "12px" }}>
                <h3 style={{ marginBottom: "16px", fontSize: "clamp(16px, 1.8vw, 18px)", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    <i className="fa fa-list" style={{ color: "var(--accent-primary)", fontSize: "20px" }}></i>
                    Available Tutorials
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {tutorials.map((t) => (
                        <button
                            key={t.id}
                            className={`btn-sleek glint-effect ${selectedTutorial === t.id ? "btn-sleek-success" : ""}`}
                            onClick={() => startTutorial(t.id)}
                            style={{
                                textAlign: "left",
                                padding: "14px",
                                borderRadius: "10px",
                                border: selectedTutorial === t.id ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                backgroundColor: selectedTutorial === t.id ? "var(--bg-secondary)" : "transparent",
                                transition: "all 0.2s",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                <i className={`fa fa-${t.icon}`} style={{ fontSize: "16px", color: "var(--accent-primary)" }}></i>
                                <div style={{ fontWeight: "600", fontSize: "14px" }}>{t.title}</div>
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4", marginTop: "4px" }}>
                                {t.description}
                            </div>
                            {completed.has(t.id) && (
                                <div style={{ fontSize: "10px", color: "var(--accent-secondary)", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <i className="fa fa-check-circle"></i> Completed
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card-sleek glint-effect" style={{ padding: "clamp(16px, 2vw, 24px)", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", overflowY: "auto", borderRadius: "12px", minHeight: 0 }}>
                {tutorial && currentStepData ? (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h3 style={{ fontSize: "22px", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                                <i className={`fa fa-${tutorial.icon}`} style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                                {tutorial.title}
                            </h3>
                            <div style={{ padding: "8px 16px", backgroundColor: "var(--bg-secondary)", borderRadius: "12px", fontSize: "13px", fontWeight: "600" }}>
                                Step {currentStep + 1} of {tutorial.steps.length}
                            </div>
                        </div>

                        <div style={{ marginBottom: "24px", padding: "20px", backgroundColor: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                            <h4 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px", color: "var(--accent-primary)" }}>
                                {currentStepData.title}
                            </h4>
                            <p style={{ color: "var(--text-primary)", lineHeight: "1.7", fontSize: "14px", margin: 0 }}>
                                {currentStepData.content}
                            </p>
                            {currentStepData.action && (
                                <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--accent-primary)" }}>
                                    <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "var(--accent-primary)" }}>
                                        <i className="fa fa-lightbulb-o"></i> Try it now:
                                    </div>
                                    <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                                        {currentStepData.action.type === "navigate" ? `Navigate to the ${Tab[currentStepData.action.tab]} tab` : currentStepData.action.selector}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <button
                                className="btn-sleek glint-effect"
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                style={{ padding: "12px 24px", fontSize: "14px", opacity: currentStep === 0 ? 0.5 : 1 }}
                            >
                                <i className="fa fa-arrow-left"></i> Previous
                            </button>
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                {Math.round(((currentStep + 1) / tutorial.steps.length) * 100)}% Complete
                            </div>
                            <button
                                className="btn-sleek btn-sleek-success glint-effect"
                                onClick={nextStep}
                                style={{ padding: "12px 24px", fontSize: "14px", fontWeight: "600" }}
                            >
                                {currentStep === tutorial.steps.length - 1 ? (
                                    <>
                                        <i className="fa fa-check"></i> Complete Tutorial
                                    </>
                                ) : (
                                    <>
                                        Next <i className="fa fa-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </div>

                        <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "10px" }}>
                            <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "12px", color: "var(--text-primary)" }}>Progress:</div>
                            <div style={{ display: "flex", gap: "4px" }}>
                                {tutorial.steps.map((_, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            flex: 1,
                                            height: "6px",
                                            backgroundColor: index <= currentStep ? "var(--accent-primary)" : "var(--border-color)",
                                            borderRadius: "3px",
                                            transition: "background-color 0.3s",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <i className="fa fa-graduation-cap" style={{ fontSize: "64px", opacity: 0.3, marginBottom: "16px" }}></i>
                        <p style={{ fontSize: "16px", fontWeight: "500" }}>Select a tutorial from the left to get started</p>
                        <p style={{ fontSize: "13px", marginTop: "8px" }}>Tutorials will guide you through BetterMITM's features step-by-step</p>
                    </div>
                )}
            </div>
        </div>
    );
}
