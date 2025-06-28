# Utils

This directory contains general-purpose utility modules that can be used throughout the application. These modules do not belong to a specific business domain but provide common functionalities like logging, data manipulation, and other helper functions.

## Files

- **`helpers.ts`**: A collection of small, independent functions that perform common tasks. This includes functionalities like:
  - Data validation (`isValidUrl`, `isValidCookie`)
  - String manipulation and sanitization (`sanitizeString`, `truncateText`)
  - Data formatting (`formatDuration`, `formatMemoryUsage`)
  - Generating random strings (`generateRandomString`)
  - Safe JSON parsing (`safeJsonParse`)
  - Other miscellaneous helpers like `delay`, `deepClone`, etc.

- **`logger.ts`**: Configures the application-wide logging system using the `winston` library.
  - **`initializeLogger`**: Sets up the logger with different transports (e.g., console, file) and formats based on the environment (development/production) and debug settings.
  - **`log`**: Exports a simplified interface (`info`, `warn`, `error`, `debug`) for logging messages throughout the application, ensuring consistency in how logs are recorded.
  - It handles logging to different files for errors, combined logs, and unhandled exceptions/rejections.

## Responsibilities

- **Providing General-Purpose Functions:** Houses small and independent functionalities needed in many parts of the project, such as data formatting, validation, string manipulation, and debugging.
- **Supporting Core Services:** Configures and provides access to essential application-wide services like logging.
- **Preventing Code Duplication:** Reduces maintenance costs by preventing the same code snippets from being rewritten in different modules.
