const express = require('express');
const path = require('path');
const db = require('./src/models');
const productosRouter = require('./src/routes/productos');
const ventasRouter = require('./src/routes/ventas');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sirve la pagina principal en la raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rutas de API
app.use('/', productosRouter);
app.use('/', ventasRouter);

const PORT = process.env.PORT || 3000;

// Sincronizar Sequelize y arrancar el servidor
db.sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ Base de datos sincronizada');
    app.listen(PORT, () => console.log(`🚀 Servidor AVALON en http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ Error al sincronizar base de datos:', err);
  });
