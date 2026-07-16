const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'auditoria.db');
const auditDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de auditoria (SQLite):", err.message);
    } else {
        console.log("Conectado ao banco local de auditoria (SQLite).");
        auditDb.run(`CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idEmpresa INTEGER,
            idProduto INTEGER,
            idSubProduto INTEGER,
            campoAlterado TEXT,
            valorAntigo TEXT,
            valorNovo TEXT,
            usuario TEXT,
            dataHora DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        auditDb.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`, () => {
            // Semeia usuários básicos caso a tabela esteja vazia (ignorando erros de unique)
            auditDb.run(`INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'admin123')`);
            auditDb.run(`INSERT OR IGNORE INTO users (username, password) VALUES ('comprador', '123456')`);
        });
    }
});

function logAuditoria(alteracoes) {
    return new Promise((resolve, reject) => {
        if (!alteracoes || alteracoes.length === 0) return resolve();

        auditDb.serialize(() => {
            auditDb.run("BEGIN TRANSACTION");
            const stmt = auditDb.prepare(`INSERT INTO audit_logs (idEmpresa, idProduto, idSubProduto, campoAlterado, valorAntigo, valorNovo, usuario) VALUES (?, ?, ?, ?, ?, ?, ?)`);
            
            alteracoes.forEach(alt => {
                stmt.run(alt.idEmpresa, alt.idProduto, alt.idSubProduto, alt.campo, alt.valorAntigo, alt.valorNovo, alt.usuario);
            });

            stmt.finalize();
            auditDb.run("COMMIT", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

function getAuditoria() {
    return new Promise((resolve, reject) => {
        auditDb.all(`SELECT * FROM audit_logs ORDER BY dataHora DESC LIMIT 1000`, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
        auditDb.get(`SELECT username FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
            if (err) reject(err);
            else resolve(row || null); // Retorna o usuário se bater, null se falhar
        });
    });
}

module.exports = {
    logAuditoria,
    getAuditoria,
    authenticateUser
};
