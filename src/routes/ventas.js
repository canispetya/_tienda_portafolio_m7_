const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { Venta, VentaItem, Producto } = require('../models');

// GET /ventas -> lista todas las ventas (tabla/lista)
router.get('/ventas', async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      include: [
        {
          model: VentaItem,
          include: [Producto]
        }
      ],
      order: [['fecha', 'DESC']]
    });
    res.status(200).json(ventas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el historial de ventas' });
  }
});

// POST /venta -> registra una venta usando transacción (TCL) pura en pg y descuenta stock
router.post('/venta', async (req, res) => {
  // Conexión cliente para la transacción
  const client = await pool.connect();
  
  try {
    const { carrito } = req.body; 

    if (!carrito || !Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ error: 'El carrito no puede estar vacío' });
    }

    // Iniciar Transacción
    await client.query('BEGIN');
    
    // 1. Crear Venta y obtener ID
    const { rows: nuevaVenta } = await client.query(
      'INSERT INTO ventas (fecha, total) VALUES (now(), 0) RETURNING id'
    );
    const idVenta = nuevaVenta[0].id;

    let totalVenta = 0;

    // 2. Procesar cada item
    for (const item of carrito) {
      // Intentar actualizar y descontar stock SI es mayor o igual a la cantidad solicitada
      const { rowCount } = await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
        [item.cantidad, item.id]
      );
      
      // Si rowCount es 0, no existía el id o el stock no era suficiente -> Abortar
      if (rowCount === 0) {
        throw new Error(`Stock insuficiente o producto no encontrado (ID: ${item.id})`);
      }

      // Obtener el precio unitario actualizado (para reflejarlo en base de datos)
      const { rows: prodActual } = await client.query('SELECT precio FROM productos WHERE id = $1', [item.id]);
      const precioUnit = parseFloat(prodActual[0].precio);
      totalVenta += (precioUnit * item.cantidad);

      // Guardar el item en la relación
      await client.query(
        'INSERT INTO venta_items (id_venta, id_producto, cantidad, precio_unit) VALUES ($1, $2, $3, $4)',
        [idVenta, item.id, item.cantidad, precioUnit]
      );
    }

    // 3. Actualizar el total general de la Venta
    await client.query('UPDATE ventas SET total = $1 WHERE id = $2', [totalVenta, idVenta]);

    // Confirmar
    await client.query('COMMIT');
    
    res.status(201).json({ mensaje: 'Venta registrada exitosamente', venta: { id: idVenta, total: totalVenta } });
  } catch (error) {
    // Si algo falla, revertimos TODO el inventario/transacción
    await client.query('ROLLBACK');
    console.error("Transacción Rollback:", error.message);
    
    const status = error.message.includes('Stock') ? 409 : 500;
    res.status(status).json({ error: error.message || 'Error al procesar la venta' });
  } finally {
    // Liberar conexion al pool
    client.release();
  }
});

module.exports = router;
