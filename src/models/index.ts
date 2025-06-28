/**
 * Models Index / Modeller Dizini
 * Tüm modelleri ve aralarındaki ilişkileri tanımlar
 * Defines all models and their relationships
 */

import { ApiKey } from './apikey.model';
import { Cookie } from './cookie.model';
import { UsageMetric } from './usage.model';
import { User } from './user.model';
import { Setting } from './setting.model';

// ApiKey ve UsageMetric arasındaki ilişki (One-to-Many)
// Bir ApiKey'in birden çok kullanım metriği olabilir
ApiKey.hasMany(UsageMetric, {
  foreignKey: 'apiKeyId',
  as: 'usageMetrics',
});
UsageMetric.belongsTo(ApiKey, {
  foreignKey: 'apiKeyId',
  as: 'apiKey',
});

// Cookie ve UsageMetric arasındaki ilişki (One-to-Many)
// Bir Cookie'nin birden çok kullanım metriği olabilir
Cookie.hasMany(UsageMetric, {
  foreignKey: 'cookieId',
  as: 'usageMetrics',
});
UsageMetric.belongsTo(Cookie, {
  foreignKey: 'cookieId',
  as: 'cookie',
});

// Tüm modelleri tek bir yerden export et
export * from './apikey.model';
export * from './cookie.model';
export * from './usage.model';
export * from './user.model';
export * from './setting.model';