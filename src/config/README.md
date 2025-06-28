# Config Folder

This folder is responsible for managing all application configuration settings. However, most settings are now managed dynamically from the database, not from the `.env` file.

## Responsibilities

* **Base Configuration:** Reads essential settings like `PORT`, `HOST`, `NODE_ENV`, `DEBUG` from the `.env` file when the server starts. A server restart is required to update these settings.
* **Dynamic Configuration Loading:** When the application starts, it loads dynamic settings (such as `SESSION_SECRET`, `REQUEST_RATE_LIMIT`, `ROUTE_PREFIX`, `PROXY_URL`, `IP_BLACKLIST`, `LOG_LEVEL`, `USER_AGENT`, `TZ`, `REASONING_HIDE`, `SOURCEGRAPH_BASE_URL`, `CHAT_ENDPOINT`) from the `settings` table in the database and keeps them in memory.
* **Instant Update:** Setting changes made from the admin panel instantly update the active configuration object in memory, in addition to the database. This eliminates the need for a server restart.
* **Model Registry:** Contains a static registry (`modelRegistry`) of all supported language models by the application, along with their Sourcegraph references and maximum token counts.

## Files

### `index.ts`

This file is the central point for configuration management and performs the following main responsibilities:

* **`getBaseConfig()`**: Reads essential settings like `PORT`, `HOST`, `DEBUG`, `NODE_ENV` from the `.env` file.
* **`loadConfigFromDb()`**: Loads settings from the database using the `Setting` model. It creates missing default settings in the database and populates the `liveConfig` object.
* **`config` Object (Proxy):** This is the main configuration object used throughout the application. It acts as a proxy, so when a value like `config.sessionSecret` is accessed, it always retrieves the most up-to-date value from `liveConfig` in memory.
* **`updateLiveConfig()`**: Instantly updates the `liveConfig` object in memory. This function is called when a setting is updated from the settings panel.
* **`modelRegistry` Object:** Contains the static list of language models supported by the application.
* **`getModelInfo()` and `getModelList()`:** Helper functions that provide access to the model registry.

## Usage

The `config` object is used throughout the application by importing it with `import { config } from '../config'`. This centralized and dynamic approach simplifies configuration management and removes the need for server restarts.
