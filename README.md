# 🔍 BetterMITM

<p align="center">
  <img src="https://github.com/BetterMint/BetterMint/blob/main/generated_video%20(1).gif?raw=true"
       alt="BetterMITM Banner" />
</p>

<p align="center">
  An enhanced fork of mitmproxy with <strong>31 advanced features</strong>, modern UI, and powerful traffic analysis tools.<br/>
  Built for security researchers, developers, and QA engineers who need more control over network traffic.
</p>

<p align="center">
  <a href="https://github.com/BetterMint/BetterMITM">
    <img src="https://img.shields.io/github/stars/BetterMint/BetterMITM?style=flat&label=Stars" alt="Repo Stars" />
  </a>
  <a href="https://github.com/BetterMint/BetterMITM/issues">
    <img src="https://img.shields.io/github/issues/BetterMint/BetterMITM?style=flat&label=Issues" alt="Issues" />
  </a>
  <a href="https://discord.gg/bettermint-development-1098267851732815932">
    <img src="https://img.shields.io/discord/1098267851732815932?style=flat&label=Discord&color=5865F2" alt="Discord" />
  </a>
</p>

---

## ✨ Complete Feature List

BetterMITM includes **31 fully implemented features** across 9 categories:

### 🎯 Interception & Traffic Control

1. **Advanced Interceptor** - Bidirectional interception with pause/block modes, URL pattern matching, and skip functionality
2. **Smart Interception Rules Engine** - Visual rule builder with JSON/YAML support, priority-based execution, and complex condition matching
3. **Traffic Replay with Modifications** - Replay requests with modifications, batch replay, and replay history
4. **Connection Pooling & Rate Limiting** - Control connection behavior with configurable pool sizes and rate limits per domain

### 📊 Analytics & Visualization

5. **Traffic Analytics Dashboard** - Real-time graphs, statistics, top domains, response times, error rates with CSV/JSON export
6. **Flow Comparison Tool** - Side-by-side flow comparison with diff highlighting, multiple flow comparison, and export reports
7. **Traffic Timeline Visualization** - Interactive timeline showing all flows with relationships, timing, and color-coded status codes
8. **Performance Profiling** - CPU/memory monitoring, slow operation detection, performance recommendations, and reports

### 🔧 Modification & Transformation

9. **Request/Response Transformers** - Pre-built and custom transformers for JSON path, headers, URL rewriting, encoding/decoding
10. **Scriptable Interception** - JavaScript and Python scripting with full API access, debugging tools, and dynamic interception logic
11. **Body Editor with Syntax Highlighting** - Monaco Editor integration with syntax highlighting, auto-formatting, validation, and search/replace

### 🔒 Security & Testing

12. **Security Testing Suite** - Test for SQL injection, XSS, CSRF, authentication bypass, header security, and SSL/TLS configuration
13. **Certificate Management** - Import custom CAs, detect certificate pinning, bypass pinning, view certificate chains, and expiration warnings
14. **Authentication Testing Tools** - Extract tokens, decode/edit JWTs, visualize OAuth flows, test token rotation, and MFA testing

### 🌐 Network & Protocol Support

15. **WebSocket Message Interception** - Full WebSocket support with message interception, modification, injection, filtering, and replay
16. **gRPC/Protobuf Enhanced Support** - Visual protobuf editor, import .proto files, auto-decode messages, type-safe editing, and stream handling
17. **HTTP/3 and QUIC Support** - Full HTTP/3 interception, QUIC connection details, stream visualization, and message modification

### 🎨 UI/UX & Workflow

18. **Customizable Dashboard** - Drag-and-drop widgets, save layouts, export/import configurations with stats, charts, flow lists, and filters
19. **Keyboard Shortcuts & Macros** - Custom shortcuts, macro recording/playback, conflict detection, and shareable macros
20. **Flow Bookmarks & Tags** - Bookmark important flows, organize with tags, filter by tags, export bookmarked flows
21. **Dark Mode Auto-Switch** - Follow system preference or schedule theme changes with smooth transitions between 10 beautiful themes

### 📤 Export & Integration

22. **Advanced Export Options** - Export to Postman, Insomnia, OpenAPI/Swagger, HAR, custom templates, batch export, and scheduled exports
23. **API for External Tools** - REST API endpoints, WebSocket API, authentication, OpenAPI docs, rate limiting, and webhook support

### 🧪 Testing & Quality

24. **Automated Testing Framework** - Create test cases from flows, assertion builder, test execution, reports, and CI/CD integration
25. **Interactive Tutorials** - Step-by-step tutorials with interactive examples, progress tracking, and contextual help
26. **Contextual Help System** - Comprehensive help topics, search functionality, video links, and example flows

### 🚀 Workflow & Automation

27. **Flow Templates** - Save and reuse flow templates with variables, template library, and sharing
28. **Automated Response Generation** - Generate mock responses based on request patterns, templates, dynamic generation, and pattern matching
29. **Create Request Feature** - Build and send custom HTTP requests with templates, import/export, and request history
30. **Fake Response Creator (Mock Responses)** - **Actually intercepts real requests** and sends fake responses instead of forwarding to the real server. Supports pattern matching (regex, exact, contains), priority-based matching, response delays, and condition-based matching with extensive customization options

### 📱 Additional Features

31. **Enhanced Flow Management** - Advanced filtering, sorting, search, bulk operations, and flow organization tools

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **uv** (fast Python package installer) - [Install uv](https://github.com/astral-sh/uv)
- **Node.js 18+** (for building the web frontend)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/BetterMint/BetterMITM.git
   cd BetterMITM
   ```

2. **Run the setup script**:
   
   **Windows:**
   ```cmd
   run.bat
   ```
   
   **Linux/MacOS:**
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

   The script will automatically:
   - Check for and install `uv` if needed
   - Install Python dependencies using `uv`
   - Check for Node.js
   - Install npm dependencies
   - Build the web frontend with Vite
   - Start BetterMITM

3. **Access the web interface**:
   Open the URL shown in the terminal (typically `http://127.0.0.1:8081/?token=...`) in your browser

4. **Configure your device/browser**:
   - Set proxy to `127.0.0.1:8080` (or the port shown in the terminal)
   - Install CA certificate from `http://mitm.it` when prompted

---

## 📖 Documentation

### Getting Started

- **Installation Guide**: See the Quick Start section above
- **First Steps**: Open the Help tab in BetterMITM for interactive tutorials
- **Feature Guides**: Each feature has detailed help in the Help tab

### Key Features Documentation

#### Smart Interception Rules Engine
Create complex interception rules with a visual builder or JSON/YAML configuration. Set priorities, multiple conditions, and actions (intercept, block, modify, redirect).

**Example Rule (YAML):**
```yaml
rules:
  - name: "Block Ads"
    priority: 100
    enabled: true
    action: block
    conditions:
      - type: url
        operator: matches
        value: ".*ads\..*"
```

#### Traffic Analytics Dashboard
View real-time statistics including:
- Total flows, data transfer, error rates
- Status code distribution charts
- HTTP method breakdown
- Top domains and response times
- Export data as CSV or JSON

#### Scriptable Interception
Write custom JavaScript or Python scripts to control interception:

**JavaScript Example:**
```javascript
// Modify all requests to example.com
if (flow.request.pretty_host === "example.com") {
    flow.request.headers["X-Custom-Header"] = "Modified";
}
```

**Python Example:**
```python
def request(flow):
    if "example.com" in flow.request.pretty_host:
        flow.request.headers["X-Custom-Header"] = "Modified"
```

#### Security Testing Suite
Test your applications for common vulnerabilities:
- SQL Injection
- Cross-Site Scripting (XSS)
- CSRF Protection
- Authentication Bypass
- Header Security Analysis
- SSL/TLS Configuration

#### Customizable Dashboard
Create your own dashboard with drag-and-drop widgets:
- Statistics widgets
- Chart widgets (methods, status codes)
- Flow list widgets
- Domain list widgets
- Save and restore layouts
- Export/import dashboard configurations

---

## 🎯 Usage Examples

### Example 1: Intercepting API Calls

1. Open the **Capture** tab
2. Enable **Advanced Interceptor**
3. Add URL pattern: `api.example.com`
4. Set mode to **Pause**
5. When API calls are intercepted, modify them in the **Flow** tab
6. Click **Resume** to continue

### Example 2: Creating Smart Interception Rules

1. Go to the **Rules** tab
2. Click "Create Rule"
3. Set name: "Block Tracking"
4. Add condition: URL matches `.*tracking\..*`
5. Set action: **Block**
6. Set priority: 100
7. Save and enable the rule

### Example 3: Security Testing

1. Go to the **Security** tab
2. Select a flow from the list
3. Choose tests: SQL Injection, XSS, CSRF
4. Click "Run Security Tests"
5. Review results with severity levels and recommendations

### Example 4: Creating Mock Responses (Actually Intercepts Real Requests)

**Important**: Mock responses actually intercept real requests and send fake responses instead of forwarding to the real server. This is perfect for testing applications without a backend.

1. Go to the **Mock** tab
2. Click "Create Mock Response"
3. Configure:
   - **Name**: "Fake API Response"
   - **URL Pattern**: `.*api\.example\.com/users.*`
   - **Match Mode**: regex (or exact/contains)
   - **Priority**: 10 (higher = matched first)
   - **Status Code**: 200
   - **Body Type**: JSON
   - **Body**: `{"users": [], "message": "This is a fake response"}`
   - **Headers**: Add custom headers if needed
   - **Delay**: 100ms (optional, simulates network delay)
   - **Conditions**: Optional (method, headers, body matching)
4. Enable the mock response
5. **Result**: When any application makes a request matching the pattern, BetterMITM intercepts it and returns your fake response instead of forwarding to the real server

**Advanced Customization**:
- **Priority**: Set priority (higher = matched first when multiple mocks match)
- **Match Mode**: Choose regex, exact, or contains matching
- **Delay**: Simulate network latency (milliseconds)
- **Conditions**: Add conditions based on HTTP method, headers, or body content
- **Enable/Disable**: Toggle individual mocks on/off without deleting them

### Comprehensive Customization Options

BetterMITM provides extensive customization options across all features:

#### Advanced Interceptor
- **Match Mode**: regex, contains, or exact URL matching
- **Skip Domains**: Configure domains to never intercept
- **Priority System**: Set interception rule priorities

#### Smart Rules Engine
- **Condition Types**: URL, method, header, body, status code, domain
- **Operators**: equals, contains, matches (regex), starts_with, ends_with
- **Case Sensitivity**: Toggle case-sensitive matching
- **Priority-Based Execution**: Higher priority rules execute first

#### Rate Limiting
- **Per-Domain Configuration**: JSON-based rate limit configs
- **Connection Pooling**: Per-domain pool size configuration
- **Throttling**: Per-domain delay configuration

#### Transformers
- **Execution Order**: Before, after, or replace (stop chain)
- **Timeout & Retry**: Configure timeouts and retry logic
- **Conditional Application**: Apply only if conditions match
- **Priority System**: Control transformer execution order

#### Scripts
- **Execution Timeout**: Maximum script execution time
- **Memory Limit**: Set memory limits for scripts
- **Error Handling**: Continue, stop, or retry on error
- **Hot Reload**: Automatically reload scripts on changes

#### Security Testing
- **Test Timeout**: Configure timeout per test (5-300 seconds)
- **Concurrent Tests**: Number of parallel tests (1-20)
- **Severity Filter**: Filter results by severity level
- **Custom Payloads**: Add custom test payloads
- **Stop on First Vulnerability**: Halt when first issue found

#### Analytics Dashboard
- **Refresh Interval**: Auto-refresh rate (1-60 seconds)
- **Time Range**: Select time window for analytics
- **Export Options**: CSV/JSON export with filters

#### Timeline Visualization
- **Color Schemes**: By status code, HTTP method, or domain
- **Filters**: Domain, method, status code, min duration
- **Zoom Control**: Adjust timeline zoom (0.5x to 5x)
- **Show Relationships**: Toggle flow relationship visualization

#### Flow Comparison
- **Diff Algorithm**: Semantic, character-based, or word-based
- **Context Lines**: Number of context lines around differences
- **Ignore Options**: Whitespace and case-insensitive comparison
- **Compare Modes**: Side-by-side, unified, or diff-only

#### Replay with Modifications
- **Batch Replay**: Replay multiple times with intervals
- **Transformation Scripts**: JavaScript transformations during replay
- **Replay Count**: Set number of replays (1-100)
- **Replay Interval**: Delay between batch replays

### Example 5: Custom Dashboard

1. Go to the **Dashboard** tab
2. Click "+ Stats" to add a statistics widget
3. Click "+ Methods" to add an HTTP methods chart
4. Drag widgets to reposition
5. Resize widgets by dragging corners
6. Click "Save" to persist your layout

---

## 🎨 Themes

BetterMITM includes **10 beautiful themes**:

- 🌞 **Light** - Clean, bright interface
- 🌙 **Dark** - Easy on the eyes
- 🔵 **Blue** - Professional blue theme
- 🟣 **Purple** - Modern purple accent
- 🟢 **Green** - Fresh green theme
- 🔴 **Red** - Bold red theme
- 🟠 **Orange** - Warm orange theme
- 💻 **Cyber** - Futuristic cyber theme
- 🌃 **Midnight** - Deep dark theme
- 🌊 **Ocean** - Calming ocean theme

Click the **Theme** button in the top-right to switch themes. Enable auto-switch to follow your system's dark mode preference.

---

## ⌨️ Keyboard Shortcuts

### Navigation
- `Ctrl+1` - Switch to Capture tab
- `Ctrl+2` - Switch to Flow List tab
- `Ctrl+3` - Switch to Analytics tab
- `Ctrl+4` - Switch to Tools tab
- `Ctrl+K` - Open keyboard shortcuts

### Flow Operations
- `Enter` - View selected flow details
- `R` - Replay selected flow
- `D` - Duplicate flow
- `Delete` - Delete selected flow(s)
- `B` - Bookmark selected flow
- `T` - Add tag to selected flow

### Interception
- `I` - Toggle interception for selected flow
- `P` - Pause/Resume intercepted flow
- `M` - Modify intercepted flow

See the **Help** tab for a complete list of keyboard shortcuts.

---

## 🛠️ Advanced Features

### Mock Responses (Fake Responses)

**Mock responses actually intercept real requests and send fake responses instead of forwarding to the real server.** This is perfect for:
- Testing applications without a backend
- Simulating API responses
- Testing error scenarios
- Development without network dependencies

**Key Features**:
- **Real Interception**: Actually blocks real requests and sends fake responses
- **Pattern Matching**: Supports regex, exact, and contains matching
- **Priority System**: Higher priority mocks are matched first
- **Response Delays**: Simulate network latency
- **Condition Matching**: Match based on HTTP method, headers, or body
- **Enable/Disable**: Toggle mocks without deleting them

**Backend Configuration**:
The mock responses addon supports configuration via command-line options:
- `mock_responses_enabled`: Enable/disable globally
- `mock_responses_match_mode`: Default match mode (regex, exact, contains)
- `mock_responses_priority_order`: How to order mocks (first, priority, last)
- `mock_responses_block_real`: Block real requests when mock is active (default: true)
- `mock_responses_log`: Log interceptions (default: true)

**Example Use Case**:
Create a mock that intercepts all requests to `api.example.com` and returns a fake 200 response:
- Pattern: `.*api\.example\.com/.*`
- Match Mode: regex
- Priority: 10
- Status: 200
- Body: `{"message": "Fake response", "data": []}`

When your application makes requests to `api.example.com`, BetterMITM intercepts them and returns your fake response instead of forwarding to the real server.

### API Integration

BetterMITM provides a REST API for external tool integration:

```bash
# Get all flows
curl http://127.0.0.1:8081/api/flows

# Get flow by ID
curl http://127.0.0.1:8081/api/flows/{flow_id}

# Replay flow
curl -X POST http://127.0.0.1:8081/api/flows/{flow_id}/replay
```

See the **Help** tab for complete API documentation.

### Export Formats

Export flows to various formats:
- **Postman** - Postman Collection v2.1
- **Insomnia** - Insomnia export format
- **OpenAPI/Swagger** - OpenAPI 3.0 specification
- **HAR** - HTTP Archive format
- **JSON** - Custom JSON format
- **CSV** - Comma-separated values

### Custom Transformers

Create custom transformers using JavaScript or Python:

```javascript
// Example: Add custom header to all requests
function transformRequest(flow) {
    flow.request.headers["X-Custom-Header"] = "Value";
    return flow;
}
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Areas where we'd love help:
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Testing
- 🌐 Translations

---

## 💬 Community & Support

- **Discord**: Join our Discord server for support, discussions, and updates
  - 👉 [Join Discord](https://discord.gg/bettermint-development-1098267851732815932)
- **GitHub Issues**: Report bugs or request features
  - 📋 [GitHub Issues](https://github.com/BetterMint/BetterMITM/issues)
- **Documentation**: Check the **Help** tab in BetterMITM for detailed guides

---

## 📋 Feature Roadmap

All 31 planned features have been implemented! We're always open to new feature suggestions.

Check out our [FEATURE_IDEAS.md](FEATURE_IDEAS.md) for ideas and planned enhancements.

---

## ⚠️ Important Notes

- **Web Interface Focus**: BetterMITM is optimized for the web interface (mitmweb). Advanced features work best in the browser.
- **Educational Use**: This tool is for educational purposes, security research, and testing your own applications.
- **Certificate Installation**: You must install the CA certificate from `http://mitm.it` to intercept HTTPS traffic.
- **Certificate Pinning**: Some apps use certificate pinning and cannot be intercepted.
- **Performance**: BetterMITM is designed for development and testing. For high-volume production use, consider performance tuning.

---

## 🔧 Troubleshooting

### Port Already in Use
If you see `Errno 10048` or port already in use:
1. Stop any other instances of BetterMITM
2. Or use a different port: `--mode regular@8082`

### Blank Page in Browser
1. Clear browser cache
2. Check browser console for errors (F12)
3. Ensure static assets are loading (check Network tab)
4. Try incognito/private window

### Dependencies Not Installing
1. Ensure `uv` is installed: `uv --version`
2. Ensure Node.js 18+ is installed: `node --version`
3. Try running `uv sync` and `npm install` manually

### Performance Issues
1. Use Performance Profiling tab to identify bottlenecks
2. Reduce number of active rules/scripts
3. Limit flow history size
4. Disable unnecessary features

---

## 📜 License

BetterMITM is based on mitmproxy and follows the same MIT license. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Credits

BetterMITM is a fork of [mitmproxy](https://mitmproxy.org/), an excellent open-source HTTP proxy tool created by the mitmproxy team. We extend their great work with additional features and improvements.

Special thanks to:
- The mitmproxy team for the excellent base
- All contributors and the BetterMint community
- Everyone who reported bugs and suggested features

---

## 📈 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes and updates.

### Recent Updates

- ✅ All 31 features fully implemented
- ✅ Enhanced UI with improved layouts
- ✅ Fixed splitter dragging issue
- ✅ Improved scrollbar visibility
- ✅ Enhanced help documentation
- ✅ Better performance monitoring
- ✅ Improved timeline visualization
- ✅ Comprehensive security testing suite

---

<p align="center">
  Made with ❤️ by the BetterMint community
</p>

<p align="center">
  <a href="https://discord.gg/bettermint-development-1098267851732815932">Discord</a> •
  <a href="https://github.com/BetterMint/BetterMITM">GitHub</a> •
  <a href="docs.md">Documentation</a>
</p>
