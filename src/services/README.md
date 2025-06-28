# Services

This directory contains the core business logic of the application, encapsulated in various services. Each service is responsible for a specific domain, such as interacting with the database, managing authentication, or communicating with external APIs. This modular approach makes the codebase easier to maintain and test.

## Files

- **`sourcegraph.ts`**: Manages all interactions with the external Sourcegraph API. It is responsible for proxying requests, handling authentication with cookies, and selecting models. It uses the `metric.service` to log each request.

- **`database.ts`**: Handles the database connection using Sequelize. It initializes the database, runs migrations using `Umzug`, and sets up the session store.

- **`cookie.service.ts`**: Provides CRUD (Create, Read, Update, Delete) operations and other utility functions for managing the Sourcegraph cookies stored in the database.

- **`apikey.service.ts`**: Similar to `cookie.service.ts`, this service manages the API keys used to access the proxy. It includes functions for creating, deleting, toggling the status of, and validating API keys.

- **`user.service.ts`**: Manages CRUD operations for admin panel users. It includes logic for adding, deleting, and updating users, with special protections for the default 'admin' user.

- **`settings.service.ts`**: Manages dynamic application settings stored in the database. It provides functions to retrieve and update settings, which are then reflected in the live application configuration.

- **`metric.service.ts`**: Responsible for recording API usage logs into the database. It captures details like the IP address, API key, model used, and success status for each request.

- **`statistics.service.ts`**: Aggregates the raw data from `UsageMetric` to produce meaningful statistics and analytics for the admin dashboard. It calculates things like error rates, usage per cookie/API key, and daily request trends.

- **`analytics.ts`**: Implements an in-memory store for real-time application analytics. It tracks metrics like total requests, response times, and model usage, providing a quick overview of the application's health and performance without constant database queries.

- **`cache.ts`**: Provides a simple in-memory caching mechanism with Time-To-Live (TTL) support. It's used to cache responses and model data to improve performance and reduce redundant requests.

- **`auth.service.ts`**: Configures and manages user authentication using `passport.js`. It defines the local authentication strategy (username/password) and handles session serialization/deserialization.

- **`index.ts`**: Acts as a central export point for all services in this directory, making them easily importable in other parts of the application. It also includes a health check function that aggregates the status of various services.
