# `config` Folder

This folder contains the application's configuration management logic. It centralizes how settings are loaded, accessed, and updated, providing a clear separation between static and dynamic configuration.

## Files

### `index.ts`

This is the main file for configuration management and is responsible for several key functions:

1. **Dual Configuration System**: The system uses two types of settings:
    * **Base Configuration (`BaseConfig`)**: Core settings that require a server restart to change. These are loaded directly from the `.env` file (e.g., `PORT`, `HOST`, `NODE_ENV`).
    * **Dynamic Configuration (`DynamicConfig`)**: Settings that can be changed "live" from the admin panel while the application is running. These are stored in the database (`settings` table) and loaded into memory.

2. **Loading from Database (`loadConfigFromDb`)**: On application startup, this function reads all settings from the database. It also creates and populates default values for any settings that are missing, ensuring the application can always run.

3. **In-Memory Caching**: Settings loaded from the database are stored in an in-memory `liveConfig` object. This prevents frequent database queries and ensures fast access to settings.

4. **Unified Access with Proxy (`config`)**: A JavaScript `Proxy` object named `config` serves as the single source of truth for accessing all configuration values throughout the application. When a setting is requested (e.g., `config.requestRateLimit`), the proxy first checks the `liveConfig` (dynamic settings) and then the `BaseConfig` (static settings). This provides a seamless and unified way to access any setting.

5. **Live Updates (`updateLiveConfig`)**: When a setting is changed in the admin panel, this function is called to instantly update the value in the `liveConfig` object in memory. This allows for real-time configuration changes without restarting the server.

6. **Model Registry**: The file also includes a static `modelRegistry` object. This registry maps OpenAI-compatible model names (e.g., `gpt-4o`) to their specific internal Sourcegraph model references (e.g., `anthropic::...`) and defines properties like `maxTokens`. Helper functions like `getModelInfo` and `getModelList` are provided to work with this registry.

## Key Exports

* `config`: The proxied configuration object. **This should be imported and used by all other parts of the application** to access any setting.
* `loadConfigFromDb`: The function that initializes dynamic settings from the database. Called once at startup.
* `updateLiveConfig`: The function used to update a dynamic setting in memory.
* `modelRegistry`, `getModelInfo`, `getModelList`: Utilities for managing and accessing information about supported AI models.
