const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  imagen: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'productos',
  timestamps: false,
});

module.exports = Producto;
