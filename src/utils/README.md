# Utils Folder

"Utils" (Utilities) is a folder that contains general-purpose helper functions and classes that can be reused throughout the application and are not tied to a specific domain. This folder helps prevent code duplication (`Don't Repeat Yourself - DRY`) and makes the code more modular and clean.

## Responsibilities

* **Providing General-Purpose Functions:** Houses small and independent functionalities needed in many parts of the project, such as data formatting, validation, string manipulation, and debugging.
* **Supporting Core Services:** Configures and provides access to essential application-wide services like logging.
* **Preventing Code Duplication:** Reduces maintenance costs by preventing the same code snippets from being rewritten in different modules.

## Files

### `logger.ts`

Sets up and manages the application's logging infrastructure.

* **Winston Library:** Based on `winston`, a powerful and flexible logging library.
* **Dynamic Configuration:** Retrieves settings like log level and colored output from the `config` object (now dynamically loaded from the database).
* **Multiple "Transports":** Can write logs to multiple destinations simultaneously:
  * **Console:** Prints logs to the console for real-time monitoring in the development environment. Colors output in `debug` mode.
  * **File:** Saves errors (`error.log`), all logs (`combined.log`), uncaught exceptions (`exceptions.log`), and unhandled Promise rejections (`rejections.log`) to separate files.
* **Configurable Format:** Centrally defines the format of logs (`timestamp`, `level`, `message`, `stack trace`).
* **`log` Object:** In addition to standard logging functions like `log.info()`, `log.error()`, it provides a special `log.request()` function that allows logging each request with its own ID. This makes tracking the lifecycle of a request very easy.

### `helpers.ts`

Contains various small and general-purpose helper functions.

* **Network and Timing:**
  * `delay`: Returns a Promise that waits for the specified milliseconds.
  * `calculateBackoff`: Calculates an exponentially increasing wait time for retries (Exponential Backoff).
* **Data Processing and Validation:**
  * `safeJsonParse`: Attempts to parse a string as JSON, returns `null` on error.
  * `sanitizeString`: Cleans potentially harmful control characters from a string.
  * `isValidUrl`, `isValidCookie`: Checks if the given strings are in a valid URL or cookie format.
* **Formatting:**
  * `formatMemoryUsage`: Converts memory size given in bytes to a human-readable format (KB, MB, GB).
  * `formatDuration`: Converts duration given in milliseconds to a human-readable format (ms, s, m, h).
  * `truncateText`: Truncates long texts with "..." after a specified character count.
* **Error Handling:**
  * `extractStatusCode`: Attempts to extract an HTTP status code from an error object.
* **Others:**
  * `generateRandomString`: Generates a random string of characters.
  * `isProduction`: Checks if the application is running in production environment.
  * `getCurrentTimestamp`: Gets the current time as a Unix timestamp in seconds.
