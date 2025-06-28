# `models` Folder

This folder contains the data models for the application, defined using the Sequelize ORM. Each model corresponds to a table in the SQLite database and defines its schema, including columns, data types, and constraints. These models provide an abstraction layer for all database interactions.

## Files

### `apikey.model.ts`

* **Table**: `api_keys`
* **Purpose**: Stores the API keys that clients use to authenticate with the proxy server.
* **Key Fields**:
  * `key`: The unique, secret API key string.
  * `alias`: A user-friendly name for the key (e.g., "Mobile App Key").
  * `isActive`: A boolean to enable or disable the key.

### `cookie.model.ts`

* **Table**: `cookies`
* **Purpose**: Stores the Sourcegraph session cookies (`SG_COOKIE`) that the proxy uses to make requests to the Sourcegraph API. The application cycles through active cookies.
* **Key Fields**:
  * `alias`: A user-friendly name for the cookie (e.g., "My Personal Account").
  * `cookieValue`: The actual, sensitive cookie string.
  * `isActive`: A boolean that determines if the cookie is part of the active pool for making requests.

### `setting.model.ts`

* **Table**: `settings`
* **Purpose**: Stores dynamic application settings as key-value pairs. This allows configuration to be changed from the admin panel without restarting the server.
* **Key Fields**:
  * `key`: The unique name of the setting (e.g., `requestRateLimit`), which serves as the primary key.
  * `value`: The value of the setting.

### `usage.model.ts`

* **Table**: `usage_metrics`
* **Purpose**: Logs every API request made to the proxy. This table is essential for analytics, monitoring, and debugging.
* **Key Fields**:
  * `ipAddress`: The IP of the client making the request.
  * `wasSuccess`: A boolean indicating if the underlying request to Sourcegraph was successful.
  * `errorMessage`: Stores the error message if the request failed.
  * `model`: The AI model requested.
  * `cookieId`: A foreign key linking to the `cookies` table, showing which cookie was used.
  * `apiKeyId`: A foreign key linking to the `api_keys` table, showing which API key was used.

### `user.model.ts`

* **Table**: `users`
* **Purpose**: Stores credentials for users who can log in to the admin panel.
* **Key Fields**:
  * `username`: The unique username for login.
  * `password`: The hashed password.
* **Features**: Includes a Sequelize `beforeSave` hook that automatically hashes the password using `bcrypt` whenever a user is created or their password is changed, ensuring that plain-text passwords are never stored.

### `index.ts`

This file serves two critical purposes:

1. **Model Aggregation**: It imports all model files and exports them from a single point. This allows services and other parts of the application to import any model from `../models` instead of referencing individual file paths.
2. **Defining Associations**: It establishes the relationships (associations) between the models. Specifically, it defines the `One-to-Many` relationships:
    * An `ApiKey` can have many `UsageMetric` records.
    * A `Cookie` can have many `UsageMetric` records.
    These associations are defined using `hasMany` and `belongsTo`, which enables powerful and convenient querying with `include` options (Sequelize's equivalent of SQL JOINs).
