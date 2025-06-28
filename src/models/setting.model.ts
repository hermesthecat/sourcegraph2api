/**
 * Setting Model
 * Defines the structure of the 'settings' table in the database.
 * This table stores application settings as key-value pairs.
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../services/database';

// Attributes that the Setting model has
interface SettingAttributes {
  key: string;
  value: string;
}

// Extend the Sequelize Model class
class Setting extends Model<SettingAttributes> implements SettingAttributes {
  public key!: string;
  public value!: string;

  // Timestamps (createdAt, updatedAt) are not necessary for this model.
}

// Initialize the model and define the table
Setting.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true, // The key itself is the primary key
      allowNull: false,
      comment: 'The unique key of the setting (e.g., SESSION_SECRET)',
    },
    value: {
      type: DataTypes.TEXT, // TEXT for long values
      allowNull: true, // Value can be null
      comment: 'The value of the setting',
    },
  },
  {
    tableName: 'settings',
    sequelize,
    timestamps: false, // Do not create createdAt and updatedAt fields
    comment: 'Dynamically stores application settings',
  }
);

export { Setting };