# `src` Folder - Application Source Code

This folder contains all the TypeScript source code for the **Sourcegraph2API** project. The application is developed following a modular and layered architecture. Each subfolder represents a layer that fulfills a specific responsibility and forms the overall structure of the project.

## Project Purpose

This project is a proxy server that converts the **Sourcegraph AI API** into the popular **OpenAI API** format. This allows any tool or application integrated with the OpenAI API to use Sourcegraph's powerful code understanding capabilities through this proxy. Additionally, the project includes an admin panel, database, authentication, usage tracking, and many other features.

## Architecture and Folder Structure

The project generally adopts a **Model-View-Controller (MVC)**-like approach along with a **Service Layer Architecture**. This ensures the Separation of Concerns, helping the code to be more testable, maintainable, and scalable.

---

### 1. Entry Point and Application Setup

The heart and starting point of the application are located at the root of the `src` folder.

* **`index.ts`**: This is the application's main entry point. The asynchronous `main()` function manages the entire startup sequence in a specific order:
    1. **Environment Variables**: Loads the `.env` file using `dotenv`.
    2. **Logger Initialization**: Initializes the `winston` logger with basic settings from environment variables.
    3. **Database Initialization**: Calls `initializeDatabase()` to connect to the database and run migrations.
    4. **Dynamic Configuration**: Calls `loadConfigFromDb()` to load settings from the database into the global `config` object.
    5. **Server Start**: Calls `startServer()` from `app.ts` to launch the web server.

* **`app.ts`**: This file is responsible for creating, configuring, and starting the Express application.
  * **`createApp()`**: This function assembles the Express `app` object. It's responsible for:
    * **View Engine & Static Files**: Configures EJS as the view engine and sets up the `public` directory for static assets.
    * **Session & Auth Middleware**: Sets up the complete stack for handling web sessions and admin authentication in the correct order: `cookie-parser`, `express-session` (with `connect-session-sequelize` for database storage), `passport.js`, and `connect-flash`.
    * **Global Middleware Stack**: Applies a series of middleware to every incoming request, including `helmet` for security, CORS handling, request logging, rate limiting, and IP blacklisting.
    * **Route Setup**: Integrates all the API and web routes defined in the `routes` layer.
    * **Error Handling**: Attaches the final middleware for handling 404 Not Found errors and other application-wide errors.
  * **`startServer()`**: This function calls `createApp()`, starts the server, logs essential startup information (like available endpoints), and sets up graceful shutdown handlers.
  * **`setupGracefulShutdown()`**: Implements handlers for system signals (`SIGINT`, `SIGTERM`) and unhandled exceptions to ensure the application can shut down cleanly.

---

### 2. Layers and Responsibilities

Below is a description of each subfolder (layer) within `src`.

#### [`config/`](./config/README.md)

Manages all application configuration. It reads environment variables from the `.env` file, merges them with dynamic settings from the database, and provides a type-safe `config` object available throughout the application.

#### [`models/`](./models/README.md)

This is the **Model** layer that defines the database schema. Using Sequelize ORM, database tables (`User`, `ApiKey`, `Cookie`, `UsageMetric`, etc.) are abstracted as TypeScript classes, and their relationships (`hasMany`, `belongsTo`) are established here.

#### [`services/`](./services/README.md)

This is the core of the application's **business logic**. Complex operations such as database operations (CRUD), communication with the external Sourcegraph API, authentication logic (Passport.js), statistics calculation, and caching are located in this layer.

#### [`middleware/`](./middleware/README.md)

Contains **middleware** functions that process incoming requests. Cross-cutting concerns such as authentication (`openaiAuth`, `isAuthenticated`), logging (`requestLogger`), security (`helmet`), CORS, rate limiting, and error handling are managed here.

#### [`controllers/`](./controllers/README.md)

This is the **Controller** layer that receives and responds to incoming HTTP requests. It validates requests, calls relevant service functions, and returns the results from the services as responses in the format expected by the client (usually JSON or a rendered EJS view).

#### [`routes/`](./routes/README.md)

This is the **routing** layer that defines the application's URL paths (endpoints). It determines which URL path with which HTTP method connects to which controller function. It includes separate route groups for the API (`/v1`) and the admin panel (`/admin`).

#### [`types/`](./types/README.md)

Contains all **TypeScript types** (`interface`, `class`) used throughout the project. This ensures type safety of the code by defining API contracts, data structures, and the shape of objects.

#### [`utils/`](./utils/README.md)

Contains general-purpose **helper functions** that do not belong to a specific layer. The logging infrastructure (`logger.ts`) and various other utility tools (`helpers.ts`) are found here.
