require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- CONEXÃO COM O BANCO (NEON) ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- ESTRUTURA VAZIA (FALLBACK) ---
const EMPTY_DATA = {
    metadata: { last_update: "AGUARDANDO...", timestamp_full: "" },
    setups: { setup_1h: "...", setup_4h: "...", setup_daily: "..." },
    data: { h1: {}, h4: {}, daily: {} },
    scores: { h1: {}, h4: {}, daily: {} }
};

// --- INICIALIZAÇÃO DO BANCO ---
const initDB = async () => {
    try {
        // 1. Cria tabelas se não existirem
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                permissions TEXT NOT NULL
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS market_history (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_json TEXT NOT NULL
            );
        `);

        // 2. Garante que o Admin existe com a senha #Carinho123
        const res = await pool.query("SELECT * FROM users WHERE username = $1", ['admin']);
        const defaultPerms = JSON.stringify(['live', 'excel', 'terminal', 'history']);

        if (res.rows.length === 0) {
            // Se não existe, cria
            await pool.query(
                "INSERT INTO users (username, password, role, permissions) VALUES ($1, $2, $3, $4)",
                ['admin', '#Carinho123', 'admin', defaultPerms]
            );
            console.log("🔒 Usuário ADMIN criado com senha: #Carinho123");
        } else {
            // Se já existe, ATUALIZA a senha
            await pool.query(
                "UPDATE users SET password = $1 WHERE username = $2",
                ['#Carinho123', 'admin']
            );
            console.log("🔒 Senha do ADMIN atualizada com sucesso para: #Carinho123");
        }

        console.log("✅ Banco de Dados PostgreSQL conectado.");
    } catch (err) {
        console.error("❌ Erro DB:", err);
    }
};

initDB();

// --- ROTAS ---

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
        if (rows.length > 0) {
            const user = rows[0];
            res.json({
                id: user.id,
                username: user.username,
                role: user.role,
                permissions: JSON.parse(user.permissions)
            });
        } else {
            res.status(401).json({ error: "Credenciais inválidas" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar Usuários
app.get('/api/users', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT id, username, role, permissions FROM users");
        const users = rows.map(u => ({ ...u, permissions: JSON.parse(u.permissions) }));
        res.json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Criar Usuário
app.post('/api/users', async (req, res) => {
    const { username, password, role, permissions } = req.body;
    try {
        const { rows } = await pool.query(
            "INSERT INTO users (username, password, role, permissions) VALUES ($1, $2, $3, $4) RETURNING id",
            [username, password, role, JSON.stringify(permissions)]
        );
        res.json({ id: rows[0].id, username, role, permissions });
    } catch (err) { res.status(400).json({ error: "Erro ao criar usuário." }); }
});

// Deletar Usuário
app.delete('/api/users/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
        res.json({ message: "Deletado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Histórico
app.get('/api/history', async (req, res) => {
    const { period } = req.query;
    let interval = period === 'month' ? "30 days" : "7 days";
    try {
        const { rows } = await pool.query(`
            SELECT timestamp, data_json 
            FROM market_history 
            WHERE timestamp >= NOW() - INTERVAL '${interval}' 
            ORDER BY timestamp DESC
        `);
        const historyData = rows.map(row => {
            try {
                const parsed = JSON.parse(row.data_json);
                // Injeta o last_update do metadata dentro do objeto principal se necessário
                return { timestamp: row.timestamp, ...parsed };
            } catch { return null; }
        }).filter(i => i);
        res.json(historyData);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Live Data
app.get('/api/live-data', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT data_json FROM market_history ORDER BY id DESC LIMIT 1");
        if (rows.length > 0) {
            res.json(JSON.parse(rows[0].data_json));
        } else {
            res.json(EMPTY_DATA);
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
    console.log(`📡 Backend PostgreSQL rodando na porta ${PORT}`);
});