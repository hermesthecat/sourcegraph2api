/**
 * Database Service
 * Manages the database connection with Sequelize
 */

import { Sequelize } from 'sequelize';
import { log } from '../utils/logger';
import path from 'path';
import session from 'express-session';
import ConnectSessionSequelize from 'connect-session-sequelize';
import { Umzug, SequelizeStorage } from 'umzug'; // Import Umzug
import winston from 'winston'; // Import Winston directly

// Path to the database file (in the project root directory)
const storage = path.join(process.cwd(), 'database.sqlite');

// Create Sequelize instance (must be defined before Umzug)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storage,
  logging: (msg) => log.debug(msg), // Log SQL queries at debug level
});

// Create a temporary logger for Umzug
const umzugLogger = winston.createLogger({
  level: 'info', // Log at info level initially
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});


// Create Umzug instance
const umzug = new Umzug({
  migrations: {
    glob: 'migrations/*.js', // Path to migration files
    resolve: ({ name, path: migrationPath, context }) => { // Also get context
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const migration = require(migrationPath as string); // Skip type check
      return {
        name,
        // Migration files will be updated to receive a context object.
        // This context object will include queryInterface and Sequelize.
        up: async () => migration.up(context),
        down: async () => migration.down(context),
      };
    },
  },
  context: { queryInterface: sequelize.getQueryInterface(), Sequelize: Sequelize }, // Define context here
  storage: new SequelizeStorage({ sequelize }),
  logger: umzugLogger, // Use custom logger for Umzug
});

log.info(`Database path: ${storage}`);

// Create Sequelize-based session store
const SequelizeStore = ConnectSessionSequelize(session.Store);
export const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
  expiration: 24 * 60 * 60 * 1000  // 24 hours
});

/**
 * Test and synchronize the database connection
 */
export async function initializeDatabase(): Promise<void> {
  // Import models and config here to break circular dependency
  const { User } = await import('../models/user.model');
  const { config } = await import('../config');

  try {
    await sequelize.authenticate();
    log.info('Database connection has been established successfully.');

    // Run migrations
    log.info('🚀 Running database migrations...');
    // No need to pass any parameters to umzug.up() method,
    // because context is already defined in the constructor.
    await umzug.up();
    log.info('✅ Database migrations completed successfully.');

    await sessionStore.sync(); // Session table will also need to be managed by migration, for now keep it here.

    // Create admin user if not exists at startup
    // This part can now be moved to migration or seed.
    // But for now it can stay here, because if migrations have run, the table exists.
    const userCount = await User.count();
    if (userCount === 0) {
      await User.create({
        username: 'admin',
        password: 'admin', // Password will be automatically hashed by the hook in the model
      });
      log.info('👤 Default admin user created (admin/admin). Please change your password on first login.');
    }

  } catch (error) {
    log.error('❌ Database synchronization error:', error);
    // Terminate the application on error
    process.exit(1);
  }
}

export { sequelize };