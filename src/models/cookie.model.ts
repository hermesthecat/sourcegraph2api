/**
 * Cookie Model
 * Defines the structure of the 'cookies' table in the database
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/database';

// Attributes that a Cookie has
interface CookieAttributes {
  id: number;
  alias: string;
  cookieValue: string;
  isActive: boolean;
}

// Some attributes may be optional when creating a Cookie (like id)
interface CookieCreationAttributes extends Optional<CookieAttributes, 'id'> { }

// Extend the Sequelize Model class
class Cookie extends Model<CookieAttributes, CookieCreationAttributes> implements CookieAttributes {
  public id!: number;
  public alias!: string;
  public cookieValue!: string;
  public isActive!: boolean;

  // Timestamps (createdAt, updatedAt)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model and define the table
Cookie.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    alias: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'An easy-to-remember name for the cookie',
    },
    cookieValue: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'The actual SG_COOKIE value',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Is the cookie active in the pool?',
    },
  },
  {
    tableName: 'cookies',
    sequelize, // The database connection
    timestamps: true, // Add createdAt and updatedAt fields
    comment: 'Stores Sourcegraph cookies',
  }
);

export { Cookie }; 