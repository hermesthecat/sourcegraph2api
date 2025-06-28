# Services Folder

This folder is the core of the application's business logic. It processes requests received by controllers, executes database operations, communicates with external APIs, and performs the application's fundamental functions. The service layer can be considered the "brain" of the application.

## Responsibilities

* **Database Interaction:** Performs Create, Read, Update, and Delete (CRUD) operations on the database using Sequelize models defined in the `models` folder.
* **External API Communication:** Manages communication with the Sourcegraph API, which is the main purpose of the application.
* **Business Logic:** Executes complex operations such as authentication, authorization, statistics calculation, and caching.
* **Data Processing:** Receives raw data and transforms it into meaningful information or statistics.

## Files

### Core Services

* **`database.ts`**: The foundation of the application.
  * **Sequelize Setup:** Creates a Sequelize instance using the `database.sqlite` file and manages the database connection.
  * **Migration Management:** Manages the database schema through migrations using the `Umzug` library instead of `sequelize.sync()`. This allows schema updates without data loss in the development environment.
  * **Session Store:** Creates a session store to save user sessions in the database using `connect-session-sequelize`.
  * **Default User:** Creates an `admin` user at the first startup if the database is empty.

* **`sourcegraph.ts`**: The most critical service, performing the application's main proxy function.
  * `SourcegraphClient`: Contains a class that manages requests to the Sourcegraph API.
  * **Request Transformation:** Converts incoming OpenAI-formatted requests into the format expected by Sourcegraph (`convertToSourcegraphFormat`).
  * **Cookie Pool:** Selects a random active cookie for each request via `cookie.service` to generate authentication headers (`Authorization`, `Cookie`).
  * **Streaming Requests:** Processes responses streamed from Sourcegraph and transmits them to the client using `axios` and Node.js `stream` modules.
  * **Dynamic Endpoints:** Dynamically retrieves values like `SOURCEGRAPH_BASE_URL` and `CHAT_ENDPOINT` from the `config` object, allowing them to be updated from the panel.
  * **Metric Recording:** Records the result of each successful or unsuccessful request to the database by calling `metric.service`.

* **`auth.service.ts`**: Manages admin panel authentication.
  * **Passport.js Setup:** Configures `LocalStrategy` which provides user login with username and password.
  * **Session Management:** Defines necessary functions for saving user information to the session (`serializeUser`) and reading it back from the session (`deserializeUser`).

* **`settings.service.ts`**: Manages the application's dynamic settings in the database.
  * `getEditableSettings`: Fetches settings to be displayed on the settings page in the admin panel from the database.
  * `updateSettings`: Saves updated settings from the admin panel to the database and instantly updates the `config` object.

### Data Management (CRUD) Services

These services provide standard CRUD operations on the `models` layer to process requests from the admin panel.

* **`apikey.service.ts`**: Manages API keys (`getAllApiKeys`, `addApiKey`, `deleteApiKey`, `toggleApiKeyStatus`). The `isValidActiveApiKey` function is used by the `openaiAuth` middleware.
* **`cookie.service.ts`**: Manages cookies (`getAllCookies`, `addCookie`, `deleteCookie`, `toggleCookieStatus`). The `getRandomActiveCookie` function is used by `sourcegraph.ts` for each request.
* **`user.service.ts`**: Manages admin panel users (`getAllUsers`, `addUser`, `deleteUser`, `updateUser`).

### Analytics and Statistics Services

* **`metric.service.ts`**: Performs database-based metric recording.
  * `recordUsage`: Records details of each API request (`ipAddress`, `model`, `wasSuccess`, etc.) to the `usage_metrics` table.
  * `getUsageMetrics`: Provides the ability to query recorded metrics with pagination and filtering (for the `/metrics` page in the admin panel).

* **`statistics.service.ts`**: Generates meaningful statistics from the data collected by `metric.service`.
  * Prepares data for the dashboard (`getGeneralStats`, `getCookieUsageStats`, `getModelUsageStats`, `getDailyUsageForChart`) using Sequelize's advanced querying capabilities such as `COUNT`, `SUM`, `GROUP BY` in the database.

### Helper Services

* **`cache.ts`**: Provides an in-memory caching mechanism.
  * `InMemoryCache`: Contains a class that supports TTL (Time-To-Live), maximum size, and LRU-like (Least Recently Used) eviction policies.
  * Creates multiple cache instances (`responseCache`, `modelCache`) for different purposes.
  * `SafeCache`: A wrapper around the original cache class that simplifies error handling.

* **`analytics.ts`**: An in-memory service that runs independently of the database and maintains real-time performance metrics (total requests, error rate, average response time, etc.). These metrics are reset when the application restarts.

* **`index.ts`**: Exports all services from a single point, allowing other modules to easily access services, and includes the `getServicesHealth` function which checks the overall health of the services.
