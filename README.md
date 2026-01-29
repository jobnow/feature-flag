# 🚀 Feature Flag Service

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![NestJS](https://img.shields.io/badge/nestjs-10.3.0-e0234e.svg)
![Prisma](https://img.shields.io/badge/prisma-5.9.1-2D3748.svg)

**Um serviço completo de Feature Flags open-source (alternativa ao LaunchDarkly) construído com NestJS, Prisma, PostgreSQL e Redis.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentação](#-documentação) • [Contribuir](#-contribuindo)

[English](./README.en.md) | [Português](./README.md)

</div>

---

## ✨ Por que usar este projeto?

- 🎯 **Open Source**: Alternativa gratuita ao LaunchDarkly
- ⚡ **Performance**: Cache Redis com snapshots otimizados
- 🔒 **Segurança**: API Keys com hash bcrypt, JWT para admin
- 🎨 **Fácil de usar**: SDK Node.js incluído, Swagger completo
- 🧪 **Testado**: Engine de avaliação com testes unitários
- 🚀 **Production Ready**: Docker Compose, migrations, logging estruturado
- 📦 **Monorepo**: Estrutura moderna com pnpm workspaces

## 🎯 Features

- ✅ **Admin API Completa**: CRUD de projetos, ambientes, flags e segmentos
- ✅ **Runtime API Otimizada**: Endpoints de alta performance para consumo em produção
- ✅ **Engine de Avaliação Inteligente**: Sistema determinístico com prioridades claras
  - Flags desabilitadas → retorna default
  - Override por segmento → prioridade máxima
  - Rollout percentual → distribuição determinística
  - Valor padrão → fallback seguro
- ✅ **Cache Inteligente**: Snapshot Redis por ambiente (TTL configurável)
- ✅ **Segurança Robusta**: 
  - JWT para Admin API
  - API Keys com hash bcrypt (nunca em texto puro)
  - Validação de tipos com class-validator
- ✅ **SDK Node.js**: Cliente TypeScript pronto para uso
- ✅ **Documentação Swagger**: API totalmente documentada em `/docs`
- ✅ **Testes Unitários**: Engine de avaliação 100% testado
- ✅ **Docker Ready**: Docker Compose com PostgreSQL + Redis + API
- ✅ **TypeScript**: 100% tipado, zero `any` desnecessário

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

## 🚀 Quick Start

### ⚡ Setup em 5 minutos

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
│   └── api/                      # NestJS API
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/         # 🔐 JWT authentication
│       │   │   ├── projects/     # 📦 CRUD projetos
│       │   │   ├── environments/ # 🌍 CRUD ambientes + API keys
│       │   │   ├── flags/        # 🚩 CRUD flags
│       │   │   ├── segments/     # 👥 CRUD segmentos + overrides
│       │   │   ├── runtime/      # ⚡ Runtime API + engine
│       │   │   ├── cache/        # 💾 Redis service
│       │   │   └── prisma/       # 🗄️ Prisma client
│       │   └── main.ts
│       └── prisma/
│           └── schema.prisma     # 📋 Database schema
├── packages/
│   └── sdk-node/                 # 📦 SDK Node.js TypeScript
├── .github/
│   ├── workflows/                # 🔄 CI/CD
│   └── ISSUE_TEMPLATE/          # 📝 Templates
├── docker-compose.yml            # 🐳 Docker setup
├── .env.example                  # ⚙️ Environment variables
├── README.md                     # 📖 This file
├── CONTRIBUTING.md               # 🤝 How to contribute
├── ROADMAP.md                    # 🗺️ Future plans
└── CHANGELOG.md                  # 📝 Version history
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

## 📊 Estatísticas do Projeto

- 📦 **100% TypeScript** - Zero `any` desnecessário
- 🧪 **Cobertura de Testes** - Engine de avaliação testado
- 📚 **Documentação Completa** - Swagger + README + Exemplos
- 🔒 **Segurança First** - API Keys com hash, JWT, validação de tipos
- ⚡ **Performance** - Cache Redis, queries otimizadas

## 🌟 Casos de Uso

- **Rollout Gradual**: Libere features para 10%, 25%, 50%, 100% dos usuários
- **A/B Testing**: Distribua usuários entre variantes A e B deterministicamente
- **Beta Testing**: Ative features apenas para grupos específicos (segmentos)
- **Kill Switch**: Desative features instantaneamente em produção
- **Feature Toggles**: Controle de features por ambiente (dev, staging, prod)

## 📈 Roadmap

- [ ] SDK para Python
- [ ] SDK para Go
- [ ] Dashboard Web (React/Next.js)
- [ ] Métricas e Analytics
- [ ] Webhooks para eventos
- [ ] Suporte a variantes (A/B testing avançado)
- [ ] CLI tool

Veja [ROADMAP.md](./ROADMAP.md) para mais detalhes.

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Este projeto existe graças a todos os contribuidores.

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para saber como contribuir.

### Como contribuir:

1. 🍴 Fork o projeto
2. 🌿 Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push para a branch (`git push origin feature/AmazingFeature`)
5. 🔃 Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](./LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Ricardo Gomes**

- 💻 GitHub: [@seu-usuario](https://github.com/seu-usuario)
- 💼 LinkedIn: [Ricardo Gomes](https://linkedin.com/in/seu-perfil)
- 📧 Email: seu-email@exemplo.com

**💡 Dica**: Se este projeto te ajudou, considere:
- ⭐ Dar uma estrela no GitHub
- 🍴 Fazer um fork
- 🤝 Contribuir com melhorias
- 📢 Compartilhar com sua rede

## 🙏 Agradecimentos

- [NestJS](https://nestjs.com/) - Framework incrível
- [Prisma](https://www.prisma.io/) - ORM moderno
- Todos os contribuidores que ajudam a melhorar este projeto

## ⭐ Se este projeto te ajudou, considere dar uma estrela!

---

<div align="center">

**Feito com ❤️ usando NestJS, TypeScript e muito café ☕**

[⬆ Voltar ao topo](#-feature-flag-service)

</div>
