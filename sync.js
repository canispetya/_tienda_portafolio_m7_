const path = require('path');
const { promises: fs } = require('fs');
const db = require('./src/models');

const DATA_DIR = path.join(__dirname, 'data');
const FILE_PROD = path.join(DATA_DIR, 'productos.json');

const seeder = async () => {
  try {
    console.log('⏳ Iniciando sincronización de Base de Datos...');
    await db.sequelize.sync({ force: true });
    console.log('✅ Base de datos recreada (force: true)');

    const productosData = await fs.readFile(FILE_PROD, 'utf-8');
    const productos = JSON.parse(productosData);

    console.log('📦 Insertando productos desde productos.json...');
    
    // We map the old JSON to the new model (ignoring the old UUID id)
    for (const prod of productos) {
      await db.Producto.create({
        nombre: prod.nombre,
        precio: parseFloat(prod.precio),
        stock: parseInt(prod.stock, 10),
        imagen: prod.imagen
      });
    }

    console.log('✅ Productos insertados correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al sincronizar db:', error);
    process.exit(1);
  }
};

seeder();
