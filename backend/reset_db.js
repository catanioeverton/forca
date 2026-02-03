require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function reset() {
    try {
        await client.connect();
        console.log("🔥 Conectado ao banco. Iniciando limpeza...");

        // Apaga as tabelas se elas existirem
        await client.query("DROP TABLE IF EXISTS market_history;");
        await client.query("DROP TABLE IF EXISTS users;");

        console.log("✅ Tabelas 'market_history' e 'users' foram EXCLUÍDAS com sucesso.");
        console.log("🧹 O banco de dados está vazio e pronto para recomeçar.");
    } catch (err) {
        console.error("❌ Erro ao limpar:", err);
    } finally {
        await client.end();
    }
}

reset();