let productos = [];
let carrito = [];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarProductos();
    await cargarVentas();

    document.getElementById('cart-tgl').addEventListener('click', (e) => {
        e.preventDefault();
        const sec = document.getElementById('cart-section');
        // If it's closed, open it and scroll. If it's open, just scroll to it (don't close on first click if visible)
        if (sec.classList.contains('hidden')) {
            sec.classList.remove('hidden');
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Already open? Scroll to it.
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    document.getElementById('checkout-btn').addEventListener('click', procesarCompra);
});

/* ─── Data ──────────────────────────────────────────────── */

async function cargarProductos() {
    try {
        const res = await fetch('/productos');
        if (!res.ok) throw new Error('Error del servidor');
        productos = await res.json();
        renderProductos();
    } catch (err) {
        console.error(err);
        document.getElementById('product-list').innerHTML =
            '<p class="col-span-full text-center text-red-400 py-10">Error al cargar el catálogo.</p>';
    }
}

/* ─── Render Products ───────────────────────────────────── */

function renderProductos() {
    const list = document.getElementById('product-list');
    list.innerHTML = '';

    if (!productos.length) {
        list.innerHTML = '<p class="col-span-full text-center text-gray-500 py-10">No hay productos disponibles.</p>';
        return;
    }

    productos.forEach((prod, i) => {
        const inStock = prod.stock > 0;

        const card = document.createElement('article');
        card.className = 'glass-card rounded-2xl overflow-hidden group transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,45,123,0.15)] hover:-translate-y-1 animate-slide-up';
        card.style.animationDelay = `${i * 0.08}s`;
        card.style.animationFillMode = 'both';

        card.innerHTML = `
            <!-- Image -->
            <div class="relative product-img-wrap h-56 overflow-hidden">
                <img src="${prod.imagen}" alt="${prod.nombre}"
                     class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                ${inStock
                    ? `<span class="absolute top-3 right-3 z-10 text-[10px] font-display font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-neon-cyan text-avalon-black shadow-[0_0_15px_rgba(0,245,255,0.5)]">Stock ${prod.stock}</span>`
                    : `<span class="absolute top-3 right-3 z-10 text-[10px] font-display font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]">Agotado</span>`
                }
            </div>

            <!-- Info -->
            <div class="p-5 flex flex-col gap-3">
                <h3 class="font-body font-semibold text-white text-lg leading-tight group-hover:text-neon-pink transition-colors duration-300">${prod.nombre}</h3>
                <p class="font-display text-2xl font-bold tracking-wider text-neon-cyan">$${Number(prod.precio).toLocaleString('es-CL')}</p>
                ${inStock
                    ? `<button onclick="agregarAlCarrito('${prod.id}')"
                         class="btn-neon w-full py-3 rounded-xl font-display text-xs tracking-[0.2em] font-bold text-white uppercase mt-auto">
                         AGREGAR AL CARRITO
                       </button>`
                    : `<button disabled
                         class="w-full py-3 rounded-xl font-display text-xs tracking-[0.2em] font-bold text-gray-600 uppercase mt-auto bg-avalon-border/30 cursor-not-allowed border border-avalon-border/50">
                         SIN STOCK
                       </button>`
                }
            </div>
        `;
        list.appendChild(card);
    });
}

/* ─── Cart ──────────────────────────────────────────────── */

function agregarAlCarrito(idRaw) {
    const id = Number(idRaw);
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    const item = carrito.find(c => c.id === id);
    if (item) {
        if (item.cantidad >= prod.stock) { showToast('Stock máximo alcanzado', 'warn'); return; }
        item.cantidad++;
    } else {
        carrito.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1, stockMax: prod.stock });
    }

    showToast(`${prod.nombre} agregado al carrito`, 'success');
    renderCarrito();

    // Auto-open cart and scroll
    const cartSec = document.getElementById('cart-section');
    cartSec.classList.remove('hidden');
    cartSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function eliminarDelCarrito(idRaw) {
    const id = Number(idRaw);
    carrito = carrito.filter(c => c.id !== id);
    renderCarrito();
    showToast('Producto eliminado del carrito', 'info');
}

function actualizarCantidad(idRaw, delta) {
    const id = Number(idRaw);
    const item = carrito.find(c => c.id === id);
    if (!item) return;

    const nuevaCant = item.cantidad + delta;

    if (nuevaCant <= 0) {
        eliminarDelCarrito(id);
        return;
    }

    if (delta > 0 && nuevaCant > item.stockMax) {
        showToast('Stock máximo alcanzado', 'warn');
        return;
    }

    item.cantidad = nuevaCant;
    renderCarrito();
}

function renderCarrito() {
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    let total = 0, count = 0;

    if (!carrito.length) {
        container.innerHTML = '<p class="text-gray-600 text-sm py-4">Tu carrito está vacío.</p>';
    } else {
        carrito.forEach(item => {
            const sub = item.precio * item.cantidad;
            total += sub;
            count += item.cantidad;

            const row = document.createElement('div');
            row.className = 'flex items-center justify-between gap-4 py-4 border-b border-avalon-border/30 animate-fade-in group/item';
            row.innerHTML = `
                <div class="flex-1 min-w-0">
                    <p class="font-body font-semibold text-white truncate">${item.nombre}</p>
                    <p class="text-sm text-gray-500 mt-1">$${Number(item.precio).toLocaleString('es-CL')} unidad</p>
                </div>
                
                <div class="flex items-center gap-3 bg-avalon-black/40 px-3 py-1.5 rounded-lg border border-avalon-border/50">
                    <button onclick="actualizarCantidad('${item.id}', -1)" 
                        class="w-6 h-6 flex items-center justify-center rounded bg-avalon-border/50 text-gray-400 hover:text-neon-pink hover:bg-neon-pink/10 transition-colors">-</button>
                    <span class="font-display text-sm font-bold w-4 text-center text-white">${item.cantidad}</span>
                    <button onclick="actualizarCantidad('${item.id}', 1)" 
                        class="w-6 h-6 flex items-center justify-center rounded bg-avalon-border/50 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors">+</button>
                </div>

                <div class="text-right shrink-0">
                    <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Subtotal</p>
                    <p class="font-display text-lg font-bold text-neon-cyan tracking-wider">$${sub.toLocaleString()}</p>
                    <button onclick="eliminarDelCarrito('${item.id}')"
                        class="text-[10px] uppercase tracking-widest text-red-500/60 hover:text-red-400 transition-colors mt-2 underline decoration-red-500/20 underline-offset-4">Eliminar</button>
                </div>
            `;
            container.appendChild(row);
        });
    }

    // Update badge
    const badge = document.getElementById('cart-count');
    badge.textContent = count;
    badge.classList.toggle('scale-0', count === 0);
    badge.classList.toggle('scale-100', count > 0);

    const iva = total * 0.19;
    const finalTotal = total + iva;

    document.getElementById('cart-subtotal').textContent = `$${total.toLocaleString('es-CL')}`;
    document.getElementById('cart-iva').textContent = `$${Math.round(iva).toLocaleString('es-CL')}`;
    document.getElementById('cart-total').textContent = `$${Math.round(finalTotal).toLocaleString('es-CL')}`;
    document.getElementById('checkout-btn').disabled = carrito.length === 0;
}

/* ─── Checkout ──────────────────────────────────────────── */

async function procesarCompra() {
    if (!carrito.length) return;

    const btn = document.getElementById('checkout-btn');
    const orig = btn.textContent;
    btn.textContent = 'PROCESANDO…';
    btn.disabled = true;

    try {
        const payload = carrito.map(i => ({ id: i.id, cantidad: i.cantidad }));
        const res = await fetch('/venta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carrito: payload })
        });
        const data = await res.json();

        if (res.ok) {
            showToast('¡Compra exitosa! ID de transacción: ' + data.venta.id, 'success');
            carrito = [];
            renderCarrito();
            await cargarProductos();
            await cargarVentas();
            document.getElementById('cart-section').classList.add('hidden');
        } else {
            showToast(data.error || 'Error al procesar la venta', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error de conexión con el servidor', 'error');
    } finally {
        btn.textContent = orig;
        btn.disabled = carrito.length === 0;
    }
}

/* ─── Toast ─────────────────────────────────────────────── */

function showToast(msg, type = 'info') {
    const colors = {
        success: 'from-neon-cyan/20 border-neon-cyan/40 text-neon-cyan',
        warn:    'from-sunset-gold/20 border-sunset-gold/40 text-sunset-gold',
        error:   'from-neon-pink/20 border-neon-pink/40 text-neon-pink',
        info:    'from-sunset-purple/20 border-sunset-purple/40 text-white',
    };
    const cls = colors[type] || colors.info;

    const el = document.createElement('div');
    el.className = `toast pointer-events-auto px-5 py-3 rounded-xl border backdrop-blur-xl bg-gradient-to-r ${cls} font-body text-sm shadow-lg`;
    el.textContent = msg;

    const container = document.getElementById('toast-container');
    container.appendChild(el);
    setTimeout(() => el.remove(), 3200);
}

/* ─── Ventas Fetching ───────────────────────────────────── */
async function cargarVentas() {
    try {
        const res = await fetch('/ventas');
        if (!res.ok) throw new Error('Error al cargar ventas');
        const ventas = await res.json();
        
        const tbody = document.getElementById('ventas-tbody');
        tbody.innerHTML = '';
        
        if (!ventas || ventas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-gray-600">No hay ventas registradas.</td></tr>';
            return;
        }
        
        ventas.forEach(venta => {
            const fecha = new Date(venta.fecha).toLocaleString('es-CL');
            const total = Number(venta.total).toLocaleString('es-CL');
            const itemsCount = venta.VentaItems ? venta.VentaItems.length : 0;
            
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-avalon-card transition-colors';
            tr.innerHTML = `
                <td class="py-3 px-4 font-display font-bold text-white">#${venta.id}</td>
                <td class="py-3 px-4">${fecha}</td>
                <td class="py-3 px-4">${itemsCount} prod.</td>
                <td class="py-3 px-4 text-right font-display text-neon-cyan">$${total}</td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch(e) {
        console.error("No se pudo cargar historial de ventas:", e);
    }
}
