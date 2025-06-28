/**
 * UsageMetric Model
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
  model: string | null;
  cookieId: number | null;
  apiKeyId: number | null;
}

interface UsageMetricCreationAttributes extends Optional<UsageMetricAttributes, 'id'> { }

class UsageMetric extends Model<UsageMetricAttributes, UsageMetricCreationAttributes> implements UsageMetricAttributes {
  public id!: number;
  public ipAddress!: string;
  public requestTimestamp!: Date;
  public wasSuccess!: boolean;
  public errorMessage!: string | null;
  public model!: string | null;
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
      comment: 'IP address of the requesting client',
    },
    requestTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp of the request',
    },
    wasSuccess: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: 'Was the Sourcegraph request successful?',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if it failed',
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'The AI model used in the request',
    },
    cookieId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if no cookie was found
      references: {
        model: 'cookies', // Reference to 'cookies' table
        key: 'id',
      },
    },
    apiKeyId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if API key was invalid
      references: {
        model: 'api_keys', // Reference to 'api_keys' table
        key: 'id',
      },
    },
  },
  {
    tableName: 'usage_metrics',
    sequelize,
    timestamps: true,
    comment: 'Logs each API request',
  }
);

export { UsageMetric }; 