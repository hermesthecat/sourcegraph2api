# Models Folder

This folder represents the "M" (Model) layer of the application and defines the database schema. Using [Sequelize](https://sequelize.org/) ORM (Object-Relational Mapper), database tables are abstracted as TypeScript classes. This allows database operations (create, read, update, delete) to be performed more securely and easily.

## Responsibilities

* **Defining Database Table Schemas:** Each model file corresponds to a table in the database and defines its columns, data types, constraints (primary key, uniqueness, etc.), and default values.
* **Determining Data Structures:** Specifies the attributes and types of data structures (e.g., `User`, `ApiKey`) to be used within the application.
* **Establishing Model Associations:** Defines relationships between models (One-to-Many, Many-to-Many, etc.) via the `index.ts` file. This allows for easy querying of related data (like `JOIN` operations).
* **Ensuring Data Integrity:** Ensures data validation or processing (e.g., password hashing) before data is written to the database, using Sequelize features like hooks.

## Files

### `apikey.model.ts`

Defines the `ApiKey` model representing the `api_keys` table. This table stores API keys used for programmatic access to the application.

* **Fields:** `id`, `key` (the actual key), `alias` (friendly name), `isActive`.

### `cookie.model.ts`

Defines the `Cookie` model representing the `cookies` table. This table stores `SG_COOKIE` values used to make requests to Sourcegraph.

* **Fields:** `id`, `alias`, `cookieValue` (the actual cookie), `isActive`.

### `setting.model.ts`

Defines the `Setting` model representing the `settings` table. This table stores the application's dynamically managed configuration settings as key-value pairs. Settings like `SESSION_SECRET`, `REQUEST_RATE_LIMIT`, `USER_AGENT`, `SOURCEGRAPH_BASE_URL` are now stored here.

* **Fields:** `key` (setting name), `value` (setting value).

### `usage.model.ts`

Defines the `UsageMetric` model representing the `usage_metrics` table. This table logs every API request, providing data for usage statistics.

* **Fields:** `id`, `ipAddress`, `requestTimestamp`, `wasSuccess`, `errorMessage`, `model`, `cookieId`, `apiKeyId`.

### `user.model.ts`

Defines the `User` model representing the `users` table. This table stores information about users who can log in to the admin panel.

* **Fields:** `id`, `username`, `password`.
* **Features:**
  * **Password Hashing:** Automatically hashes the `password` field using `bcryptjs` before a user record is created or updated, via a `beforeSave` hook.
  * `validatePassword`: Includes a method to check if a provided password matches the hashed password in the database.

### `index.ts`

This file manages all models from a central location:

* **Imports Models:** Imports all other model files (including `setting.model.ts`).
* **Defines Associations:**
  * Establishes a **One-to-Many** relationship between `ApiKey` and `UsageMetric` (an API key can have multiple usage metrics).
  * Establishes a **One-to-Many** relationship between `Cookie` and `UsageMetric` (a cookie can have multiple usage metrics).
* **Exports Models:** Exports all models and their associations from a single point, allowing them to be easily used throughout the application.
