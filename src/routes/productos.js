const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { Producto } = require('../models');

// GET /productos -> Lista todos los productos con Sequelize
router.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.findAll({
      order: [['id', 'ASC']]
    });
    res.status(200).json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /productos/raw -> Implementado con pg + prepared statements (Sugerencia)
router.get('/productos/raw', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, precio, stock, imagen FROM productos WHERE stock >= $1 ORDER BY id ASC',
      [0] // Consulta parametrizada
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar productos mediante pg (raw)' });
  }
});

// POST /producto -> Crea un producto en PostgreSQL
router.post('/producto', async (req, res) => {
  try {
    const { nombre, precio, stock, imagen } = req.body;
    
    if (!nombre || precio == null || stock == null) {
      return res.status(400).json({ error: 'Faltan datos requeridos (nombre, precio, stock)' });
    }

    const nuevoProducto = await Producto.create({
      nombre,
      precio,
      stock,
      imagen: imagen || 'https://via.placeholder.com/600x400?text=Sin+Imagen'
    });

    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /producto -> Actualiza datos de un producto
router.put('/producto', async (req, res) => {
  try {
    const { id, nombre, precio, stock, imagen } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID del producto a actualizar' });
    }

    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.update({
      nombre: nombre !== undefined ? nombre : producto.nombre,
      precio: precio !== undefined ? precio : producto.precio,
      stock: stock !== undefined ? stock : producto.stock,
      imagen: imagen !== undefined ? imagen : producto.imagen
    });

    res.status(200).json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /producto -> Elimina un producto por id
router.delete('/producto', async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID del producto a eliminar' });
    }

    const borrados = await Producto.destroy({
      where: { id }
    });

    if (borrados === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.status(200).json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
