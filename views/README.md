# Views Folder

This folder represents the "V" (View) layer of the application and contains all EJS (Embedded JavaScript) template files that form the user interface of the administration panel. These files are used to generate HTML pages on the server side (server-side rendering) by receiving dynamic data (e.g., cookie list from the database).

The routes in `src/routes/admin.routes.ts` render these template files using the `res.render()` function and present them to the user.

## Responsibilities

* **Defining the User Interface:** Defines the HTML structure and layout of different pages of the administration panel (Dashboard, Cookie Management, Login, etc.).
* **Dynamic Data Display:** Displays data coming from controllers (e.g., `cookies`, `apiKeys`, `stats`) within HTML using EJS syntax (`<%= %>`).
* **Reusable Components:** Enables the reuse of repeating UI components on pages, such as the navigation menu, through the `partials` folder.

## Files

### Main Page Templates

* **`login.ejs`**: The login page containing username and password fields for users to log in to the administration panel.
* **`dashboard.ejs`**: The main panel accessed after logging in. Displays general usage statistics, graphs, and other summary information.
* **`cookies.ejs`**: A page that lists all `Cookie`s in the database in a table format, includes a form for adding new cookies, and offers options to edit/delete/activate existing ones.
* **`edit-cookie.ejs`**: A special form page used to edit a specific cookie.
* **`apikeys.ejs`**: A page that lists all API keys in the database, offers options to create new keys and delete/activate existing ones.
* **`users.ejs`**: A page that lists users with access to the administration panel, includes forms for adding new users, editing, and deleting.
* **`metrics.ejs`**: A page that displays API usage logs (`UsageMetric` records) in detail with pagination.
* **`settings.ejs`**: A page containing form fields to view and update the application's dynamically managed settings (e.g., `sessionSecret`, `requestRateLimit`, `userAgent`, `sourcegraphBaseUrl`).

### `partials/` Folder

This subfolder contains recurring HTML snippets used across multiple pages. This prevents code duplication and simplifies maintenance.

* **`nav.ejs`**: Contains the top navigation bar visible on all administration panel pages.
* **`messages.ejs`**: The component used to display success or error messages (flash messages) after a user performs an action (e.g., "Cookie successfully added").
