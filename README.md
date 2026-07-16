# Gestão de Mínimo e Máximo - Dashboard Analítico (BI)

Este projeto é uma aplicação web completa (Full-Stack) projetada para análises aprofundadas sobre o controle de estoque mínimo e máximo da rede de supermercados, com foco na Estrutura Mercadológica. O objetivo da ferramenta é agrupar, de maneira dinâmica e instantânea, dados volumosos vindos de uma conexão ODBC (banco de dados IBM DB2), atuando como uma ferramenta de BI (Business Intelligence) moderna com recursos de simulação e edição de dados.

## ✨ Novidades e Funcionalidades Atuais

* **Edição de Limites e Integração com ERP**: Permite edição em tempo real das Quantidades Mínimas e Máximas, além de parâmetros como Referência, Modelo, Margens e flag de Inativo para Compras.
* **Capital Liberado (Simulação)**: O app calcula em tempo real o "Dinheiro Descongelado" (Capital Liberado) quando os gestores otimizam limites irreais de compras, mostrando o impacto financeiro das edições na mesma hora.
* **Alta Performance com Web Workers**: O agrupamento de dezenas de milhares de registros hierárquicos na *Pivot Table* (Tabela Dinâmica) foi delegado a um `TreeWorker` que roda em segundo plano.
* **Cálculo de UI em Deltas**: Os totais globais e de loja da tela são atualizados em milissegundos sem congelar a aplicação graças a uma arquitetura baseada em Deltas (calcula apenas a diferença do produto alterado, sem iterar na base inteira).
* **Módulo de Performance Promocional (90 Dias)**: Acompanhamento de KPIs detalhados como Venda Total, Lucro Bruto, Margem, Elasticidade e quebra detalhada do impacto promocional (TV, Encarte, Rebaixo) lado a lado com os estoques, além de visualização das Perdas.

## 🏗️ Arquitetura do Sistema

O sistema é dividido em duas camadas principais que rodam de maneira independente:

### 1. Backend (Node.js + Express)
O backend atua como uma ponte de comunicação de altíssimo desempenho com o banco de dados via SQL.
- **Porta padrão:** 8900 (`http://localhost:8900`)
- **Driver de Conexão:** IBM DB2 ODBC DRIVER (via pacote `odbc`).
- **Endpoints Chave:** `/api/estoque`, `/api/performance`, `/api/modelos`, `/api/estoque/limites` (para salvar).

### 2. Frontend (React + Vite)
A interface de usuário projetada visando o máximo em User Experience para Big Data.
- **Porta padrão Vite:** 5173 (`http://localhost:5173`)
- **Design System:** Construído inteiramente com **Vanilla CSS** utilizando a técnica de *Glassmorphism* (cartões translúcidos sobre um fundo Dark Mode dinâmico) e tipografia `Inter`.
- **Pivot Tables Inteligentes:** Em vez de apresentar milhares de registros brutos, a interface agrupa dados dinamicamente usando componentes memoizados para que a digitação nas células de tabela seja instantânea e livre de travamentos.

## 📊 Principais Regras de Negócio Otimizadas

* **VALOR ESTOQUE MAX. ATUAL:** `ESTOQUE_MAXIMO_ATUAL * PRECO_VAREJO`
* **NOVO TETO DE ESTOQUE:** Calculado a cada tecla na simulação (`QTD_MAX_DIGITADA * PRECO_VAREJO`).
* **CAPITAL LIBERADO:** Acúmulo de reduções de limite (`NOVO TETO - VALOR MAX ATUAL`) apenas quando o resultado é negativo (corte de estoque).
* **COBERTURA (DIAS):** Baseada em uma média móvel robusta calculada contra o valor em dinheiro do estoque novo para descobrir a autonomia da gôndola.

## 🚀 Como Executar Localmente

Você precisará de dois terminais (PowerShell ou CMD) na pasta raiz do projeto.

### Terminal 1: Iniciando o Motor (Backend)
```powershell
cd backend
npm install
npm run dev
```
*Aguarde a mensagem indicando que o servidor está rodando na porta 8900.*

### Terminal 2: Iniciando a Tela (Frontend)
```powershell
cd frontend
npm install
npm run dev
```
*O Vite irá iniciar o servidor de interface gráfica. Acesse `http://localhost:5173` no seu navegador.*
