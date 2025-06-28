'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(context) { // context objesini alacak şekilde değiştirildi
    const queryInterface = context.queryInterface;
    const Sequelize = context.Sequelize;

    await queryInterface.createTable('api_keys', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      key: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      alias: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('cookies', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      alias: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      cookieValue: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('usage_metrics', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      ipAddress: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      requestTimestamp: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.DataTypes.NOW,
      },
      wasSuccess: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
      },
      errorMessage: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      },
      model: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
      },
      cookieId: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'cookies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      apiKeyId: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'api_keys',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('settings', {
      key: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      value: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      },
    });

    // Session tablosunu da oluştur
    await queryInterface.createTable('sessions', {
      sid: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true,
      },
      sess: {
        type: Sequelize.DataTypes.JSON,
        allowNull: false,
      },
      expire: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  async down(context) { // context objesini alacak şekilde değiştirildi
    const queryInterface = context.queryInterface;
    const Sequelize = context.Sequelize;

    await queryInterface.dropTable('sessions');
    await queryInterface.dropTable('settings');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('usage_metrics');
    await queryInterface.dropTable('cookies');
    await queryInterface.dropTable('api_keys');
  }
};
