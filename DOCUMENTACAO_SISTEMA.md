# Documentação Completa: App de Gestão de Estoque (Min/Max) e Precificação

Este documento detalha exaustivamente a arquitetura, tecnologias, regras de negócio, estrutura do aplicativo e todas as fórmulas matemáticas (KPIs) implementadas no módulo de Gestão de Estoque Mínimo/Máximo integrado ao ERP CISS.

---

## 1. Visão Geral da Arquitetura
O sistema segue a arquitetura **Full-Stack** separada em dois projetos independentes, porém integrados:
1. **Backend (Node.js)**: Funciona como uma API RESTful. Ele é a ponte entre a interface e o banco de dados IBM DB2 da CISS.
2. **Frontend (React com Vite)**: É a interface (SPA - Single Page Application) onde o usuário consome as informações, faz simulações de compra, analisa vendas segmentadas, aplica filtros e envia edições em lote (Write-back).

---

## 2. Backend: Motor de Integração e Cache

### 2.1. O Cache em Memória
Para evitar gargalos no DB2 devido aos complexos `JOINs` necessários para buscar milhares de produtos:
- **Processo**: No primeiro acesso, o backend compila os dados do DB2 e salva em memória RAM (`cacheData`).
- **Validade**: O cache é automaticamente reciclado a cada hora. É possível forçar o reset via botão na interface (`?force=true`).

### 2.2. APIs e Rotas Principais
- **`GET /api/estoque`**: Retorna toda a malha de produtos, limites e performance de vendas brutas.
- **`GET /api/modelos`**: Busca em tempo real na tabela `DBA.PRODUTO_MODELO` para popular os dropdowns.
- **`POST /api/estoque/limites`**: Central de "Write-back" para salvar alterações em lote. Invalida o cache ao final do sucesso.

### 2.3. Mapeamento de Atualização (Write-back)
- **Mínimo / Máximo**: Atualização direta na `DBA.PRODUTO_COMPRAS`.
- **Inativo / Referência**: Atualização na `DBA.PRODUTO_GRADE`.
- **Precificação (Competitividade, Lucro)**: Atualizações direcionadas aos campos gerenciais.

### 2.4. Detalhamento do SQL de Atualização (Write-back)
A gravação no banco de dados (`updateLimites` em `backend/db.js`) é processada em um único lote transacional (Begin Transaction). Para que o DB2 saiba exatamente qual linha alterar, o sistema utiliza uma **Chave Composta** fornecida pelo Front-end:
- **`IDPRODUTO`**: Código do produto "pai" genérico.
- **`IDSUBPRODUTO`**: Código interno do SKU / Variação exata.
- **`IDEMPRESA`**: Código numérico que identifica a filial/loja (utilizado em regras exclusivas de estoque).

Os comandos SQL executados dependem dos campos editados:

1. **Estoque Mínimo e Máximo** (aplicado apenas à Loja informada):
```sql
UPDATE DBA.PRODUTO_COMPRAS 
SET QTDESTMINIMO = ?, QTDESTMAXIMO = ? 
WHERE IDEMPRESA = ? AND IDPRODUTO = ? AND IDSUBPRODUTO = ?
```

2. **Inativo Compra** (global para todas as lojas):
```sql
UPDATE DBA.PRODUTO_GRADE 
SET FLAGINATIVOCOMPRA = ? 
WHERE IDPRODUTO = ? AND IDSUBPRODUTO = ?
```

3. **Categoria (Referência)** (global para todas as lojas):
```sql
UPDATE DBA.PRODUTO_GRADE 
SET REFERENCIA = ? 
WHERE IDPRODUTO = ? AND IDSUBPRODUTO = ?
```

4. **Modelo / Papel Estratégico** (global para todas as lojas):
```sql
-- Primeiro, busca o ID do modelo a partir da descrição:
SELECT IDMODELO FROM DBA.PRODUTO_MODELO WHERE DESCRMODELO = ?
-- Em seguida, faz o update:
UPDATE DBA.PRODUTO_GRADE 
SET IDMODELO = ? 
WHERE IDPRODUTO = ? AND IDSUBPRODUTO = ?
```
Após o sucesso de todos os comandos do lote, o sistema aplica um `commit` e aciona a tabela de log de auditoria no SQLite para rastreabilidade de quem alterou.


---

## 3. Frontend: Estrutura Mercadológica e Motor de Renderização

### 3.1. A Tabela Pivotada (Drill-down Inteligente)
O coração visual do sistema é o componente `PivotTable.jsx`. Ele converte a lista plana em uma árvore de até 5 níveis:
**Seção ➔ Grupo ➔ Subgrupo ➔ Produto (Modelo) ➔ Loja/Filial**

- **Totalização "Bottom-Up"**: O React agrupa os nós filhos e soma os dados. O valor visualizado na linha de "Seção" é a soma exata do faturamento, custos e limites de todas as filiais e produtos contidos nela.
- **Virtualização**: A estrutura inicia **recolhida**, garantindo carregamento instantâneo mesmo com milhares de SKUs.

### 3.2. Simulador de Novos Produtos
Permite criar um "Produto Virtual" na tabela para prever demanda antes de cadastrá-lo no ERP.
- **Distribuição de Share**: Ao simular um item, o algoritmo avalia o Histórico da Categoria nas Lojas selecionadas e distribui o Volume Máximo de forma proporcional ao *Share* (peso) de venda que cada Loja representa na categoria.

---

## 4. Dicionário de Fórmulas e Indicadores de Negócio

Abaixo está o detalhamento matemático e a finalidade de **cada coluna e métrica** apresentada no sistema.

### 4.1. Dados Cadastrais Base
- **`EMPRESA` / `NOME_LOJA`**: Sigla e Identificador da Filial (Ex: BCS, SJN).
- **`IDPRODUTO` e `COD_INTERNO`**: Chave primária e código SKU.
- **`REFERENCIA` e `MODELO`**: Agrupadores visuais de cor/fabricante/sabor (Editáveis em lote).
- **`CLASSIFICACAO` / Papel**: Classificação do produto no mix (Ex: DESTINO, ROTINA, INTERMEDIARIO).

### 4.2. Módulo Financeiro e de Limites (Giro Tradicional)
- **Custo Gerencial (`CUSTO_GERENC`)**: Custo médio da unidade na filial.
- **Preço Varejo (`PRECO_VAREJO`)**: Preço normal da unidade na gôndola.
- **Estoque Mín/Máx (`ESTOQUE_MINIMO_ATUAL` / `MAXIMO`)**: Limite configurado para disparo e corte do pedido automático.
- **Dias de Cobertura**: 
  > **Fórmula**: `(Estoque Máximo / Média Venda Diária)`
  Indica em quantos dias o estoque suportará o ritmo de venda caso a gôndola chegue ao limite máximo estabelecido. Cor codificada (Vermelho <= 15d, Verde <= 40d).
- **Capital Liberado (Saving de Limite)**: 
  > **Fórmula**: `(Mín/Máx Antigo - Mín/Máx Novo) * Custo Gerencial`
  Cálculo do impacto financeiro poupado nas reduções de limite.

---

### 4.3. Novo Módulo de Precificação
Este módulo permite o setup tático da margem em cima dos custos base, desmembrando o lucro por tipo de campanha.

- **Margem de Varejo (% Lucro Varejo)**:
  > **Fórmula**: `((Preço Varejo - Custo Gerencial) / Preço Varejo) * 100`
  *Objetivo*: Margem bruta teórica obtida nas vendas normais de balcão (F.O.).
  
- **Competitividade (%)**: Campo editável. Define a agressividade do preço Varejo frente ao mercado.
- **Lucro Encarte (%)**: Campo editável. Limite mínimo de margem aceito em campanhas de Tablóide/Encarte.
- **Lucro TV (%)**: Campo editável. Margem de sacrifício destinada aos "Boi de Piranha" (Itens isca anunciados na TV).

---

### 4.4. Módulo de Performance 90 Dias (Venda Segmentada)
Este bloco analisa o comportamento de vendas reais que já aconteceram nos últimos 3 meses, quebrando a venda em 4 canais promocionais (Fora de Oferta, Encarte, TV, Rebaixo).

**Métricas Base (FO, Encarte, TV, Rebaixo):**
- **Volume Promocional**: O valor financeiro total de venda registrada sob aquela campanha.
- **Participação (%)**:
  > **Fórmula**: `(Volume Financeiro da Campanha / Venda Financeira Total) * 100`
  *Objetivo*: Saber o quanto cada campanha representou no mix do produto.
- **Preço Médio Praticado**:
  > **Fórmula**: `(Volume Financeiro da Campanha / Quantidade Total Vendida na Campanha)`
  *Objetivo*: O ticket médio real que o cliente pagou descontando as quebras.
- **Margem Realizada (%)**:
  > **Fórmula**: `(Lucro Real da Campanha / Volume Financeiro da Campanha) * 100`
  *Objetivo*: Analisar se a promoção de fato deixou lucro na última linha.

**Indicadores Avançados (Calculados no Totalizador):**
- **Venda Média Mês e Dia (Base FO)**:
  > **Fórmulas**: `(Venda FO / 3)` e `(Venda FO / 90)`
  *Objetivo*: Entender qual é o giro autêntico e orgânico do produto sem as injeções de venda causadas pelas ofertas.
- **Elasticidade**:
  > **Fórmula**: `(Qtd Encarte + Qtd TV) / Qtd FO Vendida`
  *Objetivo*: Medir a sensibilidade do produto. Quanto maior a elasticidade, mais ele responde às quedas de preço de mídia forte. Obs: Rebaixo foi excluído da fórmula de promoção ativa.
- **Saving (% de Verbas e Perdas)**:
  > **Fórmula**: `(Valor Total de Perdas / Venda Financeira Total) * 100`
  *Objetivo*: Mapear produtos problemáticos onde a margem está sendo engolida por perdas de vencimento, ou se há altas negociações de sell-out sustentando as ofertas.

---

## 5. Regras de Edição em Lote
A interface foi programada para "replicar inteligência" nos níveis mais altos:
- Ao editar o Limite de uma **Seção**, o sistema recalcula os Mínimos e Máximos de *todos os milhares de produtos* dentro dela simultaneamente.
- Edição de regras intrínsecas ao Produto (Ex: Inativo para Compra, Referência ou Modelo) feitas na linha do SKU afetam e bloqueiam **todas as lojas filiais** automaticamente (não é possível ter uma referência de fabricante em uma loja e outra referência na outra para o mesmo SKU).

---

## 6. Histórico de Atualizações
*Documentação atualizada por Igor Santana em 14/07/2026 na Versão com Vendas Segmentadas e Precificação Inteligente.*
