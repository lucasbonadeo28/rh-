const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 0. SERVIR LA PÁGINA WEB (EL FRONTEND)
// ==========================================
app.use(express.static(path.join(__dirname, 'frontend')));

// ==========================================
// 1. CONFIGURACIÓN DE POSTGRESQL
// ==========================================
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.DB_HOST !== 'localhost';

const poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lucas', 
    password: process.env.DB_PASSWORD || 'skou28', 
    port: process.env.DB_PORT || 5432,
};

if (isProduction && process.env.DB_HOST) {
    poolConfig.ssl = { 
        rejectUnauthorized: false,
        require: true 
    };
    console.log("🔌 Conectando a Base de Datos en la Nube...");
} else {
    console.log("💻 Conectando a Base de Datos Local...");
}

const pool = new Pool(poolConfig);

const inicializarBaseDeDatos = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                categoria VARCHAR(100),
                precio_efectivo DECIMAL(10, 2) NOT NULL,
                precio_tarjeta DECIMAL(10, 2) NOT NULL,
                descripcion TEXT,
                inventario_talles JSONB,
                imagen_url TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS banners (
                id SERIAL PRIMARY KEY,
                imagen_url TEXT NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS cupones (
                id SERIAL PRIMARY KEY,
                codigo VARCHAR(50) UNIQUE NOT NULL,
                descuento_porcentaje INT NOT NULL,
                usos_disponibles INT NOT NULL DEFAULT 0,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS ventas (
                id SERIAL PRIMARY KEY,
                cliente_nombre VARCHAR(100),
                cliente_apellido VARCHAR(100),
                cliente_email VARCHAR(255),
                cliente_telefono VARCHAR(50),
                direccion TEXT,
                costo_envio DECIMAL(10, 2),
                total DECIMAL(10, 2) NOT NULL,
                metodo_pago VARCHAR(50),
                estado VARCHAR(50) DEFAULT 'Pendiente',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS ventas_items (
                id SERIAL PRIMARY KEY,
                venta_id INT REFERENCES ventas(id) ON DELETE CASCADE,
                producto_id INT,
                nombre_producto VARCHAR(255),
                talle VARCHAR(50),
                cantidad INT,
                precio_unitario DECIMAL(10, 2)
            );
        `);
        console.log("✅ Estructura de Base de Datos verificada.");
    } catch (error) {
        console.error("❌ Error al inicializar tablas:", error);
    }
};
inicializarBaseDeDatos();

// ==========================================
// 2. CONFIGURACIÓN DE NODEMAILER (GMAIL)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tu_correo_real@gmail.com', // CAMBIAR POR TU GMAIL
        pass: 'tu_clave_de_aplicacion'    // CAMBIAR POR TU CLAVE DE APLICACIÓN DE 16 LETRAS
    }
});

// ==========================================
// 3. RUTAS DE LA API
// ==========================================

// --- PRODUCTOS ---
app.get('/api/productos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM productos ORDER BY id DESC');
        res.json(resultado.rows);
    } catch (error) { res.status(500).json({ error: "Error al traer productos" }); }
});

app.get('/api/productos/nuevos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM productos ORDER BY fecha_creacion DESC LIMIT 8');
        res.json(resultado.rows);
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

app.post('/api/productos', async (req, res) => {
    const { nombre, categoria, precio_efectivo, precio_tarjeta, descripcion, inventario_talles, imagen_url } = req.body;
    try {
        const query = 'INSERT INTO productos (nombre, categoria, precio_efectivo, precio_tarjeta, descripcion, inventario_talles, imagen_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        const resultado = await pool.query(query, [nombre, categoria, precio_efectivo, precio_tarjeta, descripcion, inventario_talles, imagen_url]);
        res.json({ success: true, producto: resultado.rows[0] });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.delete('/api/productos/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM productos WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

// --- VENTAS Y COMPRA ---
app.post('/api/comprar', async (req, res) => {
    const { total, metodo_pago, costoEnvio, cliente, productos, cupon_usado } = req.body;
    
    try {
        await pool.query('BEGIN');
        
        const insertVenta = `INSERT INTO ventas (cliente_nombre, cliente_apellido, cliente_email, cliente_telefono, direccion, costo_envio, total, metodo_pago) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;`;
        const resVenta = await pool.query(insertVenta, [cliente.nombre, cliente.apellido, cliente.email, cliente.telefono, cliente.direccion, costoEnvio, total, metodo_pago]);
        const ventaId = resVenta.rows[0].id;
        
        for (let prod of productos) {
            await pool.query(`INSERT INTO ventas_items (venta_id, producto_id, nombre_producto, talle, cantidad, precio_unitario) VALUES ($1, $2, $3, $4, $5, $6);`, 
            [ventaId, prod.id, prod.nombre, prod.talle, prod.cantidad, prod.precio_pagado]);
        }

        if (cupon_usado) {
            await pool.query('UPDATE cupones SET usos_disponibles = usos_disponibles - 1 WHERE UPPER(codigo) = UPPER($1)', [cupon_usado]);
        }

        await pool.query('COMMIT');

        // --- ARMAR EL MAIL DEL RECIBO ---
        let itemsHTML = productos.map(p => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.cantidad}x ${p.nombre} (Talle: ${p.talle})</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${p.precio_pagado * p.cantidad}</td>
            </tr>
        `).join('');

        const reciboHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background: #111; color: #fff; padding: 20px; text-align: center;">
                    <h2>RH+ JEANS STORE</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Hola <strong>${cliente.nombre}</strong>, ¡gracias por tu compra!</p>
                    <p>Hemos recibido tu pedido con éxito. Detalle de la orden <strong>#${ventaId.toString().padStart(6, '0')}</strong>:</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${itemsHTML}
                        <tr><td style="padding: 10px; text-align: right;">Envío:</td><td style="padding: 10px; text-align: right;">$${costoEnvio}</td></tr>
                        <tr><td style="padding: 10px; text-align: right;"><strong>Total:</strong></td><td style="padding: 10px; text-align: right;"><strong>$${total}</strong></td></tr>
                    </table>
                    <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #d4ba92;">
                        <p style="margin: 0;"><strong>Próximo paso:</strong> Escribinos por WhatsApp para coordinar el pago y envío.</p>
                    </div>
                </div>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: '"RH+ Jeans Store" <tu_correo_real@gmail.com>',
                to: cliente.email,
                subject: `Pedido #${ventaId.toString().padStart(6, '0')} recibido - RH+ Jeans`,
                html: reciboHTML
            });
        } catch (mErr) { console.error("Error envío mail:", mErr); }

        res.json({ success: true, orden_id: ventaId });

    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ success: false });
    }
});

app.get('/api/ventas', async (req, res) => {
    try {
        const resV = await pool.query('SELECT * FROM ventas ORDER BY id DESC');
        const ventas = resV.rows;
        for (let v of ventas) {
            const resI = await pool.query('SELECT * FROM ventas_items WHERE venta_id = $1', [v.id]);
            v.detalles = resI.rows;
        }
        res.json(ventas);
    } catch (error) { res.status(500).json({ error: "Error" }); }
});

// --- CUPONES ---
app.post('/api/validar-cupon', async (req, res) => {
    const { codigo } = req.body;
    try {
        const resC = await pool.query('SELECT * FROM cupones WHERE UPPER(codigo) = UPPER($1) AND usos_disponibles > 0', [codigo]);
        if (resC.rows.length > 0) res.json({ success: true, descuento: resC.rows[0].descuento_porcentaje });
        else res.json({ success: false, message: "Cupón no válido" });
    } catch (e) { res.status(500).json({ success: false }); }
});

// --- BANNERS ---
app.get('/api/banners/home', async (req, res) => {
    try {
        const resB = await pool.query('SELECT * FROM banners ORDER BY id DESC LIMIT 4');
        res.json(resB.rows);
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// --- RUTA FINAL PARA SPA ---
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});