# `controllers` Folder

This folder contains the controllers, which are the core logic for the application's API endpoints. Each controller is responsible for handling incoming requests from a specific route, processing them, interacting with services, and sending back a response.

## Files

### `chat.ts`

This is the most important controller, responsible for handling the OpenAI-compatible chat completion requests.

* **Endpoint**: `POST /v1/chat/completions`
* **Functionality**:
  * Receives requests that conform to the `OpenAIChatCompletionRequest` type.
  * Performs validation to ensure required fields like `model` and `messages` are present.
  * Checks if the requested model is supported by using the `getModelInfo` function from the configuration.
  * It has two main operating modes based on the `stream` parameter in the request body:
        1. **Streaming (`handleStreaming`)**: If `stream: true`, it establishes a Server-Sent Events (SSE) connection. It calls the `sourcegraphClient.makeStreamRequest` service, iterates through the response stream, formats each chunk into an OpenAI-compatible chunk, and writes it to the response. It concludes by sending a `[DONE]` message.
        2. **Non-Streaming (`handleNonStreaming`)**: If `stream: false`, it also uses the stream request service but collects all the chunks into a single response. It then calculates token usage (`prompt_tokens`, `completion_tokens`, `total_tokens`) and returns a complete `OpenAIChatCompletionResponse` object in a single JSON response.

### `health.ts`

This controller provides endpoints to monitor the health and status of the application.

* **`healthCheck` (`GET /health`)**: A simple endpoint that returns basic status information like `status: 'ok'`, uptime, and environment. Used for basic liveness checks.
* **`detailedHealthCheck` (`GET /health/detailed`)**: Provides a more comprehensive status report, including:
  * Memory usage (RSS, heap).
  * The number of active Sourcegraph cookies available.
  * Key configuration statuses (e.g., if a proxy or rate limiting is enabled).
  * It returns a `503` status code with a 'warning' message if no active cookies are available, which is critical for system monitoring.
* **`rootEndpoint` (`GET /`)**: Provides basic information about the API, including its name, version, and a list of available public endpoints.

### `models.ts`

This controller provides endpoints for listing the AI models supported by the proxy.

* **`getModels` (`GET /v1/models`)**: Returns a list of all available model IDs in an OpenAI-compatible format (`{ object: 'list', data: [...] }`). It retrieves the list of model names from the `getModelList` function in the configuration.
* **`getModel` (`GET /v1/models/{model}`)**: Returns information for a single, specified model ID.

### `index.ts`

This is a barrel file that exports all the controller functions from the other files in this directory. This simplifies imports in the `routes` files, allowing them to import all necessary controllers from a single location (`./controllers`).
