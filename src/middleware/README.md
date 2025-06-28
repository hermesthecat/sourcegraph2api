# `middleware` Folder

This folder contains all Express middleware functions. Middleware are functions that have access to the request object (`req`), the response object (`res`), and the `next` function in the application's request-response cycle. They are used to implement cross-cutting concerns such as logging, authentication, security, and error handling.

## Files

### `index.ts`

This is the main file that exports the core middleware stack used globally in the application. These middlewares are applied in sequence to every incoming request.

* `requestId`: Assigns a unique UUID to every incoming request and adds it to `req.requestId` and the `X-Request-ID` response header. This is crucial for tracing and debugging.
* `requestLogger`: Logs the details of every incoming request and its corresponding response. It records the method, URL, status code, response time, and IP address.
* `corsMiddleware`: Manages Cross-Origin Resource Sharing (CORS) settings, defining which origins, methods, and headers are allowed.
* `securityMiddleware`: Implements basic security by applying various HTTP headers using the `helmet` library.
* `compressionMiddleware`: Compresses response bodies for most requests, but intelligently skips compression for Server-Sent Events (`text/event-stream`) to avoid issues with streaming.
* `rateLimitMiddleware`: Protects the API from brute-force or denial-of-service attacks by limiting the number of requests an IP address can make in a given time frame. The limit is dynamically loaded from the application `config`.
* `ipBlacklistMiddleware`: Blocks requests from IP addresses that are listed in the dynamically configured IP blacklist.
* `errorHandler`: A global, catch-all error handler that runs at the end of the middleware stack. It logs any unhandled errors and sends a generic 500 Internal Server Error response to the client.
* `notFoundHandler`: This middleware runs if no other route has matched the request. It logs the 404 event and returns a standard JSON 404 Not Found error.

### `auth.ts`

This file contains specialized middleware for handling authentication and authorization.

* `openaiAuth`: This middleware is designed to protect the main API endpoints (like `/v1/chat/completions`). It validates the `Authorization` header, expecting a Bearer token. It checks the provided token against the `api_keys` table in the database using the `isValidActiveApiKey` service. If the key is valid and active, it attaches the key's information to the request object (`req.apiKeyId`) for use in other parts of the application (e.g., for metrics).
* `isAuthenticated`: This middleware is used to protect the admin panel web routes. It integrates with `passport.js` to check if a user has an active session (i.e., is logged in). If the user is not authenticated, it redirects them to the `/login` page with an error message.
