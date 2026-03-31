const sequelize = require('../db/sequelize');
const Producto = require('./Producto');
const Venta = require('./Venta');
const VentaItem = require('./VentaItem');

// Relaciones
Venta.hasMany(VentaItem, { foreignKey: 'id_venta', onDelete: 'CASCADE' });
VentaItem.belongsTo(Venta, { foreignKey: 'id_venta' });

Producto.hasMany(VentaItem, { foreignKey: 'id_producto', onDelete: 'CASCADE' });
VentaItem.belongsTo(Producto, { foreignKey: 'id_producto' });

module.exports = {
  sequelize,
  Producto,
  Venta,
  VentaItem
};
