/**
 * ApiKey Model
 * Defines the structure of the 'api_keys' table in the database
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/database';

interface ApiKeyAttributes {
  id: number;
  key: string;
  alias: string;
  isActive: boolean;
}

interface ApiKeyCreationAttributes extends Optional<ApiKeyAttributes, 'id'> { }

class ApiKey extends Model<ApiKeyAttributes, ApiKeyCreationAttributes> implements ApiKeyAttributes {
  public id!: number;
  public key!: string;
  public alias!: string;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ApiKey.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'The API key to access the application',
    },
    alias: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'An easy-to-remember name for the API key',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Is the API key active?',
    },
  },
  {
    tableName: 'api_keys',
    sequelize,
    timestamps: true,
    comment: 'Stores API keys for proxy access',
  }
);

export { ApiKey }; 