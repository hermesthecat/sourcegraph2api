# `routes` Folder

This folder defines the application's routing, mapping specific URL endpoints to their corresponding controller functions. It acts as the "switchboard" of the application, directing incoming requests to the appropriate logic.

## Files

### `main.ts`

This file creates and configures the main router for the application. It orchestrates all the different routing segments.

* **Public Routes**: Defines routes that do not require authentication, such as:
  * `GET /`: The root endpoint providing basic API information.
  * `GET /health` and `GET /health/detailed`: Publicly accessible health check endpoints.
* **Authentication Routes**: Handles the web-based login/logout for the admin panel.
  * `GET /login`: Renders the login page.
  * `POST /login`: Processes the login form submission using Passport.js for authentication.
  * `GET /logout`: Handles the user logout process.
* **V1 API Routes**: Defines the core, OpenAI-compatible API endpoints under the `/v1` path prefix.
  * All `/v1` routes are protected by the `openaiAuth` middleware, which requires a valid Bearer token (API key).
  * Routes include `POST /v1/chat/completions` and `GET /v1/models`.
* **Admin Router Integration**: It mounts the `adminRouter` (defined in `admin.routes.ts`) under the `/admin` path. This means all routes defined in `adminRouter` will be prefixed with `/admin`.
* **Route Prefixing**: It dynamically applies a global route prefix (e.g., `/api`) from the application configuration to the `/v1` routes.
* **`setupRoutes`**: The main exported function that takes the Express `app` instance and applies the configured main router to it.

### `admin.routes.ts`

This file defines all the routes for the web-based administration panel.

* **Authentication**: A middleware at the top of this file ensures that **all** admin routes are protected. It uses the `isAuthenticated` middleware to check if a user is logged in. If not, it redirects them to the `/login` page.
* **CRUD Operations**: It defines routes for managing all the key database models:
  * **Cookies (`/cookies`)**: Routes to list, add, edit, update, delete, and toggle the status of Sourcegraph cookies.
  * **API Keys (`/apikeys`)**: Routes to list, add, delete, and toggle the status of API keys.
  * **Users (`/users`)**: Routes to list, add, edit, and delete admin panel users.
* **Dashboard and Settings**:
  * `GET /dashboard`: Fetches comprehensive statistics from the `statistics.service` and renders the main dashboard page with charts and tables.
  * `GET /settings` and `POST /settings`: Routes to display and update the application's dynamic settings.
  * `GET /metrics`: Renders a paginated view of all API usage logs from the `usage_metrics` table.
* **Rendering Views**: All `GET` routes in this file use `res.render()` to render the appropriate `.ejs` view template, passing in the data retrieved from the various services.

### `index.ts`

A simple barrel file that exports the `setupRoutes` function from `main.ts`. This provides a clean entry point for the main `app.ts` file to initialize all the application's routes.
