import * as React from "react";
import { useState, useEffect } from "react";
import { useAppSelector } from "../../ducks";
import { fetchApi } from "../../utils";
import { Flow } from "../../flow";

interface TestCase {
    id?: string;
    name: string;
    flow_id: string;
    assertions: Array<{
        type: "status_code" | "header" | "body_contains" | "response_time" | "custom";
        expected: any;
        actual?: any;
        passed?: boolean;
    }>;
    enabled: boolean;
}

interface TestSuite {
    id?: string;
    name: string;
    test_cases: string[];
    enabled: boolean;
}

export default function TestingView() {
    const flows = useAppSelector((state) => state.flows.list);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
    const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
    const [currentTestCase, setCurrentTestCase] = useState<TestCase>({
        name: "",
        flow_id: "",
        assertions: [],
        enabled: true,
    });
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [currentTestSuite, setCurrentTestSuite] = useState<TestSuite>({
        name: "",
        test_cases: [],
        enabled: true,
    });
    const [showTestSuites, setShowTestSuites] = useState(false);

    useEffect(() => {
        fetchApi("/testing/test-cases")
            .then((res) => res.json())
            .then((data) => setTestCases(data || []))
            .catch((err) => console.error("Failed to load test cases:", err));

        fetchApi("/testing/test-suites")
            .then((res) => res.json())
            .then((data) => setTestSuites(data || []))
            .catch((err) => console.error("Failed to load test suites:", err));
    }, []);

    const addAssertion = () => {
        setCurrentTestCase({
            ...currentTestCase,
            assertions: [
                ...currentTestCase.assertions,
                { type: "status_code", expected: 200 },
            ],
        });
    };

    const updateAssertion = (index: number, field: string, value: any) => {
        const newAssertions = [...currentTestCase.assertions];
        newAssertions[index] = { ...newAssertions[index], [field]: value };
        setCurrentTestCase({ ...currentTestCase, assertions: newAssertions });
    };

    const removeAssertion = (index: number) => {
        const newAssertions = currentTestCase.assertions.filter((_, i) => i !== index);
        setCurrentTestCase({ ...currentTestCase, assertions: newAssertions });
    };

    const saveTestCase = async () => {
        try {
            await fetchApi("/testing/test-cases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...currentTestCase,
                    flow_id: selectedFlow || currentTestCase.flow_id,
                }),
            });
            const updated = await fetchApi("/testing/test-cases").then((r) => r.json());
            setTestCases(updated);
            setCurrentTestCase({
                name: "",
                flow_id: "",
                assertions: [],
                enabled: true,
            });
            setSelectedFlow(null);
        } catch (error) {
            console.error("Failed to save test case:", error);
            alert("Failed to save test case");
        }
    };

    const runTests = async (testCaseIds?: string[]) => {
        setRunning(true);
        setResults([]);
        try {
            const response = await fetchApi("/testing/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ test_case_ids: testCaseIds || testCases.map((t) => t.id).filter(Boolean) }),
            });
            const result = await response.json();
            setResults(result.results || []);
        } catch (error) {
            console.error("Failed to run tests:", error);
            alert("Failed to run tests");
        } finally {
            setRunning(false);
        }
    };

    const runTestSuite = async (suiteId: string) => {
        const suite = testSuites.find((s) => s.id === suiteId);
        if (!suite) return;
        setRunning(true);
        setResults([]);
        try {
            const response = await fetchApi("/testing/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ test_case_ids: suite.test_cases }),
            });
            const result = await response.json();
            setResults(result.results || []);
        } catch (error) {
            console.error("Failed to run test suite:", error);
            alert("Failed to run test suite");
        } finally {
            setRunning(false);
        }
    };

    const saveTestSuite = async () => {
        try {
            await fetchApi("/testing/test-suites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentTestSuite),
            });
            const updated = await fetchApi("/testing/test-suites").then((r) => r.json());
            setTestSuites(updated);
            setCurrentTestSuite({
                name: "",
                test_cases: [],
                enabled: true,
            });
            alert("Test suite saved!");
        } catch (error) {
            console.error("Failed to save test suite:", error);
            alert("Failed to save test suite");
        }
    };

    const httpFlows = flows.filter((f) => f.type === "http");

    return (
        <div style={{ 
            padding: "20px", 
            maxWidth: "100%", 
            margin: "0 auto", 
            height: "calc(100vh - 180px)", 
            display: "flex", 
            flexDirection: "column",
            overflow: "hidden",
            gap: "20px"
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
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
                            <i className="fa fa-flask" style={{ color: "var(--accent-primary)", fontSize: "clamp(24px, 3vw, 32px)" }}></i>
                            Testing & QA
                        </h2>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "clamp(12px, 1.5vw, 14px)" }}>
                            Create and run automated tests for your API endpoints
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", backgroundColor: "var(--bg-tertiary)", padding: "4px", borderRadius: "10px" }}>
                        <button
                            className={`btn-sleek glint-effect ${!showTestSuites ? "btn-sleek-success" : ""}`}
                            onClick={() => setShowTestSuites(false)}
                            style={{ padding: "10px 20px", fontSize: "13px", fontWeight: "500", borderRadius: "8px", transition: "all 0.3s ease" }}
                        >
                            <i className="fa fa-list"></i> Test Cases
                        </button>
                        <button
                            className={`btn-sleek glint-effect ${showTestSuites ? "btn-sleek-success" : ""}`}
                            onClick={() => setShowTestSuites(true)}
                            style={{ padding: "10px 20px", fontSize: "13px", fontWeight: "500", borderRadius: "8px", transition: "all 0.3s ease" }}
                        >
                            <i className="fa fa-folder"></i> Test Suites ({testSuites.length})
                        </button>
                    </div>
                </div>
            </div>

            {}
            {!showTestSuites ? (
                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "24px", 
                    flex: 1, 
                    minHeight: 0, 
                    overflow: "hidden"
                }}>
                    {}
                    <div className="card-sleek glint-effect" style={{ 
                        padding: "20px", 
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                        display: "flex", 
                        flexDirection: "column", 
                        overflow: "hidden",
                        borderRadius: "16px",
                        animation: "slideInLeft 0.4s ease-out",
                        minWidth: 0
                    }}>
                        <h2 style={{ 
                            marginBottom: "20px", 
                            fontSize: "clamp(18px, 2vw, 22px)", 
                            fontWeight: "600", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "10px",
                            flexShrink: 0
                        }}>
                            <i className="fa fa-plus-circle" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                            Create Test Case
                        </h2>
                        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "8px", marginBottom: "20px" }}>
                            <div style={{ marginBottom: "16px" }}>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Test Name:</label>
                                <input
                                    type="text"
                                    className="input-sleek"
                                    value={currentTestCase.name}
                                    onChange={(e) => setCurrentTestCase({ ...currentTestCase, name: e.target.value })}
                                    placeholder="My Test Case"
                                    style={{ width: "100%", padding: "12px", borderRadius: "8px" }}
                                />
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Select Flow:</label>
                                <select
                                    className="select-sleek"
                                    value={selectedFlow || ""}
                                    onChange={(e) => {
                                        setSelectedFlow(e.target.value || null);
                                        setCurrentTestCase({ ...currentTestCase, flow_id: e.target.value });
                                    }}
                                    style={{ width: "100%", padding: "12px", borderRadius: "8px" }}
                                >
                                    <option value="">Select a flow...</option>
                                    {httpFlows.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.request?.method} {f.request?.path} - {f.id.substring(0, 8)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Assertions:</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {currentTestCase.assertions.map((assertion, index) => (
                                        <div 
                                            key={index} 
                                            style={{ 
                                                padding: "14px", 
                                                backgroundColor: "var(--bg-secondary)", 
                                                borderRadius: "10px",
                                                border: "2px solid var(--border-color)",
                                                transition: "all 0.3s ease",
                                                animation: "fadeIn 0.3s ease-in"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-primary)"}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                                        >
                                            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr auto", gap: "10px" }}>
                                                <select
                                                    className="select-sleek"
                                                    value={assertion.type}
                                                    onChange={(e) => updateAssertion(index, "type", e.target.value)}
                                                    style={{ padding: "10px", fontSize: "13px", borderRadius: "8px" }}
                                                >
                                                    <option value="status_code">Status Code</option>
                                                    <option value="header">Header</option>
                                                    <option value="body_contains">Body Contains</option>
                                                    <option value="response_time">Response Time</option>
                                                    <option value="custom">Custom</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    className="input-sleek"
                                                    value={assertion.expected}
                                                    onChange={(e) => updateAssertion(index, "expected", e.target.value)}
                                                    placeholder="Expected value"
                                                    style={{ padding: "10px", fontSize: "13px", borderRadius: "8px" }}
                                                />
                                                <button
                                                    className="btn-sleek btn-sleek-danger glint-effect"
                                                    onClick={() => removeAssertion(index)}
                                                    style={{ padding: "10px 14px", fontSize: "13px", borderRadius: "8px", transition: "all 0.2s" }}
                                                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                                >
                                                    <i className="fa fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        className="btn-sleek glint-effect" 
                                        onClick={addAssertion} 
                                        style={{ 
                                            alignSelf: "flex-start", 
                                            padding: "12px 20px", 
                                            fontSize: "14px",
                                            borderRadius: "8px",
                                            transition: "all 0.3s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 158, 255, 0.3)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "none";
                                        }}
                                    >
                                        <i className="fa fa-plus"></i> Add Assertion
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: "auto", paddingTop: "20px", flexShrink: 0, borderTop: "2px solid var(--border-color)" }}>
                            <button 
                                className="btn-sleek btn-sleek-success glint-effect" 
                                onClick={saveTestCase} 
                                style={{ 
                                    padding: "14px 24px", 
                                    width: "100%", 
                                    fontSize: "15px", 
                                    fontWeight: "600",
                                    borderRadius: "10px",
                                    transition: "all 0.3s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <i className="fa fa-save"></i> Save Test Case
                            </button>
                        </div>
                    </div>

                    {}
                    <div className="card-sleek glint-effect" style={{ 
                        padding: "20px", 
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                        display: "flex", 
                        flexDirection: "column", 
                        overflow: "hidden",
                        borderRadius: "16px",
                        animation: "slideInRight 0.4s ease-out",
                        minWidth: 0
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexShrink: 0 }}>
                            <h2 style={{ fontSize: "clamp(18px, 2vw, 22px)", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                                <i className="fa fa-list" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                                Test Cases
                            </h2>
                            <span style={{ padding: "8px 16px", backgroundColor: "var(--bg-tertiary)", borderRadius: "12px", fontSize: "14px", fontWeight: "600", color: "var(--accent-primary)" }}>
                                {testCases.length} {testCases.length === 1 ? "case" : "cases"}
                            </span>
                        </div>
                        <div style={{ marginBottom: "16px", flexShrink: 0 }}>
                            <button
                                className="btn-sleek btn-sleek-success glint-effect"
                                onClick={() => runTests()}
                                disabled={running || testCases.length === 0}
                                style={{ padding: "12px 20px", width: "100%", fontSize: "14px", fontWeight: "600", borderRadius: "10px", transition: "all 0.3s ease" }}
                            >
                                <i className="fa fa-play"></i> {running ? "Running Tests..." : `Run All Tests (${testCases.length})`}
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "8px" }}>
                            {testCases.length === 0 ? (
                                <div style={{ 
                                    textAlign: "center", 
                                    padding: "clamp(30px, 6vw, 60px)", 
                                    color: "var(--text-secondary)",
                                    animation: "fadeIn 0.5s ease-in"
                                }}>
                                    <i className="fa fa-flask" style={{ fontSize: "clamp(40px, 8vw, 64px)", opacity: 0.3, marginBottom: "20px" }}></i>
                                    <p style={{ fontSize: "clamp(14px, 2vw, 16px)", fontWeight: "500" }}>No test cases created yet</p>
                                </div>
                            ) : (
                                testCases.map((testCase, index) => (
                                    <div
                                        key={index}
                                        className="glint-effect"
                                        style={{
                                            padding: "16px",
                                            backgroundColor: testCase.enabled ? "rgba(74, 158, 255, 0.08)" : "var(--bg-secondary)",
                                            borderRadius: "12px",
                                            border: testCase.enabled ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                            transition: "all 0.3s ease",
                                            animation: `fadeIn 0.3s ease-in ${index * 0.05}s both`
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-4px)";
                                            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "none";
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <strong style={{ fontSize: "15px", fontWeight: "600" }}>{testCase.name}</strong>
                                                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                                                    {testCase.assertions.length} assertion{testCase.assertions.length !== 1 ? "s" : ""}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button
                                                    className="btn-sleek btn-sleek-success glint-effect"
                                                    onClick={() => runTests([testCase.id || index.toString()])}
                                                    style={{ padding: "8px 14px", fontSize: "12px", borderRadius: "8px", transition: "all 0.2s" }}
                                                    title="Run test"
                                                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                                >
                                                    <i className="fa fa-play"></i>
                                                </button>
                                                <button
                                                    className={`btn-sleek glint-effect ${testCase.enabled ? "btn-sleek-success" : ""}`}
                                                    style={{ padding: "8px 14px", fontSize: "12px", borderRadius: "8px" }}
                                                >
                                                    {testCase.enabled ? "Enabled" : "Disabled"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "24px", 
                    flex: 1, 
                    minHeight: 0,
                    overflow: "hidden"
                }}>
                    {}
                    <div className="card-sleek glint-effect" style={{ 
                        padding: "20px", 
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                        display: "flex", 
                        flexDirection: "column", 
                        overflow: "hidden",
                        borderRadius: "16px",
                        animation: "slideInLeft 0.4s ease-out",
                        minWidth: 0
                    }}>
                        <h2 style={{ 
                            marginBottom: "20px", 
                            fontSize: "clamp(18px, 2vw, 22px)", 
                            fontWeight: "600", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "10px",
                            flexShrink: 0
                        }}>
                            <i className="fa fa-plus-circle" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                            Create Test Suite
                        </h2>
                        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "8px", marginBottom: "20px" }}>
                            <div style={{ marginBottom: "16px" }}>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Suite Name:</label>
                                <input
                                    type="text"
                                    className="input-sleek"
                                    value={currentTestSuite.name}
                                    onChange={(e) => setCurrentTestSuite({ ...currentTestSuite, name: e.target.value })}
                                    placeholder="My Test Suite"
                                    style={{ width: "100%", padding: "12px", borderRadius: "8px" }}
                                />
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Select Test Cases:</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "12px" }}>
                                    {testCases.length === 0 ? (
                                        <p style={{ color: "var(--text-secondary)", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                                            No test cases available. Create test cases first.
                                        </p>
                                    ) : (
                                        testCases.map((testCase) => (
                                            <label
                                                key={testCase.id || testCase.name}
                                                style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "10px", borderRadius: "8px", transition: "all 0.2s" }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={currentTestSuite.test_cases.includes(testCase.id || testCase.name)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setCurrentTestSuite({
                                                                ...currentTestSuite,
                                                                test_cases: [...currentTestSuite.test_cases, testCase.id || testCase.name],
                                                            });
                                                        } else {
                                                            setCurrentTestSuite({
                                                                ...currentTestSuite,
                                                                test_cases: currentTestSuite.test_cases.filter((id) => id !== (testCase.id || testCase.name)),
                                                            });
                                                        }
                                                    }}
                                                    style={{ width: "18px", height: "18px" }}
                                                />
                                                <span style={{ fontSize: "14px", flex: 1 }}>{testCase.name}</span>
                                                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                                    {testCase.assertions.length} assertion{testCase.assertions.length !== 1 ? "s" : ""}
                                                </span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={currentTestSuite.enabled}
                                        onChange={(e) => setCurrentTestSuite({ ...currentTestSuite, enabled: e.target.checked })}
                                        style={{ width: "18px", height: "18px" }}
                                    />
                                    <span style={{ fontSize: "13px" }}>Enabled</span>
                                </label>
                            </div>
                        </div>
                        <div style={{ marginTop: "auto", paddingTop: "20px", flexShrink: 0, borderTop: "2px solid var(--border-color)" }}>
                            <button 
                                className="btn-sleek btn-sleek-success glint-effect" 
                                onClick={saveTestSuite} 
                                style={{ 
                                    padding: "14px 24px", 
                                    width: "100%", 
                                    fontSize: "15px", 
                                    fontWeight: "600",
                                    borderRadius: "10px",
                                    transition: "all 0.3s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <i className="fa fa-save"></i> Save Test Suite
                            </button>
                        </div>
                    </div>

                    {}
                    <div className="card-sleek glint-effect" style={{ 
                        padding: "20px", 
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                        display: "flex", 
                        flexDirection: "column", 
                        overflow: "hidden",
                        borderRadius: "16px",
                        animation: "slideInRight 0.4s ease-out",
                        minWidth: 0
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexShrink: 0 }}>
                            <h2 style={{ fontSize: "clamp(18px, 2vw, 22px)", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                                <i className="fa fa-folder" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                                Test Suites
                            </h2>
                            <span style={{ padding: "8px 16px", backgroundColor: "var(--bg-tertiary)", borderRadius: "12px", fontSize: "14px", fontWeight: "600", color: "var(--accent-primary)" }}>
                                {testSuites.length} {testSuites.length === 1 ? "suite" : "suites"}
                            </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "8px" }}>
                            {testSuites.length === 0 ? (
                                <div style={{ 
                                    textAlign: "center", 
                                    padding: "clamp(30px, 6vw, 60px)", 
                                    color: "var(--text-secondary)",
                                    animation: "fadeIn 0.5s ease-in"
                                }}>
                                    <i className="fa fa-folder" style={{ fontSize: "clamp(40px, 8vw, 64px)", opacity: 0.3, marginBottom: "20px" }}></i>
                                    <p style={{ fontSize: "clamp(14px, 2vw, 16px)", fontWeight: "500" }}>No test suites created yet</p>
                                </div>
                            ) : (
                                testSuites.map((suite, index) => {
                                    const suiteTestCases = suite.test_cases
                                        .map((id) => testCases.find((tc) => (tc.id || tc.name) === id))
                                        .filter(Boolean) as TestCase[];

                                    return (
                                        <div
                                            key={index}
                                            className="glint-effect"
                                            style={{
                                                padding: "18px",
                                                backgroundColor: suite.enabled ? "rgba(74, 158, 255, 0.08)" : "var(--bg-secondary)",
                                                borderRadius: "12px",
                                                border: suite.enabled ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                                                transition: "all 0.3s ease",
                                                animation: `fadeIn 0.3s ease-in ${index * 0.05}s both`
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-4px)";
                                                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "none";
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                                <div>
                                                    <strong style={{ fontSize: "16px", fontWeight: "600" }}>{suite.name}</strong>
                                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                                                        {suite.test_cases.length} test case{suite.test_cases.length !== 1 ? "s" : ""}
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button
                                                        className="btn-sleek btn-sleek-success glint-effect"
                                                        onClick={() => runTestSuite(suite.id || index.toString())}
                                                        disabled={running || suite.test_cases.length === 0}
                                                        style={{ padding: "8px 14px", fontSize: "12px", borderRadius: "8px", transition: "all 0.2s" }}
                                                        title="Run suite"
                                                        onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = "scale(1.1)")}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                                    >
                                                        <i className="fa fa-play"></i> Run
                                                    </button>
                                                    <button
                                                        className={`btn-sleek glint-effect ${suite.enabled ? "btn-sleek-success" : ""}`}
                                                        style={{ padding: "8px 14px", fontSize: "12px", borderRadius: "8px" }}
                                                    >
                                                        {suite.enabled ? "Enabled" : "Disabled"}
                                                    </button>
                                                </div>
                                            </div>
                                            {suiteTestCases.length > 0 && (
                                                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                                                    <strong>Test Cases:</strong>
                                                    <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                        {suiteTestCases.map((tc) => (
                                                            <span
                                                                key={tc.id || tc.name}
                                                                style={{
                                                                    padding: "4px 10px",
                                                                    backgroundColor: "var(--bg-tertiary)",
                                                                    borderRadius: "6px",
                                                                    fontSize: "11px",
                                                                }}
                                                            >
                                                                {tc.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {}
            {results.length > 0 && (
                <div className="card-sleek glint-effect" style={{ 
                    padding: "20px", 
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                    borderRadius: "16px",
                    animation: "slideUp 0.4s ease-out"
                }}>
                    <h3 style={{ marginBottom: "20px", fontSize: "clamp(18px, 2vw, 22px)", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
                        <i className="fa fa-check-circle" style={{ color: "var(--accent-primary)", fontSize: "24px" }}></i>
                        Test Results
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className="glint-effect"
                                style={{
                                    padding: "16px",
                                    backgroundColor: result.passed ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)",
                                    borderRadius: "12px",
                                    border: result.passed ? "2px solid #28a745" : "2px solid #dc3545",
                                    transition: "all 0.3s ease",
                                    animation: `fadeIn 0.3s ease-in ${index * 0.1}s both`
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <strong style={{ fontSize: "15px", fontWeight: "600" }}>{result.test_name}</strong>
                                    <span
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: "8px",
                                            backgroundColor: result.passed ? "#28a745" : "#dc3545",
                                            color: "white",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {result.passed ? "PASSED" : "FAILED"}
                                    </span>
                                </div>
                                {result.assertions && (
                                    <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                                        {result.assertions.map((a: any, i: number) => (
                                            <div key={i} style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontSize: "16px", color: a.passed ? "#28a745" : "#dc3545" }}>
                                                    {a.passed ? "✓" : "✗"}
                                                </span>
                                                <span>{a.type}: {a.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
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
