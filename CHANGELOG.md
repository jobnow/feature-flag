# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-01-28

### ✨ Adicionado

- Admin API completa para gerenciamento de projetos, ambientes, flags e segmentos
- Runtime API otimizada para consumo de flags em produção
- Engine de avaliação com prioridades: disabled → segment → rollout → default
- Cache Redis com snapshots por ambiente
- Autenticação JWT para Admin API
- API Keys com hash bcrypt para Runtime API
- SDK Node.js TypeScript
- Documentação Swagger completa em `/docs`
- Testes unitários para engine de avaliação
- Docker Compose com PostgreSQL, Redis e API
- Suporte a flags boolean, string, number e json
- Rollout percentual determinístico
- Overrides por segmento
- Invalidação automática de cache
- Request ID middleware para rastreamento
- Logging estruturado
- Validação de tipos com class-validator
- CORS configurável
- Helmet para segurança HTTP

### 🔒 Segurança

- API Keys nunca armazenadas em texto puro
- Hash bcrypt para todas as API Keys
- JWT com expiração configurável
- Validação de entrada em todos os endpoints
- Helmet para headers de segurança

### 📚 Documentação

- README completo em português
- README do SDK Node.js
- Exemplos práticos em EXAMPLES.md
- Documentação Swagger interativa
- Guia de contribuição (CONTRIBUTING.md)
- Roadmap do projeto (ROADMAP.md)

---

## [Unreleased]

### Planejado

- SDK Python
- SDK Go
- Dashboard Web
- Métricas e Analytics
- Webhooks
- Variantes de flags (A/B testing avançado)

---

[1.0.0]: https://github.com/seu-usuario/feature-flag-service/releases/tag/v1.0.0
