# Types Folder

This folder centralizes all TypeScript type definitions (`interface`, `class`, `type`) used throughout the project. This ensures that the code is more readable, maintainable, and type-safe. Thanks to TypeScript's static typing features, potential errors are prevented during the development phase.

## Responsibilities

* **Defining Data Structures:** Defines the shape and field types of data objects (e.g., API requests, database objects, configuration) that flow within the application.
* **Creating API Contracts:** Clearly defines the structure of request and response bodies, especially in interactions with external APIs (like OpenAI). This guarantees compatibility with the API.
* **Ensuring Type Safety:** Ensures that types remain consistent when data is transferred between different layers of the project (controllers, services, models).
* **Improving Developer Experience:** Enables features such as autocompletion, type checking, and instant error reporting in code editors (like VS Code).

## Files

### `index.ts`

This file contains all custom type definitions in the project and is divided into logical groups:

* **OpenAI Compatible Types:**
  * `OpenAIChatCompletionRequest`: Defines the structure of the request body for the `/v1/chat/completions` endpoint.
  * `OpenAIChatCompletionResponse`: Defines the structure of the response (stream or non-stream) returned from this endpoint.
  * Sub-interfaces like `OpenAIChatMessage`, `Choice`, `Usage`, `Delta` ensure full compatibility with the OpenAI API specification.
  * `OpenAIErrorResponse`: Defines the structure of the standard error object returned to the client in case of errors.

* **Application and Configuration Types:**
  * `BaseConfig`: Defines the type of basic configuration settings (e.g., `port`, `host`, `debug`) read from the `.env` file and determined at server startup.
  * `DynamicConfig`: Defines the type of settings stored in the database and dynamically updatable from the admin panel (e.g., `sessionSecret`, `requestRateLimit`, `userAgent`, `sourcegraphBaseUrl`).
  * `AppConfig`: Combines `BaseConfig` and `DynamicConfig` to define the type of the application's full configuration object.
  * `AppUser`: Contains basic properties of the admin panel user (`id`, `username`).

* **Express & Passport.js Type Extensions:**
  * `declare global { namespace Express { ... } }`: Uses TypeScript's "declaration merging" feature to define types for properties like `user`, `login()`, `logout()`, `isAuthenticated()` added to Express's `Request` object by libraries like `passport.js`. This allows these properties to be used in a type-safe manner.

* **Helper Types:**
  * `ModelInfo`, `ModelListResponse`: Define data structures for the `/v1/models` endpoint.
  * `AppError`: A custom `Error` class used for standardized error handling throughout the application, including additional properties like `statusCode` and `isOperational`. This helps distinguish between operational errors (predictable, e.g., "User not found") and programming errors (unexpected errors).
