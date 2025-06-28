# `types` Folder

This directory contains TypeScript type definitions (`interfaces`, `types`, `classes`) that are used across the entire application. Centralizing these types ensures type safety, improves code readability and autocompletion, and makes refactoring easier.

The primary file is `index.ts`.

## File Content (`index.ts`)

The `index.ts` file is organized into several logical sections:

### 1. OpenAI-Compatible Types

This is one of the most critical sections. It defines a set of interfaces (`OpenAIChatMessage`, `OpenAIChatCompletionRequest`, `OpenAIChatCompletionResponse`, `OpenAIErrorResponse`, etc.) that mirror the official OpenAI Chat Completions API. By using these types, our proxy guarantees that it can correctly process incoming requests from standard OpenAI clients and produce responses in the expected format. This ensures seamless compatibility.

### 2. Sourcegraph-Specific Types

This section defines types used for internal communication with the Sourcegraph API.

- **`SourcegraphRequest`**: Defines the structure of the request body sent to the Sourcegraph stream endpoint.
- **`SGModelInfo`**: Represents the structure of a model entry in the application's internal model registry.

### 3. Configuration Types

This section defines the structure of the application's configuration object. It's split into two parts:

- **`BaseConfig`**: Types for settings that are loaded from the `.env` file at startup and require a server restart to change (e.g., `port`, `host`).
- **`DynamicConfig`**: Types for settings that are loaded from the database and can be changed "live" from the admin panel without a restart (e.g., `requestRateLimit`, `ipBlacklist`, `sourcegraphBaseUrl`).
- **`AppConfig`**: A combined type that merges `BaseConfig` and `DynamicConfig` into a single, comprehensive configuration type.

### 4. Express & Passport.js Type Extensions

This is a crucial piece of TypeScript configuration. It uses `declare global` to augment the global `Express` namespace. This "teaches" TypeScript about the properties and methods that `passport.js` adds to the Express `Request` object, such as:

- `req.user`
- `req.isAuthenticated()`
- `req.login()`
- `req.logout()`

Without this, using these methods would result in TypeScript compilation errors.

### 5. Other Utility Types

This section contains various other types and classes used throughout the application:

- **`AppUser`**: Defines the basic structure of a user object.
- **`ModelListResponse` / `ModelInfo`**: Defines the structure for the response of the `/v1/models` endpoint.
- **`AppError`**: A custom error class that extends the native `Error`. It allows for creating errors with an associated `statusCode`, which helps in generating appropriate HTTP responses in the error handling middleware.
- Other minor types for components like the logger and cookie manager.
