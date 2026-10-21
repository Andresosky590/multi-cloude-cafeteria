const express = require('express');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1. Pool para XAMPP (MySQL Local en la VM)
const poolLocal = mysql.createPool({
    host: process.env.DB_LOCAL_HOST,
    user: process.env.DB_LOCAL_USER,
    password: process.env.DB_LOCAL_PASSWORD,
    database: process.env.DB_LOCAL_NAME,
    port: process.env.DB_LOCAL_PORT || 3306
});

// 2. Pool para Azure Database for MySQL (Flexible Server)
const poolAzure = mysql.createPool({
    host: process.env.DB_AZURE_HOST,
    user: process.env.DB_AZURE_USER,
    password: process.env.DB_AZURE_PASSWORD,
    database: process.env.DB_AZURE_NAME,
    ssl: { rejectUnauthorized: true }
});

// 3. Pool para Supabase (PostgreSQL)
const poolSupabase = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
});

app.get('/api/test', (req, res) => {
    res.json({ success: true, mensaje: "¡El servidor responde correctamente!" });
});

// ENDPOINT 1: POS Local (XAMPP)
app.get('/api/pos-local', async (req, res) => {
    try {
        const [productos] = await poolLocal.query('SELECT * FROM tbl_productos_local');
        const [ventas] = await poolLocal.query('SELECT * FROM tbl_ventas_diarias');
        res.json({ success: true, productos, ventas });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ENDPOINT 2: Clientes Azure
app.get('/api/clientes-azure', async (req, res) => {
    try {
        const [aprendices] = await poolAzure.query('SELECT * FROM tbl_aprendices_clientes');
        const [empleados] = await poolAzure.query('SELECT * FROM tbl_empleados');
        res.json({ success: true, aprendices, empleados });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ENDPOINT 3: Alertas Supabase
app.get('/api/alertas-supabase', async (req, res) => {
    try {
        const pqrs = await poolSupabase.query('SELECT * FROM tbl_sugerencias_pqr');
        const alertas = await poolSupabase.query('SELECT * FROM tbl_alertas_inventario');
        res.json({ success: true, pqrs: pqrs.rows, alertas: alertas.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de la Cafetería SENA corriendo en el puerto ${PORT}`);
});