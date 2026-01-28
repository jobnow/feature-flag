# Exemplos de Uso

Este documento contém exemplos práticos de como usar o Feature Flag Service.

## 1. Setup Inicial

### Criar Projeto

```bash
# Login primeiro
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token')

# Criar projeto
curl -X POST http://localhost:3000/admin/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ecommerce",
    "name": "E-commerce Platform"
  }'
```

### Criar Ambiente (salve a API key retornada!)

```bash
PROJECT_ID="<id-do-projeto>"

curl -X POST http://localhost:3000/admin/projects/$PROJECT_ID/environments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "production",
    "name": "Production"
  }'

# Resposta inclui runtimeApiKey - SALVE ESTA CHAVE!
```

## 2. Criar Flags

### Flag Boolean com Rollout

```bash
ENV_ID="<id-do-ambiente>"
API_KEY="<api-key-retornada>"

curl -X POST http://localhost:3000/admin/environments/$ENV_ID/flags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "new-checkout",
    "type": "boolean",
    "enabled": true,
    "defaultValueJson": "false",
    "rolloutPercent": 25
  }'
```

### Flag String

```bash
curl -X POST http://localhost:3000/admin/environments/$ENV_ID/flags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "theme",
    "type": "string",
    "enabled": true,
    "defaultValueJson": "\"light\"",
    "rolloutPercent": null
  }'
```

### Flag Number

```bash
curl -X POST http://localhost:3000/admin/environments/$ENV_ID/flags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "max-cart-items",
    "type": "number",
    "enabled": true,
    "defaultValueJson": "10",
    "rolloutPercent": null
  }'
```

## 3. Criar Segmentos e Overrides

### Criar Segmento

```bash
curl -X POST http://localhost:3000/admin/environments/$ENV_ID/segments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "vip-customers",
    "name": "VIP Customers"
  }'
```

### Adicionar Usuários ao Segmento

```bash
SEGMENT_ID="<id-do-segmento>"

curl -X POST http://localhost:3000/admin/segments/$SEGMENT_ID/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user123", "user456", "user789"]
  }'
```

### Criar Override (Flag sempre true para VIP)

```bash
FLAG_ID="<id-da-flag>"

curl -X POST http://localhost:3000/admin/flags/$FLAG_ID/overrides \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "segmentId": "'$SEGMENT_ID'",
    "valueJson": "true"
  }'
```

## 4. Usar Runtime API

### Obter Todas as Flags

```bash
PROJECT_KEY="ecommerce"
ENV_KEY="production"

curl "http://localhost:3000/runtime/$PROJECT_KEY/$ENV_KEY/flags?userId=user123" \
  -H "x-env-key: $API_KEY"
```

**Resposta:**
```json
[
  {
    "flagKey": "new-checkout",
    "value": true,
    "type": "boolean",
    "evaluatedFrom": "segment"
  },
  {
    "flagKey": "theme",
    "value": "light",
    "type": "string",
    "evaluatedFrom": "default"
  }
]
```

### Obter Flag Específica

```bash
curl "http://localhost:3000/runtime/$PROJECT_KEY/$ENV_KEY/flags/new-checkout?userId=user123" \
  -H "x-env-key: $API_KEY"
```

### Testar Rollout Determinístico

```bash
# Mesmo usuário sempre retorna mesmo resultado
for i in {1..5}; do
  curl -s "http://localhost:3000/runtime/$PROJECT_KEY/$ENV_KEY/flags/new-checkout?userId=user999" \
    -H "x-env-key: $API_KEY" | jq -r '.value'
done
# Todos retornam o mesmo valor (true ou false)
```

## 5. Usar SDK Node.js

```typescript
import { FeatureFlagsClient } from '@feature-flag-service/sdk-node';

const client = new FeatureFlagsClient({
  baseUrl: 'http://localhost:3000',
  projectKey: 'ecommerce',
  envKey: 'production',
  apiKey: 'ff_your-api-key-here',
});

// Verificar flag
const flag = await client.get('new-checkout', { userId: 'user123' });

if (flag.value === true) {
  // Usar novo checkout
  console.log('Using new checkout flow');
} else {
  // Usar checkout antigo
  console.log('Using old checkout flow');
}

// Obter todas as flags
const allFlags = await client.getAll({ userId: 'user123' });
const flagsMap = new Map(allFlags.map(f => [f.flagKey, f.value]));

console.log('Theme:', flagsMap.get('theme'));
console.log('Max cart items:', flagsMap.get('max-cart-items'));
```

## 6. Cenários Comuns

### Cenário 1: Feature Rollout Gradual

1. Criar flag com `rolloutPercent: 0`
2. Aumentar gradualmente: 10%, 25%, 50%, 100%
3. Monitorar métricas em cada etapa

```bash
# Iniciar rollout em 10%
curl -X PATCH http://localhost:3000/admin/flags/$FLAG_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercent": 10}'

# Aumentar para 50%
curl -X PATCH http://localhost:3000/admin/flags/$FLAG_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercent": 50}'
```

### Cenário 2: Beta para Grupo Específico

1. Criar segmento "beta-testers"
2. Adicionar usuários ao segmento
3. Criar override para ativar flag apenas para esse segmento
4. Flag permanece `false` para todos os outros

### Cenário 3: Kill Switch

```bash
# Desabilitar flag imediatamente (retorna defaultValue)
curl -X PATCH http://localhost:3000/admin/flags/$FLAG_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

### Cenário 4: A/B Testing

```bash
# Criar duas flags para variantes A e B
# Flag A: rolloutPercent: 50
# Flag B: rolloutPercent: 50
# Usuários são distribuídos deterministicamente entre A e B
```

## 7. Troubleshooting

### Flag sempre retorna defaultValue

- Verifique se `enabled: true`
- Verifique se `rolloutPercent` está configurado (se necessário)
- Verifique se userId está sendo passado (para rollout)

### Override não funciona

- Verifique se usuário está no segmento correto
- Verifique se override foi criado para flag e segmento corretos
- Override tem prioridade sobre rollout

### Cache não atualiza

- Cache tem TTL de 60 segundos
- Edições invalidam cache automaticamente
- Aguarde alguns segundos ou force invalidação editando qualquer flag
