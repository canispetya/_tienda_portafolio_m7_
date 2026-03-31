# AVALON — Premium Store (PostgreSQL + Sequelize)

![AVALON Miami Neon Sunset Aesthetic](https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?q=80&w=1200&auto=format&fit=crop)

Este proyecto forma parte de la entrega del **Módulo 7: Acceso a datos en Node con PostgreSQL (pg + Sequelize)**. 
Es la migración de la tienda AVALON, pasando de persistir datos en `.json` a emplear una base de datos **PostgreSQL** mediante modelos relacionales con el ORM **Sequelize**, manteniendo validaciones de stock a través de comandos y transacciones nativas con **pg** (TCL).

## 📁 Estructura del Proyecto

Se ha estructurado utilizando buenas prácticas para proyectos MVC en Node / Express:

```text
_tienda_portafolio_m7_/
├── src/
│   ├── db/
│   │   ├── pool.js             # Conexión nativa pg para transacciones TCL
│   │   └── sequelize.js        # Instancia de conexión Sequelize
│   ├── models/                 # Modelos ORM (Producto, Venta, VentaItem, index.js)
│   └── routes/                 # Endpoints RESTful (productos.js, ventas.js)
├── public/                     # Cliente HTML/CSS/JS (Vanilla & Tailwind)
├── Evidencia/                  # Capturas de pantalla comprobatorias del funcionamiento 
├── .env.example                # Variables de entorno base sugeridas
├── server.js                   # Entry point de la aplicación (Express)
├── sync.js                     # Script para sincronización inicial y seeding de DB
└── package.json                # Dependencias principales (pg, sequelize, express)
```

## 🚀 Instalación y Ejecución

Sigue estos pasos para alistar la base de datos y correr el proyeto de forma local en tu máquina:

1. **Clonar e instalar dependencias:**
   ```bash
   npm install
   ```
2. **Configurar Conexión:**
   Renombra el archivo `.env.example` a `.env` (o crea uno nuevo) y completa tu cadena de conexión a PostgreSQL.
   ```env
   DATABASE_URL=postgres://usuario:password@localhost:5432/avalon_store
   PORT=3000
   ```
3. **Migraciones y Poblar la Base de Datos (Seeding):**
   Usa el script proporcionado para forzar la creación de las tablas a través de Sequelize (`sync()`) e insertar los productos iniciales a partir del archivo estático viejo:
   ```bash
   node sync.js
   ```
4. **Arrancar el Servidor:**
   ```bash
   npm start
   # o para desarrollo continuo:
   # npm run dev
   ```
5. Accede a la aplicación en el navegador: [http://localhost:3000](http://localhost:3000)

## 🔌 API y Endpoints

### Catálogo de Productos (`/productos`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/productos` | Lista todos los productos utilizando Sequelize. |
| `GET` | `/productos/raw` | Lista productos empleando **consultas parametrizadas (prepared statements)** nativas en `pg` para evitar inyección SQL (Sugerencia de pauta). |
| `POST` | `/producto` | Crea un nuevo producto (JSON body). |
| `PUT` | `/producto` | Actualiza un producto existente por su ID. |
| `DELETE` | `/producto` | Elimina un producto por ID. |

### Transacciones de Ventas (`/ventas`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/ventas` | Obtiene el historial de todas las transacciones generadas. |
| `POST` | `/venta` | Procesa una compra en formato TCL puro (`BEGIN`, `COMMIT`, `ROLLBACK`). |

---

## 🛡️ ¿Cómo probar la Transacción TCL (POST /venta)?

La transacción por defecto está implementada con la instancia conectada en `src/db/pool.js`. Para comprobarla:

1. Agrega cualquier producto al carrito usando la interfaz web.
2. Ingresa al carrito y agrega una **cantidad mayor al stock inicial** mediante manipulación, o simplemente vacía el stock progresivamente con compras válidas.
3. Dale a **Finalizar Compra**.
4. Detrás de escena, la ruta inicia un `BEGIN`. Comienzan a evaluarse los productos a través de `UPDATE ... WHERE stock >= $1`.
5. Si no hay stock disponible, el Query devuelve un `rowCount = 0`, lo que levanta una Excepción.
6. La ejecución cae al bloque estricto `catch (e)`, el servidor efectúa un `ROLLBACK` seguro, y todas las ventas previas de esa misma canasta de compra son revertidas.
7. Se devuelve un código HTTP `409 Conflict` (o `500` en otros casos) previniendo compras imposibles.

---

## 📸 Evidencia Visual y Vistas

Este repositorio contiene una carpeta especial llamada **`/Evidencia`**. 
Contiene una serie de imágenes para apoyo visual con los requerimientos solicitados por el material (Mockups / Capturas del producto final operando):

1. **Listado de productos:** Se ilustra el consumo y renderización a través del método _GET_.
2. **Carrito:** Manejo de estado del UI, con las operaciones pre-compra.
3. **Confirmación de compra:** Un componente "Toast" verificando que la transacción (`POST`) ha retornado status `201 Created` y el UUID referenciado.
4. **Ventas:** La sección que mapea relacionalmente (`VentaItem` en Base de Datos) mostrando items comprados y el histórico.

*Prueba elaborada en cumplimiento de los estándares del curso Fullstack.*
