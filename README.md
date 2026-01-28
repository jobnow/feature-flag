# Feature Flag Service

Um serviço completo de Feature Flags (mini LaunchDarkly) construído com NestJS, Prisma, PostgreSQL e Redis.

## 🎯 Visão Geral

Este projeto fornece uma solução completa para gerenciamento e avaliação de feature flags, permitindo:

- **Admin API**: CRUD completo de projetos, ambientes, flags e segmentos
- **Runtime API**: Endpoints otimizados para aplicações consumirem flags avaliadas
- **Engine de Avaliação**: Sistema determinístico com prioridades claras
- **Cache Inteligente**: Snapshot em Redis para performance máxima
- **Segurança**: JWT para admin, API Keys com hash para runtime

## 🏗️ Arquitetura

```
┌─────────────┐
│   App/Web   │
└──────┬──────┘
       │ HTTP + x-env-key header
       ▼
┌─────────────────────────────────┐
│      Runtime API (NestJS)       │
│  ┌──────────────────────────┐  │
│  │  RuntimeApiKeyGuard       │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │   CacheService (Redis)     │  │
│  │   └─> Snapshot Cache       │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │   Evaluation Engine       │  │
│  │   1. disabled? → default   │  │
│  │   2. segment? → override  │  │
│  │   3. rollout? → hash      │  │
│  │   4. else → default       │  │
│  └──────────────────────────┘  │
└──────────┬──────────────────────┘
           │ Cache miss
           ▼
┌─────────────────────────────────┐
│   Prisma + PostgreSQL          │
│   - Projects                    │
│   - Environments                │
│   - Flags                       │
│   - Segments                    │
│   - Overrides                   │
└─────────────────────────────────┘
```

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 20+
- pnpm 8+
- Docker e Docker Compose

### Passo a Passo

1. **Clone o repositório**

```bash
git clone <repo-url>
cd feature-flag-service
```

2. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
# Edite .env conforme necessário
```

3. **Instale dependências**

```bash
pnpm install
```

4. **Suba os serviços (PostgreSQL + Redis)**

```bash
docker compose up -d postgres redis
```

5. **Execute migrations do Prisma**

```bash
pnpm prisma:migrate
# ou
cd apps/api && pnpm prisma migrate dev
```

6. **Inicie a API**

```bash
pnpm dev
```

A API estará disponível em `http://localhost:3000` e a documentação Swagger em `http://localhost:3000/docs`.

## 📚 Endpoints Principais

### Admin API (requer JWT)

#### Autenticação

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Resposta: {"access_token":"eyJhbGc..."}
```

#### Projetos

```bash
# Criar projeto
curl -X POST http://localhost:3000/admin/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"key":"my-project","name":"My Project"}'

# Listar projetos
curl http://localhost:3000/admin/projects \
  -H "Authorization: Bearer <token>"
```

#### Ambientes

```bash
# Criar ambiente (retorna API key UMA VEZ)
curl -X POST http://localhost:3000/admin/projects/<projectId>/environments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"key":"production","name":"Production"}'

# Rotacionar API key
curl -X POST http://localhost:3000/admin/environments/<envId>/rotate-key \
  -H "Authorization: Bearer <token>"
```

#### Flags

```bash
# Criar flag
curl -X POST http://localhost:3000/admin/environments/<envId>/flags \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key":"new-feature",
    "type":"boolean",
    "enabled":true,
    "defaultValueJson":"false",
    "rolloutPercent":50
  }'

# Atualizar flag
curl -X PATCH http://localhost:3000/admin/flags/<flagId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled":true,"rolloutPercent":75}'
```

#### Segmentos

```bash
# Criar segmento
curl -X POST http://localhost:3000/admin/environments/<envId>/segments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"key":"beta-users","name":"Beta Users"}'

# Adicionar usuários ao segmento
curl -X POST http://localhost:3000/admin/segments/<segmentId>/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userIds":["user123","user456"]}'

# Criar override de flag por segmento
curl -X POST http://localhost:3000/admin/flags/<flagId>/overrides \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"segmentId":"<segmentId>","valueJson":"true"}'
```

### Runtime API (requer x-env-key)

```bash
# Obter todas as flags
curl http://localhost:3000/runtime/my-project/production/flags?userId=user123 \
  -H "x-env-key: ff_your-api-key-here"

# Obter flag específica
curl http://localhost:3000/runtime/my-project/production/flags/new-feature?userId=user123 \
  -H "x-env-key: ff_your-api-key-here"
```

**Resposta exemplo:**
```json
{
  "flagKey": "new-feature",
  "value": true,
  "type": "boolean",
  "evaluatedFrom": "rollout"
}
```

## 🔧 Modelo de Avaliação

O engine de avaliação segue esta prioridade:

1. **Flag desabilitada** (`enabled = false`)
   - Retorna `defaultValue` (ou `false` para boolean)

2. **Override por segmento**
   - Se `userId` está em um segmento que tem override para a flag
   - Retorna o valor do override

3. **Rollout percentual**
   - Se `rolloutPercent` existe (0-100) e `userId` fornecido
   - Calcula bucket determinístico: `hash(userId + flagKey) % 100`
   - Se bucket < `rolloutPercent` → retorna valor ativado
   - Caso contrário → retorna `defaultValue`

4. **Valor padrão**
   - Retorna `defaultValue`

### Exemplo de Avaliação

```typescript
// Flag configurada:
{
  key: "new-checkout",
  enabled: true,
  defaultValueJson: "false",
  rolloutPercent: 50
}

// Avaliação:
evaluate("user123") → bucket=23 → 23 < 50 → true (rollout)
evaluate("user456") → bucket=67 → 67 >= 50 → false (default)
evaluate("user789") → bucket=23 → 23 < 50 → true (rollout) // Determinístico!
```

## 💾 Cache

- **Snapshot**: Cache completo por `(projectKey, envKey)` em Redis
- **TTL**: 60 segundos (configurável via `CACHE_TTL_SECONDS`)
- **Invalidação**: Automática ao editar flags, segmentos ou overrides
- **Chave**: `ff:snapshot:${projectKey}:${envKey}`

## 🔐 Segurança

### Admin API
- Autenticação via JWT
- Credenciais configuráveis via `.env` (`ADMIN_USER`, `ADMIN_PASS`)
- Rotas protegidas com `JwtAuthGuard`

### Runtime API
- Autenticação via API Key no header `x-env-key`
- API Keys armazenadas como hash (bcrypt) no banco
- Validação via `RuntimeApiKeyGuard`
- **Nunca** retorna API keys em texto puro (apenas na criação/rotação)

## 📦 SDK Node.js

O projeto inclui um SDK oficial para Node.js:

```typescript
import { FeatureFlagsClient } from '@feature-flag-service/sdk-node';

const client = new FeatureFlagsClient({
  baseUrl: 'http://localhost:3000',
  projectKey: 'my-project',
  envKey: 'production',
  apiKey: 'ff_your-api-key',
});

const flag = await client.get('new-feature', { userId: 'user123' });
console.log(flag.value); // true ou false
```

Veja mais detalhes em [`packages/sdk-node/README.md`](./packages/sdk-node/README.md).

## 🧪 Testes

```bash
# Rodar testes unitários do engine
pnpm test

# Com cobertura
pnpm test:cov
```

Os testes focam no engine de avaliação (`evaluate.spec.ts`), garantindo:
- Flags desabilitadas retornam default
- Overrides de segmento têm prioridade sobre rollout
- Rollout é determinístico
- Sem userId não aplica rollout

## 📁 Estrutura do Projeto

```
feature-flag-service/
├── apps/
│   └── api/                 # NestJS API
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/           # JWT authentication
│       │   │   ├── projects/      # CRUD projetos
│       │   │   ├── environments/  # CRUD ambientes + API keys
│       │   │   ├── flags/         # CRUD flags
│       │   │   ├── segments/      # CRUD segmentos + overrides
│       │   │   ├── runtime/       # Runtime API + engine
│       │   │   ├── cache/         # Redis service
│       │   │   └── prisma/        # Prisma client
│       │   └── main.ts
│       └── prisma/
│           └── schema.prisma
├── packages/
│   └── sdk-node/            # SDK Node.js
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🛠️ Tecnologias

- **Backend**: NestJS 10, TypeScript
- **ORM**: Prisma 5
- **Banco**: PostgreSQL 16
- **Cache**: Redis 7
- **Autenticação**: JWT, bcrypt
- **Documentação**: Swagger/OpenAPI
- **Testes**: Jest
- **Linting**: ESLint + Prettier

## 📝 Variáveis de Ambiente

Veja `.env.example` para todas as variáveis disponíveis:

- `DATABASE_URL`: URL de conexão PostgreSQL
- `REDIS_URL`: URL de conexão Redis
- `JWT_SECRET`: Secret para assinatura JWT
- `ADMIN_USER`: Usuário admin
- `ADMIN_PASS`: Senha admin
- `CACHE_TTL_SECONDS`: TTL do cache (padrão: 60)
- `PORT`: Porta da API (padrão: 3000)

## 🚢 Deploy

### Docker Compose (Produção)

```bash
docker compose up -d
```

### Build Manual

```bash
# Build da API
pnpm build

# Build do SDK
cd packages/sdk-node && pnpm build
```

## 📄 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou PR.
