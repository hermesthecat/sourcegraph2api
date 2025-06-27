/**
 * UsageMetric Model / Kullanım Metriği Modeli
 * API kullanım loglarını saklar
 * Stores API usage logs
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/database';

interface UsageMetricAttributes {
  id: number;
  ipAddress: string;
  requestTimestamp: Date;
  wasSuccess: boolean;
  errorMessage: string | null;
  cookieId: number | null;
  apiKeyId: number | null;
}

interface UsageMetricCreationAttributes extends Optional<UsageMetricAttributes, 'id'> {}

class UsageMetric extends Model<UsageMetricAttributes, UsageMetricCreationAttributes> implements UsageMetricAttributes {
  public id!: number;
  public ipAddress!: string;
  public requestTimestamp!: Date;
  public wasSuccess!: boolean;
  public errorMessage!: string | null;
  public cookieId!: number | null;
  public apiKeyId!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UsageMetric.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'İsteği yapan istemcinin IP adresi / IP address of the requesting client',
    },
    requestTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'İsteğin yapıldığı zaman damgası / Timestamp of the request',
    },
    wasSuccess: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: 'Sourcegraph isteği başarılı oldu mu? / Was the Sourcegraph request successful?',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Başarısızsa hata mesajı / Error message if it failed',
    },
    cookieId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Bir cookie bulunamadığında null olabilir / Can be null if no cookie was found
      references: {
        model: 'cookies', // 'cookies' tablosuna referans / Reference to 'cookies' table
        key: 'id',
      },
    },
    apiKeyId: {
      type: DataTypes.INTEGER,
      allowNull: true, // API anahtarı geçersizse null olabilir / Can be null if API key was invalid
      references: {
        model: 'api_keys', // 'api_keys' tablosuna referans / Reference to 'api_keys' table
        key: 'id',
      },
    },
  },
  {
    tableName: 'usage_metrics',
    sequelize,
    timestamps: true,
    comment: 'Her bir API isteğinin loglarını tutar / Logs each API request',
  }
);

export { UsageMetric }; 