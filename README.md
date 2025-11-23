# Loja de Cosmeticos - Fortnite

Aplicação full-stack da loja do Fortnite.
- Backend consome a API pública não oficial (fortnite-api.com), grava no banco de dados Postgres e disponibiliza endpoints REST;
- Frontend consome os dados disponibilizados pela API e disponibiliza todos os cosmeticos na página do Showroom (com filtros), pacotes promocionais, inventário, histórico de transações e acesso público aos usuários cadastrados e seus inventários.

## Stack utilizada

| Camada | Tecnologias |
| --- | --- |
| Backend | Node.js, Express, JWT, node-cron, Swagger |
| Banco | PostgreSQL 15 |
| Frontend | Vue 3 + Vite, Pinia, Vue Router, TailwindCSS |
| Infra | Docker / Docker Compose, Nginx |

---

## Decisões técnicas relevantes

- **Sincronizacao centralizada (`runFullSync`)**: catalogo completo, novidades e loja rodam em uma unica rotina acionada no start, via cron diario configuravel ou pelo endpoint `/cosmetics/sync`.
- **Filtros 100% server-side**: `/cosmetics` aceita busca, raridade, tipo, periodo, filtros de itens a venda e em promocao.
- **Documentacao pronta**: `/docs` expoe o Swagger, facilitando testes.

## Pré-requisitos

### Para executar com Docker (mais simples)
- Docker Desktop 4.x ou compativel.
- Git para clonar o repositorio.

### Para executar manualmente (sem Docker)
- Node.js 20 + npm 10.
- PostgreSQL 15 acessivel (local ou container separado).
- Git.


## Guia para executar

### 1. Clonar e preparar variaveis

```powershell
git clone https://github.com/jvasques/cosmeticsStore_Fortnite.git
cd cosmeticsStore_Fortnite

copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Os `.env` ja possuem defaults funcionais (porta 3000, banco `fortnite`, cron as 03h). Ajuste apenas se precisar apontar para outro host.

---

## Execução com Docker Compose

1. Abra o Docker Desktop.
2. No diretorio raiz execute:

```powershell
cd *seu diretório*\cosmeticsStore_Fortnite
docker compose up --build
```

O comando compila backend e frontend, cria o volume do Postgres e expõe:

| Serviço | URL | Observações |
| --- | --- | --- |
| Backend | `http://localhost:3000` | Swagger em `/docs`, health em `/health`, sync em `/cosmetics/sync` |
| Frontend | `http://localhost:4173` | Build |
| Banco | `localhost:5432` | DB `fortnite`, usuario `fortnite`, senha `fortnite` |

Na inicialização o backend aplica a migration, realiza a sincronização e agenda o cron.

### Comandos uteis

```powershell
# Parar tudo e remover volume (reseta banco)
docker compose down -v
```

## Execucao local (sem Docker)

### 1. Banco de dados
1. Instale/Postgres ou suba um container separado.
2. Crie um banco chamado `fortnite` (ou outro conforme apontar no arquivo .env).

Atualize `backend/.env` com os dados do banco (host, porta, user, senha e nome do banco).

### 2. Backend

```powershell
cd backend
npm install

# (opcional) sincroniza catalogo antes de subir a API
npm run sync

# Iniciar o servidor (com hot reload)
npm run dev
```

### 3. Frontend

```powershell
cd frontend
npm install

# Iniciar o frontend
npm run dev
```
Atualize `frontend/.env` com os ip e porta do servidor (padrão http://localhost:3000).

Abra `http://localhost:5173` para acessar a página principal.