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
// 1. CONFIGURACIÓN DE POSTGRESQL (NUBE Y LOCAL)
// ==========================================
// Forzamos a leer las variables de entorno si existen. 
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.DB_HOST !== 'localhost';

const poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lucas', 
    password: process.env.DB_PASSWORD || 'skou28', 
    port: process.env.DB_PORT || 5432,
};

// Configuración SSL ultra-permisiva (Necesario para bases de datos gratuitas en Render)
if (isProduction && process.env.DB_HOST) {
    poolConfig.ssl = { 
        rejectUnauthorized: false,
        require: true // Obligamos a que use SSL
    };
    console.log("🔌 Conectando a Base de Datos en la Nube...");
} else {
    console.log("💻 Conectando a Base de Datos Local...");
}

const pool = new Pool(poolConfig);

// Chequeo de conexión para que nos avise en el log si pudo entrar
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error fatal adquiriendo cliente de base de datos:', err.stack);
    } else {
        console.log('✅ Conexión exitosa a PostgreSQL comprobada.');
        release();
    }
});

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
        console.log("✅ Tablas de la base de datos listas y verificadas.");
    } catch (error) {
        console.error("❌ Error al crear las tablas:", error);
    }
};
inicializarBaseDeDatos();

// ==========================================
// 2. CONFIGURACIÓN DE NODEMAILER (GMAIL)
// ==========================================
const codigosVerificacion = {}; 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tu_correo_default@gmail.com', 
        pass: 'tu_clave_de_aplicacion_aqui'  
    }
});

// ==========================================
// 3. RUTAS DE LA API (PRODUCTOS Y VENTAS)
// ==========================================
app.get('/api/productos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM productos ORDER BY id DESC');
        res.json(resultado.rows);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.get('/api/productos/nuevos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM productos ORDER BY fecha_creacion DESC LIMIT 8');
        res.json(resultado.rows);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

// Ruta para crear nuevos productos
app.post('/api/productos', async (req, res) => {
    const { nombre, categoria, precio_efectivo, precio_tarjeta, descripcion, inventario_talles, imagen_url } = req.body;
    try {
        const query = `
            INSERT INTO productos (nombre, categoria, precio_efectivo, precio_tarjeta, descripcion, inventario_talles, imagen_url) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;
        const valores = [nombre, categoria, precio_efectivo, precio_tarjeta, descripcion, inventario_talles, imagen_url];
        const resultado = await pool.query(query, valores);
        res.json({ success: true, producto: resultado.rows[0] });
    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ success: false, message: "Error al guardar en la base de datos" });
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM productos WHERE id = $1', [id]);
        res.json({ success: true, message: "Producto eliminado correctamente" });
    } catch (error) { 
        res.status(500).json({ success: false, error: "No se pudo borrar el producto" }); 
    }
});

app.get('/api/ventas', async (req, res) => {
    try {
        const resultadoVentas = await pool.query('SELECT * FROM ventas ORDER BY fecha_creacion DESC');
        const ventas = resultadoVentas.rows;
        for (let venta of ventas) {
            const resultadoItems = await pool.query('SELECT * FROM ventas_items WHERE venta_id = $1', [venta.id]);
            venta.detalles = resultadoItems.rows; 
        }
        res.json(ventas);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

// Ruta para ELIMINAR pedidos
app.delete('/api/ventas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM ventas WHERE id = $1', [id]);
        res.json({ success: true, message: "Pedido eliminado correctamente" });
    } catch (error) { 
        res.status(500).json({ success: false, error: "No se pudo borrar el pedido" }); 
    }
});

// ==========================================
// 4. RUTAS PARA BANNERS
// ==========================================
app.get('/api/banners/home', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM banners ORDER BY id DESC LIMIT 4');
        res.json(resultado.rows);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.get('/api/banners', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM banners ORDER BY id DESC');
        res.json(resultado.rows);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.post('/api/banners', async (req, res) => {
    const { imagen_url } = req.body;
    if(!imagen_url) return res.status(400).json({ error: "La URL de la imagen es obligatoria"});
    try {
        const countRes = await pool.query('SELECT count(*) FROM banners');
        if (parseInt(countRes.rows[0].count) >= 4) {
            await pool.query('DELETE FROM banners WHERE id IN (SELECT id FROM banners ORDER BY id ASC LIMIT 1)');
        }
        const query = 'INSERT INTO banners (imagen_url) VALUES ($1) RETURNING *';
        const resultado = await pool.query(query, [imagen_url]);
        res.json(resultado.rows[0]);
    } catch (error) { res.status(500).json({ error: "Error interno al subir el banner" }); }
});

app.delete('/api/banners/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM banners WHERE id = $1', [id]);
        res.json({ message: "Banner eliminado correctamente"});
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

// ==========================================
// 5. RUTAS DE CUPONES
// ==========================================
app.post('/api/validar-cupon', async (req, res) => {
    const { codigo } = req.body;
    if(!codigo) return res.status(400).json({ success: false, message: "Código vacío" });

    try {
        const query = 'SELECT * FROM cupones WHERE UPPER(codigo) = UPPER($1) AND usos_disponibles > 0';
        const resultado = await pool.query(query, [codigo]);

        if (resultado.rows.length > 0) {
            res.json({ success: true, descuento: resultado.rows[0].descuento_porcentaje });
        } else {
            res.json({ success: false, message: "Cupón inválido, expirado o agotado" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});

app.get('/api/cupones', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM cupones ORDER BY id DESC');
        res.json(resultado.rows);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.post('/api/cupones', async (req, res) => {
    const { codigo, descuento_porcentaje, usos_disponibles } = req.body;
    try {
        const query = 'INSERT INTO cupones (codigo, descuento_porcentaje, usos_disponibles) VALUES ($1, $2, $3) RETURNING *';
        const resultado = await pool.query(query, [codigo.toUpperCase(), descuento_porcentaje, usos_disponibles]);
        res.json(resultado.rows[0]);
    } catch (error) { 
        res.status(500).json({ error: "Error interno o código duplicado" }); 
    }
});

app.delete('/api/cupones/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM cupones WHERE id = $1', [id]);
        res.json({ message: "Cupón eliminado" });
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

// ==========================================
// 6. RUTAS DE CORREO Y COMPRA
// ==========================================
app.post('/api/enviar-codigo', async (req, res) => {
    const { email } = req.body;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString(); 
    codigosVerificacion[email] = codigo;
    try {
        await transporter.sendMail({
            from: '"LUCAS STORE" <tu_correo_default@gmail.com>', 
            to: email,
            subject: 'Tu código de verificación - Lucas Store',
            html: `<h3>¡Hola!</h3><p>Tu código para finalizar la compra en <b>LUCAS STORE</b> es:</p><h2 style="color:#563318; font-size: 24px; letter-spacing: 2px;">${codigo}</h2><p>Si no solicitaste este código, ignorá este correo.</p>`
        });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: 'No se pudo enviar el correo' }); }
});

app.post('/api/verificar-codigo', (req, res) => {
    const { email, codigo } = req.body;
    if (codigosVerificacion[email] && codigosVerificacion[email] === codigo) {
        delete codigosVerificacion[email]; 
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'Código incorrecto' });
    }
});

app.post('/api/comprar', async (req, res) => {
    const { total, metodo_pago, costoEnvio, cliente, productos, cupon_usado } = req.body;
    
    try {
        await pool.query('BEGIN');
        const insertVentaQuery = `INSERT INTO ventas (cliente_nombre, cliente_apellido, cliente_email, cliente_telefono, direccion, costo_envio, total, metodo_pago, estado, fecha_creacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pendiente', CURRENT_TIMESTAMP) RETURNING id;`;
        const valoresVenta = [cliente.nombre, cliente.apellido, cliente.email, cliente.telefono, cliente.direccion, costoEnvio, total, metodo_pago];
        const resultadoVenta = await pool.query(insertVentaQuery, valoresVenta);
        const ventaId = resultadoVenta.rows[0].id;
        
        const insertItemQuery = `INSERT INTO ventas_items (venta_id, producto_id, nombre_producto, talle, cantidad, precio_unitario) VALUES ($1, $2, $3, $4, $5, $6);`;
        for (let prod of productos) {
            await pool.query(insertItemQuery, [ventaId, prod.id, prod.nombre, prod.talle, prod.cantidad, prod.precio_pagado]);
        }

        if (cupon_usado) {
            await pool.query('UPDATE cupones SET usos_disponibles = usos_disponibles - 1 WHERE UPPER(codigo) = UPPER($1)', [cupon_usado]);
        }

        await pool.query('COMMIT');

        let itemsHTML = productos.map(p => `
            <tr>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; color: #333;">${p.cantidad}x ${p.nombre} <br><small style="color:#777;">Talle: ${p.talle}</small></td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #333;">$${p.precio_pagado * p.cantidad}</td>
            </tr>
        `).join('');

        let descuentoHTML = cupon_usado ? `
            <tr>
                <td style="padding: 12px 10px; text-align: right; color: #555;"><strong>Descuento aplicado:</strong></td>
                <td style="padding: 12px 10px; text-align: right; color: #27ae60;">Cupón ${cupon_usado}</td>
            </tr>
        ` : '';

        const mensajeSiguientePaso = metodo_pago === 'transferencia' 
            ? `Como elegiste pago por <strong>Transferencia</strong>, a la brevedad nos pondremos en contacto con vos al número ${cliente.telefono} vía WhatsApp para pasarte el CBU/Alias y coordinar el envío.`
            : `Hemos registrado tu pedido con pago vía <strong>Mercado Pago</strong>. Nos comunicaremos al ${cliente.telefono} para coordinar los detalles del envío.`;

        const plantillaReciboHTML = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background-color: #111; padding: 25px; text-align: center;">
                    <h2 style="margin: 0; color: #fff; font-size: 24px; letter-spacing: 2px;">LUCAS STORE</h2>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #333; margin-top: 0;">Hola <strong>${cliente.nombre}</strong>,</p>
                    <p style="font-size: 15px; color: #555; line-height: 1.5;">¡Muchas gracias por elegirnos! Hemos recibido tu pedido correctamente. Acá tenés el comprobante con el detalle de tu compra:</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #eee;">
                        <h3 style="margin-top: 0; color: #111; border-bottom: 2px solid #ddd; padding-bottom: 10px;">Orden #${ventaId}</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            ${itemsHTML}
                            <tr>
                                <td style="padding: 12px 10px; text-align: right; color: #555;"><strong>Costo de Envío:</strong></td>
                                <td style="padding: 12px 10px; text-align: right; color: #333;">$${costoEnvio}</td>
                            </tr>
                            ${descuentoHTML}
                            <tr>
                                <td style="padding: 15px 10px; text-align: right; font-size: 18px; color: #111;"><strong>Total a Pagar:</strong></td>
                                <td style="padding: 15px 10px; text-align: right; font-size: 20px; color: #27ae60;"><strong>$${total}</strong></td>
                            </tr>
                        </table>
                    </div>
                    <div style="background: #eafaf1; padding: 15px 20px; border-radius: 8px; border-left: 5px solid #27ae60;">
                        <p style="font-size: 14px; color: #2c3e50; margin: 0; line-height: 1.5;">
                            <strong>¿Qué sigue ahora?</strong><br>
                            ${mensajeSiguientePaso}
                        </p>
                    </div>
                </div>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #888; margin: 0;">
                        © ${new Date().getFullYear()} Lucas Store. Todos los derechos reservados.<br>
                        Santa Fe, Argentina.
                    </p>
                </div>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: '"LUCAS STORE" <tu_correo_default@gmail.com>', 
                to: cliente.email, 
                subject: `¡Gracias por tu compra! Comprobante de Orden #${ventaId}`,
                html: plantillaReciboHTML
            });
        } catch (mailError) {
            console.error("Error al enviar el recibo por mail:", mailError);
        }

        res.json({ success: true, message: 'Compra registrada con éxito', orden_id: ventaId });
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ success: false, message: 'Error interno al procesar la compra' });
    }
});

app.post('/api/crear_preferencia', async (req, res) => {
    const { items, cliente, costoEnvio } = req.body;
    res.json({ init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=ficticia-12345' });
});

// Para que cualquier ruta devuelva el index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Lucas Store corriendo en el puerto ${PORT}`);
});