const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const VentaItem = sequelize.define('VentaItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  precio_unit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'venta_items',
  timestamps: false,
});

module.exports = VentaItem;
