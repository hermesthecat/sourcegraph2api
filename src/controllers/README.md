# Controllers Folder

This folder represents the "C" (Controller) layer of the application. It receives incoming HTTP requests, calls the necessary service layer functions to process these requests, and returns the appropriate HTTP response to the client. Each controller focuses on a specific functional area.

## Responsibilities

* **Managing Request/Response Cycle:** Processes incoming requests and generates responses using Express's `Request` and `Response` objects.
* **Request Validation:** Validates incoming request bodies (`body`), parameters (`params`), and query strings (`query`). In case of missing or invalid data, it informs the client with 4xx error codes.
* **Calling Service Layer:** Calls services (e.g., `sourcegraphClient`) containing business logic to perform the actual work.
* **Response Formatting:** Formats the data returned from services in a way that is compatible with the API specification (e.g., OpenAI API format) and presents it to the client in JSON format.
* **Error Handling:** Catches errors that occur during operations and logs them along with appropriate HTTP error codes (usually 500).

## Files

### `chat.ts`

Manages the OpenAI-compatible `/v1/chat/completions` endpoint.

* `chatCompletion`: This is the main function. It validates the incoming request, checks if the model is supported, and calls either `handleStreaming` or `handleNonStreaming` functions based on whether the request is `stream`ing.
* `handleStreaming`: Sends the response in chunks using Server-Sent Events (SSE).
* `handleNonStreaming`: Concatenates the entire response from the Sourcegraph API and returns it as a single JSON object.

### `health.ts`

Manages endpoints used to check the application's health status.

* `healthCheck`: (`/health`) Returns a simple response containing the application's basic status (uptime, version, environment).
* `detailedHealthCheck`: (`/health/detailed`) Provides more detailed system information such as memory usage, cookie status, and configuration details.
* `rootEndpoint`: (`/`) Handles requests to the application's root directory and provides general information about the project along with a list of available endpoints.

### `models.ts`

Manages the OpenAI-compatible `/v1/models` endpoints.

* `getModels`: (`/v1/models`) Returns a list of all supported models in OpenAI format from the application configuration (now dynamically loaded from the database).
* `getModel`: (`/v1/models/{model}`) Returns details for a specific model.

### `index.ts`

This file exports all controller functions in the folder from a single point, making the code more organized and manageable. This allows the `routes` layer to access controllers more cleanly.
