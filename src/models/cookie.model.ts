/**
 * Cookie Model / Cookie Modeli
 * Veritabanındaki 'cookies' tablosunun yapısını tanımlar / Defines the structure of the 'cookies' table in the database
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/database';

// Cookie'nin sahip olduğu attributelar / Attributes that a Cookie has
interface CookieAttributes {
  id: number;
  alias: string;
  cookieValue: string;
  isActive: boolean;
}

// Cookie oluşturulurken bazı attributelar opsiyonel olabilir (id gibi)
// Some attributes may be optional when creating a Cookie (like id)
interface CookieCreationAttributes extends Optional<CookieAttributes, 'id'> { }

// Sequelize Model sınıfını genişlet / Extend the Sequelize Model class
class Cookie extends Model<CookieAttributes, CookieCreationAttributes> implements CookieAttributes {
  public id!: number;
  public alias!: string;
  public cookieValue!: string;
  public isActive!: boolean;

  // Timestamps (createdAt, updatedAt)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Modeli başlat ve tabloyu tanımla / Initialize the model and define the table
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
      comment: 'Cookie için kolay hatırlanabilir bir isim / An easy-to-remember name for the cookie',
    },
    cookieValue: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Asıl SG_COOKIE değeri / The actual SG_COOKIE value',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Cookie havuzda aktif mi? / Is the cookie active in the pool?',
    },
  },
  {
    tableName: 'cookies',
    sequelize, // Veritabanı bağlantısı / The database connection
    timestamps: true, // createdAt ve updatedAt alanlarını ekle / Add createdAt and updatedAt fields
    comment: 'Sourcegraph cookie\'lerini saklar / Stores Sourcegraph cookies',
  }
);

export { Cookie }; 