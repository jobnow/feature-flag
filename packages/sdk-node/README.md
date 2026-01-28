# Feature Flag Service - Node.js SDK

SDK oficial para consumir flags do Feature Flag Service em aplicações Node.js.

## Instalação

```bash
npm install @feature-flag-service/sdk-node
# ou
pnpm add @feature-flag-service/sdk-node
```

**Nota:** Este SDK requer Node.js 20+ (que inclui `fetch` nativo) ou você pode instalar `undici` como dependência:

```bash
npm install undici
```

## Uso Básico

```typescript
import { FeatureFlagsClient } from '@feature-flag-service/sdk-node';

const client = new FeatureFlagsClient({
  baseUrl: 'http://localhost:3000',
  projectKey: 'my-project',
  envKey: 'production',
  apiKey: 'ff_your-api-key-here',
});

// Obter uma flag específica
const flag = await client.get('new-feature', { userId: 'user123' });
console.log(flag.value); // true ou false
console.log(flag.evaluatedFrom); // 'default' | 'segment' | 'rollout' | 'disabled'

// Obter todas as flags
const allFlags = await client.getAll({ userId: 'user123' });
allFlags.forEach((flag) => {
  console.log(`${flag.flagKey}: ${flag.value}`);
});
```

## API

### `FeatureFlagsClient`

#### Constructor

```typescript
new FeatureFlagsClient(options: {
  baseUrl: string;      // URL base da API (ex: 'http://localhost:3000')
  projectKey: string;   // Chave do projeto
  envKey: string;       // Chave do ambiente (ex: 'production', 'staging')
  apiKey: string;       // API Key do ambiente
})
```

#### Métodos

##### `get(flagKey: string, options?: { userId?: string }): Promise<FlagEvaluation>`

Obtém o valor de uma flag específica.

**Parâmetros:**
- `flagKey`: Chave da flag
- `options.userId`: (opcional) ID do usuário para avaliação personalizada

**Retorna:**
```typescript
{
  flagKey: string;
  value: any;           // Valor da flag (boolean, string, number, ou JSON)
  type: string;         // Tipo da flag ('boolean', 'string', 'number', 'json')
  evaluatedFrom: string; // Origem: 'default' | 'segment' | 'rollout' | 'disabled'
}
```

##### `getAll(options?: { userId?: string }): Promise<FlagEvaluation[]>`

Obtém todas as flags do ambiente.

**Parâmetros:**
- `options.userId`: (opcional) ID do usuário para avaliação personalizada

**Retorna:** Array de `FlagEvaluation`

## Exemplos

### Verificar se uma feature está habilitada

```typescript
const flag = await client.get('new-checkout-flow', { userId: 'user123' });

if (flag.value === true) {
  // Usar novo fluxo
} else {
  // Usar fluxo antigo
}
```

### Obter valor de flag string

```typescript
const theme = await client.get('app-theme', { userId: 'user123' });
console.log(`Theme: ${theme.value}`); // 'dark' ou 'light'
```

### Obter valor de flag number

```typescript
const maxItems = await client.get('cart-max-items', { userId: 'user123' });
if (cart.length >= maxItems.value) {
  // Limitar carrinho
}
```

### Obter todas as flags e criar um mapa

```typescript
const flags = await client.getAll({ userId: 'user123' });
const flagsMap = new Map(
  flags.map((flag) => [flag.flagKey, flag.value])
);

// Usar flags
if (flagsMap.get('feature-a') === true) {
  // ...
}
```

## Tratamento de Erros

O SDK lança erros quando:
- A API retorna um status HTTP de erro
- A flag não existe (404)
- A API key é inválida (401)
- O projeto/ambiente não existe (404)

```typescript
try {
  const flag = await client.get('my-flag');
} catch (error) {
  console.error('Erro ao obter flag:', error.message);
}
```

## Requisitos

- Node.js 20+ (com `fetch` nativo) OU
- Node.js 18+ com `undici` instalado
