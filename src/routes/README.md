# Routes Folder

This folder defines the routing layer of the Express.js application. It directs incoming HTTP requests to the relevant controller functions based on specific URL paths (endpoints). It also applies middleware for specific paths.

## Responsibilities

* **Defining URL Paths:** Defines the application's API endpoints (e.g., `/v1/chat/completions`, `/admin/dashboard`) and which HTTP methods (GET, POST, etc.) can be used to access these paths.
* **Directing Controllers:** Connects an incoming request to the relevant controller function that will execute the business logic.
* **Applying Middleware:** Applies middleware such as authentication (`openaiAuth`) and authorization (`isAuthenticated`) for specific paths or groups of paths.
* **Path Grouping:** Organizes related paths into modular groups using `Express.Router` (e.g., `adminRouter`, `v1Router`).

## Files

### `main.ts`

This file creates and configures the application's main router.

* `createApiRouter`: Creates the main router object and connects all sub-routes (API, admin, health check, etc.) to it.
  * **Root (`/`) and Health Check (`/health`) Routes:** Defines general information about the application and health status endpoints.
  * **Authentication Routes (`/login`, `/logout`):** Manages user login and logout operations for the admin panel. Integrated with `passport.js`.
  * **Admin Panel (`/admin`):** Redirects all requests with the `/admin` prefix to the `adminRouter` defined in `admin.routes.ts`.
  * **V1 API Routes (`/v1`):** Defines the main OpenAI-compatible API routes (`/chat/completions`, `/models`) with the `/v1` prefix. These routes are protected by the `openaiAuth` middleware.
  * **Metric Routes (`/metrics`):** Contains endpoints that provide information about application performance and statistics.
* `setupRoutes`: Connects the main router created by `createApiRouter` to the main Express `app` object.
* `processRoutePrefix`: Processes the `routePrefix` value from `config` (now dynamically loaded from the database) to allow API routes to be served under a custom prefix.

### `admin.routes.ts`

Contains all routes required for the admin panel interface. All of these routes are protected by middleware that requires the user to be logged in.

* **Dashboard (`/dashboard`):** Renders the main panel page showing general statistics, usage graphs, and model usage rates.
* **Cookie Management (`/cookies`):** Includes routes that manage CRUD (Create, Read, Update, Delete) operations for listing, adding, editing, deleting, and changing the active/inactive status of cookies.
* **API Key Management (`/apikeys`):** Includes CRUD routes for listing, creating, deleting, and changing the status of API keys.
* **User Management (`/users`):** Includes routes for listing, adding, updating, and deleting users who can access the admin panel.
* **Usage Metrics (`/metrics`):** Provides a page displaying API usage logs with pagination.
* **Settings (`/settings`):** Provides an interface for viewing and updating the application's dynamic settings (e.g., `sessionSecret`, `requestRateLimit`, `userAgent`, `sourcegraphBaseUrl`).
* **Flash Messages:** Uses `connect-flash` and session-based middleware to display informational messages after user operations (e.g., "Cookie added successfully").

### `index.ts`

Exports the `createApiRouter` and `setupRoutes` functions from `main.ts`, allowing higher-level modules like `app.ts` to access these functions cleanly.
