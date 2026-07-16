-- ==============================================================================
-- SCRIPT DE CRIAÇÃO DA MQT (Materialized Query Table) PARA PERFORMANCE NO DB2
-- Objetivo: Acabar com o processamento pesado "on-the-fly" de 90 dias de vendas.
-- Instruções: Rodar este script como DBA no banco de dados.
-- ==============================================================================

-- 1. Criar a MQT com base nas vendas dos últimos 90 dias
CREATE TABLE DBA.PERFORMANCE_PRODUTO_ATUAL_MQT AS (
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
        -- Define o range fixo ou usar procedure para atualizar os 90 dias
        A.DTMOVIMENTO >= CURRENT DATE - 91 DAYS AND
        A.DTMOVIMENTO < CURRENT DATE
    GROUP BY
        A.IDEMPRESA,
        A.IDPRODUTO,
        A.IDSUBPRODUTO
) DATA INITIALLY DEFERRED REFRESH DEFERRED;

-- 2. Criar Índices na MQT para otimizar os JOINs com PRODUTO_COMPRAS
CREATE UNIQUE INDEX IDX_PERF_MQT ON DBA.PERFORMANCE_PRODUTO_ATUAL_MQT (IDEMPRESA, IDPRODUTO, IDSUBPRODUTO);

-- 3. Comando para popular/atualizar a MQT (Pode ser colocado numa JOB/Procedure noturna diária)
-- REFRESH TABLE DBA.PERFORMANCE_PRODUTO_ATUAL_MQT;
