# Sourcegraph2API - Node.js

🚀 **A high-performance, production-ready proxy server to use Sourcegraph's AI API in the OpenAI API format, complete with a full-featured Admin Panel.**

This project allows you to use Sourcegraph's powerful AI capabilities (including over 35 models like Claude, Gemini, and GPT series) through the standard OpenAI API format. It comes with a built-in admin panel to manage API keys, cookies, users, and monitor usage statistics.

## 📋 Table of Contents

- [Features](#features)
- [Admin Panel](#admin-panel)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Docker](#docker)
- [Supported Models](#supported-models)
- [Development](#development)
- [License](#license)

## Features

- **Full OpenAI Compatibility**: Works seamlessly with existing OpenAI libraries and tools.
- **Built-in Admin Panel**: A comprehensive web interface to manage the entire proxy.
- **Dynamic Cookie & API Key Pools**: Manage multiple Sourcegraph cookies and generate API keys for your users, all from the UI.
- **Usage Statistics & Metrics**: Detailed dashboard with charts for requests, errors, and model usage.
- **Broad Model Support**: Access to over 35 of the latest AI models from Anthropic, Google, OpenAI, etc.
- **Streaming Support**: Full `stream: true` support for real-time responses.
- **Enterprise Security**: Rate limiting, IP blacklisting, and a robust user/API key authentication system.
- **Production-Ready**: Developed with TypeScript for stability and performance.

## Admin Panel

This project includes a powerful admin panel to manage and monitor your proxy server.

**How to Access:**

1. Start the server.
2. Open your browser and go to `http://localhost:7033/login`.
3. Log in with the default credentials:
    - **Username:** `admin`
    - **Password:** `admin`

> **Security Note:** It is highly recommended to change the default admin password immediately after your first login.

**Panel Features:**

- **Dashboard**: View real-time statistics, including total requests, error rates, and usage charts for models, cookies, and API keys.
- **Cookie Management**: Add, delete, and toggle multiple Sourcegraph cookies to create a resilient request pool.
- **API Key Management**: Create, delete, and manage API keys for your users.
- **User Management**: Add or remove admin users who can access the panel.
- **Usage Metrics**: Browse through a detailed, paginated log of all API requests.

## Installation

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v8.0.0` or higher (or `yarn`)

### Steps

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/hermesthecat/sourcegraph2api.git
    cd sourcegraph2api/nodejs
    ```

2. **Install Dependencies:**

    ```bash
    npm install
    ```

3. **Set Up Environment Variables:**
    Create a new file named `.env` by copying `env.example` and edit the values within it.

    ```bash
    cp env.example .env
    ```

4. **Run Migrations:**
    Before starting the server for the first time, or after pulling new changes that include database schema updates, run the migrations:

    ```bash
    npm run db:migrate
    ```

5. **Start the Server:**
    - **Development Mode (with auto-reload):**

      ```bash
      npm run dev
      ```

    - **Production Mode:**

      ```bash
      npm run build
      npm start
      ```

## Configuration

The application's configuration is managed in two ways:

1. **`.env` File (Startup Settings)**: These are core settings required to boot the server. They are only read once when the server starts.
2. **Admin Panel (Dynamic Settings)**: All other settings are managed dynamically from the **Admin Panel → Settings** page. These settings are stored in the database and can be changed on-the-fly without restarting the server.

### `.env` File Settings

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port the server will run on. | `7033` |
| `HOST` | The host address the server will bind to. | `0.0.0.0` |
| `NODE_ENV` | The operating environment (`development` or `production`). | `production` |
| `DEBUG` | Enables detailed debug logging (`true` or `false`). | `false` |

### Admin Panel Settings

The following settings can be configured from the UI:

- **Session Secret**: A secret key for securing user sessions.
- **Request Rate Limit**: Max requests per minute per IP.
- **Route Prefix**: A global prefix for all API routes.
- **Proxy URL**: An HTTP/HTTPS proxy for outbound requests.
- **IP Blacklist**: Comma-separated IPs to block.
- **Log Level**: The verbosity of application logs (`info`, `debug`, etc.).
- **User Agent**: The User-Agent header sent with requests to Sourcegraph.
- **Time Zone (TZ)**: The application's timezone.
- **Reasoning Hide**: Whether to hide the model's reasoning process.
- **Sourcegraph Base URL**: The base URL for the Sourcegraph API.
- **Chat Endpoint**: The endpoint path for Sourcegraph chat API.

## Usage

Once the server is running, first **create an API key in the [Admin Panel](#admin-panel)**. Then, use that key to make requests with standard OpenAI libraries.

### With OpenAI Library (Node.js/TypeScript)

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:7033/v1", // If you set a ROUTE_PREFIX, include it here
  apiKey: "s2a-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // Your API key generated from the admin panel
});

async function main() {
  const stream = await client.chat.completions.create({
    model: "claude-3-opus", // Any supported model
    messages: [
      {
        role: "user",
        content: "Can you write 5 interview questions about TypeScript?",
      },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();
```

### Test with cURL

```bash
# Replace with your API key from the admin panel
API_KEY="s2a-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

curl http://localhost:7033/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

## API Endpoints

- `POST /v1/chat/completions`: The main endpoint for chat completion requests.
- `GET /v1/models`: Returns a list of all supported models.
- `GET /health`: A simple health check.
- `GET /login`: The login page for the admin panel.
- `GET /admin/dashboard`: The main dashboard for the admin panel.

## Docker

1. **Build the Docker image:**

    ```bash
    docker build -t sourcegraph2api-nodejs .
    ```

2. **Run the container:**
    Make sure your `.env` file is created and configured.

    ```bash
    docker run -p 7033:7033 --env-file .env sourcegraph2api-nodejs
    ```

## Supported Models

This proxy provides a wide variety of models supported by Sourcegraph in the OpenAI format.

### Main Models

| Brand | Popular Models |
| :--- | :--- |
| **Claude** (Anthropic) | `claude-3-opus`, `claude-3.5-sonnet-latest`, `claude-3-haiku` |
| **Gemini** (Google) | `gemini-1.5-pro`, `gemini-2.0-flash` |
| **GPT** (OpenAI) | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| **Other** | `mixtral-8x22b-instruct`, `deepseek-v3` |

### Full Model List

`claude-sonnet-4-latest`, `claude-sonnet-4-thinking-latest`, `claude-3-7-sonnet-latest`, `claude-3-7-sonnet-extended-thinking`, `claude-3-5-sonnet-latest`, `claude-3-opus`, `claude-3-5-haiku-latest`, `claude-3-haiku`, `claude-3.5-sonnet`, `claude-3-5-sonnet-20240620`, `claude-3-sonnet`, `claude-2.1`, `claude-2.0`, `deepseek-v3`, `gemini-1.5-pro`, `gemini-1.5-pro-002`, `gemini-2.0-flash-exp`, `gemini-2.0-flash`, `gemini-2.5-flash-preview-04-17`, `gemini-2.0-flash-lite`, `gemini-2.0-pro-exp-02-05`, `gemini-2.5-pro-preview-03-25`, `gemini-1.5-flash`, `gemini-1.5-flash-002`, `mixtral-8x7b-instruct`, `mixtral-8x22b-instruct`, `gpt-4o`, `gpt-4.1`, `gpt-4o-mini`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o3-mini-medium`, `o3`, `o4-mini`, `o1`, `gpt-4-turbo`, `gpt-3.5-turbo`

## Development

### Project Structure

```bash
nodejs/
├── config/              # Sequelize CLI configuration (config.json)
├── migrations/          # Database migration files
├── src/
│   ├── config/          # Dynamic configuration manager and model list
│   ├── controllers/     # Logic for handling incoming HTTP requests
│   ├── middleware/      # Middleware for authentication, logging, etc.
│   ├── models/          # Sequelize database models and relationships
│   ├── routes/          # API and web routes (endpoints)
│   ├── services/        # Core business logic (DB, Sourcegraph client, etc.)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions and logger
│   ├── app.ts           # Main setup for the Express application
│   └── index.ts         # The application's entry point
├── views/               # EJS templates for the Admin Panel
├── public/              # Static files (CSS, JS) for the Admin Panel
├── database.sqlite      # SQLite veritabanı dosyası (migration'lar tarafından yönetilir)
├── package.json
├── .sequelizerc         # Sequelize CLI konfigürasyonu
└── .env.example
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
