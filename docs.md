# BetterMITM Complete Documentation

## What is BetterMITM?

BetterMITM is an enhanced fork of mitmproxy, a powerful interactive HTTP/HTTPS proxy tool. BetterMITM extends the original mitmproxy functionality with **31 advanced features**, modern UI, and powerful traffic analysis tools. Built for security researchers, developers, and QA engineers who need more control over network traffic.

**Note**: BetterMITM is designed primarily for use with the **web interface (mitmweb)**. While the command-line tools (mitmproxy, mitmdump) are available, the advanced features and enhanced UI are best experienced through the web interface.

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**: BetterMITM requires Python 3.10 or higher
- **uv**: A fast Python package installer and resolver
- **Node.js 18+**: Required for building the web frontend
- **npm**: Comes with Node.js

### Installation

1. **Clone or download BetterMITM**:
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

3. **Access the web interface**: Once started, BetterMITM will display a URL (typically `http://127.0.0.1:8081`). Open this URL in your web browser.

### Basic Proxy Setup

1. **Configure your device/browser** to use the proxy:
   - **Host**: `127.0.0.1` (or your machine's IP if accessing from another device)
   - **Port**: `8080` (default HTTP proxy port)

2. **Install the CA certificate**:
   - Navigate to `http://mitm.it` in your browser while the proxy is running
   - Download and install the certificate for your operating system/browser

---

## 📚 Complete Feature Documentation

### 🎯 Interception & Traffic Control

#### 1. Advanced Interceptor

**Description**: Bidirectional interception with pause/block modes, URL pattern matching, and skip functionality.

**Features**:
- Intercept both inbound (responses) and outbound (requests) traffic
- URL pattern matching with regex support
- Pause mode: Temporarily halt connections for modification
- Block mode: Completely block connections
- Skip functionality: Skip N connections from a domain before intercepting
- Real-time flow modification

**Customization Options**:
- Enable/disable interception globally
- Configure separate settings for inbound/outbound traffic
- Set interception mode (pause or block)
- Add multiple URL patterns (comma-separated)
- Configure skip settings per domain (format: `domain.com:5, api.com:10`)
- **Match Mode**: Choose how URL patterns are matched:
  - `regex`: Full regular expression matching
  - `contains`: Simple substring matching
  - `exact`: Exact URL matching
- Configure skip domains (domains to never intercept)
- Set priority for interception rules

**Usage**:
1. Navigate to the **Capture** tab
2. Enable **Advanced Interceptor**
3. Configure interception settings
4. Add URL patterns to intercept
5. When flows are intercepted, modify them in the Flow tab and click "Resume"

---

#### 2. Smart Interception Rules Engine

**Description**: Visual rule builder with JSON/YAML support, priority-based execution, and complex condition matching.

**Features**:
- Visual rule builder with drag-and-drop interface
- JSON/YAML configuration support
- Rule priorities and conflict resolution
- Complex condition matching (URL, method, headers, body, status code)
- Rule templates for common scenarios
- Import/export rules for sharing

**Customization Options**:
- Create rules with multiple conditions (AND/OR logic)
- Set rule priorities (higher priority rules execute first)
- Choose actions: intercept, block, modify, redirect
- Configure condition operators: equals, contains, matches (regex), starts_with, ends_with
- **Condition Types**: URL, method, header, body, status code, domain
- **Case Sensitivity**: Toggle case-sensitive matching
- Save and load rule configurations
- Enable/disable individual rules
- Import/export rules in JSON/YAML format

**Usage**:
1. Navigate to the **Rules** tab
2. Click "Create Rule" or use JSON/YAML mode
3. Configure conditions and actions
4. Set priority and enable the rule
5. Rules are automatically applied to matching flows

---

#### 3. Traffic Replay with Modifications

**Description**: Replay requests with modifications, batch replay, and replay history.

**Features**:
- Modify headers, body, or method before replaying
- Apply transformations (e.g., change POST to GET, modify timestamps)
- Replay with delays or at specific intervals
- Batch replay with different modifications for each request
- Replay history and statistics

**Customization Options**:
- Modify request method, headers, body
- **Replay Count**: Set number of times to replay (1-100)
- **Replay Interval**: Delay between batch replays (ms)
- **Batch Replay**: Enable batch replay mode
- **Apply Transformations**: Use JavaScript transformations during replay
- **Transformation Script**: Write custom JavaScript to modify requests
- Configure replay delays
- Export replay history

**Usage**:
1. Select a flow in the **Flow** tab
2. Click "Replay Modified"
3. Modify the request as needed
4. Click "Replay" to send the modified request

---

#### 4. Connection Pooling & Rate Limiting

**Description**: Control connection behavior with configurable pool sizes and rate limits per domain.

**Features**:
- Configure connection pool sizes per domain
- Rate limiting (requests per second/minute)
- Throttling options (slow down connections)
- Connection timeout configuration
- Queue management for rate-limited requests

**Customization Options**:
- Set global rate limits (requests per second/minute)
- Configure per-domain rate limits (JSON format: `{"domain.com": {"rps": 10, "burst": 20}}`)
- Adjust connection pool sizes per domain
- Set throttling speeds (delay per request in milliseconds)
- Configure timeout values
- **Rate Limit Config**: Advanced JSON configuration for fine-grained control
- **Connection Pool Config**: Per-domain pool size configuration
- **Throttle Config**: Per-domain delay configuration

**Usage**:
1. Navigate to the **Capture** tab
2. Open **Rate Limiting** settings
3. Enable rate limiting
4. Configure limits per domain or globally
5. Set connection pool sizes

---

### 📊 Analytics & Visualization

#### 5. Traffic Analytics Dashboard

**Description**: Real-time graphs, statistics, top domains, response times, error rates with CSV/JSON export.

**Features**:
- Real-time traffic graphs (requests/sec, data transfer)
- Top domains, endpoints, and user-agents
- Response time analysis and latency charts
- Error rate tracking
- Data transfer statistics (total, per domain, per hour)
- Export analytics data (CSV, JSON)
- Custom time range selection
- Filtering by domain, status code, method, etc.

**Customization Options**:
- Choose which metrics to display
- Configure time ranges (last hour, day, week, custom)
- Set up custom filters (domain, status code, method)
- Export formats (CSV, JSON)
- Chart types and colors
- **Refresh Interval**: Set auto-refresh rate (1-60 seconds)
- **Time Range**: Select time window for analytics
- **Export Analytics**: Export current view to CSV/JSON

**Usage**:
1. Navigate to the **Analytics** tab
2. View real-time statistics and charts
3. Use filters to narrow down data
4. Export data using the export button

---

#### 6. Flow Comparison Tool

**Description**: Side-by-side flow comparison with diff highlighting, multiple flow comparison, and export reports.

**Features**:
- Select two flows to compare
- Highlight differences in headers, body, timing
- Diff view for request/response bodies
- Export comparison report
- Compare multiple flows at once
- Save comparison templates

**Customization Options**:
- Choose which fields to compare (headers, body, timing)
- Configure diff highlighting colors
- **Diff Algorithm**: Choose between semantic, character-based, or word-based diff
- **Context Lines**: Set number of context lines around differences
- **Ignore Whitespace**: Toggle to ignore whitespace differences
- **Ignore Case**: Toggle case-insensitive comparison
- **Compare Mode**: Side-by-side, unified, or diff-only view
- Export formats (JSON, HTML)
- Save comparison templates

**Usage**:
1. Navigate to the **Tools** tab
2. Select "Flow Comparison"
3. Choose two flows to compare
4. Review differences highlighted in the UI
5. Export comparison report if needed

---

#### 7. Traffic Timeline Visualization

**Description**: Interactive timeline showing all flows with relationships, timing, and color-coded status codes.

**Features**:
- Interactive timeline view
- Show flow relationships (parent/child, redirects)
- Filter by time range
- Zoom in/out for different time scales
- Click flows to jump to details
- Export timeline as image

**Customization Options**:
- **Zoom Control**: Adjust timeline zoom (0.5x to 5x)
- Choose which flow types to display
- **Color Scheme**: Choose coloring by status code, HTTP method, or domain
- **Filter Domain**: Filter flows by domain name
- **Filter Method**: Filter by HTTP method (GET, POST, etc.)
- **Filter Status**: Filter by status code range (2xx, 3xx, 4xx, 5xx)
- **Min Duration**: Show only flows with duration above threshold (ms)
- **Show Relationships**: Toggle flow relationship visualization
- Export timeline as image

**Usage**:
1. Navigate to the **Analytics** tab
2. Open **Timeline Visualization**
3. Use zoom controls to adjust time scale
4. Click on flows to view details
5. Export timeline as image

---

#### 8. Performance Profiling

**Description**: CPU/memory monitoring, slow operation detection, performance recommendations, and reports.

**Features**:
- CPU usage monitoring
- Memory usage tracking
- Slow operation detection
- Performance recommendations
- Performance reports

**Customization Options**:
- Set monitoring intervals
- Configure thresholds for slow operations
- Choose which metrics to track
- Set up alerts
- Export performance reports

**Usage**:
1. Navigate to the **Analytics** tab
2. Open **Performance Profiling**
3. Click "Start Monitoring"
4. View real-time CPU and memory usage
5. Review slow operations and recommendations

---

### 🔧 Modification & Transformation

#### 9. Request/Response Transformers

**Description**: Pre-built and custom transformers for JSON path, headers, URL rewriting, encoding/decoding.

**Features**:
- Pre-built transformers:
  - JSON path modification
  - Header injection/removal
  - URL rewriting
  - Body encryption/decryption
  - Base64 encoding/decoding
  - JSON schema validation
- Custom JavaScript/Python transformers
- Chain multiple transformers
- Conditional application (only apply if condition matches)
- Transformer templates library

**Customization Options**:
- Create custom transformers
- **Priority**: Set execution priority (higher executes first)
- **Execution Order**: Before, after, or replace (stop chain)
- **Timeout**: Set transformer timeout (100-60000ms)
- **Retry Count**: Configure retry attempts (0-10)
- **Retry Delay**: Set delay between retries (100-10000ms)
- **Conditional Application**: Apply only if condition matches:
  - Condition type: URL, header, method, status code, domain, body
  - Operator: equals, contains, matches (regex), starts_with, ends_with
  - Case sensitivity toggle
- Chain multiple transformers
- **Log Transformations**: Toggle logging of transformation operations
- Save transformer templates
- Import/export transformers

**Usage**:
1. Navigate to the **Tools** tab
2. Select "Transformers"
3. Create or select a transformer
4. Configure transformation rules
5. Apply to flows automatically

---

#### 10. Scriptable Interception

**Description**: JavaScript and Python scripting with full API access, debugging tools, and dynamic interception logic.

**Features**:
- JavaScript and Python script support
- Access to flow data, headers, body
- Modify flows programmatically
- Access to BetterMITM API
- Hot-reload scripts
- Script debugging tools
- Script library/examples

**Customization Options**:
- Write custom scripts in JavaScript or Python
- Configure script triggers (request, response, both)
- **Priority**: Set execution priority
- **Timeout**: Configure script execution timeout (ms)
- **Error Handling**: Choose behavior on error (continue, stop, retry)
- **Retry Count**: Set retry attempts on error
- **Retry Delay**: Delay between retries (ms)
- **Hot Reload**: Automatically reload scripts on file changes
- **Execution Timeout**: Maximum script execution time
- **Memory Limit**: Set memory limit for scripts
- Enable/disable scripts individually
- Use script templates
- Debug scripts with output logging

**Usage**:
1. Navigate to the **Scripts** tab
2. Click "Create Script"
3. Choose language (JavaScript or Python)
4. Write your script using the API reference
5. Set trigger (request, response, or both)
6. Save and enable the script

**Complete API Reference**:

##### Flow Object Properties

```javascript
// Flow Identification
flow.id                    // Unique flow ID (string)
flow.type                  // Flow type: "http", "tcp", "udp", "websocket"
flow.timestamp_created     // Creation timestamp (number)
flow.modified()            // Check if flow was modified (boolean)
flow.intercepted           // Check if flow is intercepted (boolean)
flow.live                  // Check if flow is live (boolean)
flow.killable              // Check if flow can be killed (boolean)
flow.marked                // Flow marker/emoji (string)
flow.comment               // Flow comment (string)
flow.error                 // Flow error object (if any)

// Request Object (HTTP flows)
flow.request.method        // HTTP method: "GET", "POST", etc.
flow.request.url           // Full request URL (string)
flow.request.scheme        // URL scheme: "http" or "https"
flow.request.host          // Request host (string)
flow.request.port          // Request port (number)
flow.request.path          // Request path (string)
flow.request.http_version  // HTTP version: "HTTP/1.1", "HTTP/2", etc.
flow.request.headers       // Request headers (object/dict)
flow.request.content       // Request body content (bytes)
flow.request.text          // Request body as text (string)
flow.request.json          // Request body as JSON (object, throws if invalid)
flow.request.raw_content   // Raw request content (bytes)

// Response Object (HTTP flows)
flow.response.status_code  // HTTP status code (number: 200, 404, etc.)
flow.response.reason       // HTTP reason phrase: "OK", "Not Found", etc.
flow.response.http_version // HTTP version (string)
flow.response.headers      // Response headers (object/dict)
flow.response.content      // Response body content (bytes)
flow.response.text         // Response body as text (string)
flow.response.json         // Response body as JSON (object, throws if invalid)
flow.response.raw_content  // Raw response content (bytes)

// Connection Objects
flow.client_conn.address   // Client IP address (tuple: [host, port])
flow.client_conn.tls_established  // TLS established (boolean)
flow.client_conn.certificate_list // Client certificates (array)
flow.server_conn.address   // Server IP address (tuple: [host, port])
flow.server_conn.tls_established  // TLS established (boolean)
flow.server_conn.certificate_list // Server certificates (array)
flow.server_conn.sni       // Server Name Indication (string)
flow.server_conn.alpn      // Application-Layer Protocol Negotiation (string)
```

##### Flow Modification Methods

```javascript
// Modify Request
flow.request.method = "POST"                    // Change HTTP method
flow.request.url = "https://example.com/new"    // Change URL
flow.request.path = "/new/path"                 // Change path
flow.request.host = "newhost.com"               // Change host
flow.request.port = 443                         // Change port
flow.request.headers["X-Custom"] = "value"      // Add/modify header
delete flow.request.headers["User-Agent"]       // Remove header
flow.request.content = "new body"               // Set body as string
flow.request.content = Buffer.from("data")      // Set body as bytes (JS)
flow.request.json = {key: "value"}              // Set body as JSON

// Modify Response
flow.response.status_code = 200                 // Change status code
flow.response.reason = "OK"                     // Change reason phrase
flow.response.headers["X-Custom"] = "value"     // Add/modify header
delete flow.response.headers["Server"]          // Remove header
flow.response.content = "new body"              // Set body as string
flow.response.content = Buffer.from("data")     // Set body as bytes (JS)
flow.response.json = {key: "value"}             // Set body as JSON

// Flow Control
flow.intercept()                                // Pause flow for manual review
flow.kill()                                     // Kill/block the flow
flow.resume()                                   // Resume intercepted flow

// Metadata
flow.marked = "🔴"                              // Set flow marker
flow.comment = "Important flow"                 // Set flow comment
```

##### Utility Functions

```javascript
// Logging
console.log("Message", data)                    // Log message
console.error("Error", error)                   // Log error
console.warn("Warning", data)                   // Log warning
console.debug("Debug", data)                    // Log debug info

// HTTP Requests
fetch("https://api.example.com/data")           // Make HTTP request
  .then(res => res.json())
  .then(data => console.log(data))

// Crypto (JavaScript)
crypto.createHash("sha256").update(data).digest("hex")  // Hash data
crypto.randomBytes(32).toString("hex")          // Generate random bytes

// JSON
JSON.parse(jsonString)                          // Parse JSON
JSON.stringify(object)                          // Stringify object

// URL Parsing
const url = new URL("https://example.com/path?q=1")
url.searchParams.get("q")                       // Get query param
url.searchParams.set("q", "2")                  // Set query param

// Base64
Buffer.from("text").toString("base64")          // Encode to base64
Buffer.from("base64string", "base64").toString() // Decode from base64

// Regex
const match = "text".match(/pattern/)           // Match regex
const replaced = "text".replace(/pattern/, "new") // Replace regex
```

##### Python API

```python
# Flow Properties
flow.id                    # Unique flow ID (str)
flow.type                  # Flow type: "http", "tcp", "udp", "websocket"
flow.timestamp_created     # Creation timestamp (float)
flow.modified()            # Check if flow was modified (bool)
flow.intercepted           # Check if flow is intercepted (bool)

# Request Object
flow.request.method        # HTTP method (str)
flow.request.url           # Full request URL (str)
flow.request.headers       # Request headers (dict)
flow.request.content       # Request body content (bytes)
flow.request.text          # Request body as text (str)
flow.request.json          # Request body as JSON (dict)

# Response Object
flow.response.status_code  # HTTP status code (int)
flow.response.headers      # Response headers (dict)
flow.response.content      # Response body content (bytes)
flow.response.text         # Response body as text (str)
flow.response.json         # Response body as JSON (dict)

# Modification
flow.request.method = "POST"
flow.request.headers["X-Custom"] = "value"
flow.request.content = b"new body"
flow.request.json = {"key": "value"}
flow.intercept()
flow.kill()
flow.resume()

# Python Utilities
import json
import hashlib
import base64
import re
import requests

json.loads(flow.request.text)
hashlib.sha256(flow.request.content).hexdigest()
base64.b64encode(flow.request.content)
re.match(r"pattern", flow.request.path)
requests.get("https://api.example.com")
```

##### Example Scripts

**Example 1: Add Authentication Header**
```javascript
// Trigger: request
if (flow.request.host === "api.example.com") {
    flow.request.headers["Authorization"] = "Bearer " + getToken();
}
```

**Example 2: Modify JSON Request Body**
```javascript
// Trigger: request
if (flow.request.headers["content-type"]?.includes("json")) {
    const body = flow.request.json;
    body.userId = "12345";
    body.timestamp = Date.now();
    flow.request.json = body;
}
```

**Example 3: Block Specific URLs**
```javascript
// Trigger: request
const blockedPatterns = [/\/admin/, /\/private/];
if (blockedPatterns.some(pattern => pattern.test(flow.request.path))) {
    flow.kill();
    console.log("Blocked:", flow.request.url);
}
```

**Example 4: Modify Response Based on Status**
```javascript
// Trigger: response
if (flow.response.status_code >= 500) {
    flow.response.status_code = 200;
    flow.response.json = {error: false, message: "Handled server error"};
}
```

**Example 5: Rate Limiting**
```javascript
// Trigger: request
const rateLimiter = new Map();
const maxRequests = 10;
const windowMs = 60000; // 1 minute

const key = flow.client_conn.address[0];
const now = Date.now();
const requests = rateLimiter.get(key) || [];
const recent = requests.filter(time => now - time < windowMs);

if (recent.length >= maxRequests) {
    flow.kill();
    console.log("Rate limit exceeded for", key);
} else {
    recent.push(now);
    rateLimiter.set(key, recent);
}
```

##### Additional Advanced API Functions

```javascript
// Flow Comparison and Analysis
flow.compare(otherFlow)                    // Compare two flows (returns diff object)
flow.getDuration()                         // Get flow duration in milliseconds
flow.getSize()                             // Get total flow size in bytes
flow.isSecure()                            // Check if flow uses HTTPS/TLS
flow.getDomain()                           // Extract domain from URL
flow.getPath()                             // Extract path from URL
flow.getQueryParams()                      // Get query parameters as object
flow.setQueryParam(key, value)             // Set query parameter
flow.removeQueryParam(key)                 // Remove query parameter

// Request/Response Helpers
flow.request.clone()                       // Clone request for modification
flow.response.clone()                      // Clone response for modification
flow.request.addHeader(name, value)        // Add header (alternative syntax)
flow.request.removeHeader(name)            // Remove header (alternative syntax)
flow.request.hasHeader(name)               // Check if header exists
flow.request.getHeader(name)               // Get header value
flow.response.addHeader(name, value)       // Add response header
flow.response.removeHeader(name)           // Remove response header
flow.response.hasHeader(name)              // Check if response header exists
flow.response.getHeader(name)              // Get response header value

// Body Manipulation
flow.request.setBody(text, contentType)    // Set body with content type
flow.request.appendBody(text)              // Append to body
flow.request.prependBody(text)             // Prepend to body
flow.response.setBody(text, contentType)   // Set response body with content type
flow.response.appendBody(text)             // Append to response body
flow.response.prependBody(text)            // Prepend to response body

// JSON Helpers
flow.request.getJSON()                     // Get JSON (returns null if invalid)
flow.request.setJSON(obj)                  // Set JSON body
flow.request.updateJSON(updater)           // Update JSON with function
flow.response.getJSON()                    // Get response JSON
flow.response.setJSON(obj)                 // Set response JSON
flow.response.updateJSON(updater)          // Update response JSON

// URL Manipulation
flow.request.setURL(url)                   // Set full URL
flow.request.setPath(path)                 // Set path only
flow.request.setHost(host)                 // Set host only
flow.request.setPort(port)                 // Set port only
flow.request.setScheme(scheme)             // Set scheme (http/https)
flow.request.buildURL()                    // Build URL from components

// Headers Manipulation
flow.request.setHeaders(headers)           // Set all headers (object)
flow.request.mergeHeaders(headers)         // Merge headers (object)
flow.request.removeHeaders(names)          // Remove multiple headers (array)
flow.response.setHeaders(headers)          // Set all response headers
flow.response.mergeHeaders(headers)        // Merge response headers
flow.response.removeHeaders(names)         // Remove multiple response headers

// Content Type Helpers
flow.request.getContentType()              // Get content type
flow.request.setContentType(type)          // Set content type
flow.request.isJSON()                      // Check if content is JSON
flow.request.isXML()                       // Check if content is XML
flow.request.isFormData()                  // Check if content is form data
flow.response.getContentType()             // Get response content type
flow.response.setContentType(type)         // Set response content type
flow.response.isJSON()                     // Check if response is JSON
flow.response.isXML()                      // Check if response is XML

// Status Code Helpers
flow.response.isSuccess()                  // Check if status is 2xx
flow.response.isRedirect()                 // Check if status is 3xx
flow.response.isClientError()              // Check if status is 4xx
flow.response.isServerError()              // Check if status is 5xx
flow.response.setSuccess(data)             // Set 200 OK with JSON data
flow.response.setError(code, message)      // Set error response
flow.response.setRedirect(url, code)       // Set redirect response

// Flow State Management
flow.save()                                // Save flow state
flow.revert()                              // Revert to original state
flow.getOriginal()                         // Get original flow (before modifications)
flow.isModified()                          // Check if flow was modified
flow.getModifications()                    // Get list of modifications made

// Flow Metadata
flow.addTag(tag)                           // Add tag to flow
flow.removeTag(tag)                        // Remove tag from flow
flow.hasTag(tag)                           // Check if flow has tag
flow.getTags()                             // Get all tags
flow.setComment(comment)                   // Set flow comment
flow.getComment()                          // Get flow comment
flow.setMarker(marker)                     // Set flow marker (emoji)
flow.getMarker()                           // Get flow marker

// Flow Actions
flow.duplicate()                           // Duplicate flow
flow.replay()                              // Replay flow
flow.replayModified()                      // Replay with modifications
flow.export(format)                        // Export flow (json, har, curl)
flow.import(data, format)                  // Import flow data

// Connection Helpers
flow.getClientIP()                         // Get client IP address
flow.getServerIP()                         // Get server IP address
flow.getClientPort()                       // Get client port
flow.getServerPort()                       // Get server port
flow.isTLS()                               // Check if connection uses TLS
flow.getTLSVersion()                       // Get TLS version
flow.getCipherSuite()                      // Get cipher suite
flow.getCertificate()                      // Get server certificate

// Timing and Performance
flow.getRequestTime()                      // Get request timestamp
flow.getResponseTime()                      // Get response timestamp
flow.getTotalTime()                        // Get total flow time
flow.getRequestDuration()                  // Get request duration
flow.getResponseDuration()                 // Get response duration
flow.getServerDuration()                   // Get server processing time

// Pattern Matching and Validation
flow.request.matches(pattern)              // Check if request matches pattern
flow.response.matches(pattern)             // Check if response matches pattern
flow.matches(pattern)                      // Check if flow matches pattern
flow.request.validate()                    // Validate request
flow.response.validate()                   // Validate response

// Transformation Helpers
flow.request.transform(transformer)        // Transform request with function
flow.response.transform(transformer)       // Transform response with function
flow.transform(transformer)                // Transform entire flow

// Utility Functions (Global)
// String Utilities
String.prototype.base64Encode()            // Encode string to base64
String.prototype.base64Decode()            // Decode base64 string
String.prototype.urlEncode()               // URL encode string
String.prototype.urlDecode()               // URL decode string
String.prototype.htmlEncode()              // HTML encode string
String.prototype.htmlDecode()              // HTML decode string
String.prototype.jsonEscape()              // JSON escape string
String.prototype.sha256()                  // SHA-256 hash
String.prototype.md5()                     // MD5 hash
String.prototype.sha1()                    // SHA-1 hash

// Array Utilities
Array.prototype.unique()                   // Remove duplicates
Array.prototype.shuffle()                  // Shuffle array
Array.prototype.groupBy(key)               // Group by key
Array.prototype.sortBy(key)                // Sort by key

// Object Utilities
Object.deepClone(obj)                      // Deep clone object
Object.deepMerge(obj1, obj2)               // Deep merge objects
Object.flatten(obj)                        // Flatten nested object
Object.pick(obj, keys)                     // Pick specific keys
Object.omit(obj, keys)                     // Omit specific keys

// Date Utilities
Date.now()                                 // Current timestamp
Date.fromTimestamp(ts)                     // Create date from timestamp
Date.format(format)                        // Format date string
Date.addDays(days)                         // Add days to date
Date.addHours(hours)                       // Add hours to date

// Network Utilities
fetch(url, options)                        // Make HTTP request
fetch.get(url, options)                    // GET request
fetch.post(url, data, options)             // POST request
fetch.put(url, data, options)              // PUT request
fetch.delete(url, options)                 // DELETE request
fetch.patch(url, data, options)            // PATCH request

// Crypto Utilities
crypto.randomString(length)                // Generate random string
crypto.randomBytes(length)                 // Generate random bytes
crypto.hash(data, algorithm)               // Hash data
crypto.hmac(data, key, algorithm)          // HMAC hash
crypto.encrypt(data, key, algorithm)       // Encrypt data
crypto.decrypt(data, key, algorithm)       // Decrypt data
crypto.generateKey(algorithm)              // Generate encryption key

// Regex Utilities
RegExp.matchAll(text, pattern)             // Match all occurrences
RegExp.replaceAll(text, pattern, repl)     // Replace all occurrences
RegExp.escape(text)                        // Escape regex special chars

// Validation Utilities
validate.email(email)                      // Validate email
validate.url(url)                          // Validate URL
validate.ip(ip)                            // Validate IP address
validate.json(json)                        // Validate JSON
validate.xml(xml)                          // Validate XML

// Storage Utilities (Persistent across script executions)
storage.set(key, value)                    // Set value in storage
storage.get(key)                           // Get value from storage
storage.remove(key)                        // Remove value from storage
storage.clear()                            // Clear all storage
storage.keys()                             // Get all keys
storage.has(key)                           // Check if key exists

// Logging Utilities
logger.log(level, message, data)           // Log with level
logger.debug(message, data)                // Debug log
logger.info(message, data)                 // Info log
logger.warn(message, data)                 // Warning log
logger.error(message, data)                // Error log
logger.trace(message, data)                // Trace log

// Performance Utilities
performance.start(name)                    // Start performance timer
performance.end(name)                      // End performance timer
performance.measure(name)                  // Get performance measurement
performance.memory()                       // Get memory usage
performance.cpu()                          // Get CPU usage
```

---

#### 11. Body Editor with Syntax Highlighting

**Description**: Monaco Editor integration with syntax highlighting, auto-formatting, validation, and search/replace.

**Features**:
- Syntax highlighting for JSON, XML, HTML, JavaScript, etc.
- Auto-formatting (prettify)
- JSON validation
- Search and replace
- Line numbers
- Code folding
- Multiple view modes (raw, formatted, hex)
- Undo/redo

**Customization Options**:
- Choose editor theme
- Configure syntax highlighting
- Set auto-formatting rules
- Enable/disable features
- Customize editor font and size

**Usage**:
1. Open any flow in the **Flow** tab
2. Click on request or response body
3. Use the Monaco editor to edit content
4. Use syntax highlighting and auto-formatting
5. Save changes

---

### 🔒 Security & Testing

#### 12. Security Testing Suite

**Description**: Test for SQL injection, XSS, CSRF, authentication bypass, header security, and SSL/TLS configuration.

**Features**:
- SQL injection testing
- XSS testing
- CSRF token validation
- Authentication bypass attempts
- Header security analysis (CORS, CSP, etc.)
- SSL/TLS configuration checker
- Automated security scan reports

**Customization Options**:
- Select which tests to run (SQL injection, XSS, CSRF, auth bypass, headers, SSL/TLS)
- **Test Mode**: Single flow or batch testing
- **Test Timeout**: Set timeout per test (5-300 seconds)
- **Concurrent Tests**: Number of parallel tests (1-20)
- **Severity Filter**: Filter results by severity (all, high, medium, low)
- **Stop on First Vulnerability**: Halt testing when first issue found
- **Scan Depth**: Configure depth of security scan
- **Custom Payloads**: Add custom test payloads per test type
- Export test results (JSON, HTML)

**Usage**:
1. Navigate to the **Security** tab
2. Select a flow or choose batch mode
3. Select tests to run
4. Click "Run Security Tests"
5. Review results and recommendations
6. Export report if needed

---

#### 13. Certificate Management

**Description**: Import custom CAs, detect certificate pinning, bypass pinning, view certificate chains, and expiration warnings.

**Features**:
- Import custom CA certificates
- Certificate pinning detection
- Bypass certificate pinning (where possible)
- Certificate expiration warnings
- Certificate chain visualization
- Export certificates
- Per-domain certificate configuration

**Customization Options**:
- Import custom certificates
- Configure certificate pinning bypass
- Set expiration warning thresholds
- Choose which certificates to display
- Export certificate configurations

**Usage**:
1. Navigate to the **Security** tab
2. Open **Certificate Management**
3. Import custom certificates
4. View certificate chains
5. Configure pinning bypass

---

#### 14. Authentication Testing Tools

**Description**: Extract tokens, decode/edit JWTs, visualize OAuth flows, test token rotation, and MFA testing.

**Features**:
- Session token extraction
- JWT token decoder/editor
- OAuth flow visualization
- Authentication replay
- Token rotation testing
- Multi-factor authentication testing

**Customization Options**:
- Configure token extraction patterns
- Set JWT decoding options
- Visualize OAuth flows
- Test token rotation scenarios
- Configure MFA testing

**Usage**:
1. Navigate to the **Security** tab
2. Open **Authentication Testing**
3. Extract tokens from flows
4. Decode and edit JWTs
5. Visualize OAuth flows

---

### 🌐 Network & Protocol Support

#### 15. WebSocket Message Interception

**Description**: Full WebSocket support with message interception, modification, injection, filtering, and replay.

**Features**:
- Intercept WebSocket messages (both directions)
- Modify message content
- Inject messages
- Message filtering
- WebSocket connection details
- Message history
- Replay WebSocket messages

**Customization Options**:
- Configure message interception rules
- Set up message filters
- Configure injection patterns
- Choose which messages to log
- Set up message replay rules

**Usage**:
1. Navigate to the **Flow** tab
2. Select a WebSocket flow
3. View messages in the WebSocket tab
4. Modify or inject messages
5. Replay messages as needed

---

#### 16. gRPC/Protobuf Enhanced Support

**Description**: Visual protobuf editor, import .proto files, auto-decode messages, type-safe editing, and stream handling.

**Features**:
- Visual protobuf message editor
- Import .proto files
- Auto-decode protobuf messages
- Edit protobuf fields with type safety
- gRPC method call visualization
- Stream message handling

**Customization Options**:
- Import .proto files
- Configure protobuf decoding
- Set up type-safe editing
- Visualize gRPC methods
- Handle stream messages

**Usage**:
1. Navigate to the **Flow** tab
2. Select a gRPC/Protobuf flow
3. Open the **Protobuf** tab
4. Import .proto files if needed
5. Edit protobuf fields with type safety

---

#### 17. HTTP/3 and QUIC Support

**Description**: Full HTTP/3 interception, QUIC connection details, stream visualization, and message modification.

**Features**:
- HTTP/3 interception
- QUIC connection details
- QUIC stream visualization
- HTTP/3 message modification

**Customization Options**:
- Configure HTTP/3 interception
- View QUIC connection details
- Visualize QUIC streams
- Modify HTTP/3 messages

**Usage**:
1. HTTP/3 flows are automatically detected
2. View QUIC connection details in flow view
3. Visualize streams in the timeline
4. Modify messages as needed

---

### 🎨 UI/UX & Workflow

#### 18. Customizable Dashboard

**Description**: Drag-and-drop widgets, save layouts, export/import configurations with stats, charts, flow lists, and filters.

**Features**:
- Drag-and-drop widget layout
- Widget types: stats, charts, flow list, filters
- Save multiple dashboard layouts
- Export/import dashboard configs
- Fullscreen mode for widgets

**Customization Options**:
- Add/remove widgets
- Resize widgets
- Reposition widgets
- Save multiple layouts
- Export/import configurations
- Choose widget types and data sources

**Usage**:
1. Navigate to the **Dashboard** tab
2. Click widget buttons to add widgets
3. Drag widgets to reposition
4. Resize widgets by dragging corners
5. Save layout for future use

---

#### 19. Keyboard Shortcuts & Macros

**Description**: Custom shortcuts, macro recording/playback, conflict detection, and shareable macros.

**Features**:
- Define custom keyboard shortcuts
- Record macros (sequences of actions)
- Playback macros
- Share macros
- Shortcut conflict detection

**Customization Options**:
- Create custom shortcuts
- Record macro sequences
- Configure macro playback
- Share macros with others
- Detect shortcut conflicts

**Usage**:
1. Navigate to **Options** > **Keyboard Shortcuts**
2. Create custom shortcuts
3. Record macros for repetitive tasks
4. Playback macros as needed

---

#### 20. Flow Bookmarks & Tags

**Description**: Bookmark important flows, organize with tags, filter by tags, export bookmarked flows.

**Features**:
- Bookmark flows
- Add tags to flows
- Filter by bookmarks/tags
- Tag management (create, edit, delete)
- Export bookmarked flows
- Tag-based organization

**Customization Options**:
- Create custom tags
- Organize flows with tags
- Filter by bookmarks or tags
- Export bookmarked flows
- Configure tag colors

**Usage**:
1. Select a flow in the **Flow** tab
2. Click the bookmark icon to bookmark
3. Add tags using the tag editor
4. Filter flows by tags in the flow list

---

#### 21. Dark Mode Auto-Switch

**Description**: Follow system preference or schedule theme changes with smooth transitions between 10 beautiful themes.

**Features**:
- Follow system dark mode preference
- Schedule theme changes (e.g., dark at night)
- Smooth transitions
- Per-user preference
- 10 beautiful themes available

**Customization Options**:
- Choose from 10 themes
- Enable auto-switch based on system preference
- Schedule theme changes
- Configure transition animations

**Usage**:
1. Click the **Theme** button in the top-right
2. Choose a theme
3. Enable auto-switch if desired
4. Configure schedule if needed

---

### 📤 Export & Integration

#### 22. Advanced Export Options

**Description**: Export to Postman, Insomnia, OpenAPI/Swagger, HAR, custom templates, batch export, and scheduled exports.

**Features**:
- Export to Postman collection
- Export to Insomnia
- Export to OpenAPI/Swagger
- Custom export templates
- Batch export with filters
- Export flow relationships
- Scheduled exports

**Customization Options**:
- Choose export format
- Configure export templates
- Set up batch exports
- Schedule automatic exports
- Filter flows before export

**Usage**:
1. Navigate to the **Tools** tab
2. Select "Advanced Export"
3. Choose export format
4. Select flows to export
5. Configure export options
6. Export flows

---

#### 23. API for External Tools

**Description**: REST API endpoints, WebSocket API, authentication, OpenAPI docs, rate limiting, and webhook support.

**Features**:
- REST API endpoints
- WebSocket API for real-time updates
- API authentication
- API documentation (OpenAPI)
- Rate limiting
- Webhook support

**Customization Options**:
- Configure API authentication
- Set up rate limiting
- Configure webhooks
- Customize API endpoints
- Generate API documentation

**Usage**:
1. Access API documentation at `/api/docs`
2. Use REST API endpoints for automation
3. Connect via WebSocket for real-time updates
4. Configure authentication and rate limiting

---

### 🧪 Testing & Quality

#### 24. Automated Testing Framework

**Description**: Create test cases from flows, assertion builder, test execution, reports, and CI/CD integration.

**Features**:
- Create test cases from flows
- Assertion builder
- Test execution
- Test reports
- CI/CD integration
- Test data management

**Customization Options**:
- Create custom test cases
- Build assertions
- Configure test execution
- Set up CI/CD integration
- Manage test data

**Usage**:
1. Navigate to the **Testing** tab
2. Create test cases from flows
3. Build assertions
4. Execute tests
5. Review test reports

---

#### 25. Interactive Tutorials

**Description**: Step-by-step tutorials with interactive examples, progress tracking, and contextual help.

**Features**:
- Step-by-step tutorials
- Interactive examples
- Progress tracking
- Contextual help
- Video tutorials integration

**Customization Options**:
- Choose tutorial topics
- Track progress
- Skip completed tutorials
- Access contextual help

**Usage**:
1. Navigate to the **Help** tab
2. Select "Interactive Tutorials"
3. Choose a tutorial
4. Follow step-by-step instructions
5. Track your progress

---

#### 26. Contextual Help System

**Description**: Comprehensive help topics, search functionality, video links, and example flows.

**Features**:
- Tooltips with explanations
- Help panels
- Searchable help
- Video links
- Example flows

**Customization Options**:
- Search help topics
- Access contextual help
- View example flows
- Watch video tutorials

**Usage**:
1. Navigate to the **Help** tab
2. Search for help topics
3. Access contextual help throughout the UI
4. View example flows and videos

---

### 🚀 Workflow & Automation

#### 27. Flow Templates

**Description**: Save and reuse flow templates with variables, template library, and sharing.

**Features**:
- Create templates from flows
- Template library
- Apply templates to new flows
- Template variables
- Share templates

**Customization Options**:
- Create custom templates
- Define template variables
- Organize template library
- Share templates with others

**Usage**:
1. Select a flow in the **Flow** tab
2. Click "Save as Template"
3. Define template variables
4. Apply templates to new flows

---

#### 28. Automated Response Generation

**Description**: Generate mock responses based on request patterns, templates, dynamic generation, and pattern matching.

**Features**:
- Auto-generate responses
- Response templates
- Dynamic response generation
- Pattern matching
- Response library

**Customization Options**:
- Configure response templates
- Set up pattern matching
- Customize response generation
- Manage response library

**Usage**:
1. Navigate to the **Mock** tab
2. Enable auto-generation
3. Configure patterns
4. Responses are automatically generated

---

#### 29. Create Request Feature

**Description**: Build and send custom HTTP requests with templates, import/export, and request history.

**Features**:
- Build custom HTTP requests
- Request templates
- Import/export requests
- Request history
- Multiple body types (JSON, form, XML, raw)

**Customization Options**:
- Create custom requests
- Save request templates
- Import/export requests
- View request history
- Configure request options

**Usage**:
1. Navigate to the **Request Builder** tab
2. Build your request
3. Configure headers and body
4. Send request
5. View response and history

---

#### 30. Fake Response Creator (Mock Responses)

**Description**: Build fake responses with templates, apply to flows, pattern matching, and response library. **This feature actually intercepts real requests and sends fake responses instead of forwarding to the real server.**

**Features**:
- Create mock responses with custom status codes, headers, and body
- URL pattern matching (regex, exact, contains)
- Priority-based matching (higher priority mocks are matched first)
- Response delay simulation
- Condition-based matching (method, headers, body)
- Enable/disable individual mocks
- Block real requests when mock is active

**Customization Options**:
- **Pattern Matching**: Choose match mode (regex, exact, contains)
- **Priority**: Set priority (higher = matched first)
- **Delay**: Simulate network delay (milliseconds)
- **Conditions**: Add conditions (method, headers, body) with operators (equals, contains, matches)
- **Status Code**: Custom HTTP status codes
- **Headers**: Custom response headers
- **Body**: Custom response body (JSON, HTML, XML, text, raw)
- **Enable/Disable**: Toggle individual mocks on/off

**Usage**:
1. Navigate to the **Mock** tab
2. Click "Create Mock Response"
3. Configure:
   - **Name**: Descriptive name for the mock
   - **URL Pattern**: Pattern to match (supports regex, exact, or contains)
   - **Match Mode**: Choose how to match the pattern
   - **Priority**: Set priority (higher = matched first)
   - **Status Code**: HTTP status code to return
   - **Headers**: Response headers
   - **Body**: Response body content
   - **Body Type**: JSON, HTML, XML, text, or raw
   - **Delay**: Optional delay in milliseconds
   - **Conditions**: Optional conditions (method, headers, body)
4. Enable the mock response
5. When a request matches the pattern, the mock response is sent instead of forwarding to the real server

**Backend Configuration**:
The mock responses addon supports additional configuration options:
- `mock_responses_enabled`: Enable/disable mock response interception globally
- `mock_responses_match_mode`: Default match mode (regex, exact, contains)
- `mock_responses_priority_order`: How to order mocks when multiple match (first, priority, last)
- `mock_responses_block_real`: Block real requests when mock is active (default: true)
- `mock_responses_log`: Log mock response interceptions (default: true)

**Example**:
Create a mock response that intercepts all requests to `api.example.com` and returns a fake 200 response with JSON body:
- **Name**: "Fake API Response"
- **Pattern**: `.*api\.example\.com/.*`
- **Match Mode**: regex
- **Priority**: 10
- **Status Code**: 200
- **Body**: `{"message": "This is a fake response", "timestamp": "2024-01-01T00:00:00Z"}`
- **Body Type**: json
- **Enabled**: true

When any application makes a request to `api.example.com`, BetterMITM will intercept it and return your fake response instead of forwarding to the real server.

---

#### 31. Enhanced Flow Management

**Description**: Advanced filtering, sorting, search, bulk operations, and flow organization tools.

**Features**:
- Advanced filtering by type, domain, method, status code, etc.
- Sorting by various criteria
- Search functionality
- Bulk operations (delete, export, tag, etc.)
- Flow organization tools

**Customization Options**:
- Configure filters
- Set up sorting rules
- Customize search
- Configure bulk operations
- Organize flows

**Usage**:
1. Navigate to the **Flow** tab
2. Use filters to narrow down flows
3. Sort flows by various criteria
4. Search for specific flows
5. Perform bulk operations

---

## 🎨 Themes

BetterMITM includes 10 beautiful themes:

1. **Light** - Clean, bright interface
2. **Dark** - Easy on the eyes
3. **Blue** - Professional blue theme
4. **Purple** - Vibrant purple theme
5. **Green** - Fresh green theme
6. **Red** - Bold red theme
7. **Orange** - Warm orange theme
8. **Cyber** - Futuristic cyber theme
9. **Midnight** - Deep dark theme
10. **Ocean** - Calming ocean theme

Switch themes using the **Theme** button in the top-right corner. Your preference is saved automatically.

---

## 🔧 Advanced Configuration

### Command-Line Options

BetterMITM supports all standard mitmproxy command-line options plus additional ones:

```bash
# Start with custom ports
uv run python -m BetterMITM.tools.main mitmweb --set web_port=8081 --mode regular@8082

# Enable advanced interceptor
uv run python -m BetterMITM.tools.main mitmweb --set advanced_intercept_enabled=true

# Configure mock responses
uv run python -m BetterMITM.tools.main mitmweb --set mock_responses_enabled=true
```

### Configuration Files

BetterMITM uses the same configuration system as mitmproxy. Configuration files are located in:
- **Windows**: `%APPDATA%\BetterMITM\`
- **Linux/MacOS**: `~/.config/BetterMITM/`

---

## 🐛 Troubleshooting

### "uv: command not found"

Install `uv` using:
```bash
# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Linux/MacOS
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### "npm: command not found"

Install Node.js from [nodejs.org](https://nodejs.org/).

### Build fails

1. Delete `node_modules` and `package-lock.json` in the `web` directory
2. Run `npm install` again
3. Try building again

### Certificate issues

1. Install the CA certificate from `http://mitm.it`
2. Trust the certificate in system settings
3. Some apps use certificate pinning and cannot be intercepted

### Mock responses not working

1. Ensure mock responses are enabled in settings
2. Check that the URL pattern matches your requests
3. Verify the mock response is enabled
4. Check the match mode (regex, exact, contains)
5. Review priority settings if multiple mocks match

---

## 📖 Additional Resources

- **GitHub**: [github.com/BetterMint/BetterMITM](https://github.com/BetterMint/BetterMITM)
- **Discord**: Join our Discord server for support and discussions
- **Issues**: Report bugs or request features on GitHub

---

## 📄 License

BetterMITM is based on mitmproxy and follows the same MIT license. See the LICENSE file for details.

---

## 🙏 Credits

BetterMITM is a fork of [mitmproxy](https://mitmproxy.org/), an excellent open-source HTTP proxy tool. We extend our gratitude to the mitmproxy team and community for their excellent work.
