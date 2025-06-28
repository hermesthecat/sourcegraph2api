# Middleware Folder

This folder contains the "middleware" functions of the Express.js application. Middleware functions operate on the incoming request (`request`) and outgoing response (`response`) objects, sitting in the middle of the request/response cycle. This layer plays a critical role in managing "cross-cutting concerns" such as authentication, logging, security, and error handling.

## Responsibilities

* **Authentication and Authorization:** Checks whether incoming requests contain valid credentials (API key, session token, etc.).
* **Request Processing:** Performs operations such as assigning a unique ID to each request and logging request details.
* **Security:** Handles tasks like enforcing CORS (Cross-Origin Resource Sharing) policies, adding security headers (Helmet.js), limiting request rates, and blocking specific IP addresses. These settings are now dynamically managed from the database.
* **Performance:** Reduces network traffic by compressing responses (`compression`).
* **Error Handling:** Catches, logs, and returns error responses in a standard format to the client for errors occurring throughout the application.

## Files

### `auth.ts`

Contains all authentication-related middleware.

* `openaiAuth`: Checks the `Authorization` header in `Bearer <token>` format, compatible with the OpenAI API. It verifies whether the incoming API key is active via `apikey.service`. If successful, it adds `apiKey` and `apiKeyId` information to the request object (`req`).
* `isAuthenticated`: Used to protect web interface routes such as the admin panel. It checks if the user is logged in using Passport.js's `req.isAuthenticated()` method. Redirects unauthenticated users to the login page.
* `apiAuth` (`@deprecated`): An old authentication method that uses the `proxy-secret` header and is no longer intended for development.

### `index.ts`

Defines and exports various middleware used throughout the application.

* `requestId`: Assigns a unique UUID to each request, facilitating logging and tracking.
* `requestLogger`: Logs incoming requests and the status code, duration, etc., of completed responses.
* `corsMiddleware`: Sets up CORS settings that allow browsers to accept requests from different domains.
* `securityMiddleware`: Uses the `helmet` library to add various HTTP security headers to protect the application against known web vulnerabilities.
* `compressionMiddleware`: Compresses response bodies (JSON, HTML, etc.) for faster delivery to the client. It skips compression for SSE (Server-Sent Events) streams.
* `rateLimitMiddleware`: Limits the number of requests that can come from an IP address within a certain time interval, based on the `requestRateLimit` value obtained from `config` (database).
* `ipBlacklistMiddleware`: Blocks requests from IP addresses found in the `ipBlacklist` array obtained from `config` (database).
* `errorHandler`: This is the catch-all mechanism for errors that are triggered by `next(error)` or are uncaught anywhere in the application. It logs errors and returns a 500 Internal Server Error response.
* `notFoundHandler`: Returns a 404 Not Found response for requests that do not match any defined routes.
