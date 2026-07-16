const odbc = require('odbc');
require('dotenv').config();

// Força o driver ODBC do DB2 a converter os dados para UTF-8, evitando o ''
process.env.DB2CODEPAGE = '1208';

const connectionString = process.env.ODBC_CONNECTION_STRING;

if (!connectionString) {
    console.error("FATAL ERROR: A variável de ambiente ODBC_CONNECTION_STRING não foi encontrada.");
    console.error("Verifique o arquivo .env no diretório backend.");
    process.exit(1);
}

const query = `
SELECT 
    T.*,
    (T.ESTOQUE_MAXIMO_ATUAL * T.PRECO_VAREJO) AS VALOR_ESTOQUE_MAX_ATUAL,
    (T.ESTOQUE_MAXIMO_ATUAL * T.PRECO_VAREJO) AS VALOR_ESTOQUE_MAX_NOVO,
    ((T.QTDE_VENDA / 3.0) * T.PRECO_VAREJO) AS VENDA_VALOR_TRIMESTRE,
    ((T.QTDE_VENDA / 3.0) * T.PRECO_VAREJO) AS MEDIA_VENDA_MENSAL,
    (T.ESTOQUE_MAXIMO_ATUAL / NULLIF((T.QTDE_VENDA / 3.0), 0)) * 30 AS COBERTURA_DIAS,
    -- NOVOS KPIs (Fase 2)
    ((T.QTDE_VENDA / 3.0) * T.CUSTO_GERENC) AS CMV_30D,
    ((T.QTDE_VENDA / 3.0) * (T.PRECO_VAREJO - T.CUSTO_GERENC)) AS LUCRO_BRUTO_30D,
    (T.ESTOQUE_MAXIMO_ATUAL * T.CUSTO_GERENC) AS VALOR_ESTOQUE_CUSTO_NOVO
FROM (
select
    PC.IDEMPRESA as EMPRESA,
    PC.IDPRODUTO as IDPRODUTO,
    SC.IDSECAO as SECAO,
    SC.DESCRSECAO as DESCRICAO_SECAO,
    GR.IDGRUPO as GRUPO,
    GR.DESCRGRUPO as DESCRICAO_GRUPO,
    SG.IDSUBGRUPO as SUBGRUPO,
    SG.DESCRSUBGRUPO as DESCRICAO_SUBGRUPO,
    PC.IDSUBPRODUTO as COD_INTERNO,
    PG.IDCODBARPROD as COD_EAN,
    PG.REFERENCIA as REFERENCIA,
    PM.DESCRMODELO as MODELO,
    PG.FLAGINATIVOCOMPRA as INATIVO_COMPRA,
    COR.DESCRCOR as CLASSIFICACAO,
    PR.FABRICANTE as CURVA_ORIGINAL,
    REPLACE(PR.FABRICANTE, 'Curva ', '') as CURVA,
    US.NOMEUSUARIO as COMPRADOR,
    PR.DESCRCOMPRODUTO || ' ' || PG.SUBDESCRICAO AS DESCRICAO_PRODUTO,
    CAST(PP.CUSTOGERENCIAL AS FLOAT) as CUSTO_GERENC,
    CAST(PP.VALPRECOVAREJO AS FLOAT) as PRECO_VAREJO,
    COALESCE(PC.QTDESTMINIMO, 0) AS ESTOQUE_MINIMO_ATUAL,
    COALESCE(PC.QTDESTMAXIMO, 0) AS ESTOQUE_MAXIMO_ATUAL,
    COALESCE(PC.QTDESTMAXIMO, 0) * CAST(PP.VALPRECOVAREJO AS FLOAT) AS VALOR_ESTOQUE_MAX_VAREJO,
    PC.DIASESTOQUE as DIAS_ESTOQUE,
    COALESCE(EA.DIAS_VENDA, 0) as DIAS_VENDA,
    COALESCE(CAST(EA.QUANT_VENDA AS FLOAT), 0) as QTDE_VENDA,
    EA.PRIM_VENDA as PRIM_VENDA,
    EA.ULTI_VENDA as ULTI_VENDA,
    CAST(PG.LARGURA AS FLOAT) as PERC_COMPETITIVIDADE,
    CAST(PG.COMPRIMENTO AS FLOAT) as PERC_LUCRO_ENCARTE,
    CAST(PG.ALTURA AS FLOAT) as PERC_LUCRO_TV
from
    DBA.PRODUTO_COMPRAS PC
    inner join DBA.PRODUTO_GRADE PG on (PC.IDPRODUTO = PG.IDPRODUTO and PC.IDSUBPRODUTO = PG.IDSUBPRODUTO)
    inner join DBA.POLITICA_PRECO_PRODUTO PP on (PC.IDPRODUTO = PP.IDPRODUTO and PC.IDSUBPRODUTO = PP.IDSUBPRODUTO and PC.IDEMPRESA = PP.IDEMPRESA)
    inner join DBA.PRODUTO PR on (PC.IDPRODUTO = PR.IDPRODUTO)
    left join DBA.SECAO SC on (PR.IDSECAO = SC.IDSECAO)
    left join DBA.GRUPO GR on (PR.IDGRUPO = GR.IDGRUPO)
    left join DBA.SUBGRUPO SG on (PR.IDSUBGRUPO = SG.IDSUBGRUPO)
    left join DBA.PRODUTO_COR COR on (PG.IDCOR = COR.IDCOR)
    left join DBA.PRODUTO_MODELO PM on (PG.IDMODELO = PM.IDMODELO)
    left join
    (
        select
            min(IDUSUARIO) as IDUSUARIO,
            IDPRODUTO,
            IDSUBPRODUTO
        from
            DBA.PRODUTO_COMPRADOR
        group by
            IDPRODUTO, IDSUBPRODUTO
    ) as CP on (CP.IDPRODUTO = PG.IDPRODUTO and CP.IDSUBPRODUTO = PG.IDSUBPRODUTO)
    left join DBA.USUARIO US on (CP.IDUSUARIO = US.IDUSUARIO)
    left join (
        SELECT
            A.IDEMPRESA,
            A.IDPRODUTO,
            A.IDSUBPRODUTO,
            COUNT(DISTINCT A.DTMOVIMENTO) AS DIAS_VENDA,
            CAST(SUM(A.QTDPRODUTO) AS DECIMAL(15,3)) AS QUANT_VENDA,
            MIN(A.DTMOVIMENTO) AS PRIM_VENDA,
            MAX(A.DTMOVIMENTO) AS ULTI_VENDA
        FROM
            DBA.ESTOQUE_ANALITICO A
        WHERE
            A.FLAGMOVSALDOPRO = 'T' AND
            A.TIPOCATEGORIA = 'A' AND
            A.IDOPERACAO > 1000 AND
            A.IDOPERACAO <> 1301 AND
            A.DTMOVIMENTO >= CURRENT DATE - 91 DAYS AND
            A.DTMOVIMENTO < CURRENT DATE
        GROUP BY
            A.IDEMPRESA,
            A.IDPRODUTO,
            A.IDSUBPRODUTO
    ) AS EA 
    on (EA.IDEMPRESA = PC.IDEMPRESA and EA.IDPRODUTO = PC.IDPRODUTO and EA.IDSUBPRODUTO = PC.IDSUBPRODUTO)
where
    PG.FLAGINATIVO = 'F' and
    UPPER(COALESCE(SC.DESCRSECAO, '')) NOT LIKE '%CONSUMO%' and
    PR.IDSECAO <> 98
) AS T
order by
    T.SECAO,
    T.GRUPO,
    T.SUBGRUPO,
    T.DESCRICAO_PRODUTO,
    T.EMPRESA
`;

async function getEstoqueData() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        const result = await connection.query(query);
        return result;
    } catch (error) {
        console.error("Erro ao executar a consulta ODBC:", error);
        throw error;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function getModelos() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        const result = await connection.query(`SELECT IDMODELO, DESCRMODELO FROM DBA.PRODUTO_MODELO ORDER BY DESCRMODELO`);
        return result;
    } catch (error) {
        console.error("Erro ao buscar modelos:", error);
        throw error;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function getPerformanceData() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        
        const salesQuery = `
        SELECT
            EA.IDEMPRESA as EMPRESA,
            EA.IDSUBPRODUTO as COD_INTERNO,
            PG.IDTPPROMOCAO,
            SUM(EA.QTDPRODUTO) AS SUM_QTDPRODUTO,
            SUM(EA.VALTOTLIQUIDO) AS SUM_VALTOTLIQUIDO,
            SUM(EA.VALLUCRO * EA.QTDPRODUTO) AS SUM_VALLUCRO
        FROM
            DBA.ESTOQUE_ANALITICO EA
        JOIN DBA.ESTOQUE_ANALITICO_PROMOCAO_GESTAO EPG 
          ON EA.IDPLANILHA = EPG.IDPLANILHA 
         AND EA.IDEMPRESA = EPG.IDEMPRESA 
         AND EA.NUMSEQUENCIA = EPG.NUMSEQUENCIA
        JOIN DBA.PROMOCAO_GESTAO PG 
          ON PG.IDPROMOCAO = EPG.IDPROMOCAO
        WHERE
            EA.FLAGMOVSALDOPRO = 'T' AND
            EA.TIPOCATEGORIA = 'A' AND
            EA.IDOPERACAO > 1000 AND
            EA.IDOPERACAO <> 1301 AND
            EA.DTMOVIMENTO BETWEEN ((CURRENT DATE - 1 DAY) - 3 MONTHS) AND (CURRENT DATE - 1 DAY)
        GROUP BY
            EA.IDEMPRESA,
            EA.IDSUBPRODUTO,
            PG.IDTPPROMOCAO
        `;

        const lossesQuery = `
        SELECT
            EA.IDEMPRESA as EMPRESA,
            EA.IDSUBPRODUTO as COD_INTERNO,
            SUM(EA.VALTOTLIQUIDO) AS SUM_VALPERDA
        FROM
            DBA.ESTOQUE_ANALITICO EA
        WHERE
            EA.NUMSEQUENCIA > 0 AND
            EA.DTMOVIMENTO BETWEEN ((CURRENT DATE - 1 DAY) - 3 MONTHS) AND (CURRENT DATE - 1 DAY) AND
            EA.IDOPERACAO IN (1082, 1085, 1079, 1083, 1084)
        GROUP BY
            EA.IDEMPRESA,
            EA.IDSUBPRODUTO
        `;

        const totalSalesQuery = `
        SELECT
            EA.IDEMPRESA as EMPRESA,
            EA.IDSUBPRODUTO as COD_INTERNO,
            SUM(EA.QTDPRODUTO) AS SUM_QTDPRODUTO_TT,
            SUM(EA.VALTOTLIQUIDO) AS SUM_VALTOTLIQUIDO_TT,
            SUM(EA.VALLUCRO * EA.QTDPRODUTO) AS SUM_VALLUCRO_TT
        FROM
            DBA.ESTOQUE_ANALITICO EA
        WHERE
            EA.FLAGMOVSALDOPRO = 'T' AND
            EA.TIPOCATEGORIA = 'A' AND
            EA.IDOPERACAO > 1000 AND
            EA.IDOPERACAO <> 1301 AND
            EA.DTMOVIMENTO BETWEEN ((CURRENT DATE - 1 DAY) - 3 MONTHS) AND (CURRENT DATE - 1 DAY)
        GROUP BY
            EA.IDEMPRESA,
            EA.IDSUBPRODUTO
        `;

        console.log("[DB2] Iniciando consulta de Vendas Promocionais (90 dias)...");
        const sales = await connection.query(salesQuery);
        
        console.log("[DB2] Iniciando consulta de Vendas Totais (90 dias)...");
        const totalSales = await connection.query(totalSalesQuery);
        
        console.log("[DB2] Iniciando consulta de Perdas (90 dias)...");
        const losses = await connection.query(lossesQuery);
        
        return { sales, totalSales, losses };
    } catch (error) {
        console.error("Erro ao buscar dados de performance:", error);
        throw error;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function updateLimites(updates) {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        await connection.beginTransaction();

        const sqlCompras = `
            UPDATE DBA.PRODUTO_COMPRAS 
            SET QTDESTMINIMO = ?, QTDESTMAXIMO = ? 
            WHERE IDEMPRESA = ? AND IDPRODUTO = ? AND IDSUBPRODUTO = ?
        `;



        for (const update of updates) {
            const productQueries = [];

            productQueries.push(
                connection.query(sqlCompras, [
                    update.QTDESTMINIMO,
                    update.QTDESTMAXIMO,
                    update.IDEMPRESA,
                    update.IDPRODUTO,
                    update.IDSUBPRODUTO
                ])
            );

            if (update.INATIVO_COMPRA !== undefined) {
                productQueries.push(
                    connection.query(
                        `UPDATE DBA.PRODUTO_GRADE SET FLAGINATIVOCOMPRA = ? WHERE IDPRODUTO = ? AND IDSUBPRODUTO = ?`,
                        [update.INATIVO_COMPRA, update.IDPRODUTO, update.IDSUBPRODUTO]
                    )
                );
            }

            if (update.REFERENCIA !== undefined) {
                productQueries.push(
                    connection.query(
                        `UPDATE DBA.PRODUTO_GRADE SET REFERENCIA = ? WHERE IDPRODUTO = ? AND IDSUBPRODUTO = ?`,
                        [update.REFERENCIA, update.IDPRODUTO, update.IDSUBPRODUTO]
                    )
                );
            }

            if (update.MODELO !== undefined) {
                // A lógica de modelo envolve SELECT MAX e INSERT, sendo mais segura de rodar isoladamente 
                // para evitar race conditions no mesmo loop (embora encapsulada em uma promessa assíncrona)
                const modelPromise = (async () => {
                    const modelStr = update.MODELO ? update.MODELO.trim() : '';
                    let idModelo = null;
                    
                    if (modelStr) {
                        const existing = await connection.query(`SELECT IDMODELO FROM DBA.PRODUTO_MODELO WHERE DESCRMODELO = ?`, [modelStr]);
                        if (existing && existing.length > 0) {
                            idModelo = existing[0].IDMODELO;
                        } else {
                            const maxIdResult = await connection.query(`SELECT COALESCE(MAX(IDMODELO), 0) + 1 AS NEW_ID FROM DBA.PRODUTO_MODELO`);
                            idModelo = maxIdResult[0].NEW_ID;
                            await connection.query(`INSERT INTO DBA.PRODUTO_MODELO (IDMODELO, DESCRMODELO) VALUES (?, ?)`, [idModelo, modelStr]);
                        }
                    }
                    
                    await connection.query(
                        `UPDATE DBA.PRODUTO_GRADE SET IDMODELO = ? WHERE IDPRODUTO = ? AND IDSUBPRODUTO = ?`,
                        [idModelo, update.IDPRODUTO, update.IDSUBPRODUTO]
                    );
                })();
                productQueries.push(modelPromise);
            }

            if (update.PERC_COMPETITIVIDADE !== undefined) {
                productQueries.push(
                    connection.query(
                        `UPDATE DBA.PRODUTO_GRADE SET LARGURA = ? WHERE IDPRODUTO = ? AND IDSUBPRODUTO = ?`,
                        [update.PERC_COMPETITIVIDADE, update.IDPRODUTO, update.IDSUBPRODUTO]
                    )
                );
            }

            if (update.PERC_LUCRO_ENCARTE !== undefined) {
                productQueries.push(
                    connection.query(
                        `UPDATE DBA.PRODUTO_GRADE SET COMPRIMENTO = ? WHERE IDPRODUTO = ? AND IDSUBPRODUTO = ?`,
                        [update.PERC_LUCRO_ENCARTE, update.IDPRODUTO, update.IDSUBPRODUTO]
                    )
                );
            }

            if (update.PERC_LUCRO_TV !== undefined) {
                productQueries.push(
                    connection.query(
                        `UPDATE DBA.PRODUTO_GRADE SET ALTURA = ? WHERE IDPRODUTO = ? AND IDSUBPRODUTO = ?`,
                        [update.PERC_LUCRO_TV, update.IDPRODUTO, update.IDSUBPRODUTO]
                    )
                );
            }

            // Aguarda todas as queries deste produto terminarem em paralelo
            await Promise.all(productQueries);
        }

        await connection.commit();
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        throw error;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

module.exports = {
    getEstoqueData,
    updateLimites,
    getModelos,
    getPerformanceData
};
