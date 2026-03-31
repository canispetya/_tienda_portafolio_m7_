const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../db/sequelize');

const Venta = sequelize.define('Venta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // It can be updated later if needed
  }
}, {
  tableName: 'ventas',
  timestamps: false,
});

module.exports = Venta;
