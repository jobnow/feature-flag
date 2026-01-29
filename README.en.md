# 🚀 Feature Flag Service

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![NestJS](https://img.shields.io/badge/nestjs-10.3.0-e0234e.svg)
![Prisma](https://img.shields.io/badge/prisma-5.9.1-2D3748.svg)

**A complete open-source Feature Flag Service (LaunchDarkly alternative) built with NestJS, Prisma, PostgreSQL, and Redis.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

[English](./README.en.md) | [Português](./README.md)

</div>

---

## ✨ Why use this project?

- 🎯 **Open Source**: Free alternative to LaunchDarkly
- ⚡ **Performance**: Redis cache with optimized snapshots
- 🔒 **Security**: API Keys with bcrypt hash, JWT for admin
- 🎨 **Easy to use**: Node.js SDK included, complete Swagger docs
- 🧪 **Tested**: Evaluation engine with unit tests
- 🚀 **Production Ready**: Docker Compose, migrations, structured logging
- 📦 **Monorepo**: Modern structure with pnpm workspaces

## 🎯 Features

- ✅ **Complete Admin API**: CRUD for projects, environments, flags, and segments
- ✅ **Optimized Runtime API**: High-performance endpoints for production consumption
- ✅ **Smart Evaluation Engine**: Deterministic system with clear priorities
  - Disabled flags → returns default
  - Segment override → highest priority
  - Percentage rollout → deterministic distribution
  - Default value → safe fallback
- ✅ **Smart Cache**: Redis snapshot per environment (configurable TTL)
- ✅ **Robust Security**: 
  - JWT for Admin API
  - API Keys with bcrypt hash (never in plain text)
  - Type validation with class-validator
- ✅ **Node.js SDK**: TypeScript client ready to use
- ✅ **Swagger Documentation**: Fully documented API at `/docs`
- ✅ **Unit Tests**: 100% tested evaluation engine
- ✅ **Docker Ready**: Docker Compose with PostgreSQL + Redis + API
- ✅ **TypeScript**: 100% typed, zero unnecessary `any`

## 🚀 Quick Start

### ⚡ Setup in 5 minutes

```bash
# Clone repository
git clone https://github.com/seu-usuario/feature-flag-service.git
cd feature-flag-service

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env

# Start services
docker compose up -d postgres redis

# Run migrations
pnpm prisma:migrate

# Start API
pnpm dev
```

API available at `http://localhost:3000`  
Swagger docs at `http://localhost:3000/docs`

## 📚 Documentation

- [Full README](./README.md) - Complete documentation in Portuguese
- [Examples](./EXAMPLES.md) - Practical usage examples
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Roadmap](./ROADMAP.md) - Future plans

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## ⭐ Star this repo if it helped you!

---

<div align="center">

**Made with ❤️ using NestJS, TypeScript and lots of coffee ☕**

[⬆ Back to top](#-feature-flag-service)

</div>
