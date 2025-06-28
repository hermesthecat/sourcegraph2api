/**
 * Models Index
 * Defines all models and their relationships
 */

import { ApiKey } from './apikey.model';
import { Cookie } from './cookie.model';
import { UsageMetric } from './usage.model';
import { User } from './user.model';
import { Setting } from './setting.model';

// One-to-Many relationship between ApiKey and UsageMetric
// An ApiKey can have multiple usage metrics
ApiKey.hasMany(UsageMetric, {
  foreignKey: 'apiKeyId',
  as: 'usageMetrics',
});
UsageMetric.belongsTo(ApiKey, {
  foreignKey: 'apiKeyId',
  as: 'apiKey',
});

// One-to-Many relationship between Cookie and UsageMetric
// A Cookie can have multiple usage metrics
Cookie.hasMany(UsageMetric, {
  foreignKey: 'cookieId',
  as: 'usageMetrics',
});
UsageMetric.belongsTo(Cookie, {
  foreignKey: 'cookieId',
  as: 'cookie',
});

// Export all models from a single point
export * from './apikey.model';
export * from './cookie.model';
export * from './usage.model';
export * from './user.model';
export * from './setting.model';