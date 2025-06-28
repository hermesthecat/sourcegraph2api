# `views` Folder

This directory contains all the EJS (Embedded JavaScript) templates for rendering the application's web interface, specifically the admin panel. These files are responsible for generating the HTML sent to the client's browser.

## Templating Engine

The application uses **EJS** as its templating engine. This allows embedding dynamic data and JavaScript logic directly into HTML files.

- `<%= ... %>`: Outputs the value of a variable into the HTML (HTML-escaped).
- `<%- ... %>`: Outputs the unescaped value. Used for including other templates (like partials).
- `<% ... %>`: Used for control flow statements like loops (`forEach`) and conditionals (`if`).

## Main Views

- **`dashboard.ejs`**: The main landing page of the admin panel. It displays a comprehensive overview of the application's statistics, including general stats (total requests, error rate), performance charts (daily usage, model distribution via `Chart.js`), and summary tables for cookie and API key usage.

- **`apikeys.ejs`**: Provides an interface for managing proxy API keys. It includes a form to create new keys and a table to list, activate/deactivate, and delete existing keys.

- **`cookies.ejs`**: Provides an interface for managing Sourcegraph cookies (referred to as Sourcegraph API Keys in the UI). It contains a form for adding new cookies and a table to list, edit, toggle the status of, and delete existing cookies.

- **`edit-cookie.ejs`**: A dedicated page with a form to edit the alias and value of a specific Sourcegraph cookie.

- **`users.ejs`**: Manages admin panel users. It features a form to add new users and a table to list existing ones. It also includes a JavaScript-powered modal popup for editing user details (username and password), with special protections to prevent modification of the primary 'admin' user.

- **`metrics.ejs`**: Displays a detailed, paginated log of all API requests recorded by the system. The table includes information like timestamp, IP address, success status, and error messages.

- **`settings.ejs`**: A form that allows administrators to view and update all the dynamic application settings stored in the database. These changes are applied instantly without requiring a server restart.

- **`login.ejs`**: The authentication page. It displays a simple form for users to enter their username and password to access the admin panel.

## Partials

The `partials/` subdirectory contains reusable snippets of EJS templates that are included in multiple main views. This follows the DRY (Don't Repeat Yourself) principle.

- **`partials/nav.ejs`**: Defines the main navigation bar, providing consistent navigation links across all pages of the admin panel.

- **`partials/messages.ejs`**: Renders success or error messages that are passed to the view via `express-flash`. This is used to provide feedback to the user after they perform an action (e.g., "Settings saved successfully").
