# Gestão de Mínimo e Máximo - Dashboard Analítico (BI)

Este projeto é uma aplicação web completa (Full-Stack) projetada para análises aprofundadas sobre o controle de estoque mínimo e máximo da rede de supermercados, com foco na Estrutura Mercadológica. O objetivo da ferramenta é agrupar, de maneira dinâmica e instantânea, dados volumosos vindos de uma conexão ODBC (banco de dados IBM DB2), atuando como uma ferramenta de BI (Business Intelligence) moderna.

## 🏗️ Arquitetura do Sistema

O sistema é dividido em duas camadas principais que rodam de maneira independente:

### 1. Backend (Node.js + Express)
O backend atua como uma ponte de comunicação com o banco de dados. Ele foi projetado para extrair e pré-processar os dados usando alta performance via SQL.
- **Porta padrão:** 3001 (`http://localhost:3001/api/estoque`)
- **Driver de Conexão:** IBM DB2 ODBC DRIVER (via pacote `odbc`).
- **Função Principal:** Executa as regras de negócio matemáticas mais pesadas já no momento da consulta ao banco, entregando um JSON pronto e veloz para a interface, incluindo os cálculos de *Média de Venda Mensal* e as formatações de curva.

### 2. Frontend (React + Vite)
O Frontend é a interface visual com a qual o usuário interage.
- **Porta padrão:** 5173 (`http://localhost:5173`)
- **Design System:** Construído inteiramente com **Vanilla CSS** utilizando a técnica de *Glassmorphism* (cartões translúcidos sobre um fundo Dark Mode dinâmico), tipografia `Inter` e alta responsividade.
- **Pivot Tables (Tabelas Dinâmicas):** Em vez de apresentar dezenas de milhares de registros brutos, o painel agrupa os dados instantaneamente sob 4 grandes pilares:
  - **LOJA**
  - **CURVA**
  - **COMPRADOR**
  - **ESTRUTURA MERCADOLÓGICA (Seção)**

## 📊 Regras de Negócio e Fórmulas

Para garantir total fidelidade com os controles do Excel, as seguintes fórmulas foram embarcadas diretamente no motor do sistema:

* **VALOR ESTOQUE MAX. ATUAL:** 
  Multiplicação da Quantidade Máxima Atual pelo Preço de Varejo (`ESTOQUE_MAXIMO_ATUAL * PRECO_VAREJO`).
* **VALOR ESTOQUE MAX. NOVO:** 
  Soma do valor em dinheiro do Estoque Máximo Atual com a adição gerada pelo novo cadastro (`VALOR_ESTOQUE_MAX_ATUAL + (ESTOQUE_MAXIMO_NOVO * PRECO_VAREJO)`).
* **DIFERENÇA DE ESTOQUE:**
  Subtração simples (`ESTOQUE MAX NOVO - ESTOQUE MAX ATUAL`), colorida dinamicamente no painel (vermelho para quedas, verde para adições).
* **VENDA VALOR TRIMESTRE:**
  Baseada nos dias de venda ativos, calculada como `((QTDE_VENDA / DIAS_VENDA) * 30 * PRECO_VAREJO)`.
* **MÉDIA VENDA MENSAL:**
  Taxa diária sobre 90 dias, calculada como `(VENDA_VALOR_TRIMESTRE / 90) * 31.5`.
* **COBERTURA DIAS:**
  Relação da capacidade global de estoque (`(VALOR ESTOQUE MAX. NOVO / MÉDIA VENDA MENSAL) * 30`).

> ⚠️ *Nota Técnica: Para todas as divisões citadas acima, o sistema possui travas anti-quebra (NULLIF no Backend e condicionais booleanas no Frontend) que impedem erros matemáticos de Divisão por Zero caso não haja dias de venda computados.*

## 🚀 Como Executar Localmente

Para rodar o projeto, você precisará abrir **dois terminais (PowerShell ou CMD)** na pasta raiz do projeto (`h:\Meus Testes\gestao-min-max`).

### Terminal 1: Iniciando o Motor (Backend)
```powershell
cd backend
npm start
```
*Aguarde a mensagem "Servidor rodando na porta 3001". Isso significa que ele está pronto para puxar dados do DB2.*

### Terminal 2: Iniciando a Tela (Frontend)
```powershell
cd frontend
npm run dev
```
*O Vite irá iniciar o servidor de interface gráfica. Segure a tecla `Ctrl` e clique no link `http://localhost:5173` que aparecerá no terminal para abrir o navegador.*

## 🔍 Funcionalidades de Filtragem
Do lado esquerdo do painel, há uma barra de Slicers (Filtros).
Qualquer botão clicado nestes filtros fará com que toda a base de dados em memória seja recalculada, reorganizando instantaneamente os totais gerenciais das 4 tabelas e os totais gerais nos rodapés.
