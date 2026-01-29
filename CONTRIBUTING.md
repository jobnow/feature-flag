# Contribuindo para Feature Flag Service

Obrigado por considerar contribuir! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Desenvolvimento](#desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)

## 📜 Código de Conduta

Este projeto adere a um Código de Conduta. Ao participar, você concorda em manter este código.

## 🚀 Como Contribuir

### Reportar Bugs

Se você encontrou um bug:

1. Verifique se o bug já não foi reportado nas [Issues](https://github.com/seu-usuario/feature-flag-service/issues)
2. Se não foi reportado, crie uma nova issue com:
   - Título descritivo
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Ambiente (OS, Node version, etc)

### Sugerir Features

1. Verifique se a feature já não foi sugerida
2. Crie uma issue com:
   - Descrição clara da feature
   - Casos de uso
   - Por que seria útil

### Contribuir com Código

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Faça suas alterações
4. Adicione testes se aplicável
5. Certifique-se de que todos os testes passam (`pnpm test`)
6. Certifique-se de que o lint passa (`pnpm lint`)
7. Commit suas mudanças (veja [Commits](#commits))
8. Push para sua branch (`git push origin feature/minha-feature`)
9. Abra um Pull Request

## 💻 Desenvolvimento

### Setup

```bash
# Clone seu fork
git clone https://github.com/seu-usuario/feature-flag-service.git
cd feature-flag-service

# Instale dependências
pnpm install

# Configure .env
cp .env.example .env

# Suba serviços
docker compose up -d postgres redis

# Rode migrations
pnpm prisma:migrate
```

### Scripts Disponíveis

- `pnpm dev` - Inicia API em modo desenvolvimento
- `pnpm build` - Build do projeto
- `pnpm test` - Roda testes
- `pnpm test:watch` - Roda testes em watch mode
- `pnpm test:cov` - Roda testes com cobertura
- `pnpm lint` - Verifica código com ESLint
- `pnpm format` - Formata código com Prettier

## 📝 Padrões de Código

### TypeScript

- Use TypeScript estrito
- Evite `any` - use tipos específicos
- Use interfaces para objetos
- Use enums quando apropriado

### NestJS

- Siga a estrutura de módulos do NestJS
- Use DTOs com class-validator
- Use Guards para autenticação/autorização
- Use Services para lógica de negócio
- Use Controllers apenas para HTTP

### Naming

- Arquivos: `kebab-case` (ex: `user-service.ts`)
- Classes: `PascalCase` (ex: `UserService`)
- Variáveis/funções: `camelCase` (ex: `getUserById`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `MAX_RETRIES`)

### Imports

- Ordene imports: externos → internos
- Use paths absolutos quando disponível (`@/modules/...`)

### Exemplo de Código

```typescript
// ✅ Bom
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}

// ❌ Ruim
@Injectable()
export class userService {
  constructor(private prisma: any) {}

  async findById(id: any): Promise<any> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

## 📦 Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova feature
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação, ponto e vírgula, etc (não afeta código)
- `refactor:` Refatoração de código
- `test:` Adição/correção de testes
- `chore:` Mudanças em build, dependências, etc

Exemplos:

```bash
feat: add user authentication
fix: resolve cache invalidation issue
docs: update README with new examples
refactor: improve flag evaluation engine
test: add tests for segment overrides
```

## 🔄 Pull Requests

### Antes de Abrir um PR

- [ ] Código segue os padrões do projeto
- [ ] Testes passam (`pnpm test`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Documentação atualizada (se necessário)
- [ ] Commits seguem Conventional Commits
- [ ] Branch está atualizada com `main`

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Lint passa
- [ ] Testes passam
```

## 🧪 Testes

- Adicione testes para novas features
- Mantenha cobertura acima de 80%
- Testes devem ser determinísticos
- Use nomes descritivos: `describe('FeatureName', () => { it('should do something', () => { ... }) })`

## 📚 Documentação

- Atualize README se necessário
- Adicione JSDoc para funções públicas
- Atualize exemplos se mudar comportamento

## ❓ Dúvidas?

Sinta-se à vontade para abrir uma issue com a tag `question`.

---

Obrigado por contribuir! 🎉
