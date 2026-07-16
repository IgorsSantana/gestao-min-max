const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const AsyncLock = require('async-lock');
const { getEstoqueData, updateLimites, getModelos, getPerformanceData } = require('./db');
const { logAuditoria, getAuditoria, authenticateUser } = require('./auditDb');

const app = express();

// Rate Limiting Global: 200 requests por minuto por IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 200, 
  message: { error: "Muitas requisições deste IP, tente novamente em 1 minuto" }
});
app.use(limiter);
app.use(compression()); // Habilita compressão Gzip/Deflate
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8900;

// Cache em Memória com Bloqueios (AsyncLock)
let cacheData = null;
let cacheTimestamp = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

let cachePerfData = null;
let cachePerfTimestamp = null;
const CACHE_PERF_TTL = 60 * 60 * 1000; // 1 hora

const lock = new AsyncLock();

app.get('/api/estoque', async (req, res) => {
    try {
        const forceRefresh = req.query.force === 'true';
        let now = Date.now();
        let isCacheValid = cacheData && cacheTimestamp && (now - cacheTimestamp < CACHE_TTL);

        if (isCacheValid && !forceRefresh) {
            console.log(`[Cache] Servindo dados de estoque direto da RAM (${cacheData.length} itens)`);
            return res.json(cacheData);
        }

        console.log(`[DB2] Buscando dados de estoque direto do Banco de Dados...`);
        
        // Bloqueio para evitar que várias requisições atualizem o cache e batam no DB2 ao mesmo tempo
        const data = await lock.acquire('cache_update_lock', async () => {
            // Verifica novamente caso o cache tenha sido preenchido enquanto esperava o lock
            now = Date.now();
            isCacheValid = cacheData && cacheTimestamp && (now - cacheTimestamp < CACHE_TTL);
            if (isCacheValid && !forceRefresh) {
                console.log(`[Cache] Dados obtidos logo após liberação do Lock.`);
                return cacheData;
            }

            const freshData = await getEstoqueData();
            
            // Atualiza o Cache global
            cacheData = freshData;
            cacheTimestamp = now;
            return freshData;
        });

        res.json(data);
    } catch (error) {
        console.error("Erro na API:", error);
        res.status(500).json({ error: "Erro ao buscar dados do estoque", details: error.message });
    }
});

app.get('/api/modelos', async (req, res) => {
    try {
        const modelos = await getModelos();
        res.json(modelos);
    } catch (error) {
        console.error("Erro na API Modelos:", error);
        res.status(500).json({ error: "Erro ao buscar modelos" });
    }
});

app.get('/api/performance', async (req, res) => {
    try {
        const forceRefresh = req.query.force === 'true';
        let now = Date.now();
        let isCacheValid = cachePerfData && cachePerfTimestamp && (now - cachePerfTimestamp < CACHE_PERF_TTL);

        if (isCacheValid && !forceRefresh) {
            console.log(`[Cache] Servindo dados de performance direto da RAM`);
            return res.json(cachePerfData);
        }

        console.log(`[DB2] Buscando dados de performance (Vendas/Perdas 90d)...`);
        
        const perfData = await lock.acquire('cache_perf_lock', async () => {
            now = Date.now();
            isCacheValid = cachePerfData && cachePerfTimestamp && (now - cachePerfTimestamp < CACHE_PERF_TTL);
            if (isCacheValid && !forceRefresh) {
                console.log(`[Cache] Dados de performance obtidos logo após liberação do Lock.`);
                return cachePerfData;
            }

            const freshData = await getPerformanceData();
            cachePerfData = freshData;
            cachePerfTimestamp = now;
            return freshData;
        });

        res.json(perfData);
    } catch (error) {
        console.error("Erro na API de Performance:", error);
        res.status(500).json({ error: "Erro ao buscar dados de performance", details: error.message });
    }
});

app.post('/api/estoque/limites', async (req, res) => {
    try {
        const { updates, auditLogs } = req.body;
        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ error: "Formato inválido. Esperado { updates: [...] }" });
        }
        
        // Validação Estrita de Dados
        for (let i = 0; i < updates.length; i++) {
            const upd = updates[i];
            if (upd.IDEMPRESA == null || upd.IDPRODUTO == null || upd.IDSUBPRODUTO == null) {
                return res.status(400).json({ error: `Payload corrompido no item ${i}: IDEMPRESA, IDPRODUTO e IDSUBPRODUTO são obrigatórios.` });
            }
        }
        
        // Aplica o bloqueio para que uma transação de gravação ocorra por vez
        await lock.acquire('cache_update_lock', async () => {
            console.log(`[AsyncLock] Lock adquirido para atualização em lote e revalidação de cache.`);
            await updateLimites(updates);

            if (auditLogs && auditLogs.length > 0) {
                await logAuditoria(auditLogs).catch(err => console.error("Erro ao salvar auditoria:", err));
            }
            
            // Invalidação Granular do Cache: Atualiza apenas os produtos alterados em RAM
            if (cacheData) {
                updates.forEach(upd => {
                    const idx = cacheData.findIndex(r => r.EMPRESA === upd.idEmpresa && r.COD_INTERNO === upd.idSubProduto);
                    if (idx !== -1) {
                        if (upd.min !== undefined) cacheData[idx].QTD_MIN_REAL = upd.min;
                        if (upd.max !== undefined) cacheData[idx].QTD_MAX_REAL = upd.max;
                        if (upd.inativoCompra !== undefined) cacheData[idx].INATIVO_COMPRA_REAL = upd.inativoCompra;
                        if (upd.referencia !== undefined) cacheData[idx].REFERENCIA = upd.referencia;
                        if (upd.modelo !== undefined) cacheData[idx].MODELO = upd.modelo;
                    }
                });
                console.log(`[Cache] Atualização granular concluída para ${updates.length} itens sob bloqueio seguro.`);
            }
        });
        
        res.json({ success: true, message: `${updates.length} produto(s) atualizado(s) com sucesso.` });
    } catch (error) {
        console.error("Erro no Write-Back:", error);
        res.status(500).json({ error: "Erro ao atualizar limites no banco", details: error.message });
    }
});

app.get('/api/auditoria', async (req, res) => {
    try {
        const logs = await getAuditoria();
        res.json(logs);
    } catch (error) {
        console.error("Erro na API de Auditoria:", error);
        res.status(500).json({ error: "Erro ao buscar logs de auditoria" });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
        }
        const user = await authenticateUser(username, password);
        if (user) {
            res.json({ success: true, username: user.username });
        } else {
            res.status(401).json({ error: "Usuário ou senha inválidos" });
        }
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: "Erro interno ao autenticar" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
