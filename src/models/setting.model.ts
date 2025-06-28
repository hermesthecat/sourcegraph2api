/**
 * Setting Model / Ayar Modeli
 * Veritabanındaki 'settings' tablosunun yapısını tanımlar.
 * Bu tablo, anahtar-değer çiftleri olarak uygulama ayarlarını saklar.
 * Defines the structure of the 'settings' table in the database.
 * This table stores application settings as key-value pairs.
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../services/database';

// Setting modelinin sahip olduğu nitelikler
interface SettingAttributes {
  key: string;
  value: string;
}

// Sequelize Model sınıfını genişlet
class Setting extends Model<SettingAttributes> implements SettingAttributes {
  public key!: string;
  public value!: string;

  // Timestamps (createdAt, updatedAt) bu model için gerekli değil.
  // Timestamps are not necessary for this model.
}

// Modeli başlat ve tabloyu tanımla
Setting.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true, // Anahtarın kendisi birincil anahtardır
      allowNull: false,
      comment: 'Ayarın benzersiz anahtarı (örn: SESSION_SECRET)',
    },
    value: {
      type: DataTypes.TEXT, // Uzun değerler için TEXT
      allowNull: true, // Değer boş olabilir
      comment: 'Ayarın değeri',
    },
  },
  {
    tableName: 'settings',
    sequelize,
    timestamps: false, // createdAt ve updatedAt alanlarını oluşturma
    comment: 'Uygulama ayarlarını dinamik olarak saklar',
  }
);

export { Setting };