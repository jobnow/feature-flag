import { createHash } from 'crypto';
import { SnapshotData } from '../runtime.service';

export interface EvaluationContext {
  userId?: string;
}

export interface EvaluationResult {
  value: any;
  source: 'disabled' | 'default' | 'segment' | 'rollout';
}

export interface FlagData {
  id: string;
  key: string;
  type: string;
  enabled: boolean;
  defaultValueJson: string;
  rolloutPercent: number | null;
}

/**
 * Engine de avaliação de flags com prioridade:
 * 1) Se flag.enabled = false => retorna defaultValue (ou false para boolean)
 * 2) Se existir override por segmento e userId estiver no segmento => retorna override
 * 3) Se rolloutPercent existir (0-100) e userId fornecido => decide por hash(userId) determinístico
 * 4) Senão => retorna defaultValue
 */
export function evaluateFlag(
  flag: FlagData,
  context: EvaluationContext,
  snapshot: SnapshotData
): EvaluationResult {
  // 1) Flag desabilitada
  if (!flag.enabled) {
    const defaultValue = parseDefaultValue(flag.type, flag.defaultValueJson);
    return {
      value: defaultValue,
      source: 'disabled',
    };
  }

  // 2) Verifica override por segmento
  if (context.userId) {
    const override = findSegmentOverride(flag.id, context.userId, snapshot);
    if (override) {
      return {
        value: JSON.parse(override.valueJson),
        source: 'segment',
      };
    }
  }

  // 3) Rollout percentual
  if (flag.rolloutPercent !== null && flag.rolloutPercent !== undefined && context.userId) {
    const bucket = getRolloutBucket(context.userId, flag.key);
    if (bucket < flag.rolloutPercent) {
      // Usuário está no rollout
      const defaultValue = parseDefaultValue(flag.type, flag.defaultValueJson);
      // Para rollout, assumimos que o valor é o inverso do default (ou true para boolean)
      // Na prática, você pode querer ter um campo rolloutValueJson separado
      // Por simplicidade, assumimos que rollout ativa a feature (true para boolean)
      const rolloutValue = getRolloutValue(flag.type, defaultValue);
      return {
        value: rolloutValue,
        source: 'rollout',
      };
    }
  }

  // 4) Default value
  const defaultValue = parseDefaultValue(flag.type, flag.defaultValueJson);
  return {
    value: defaultValue,
    source: 'default',
  };
}

function parseDefaultValue(type: string, defaultValueJson: string): any {
  try {
    return JSON.parse(defaultValueJson);
  } catch {
    // Fallback baseado no tipo
    switch (type) {
      case 'boolean':
        return false;
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'json':
        return null;
      default:
        return null;
    }
  }
}

function findSegmentOverride(
  flagId: string,
  userId: string,
  snapshot: SnapshotData
): { valueJson: string } | null {
  // Encontra segmentos que contêm o userId
  const userSegments = snapshot.segments.filter((s) => s.userIds.includes(userId));

  // Encontra override para algum desses segmentos
  for (const segment of userSegments) {
    const override = snapshot.overrides.find(
      (o) => o.flagId === flagId && o.segmentId === segment.id
    );
    if (override) {
      return override;
    }
  }

  return null;
}

/**
 * Calcula bucket determinístico (0-99) baseado em userId e flagKey
 * Usa hash SHA256 para garantir determinismo
 */
function getRolloutBucket(userId: string, flagKey: string): number {
  const hash = createHash('sha256')
    .update(`${userId}:${flagKey}`)
    .digest('hex');

  // Pega primeiros 8 caracteres do hash e converte para número
  const hashInt = parseInt(hash.substring(0, 8), 16);
  return hashInt % 100;
}

/**
 * Retorna valor para rollout (assumindo que rollout ativa a feature)
 */
function getRolloutValue(type: string, defaultValue: any): any {
  switch (type) {
    case 'boolean':
      return true; // Rollout sempre ativa para boolean
    case 'string':
      return defaultValue || 'enabled';
    case 'number':
      return defaultValue !== undefined ? defaultValue : 1;
    case 'json':
      return defaultValue || {};
    default:
      return defaultValue;
  }
}
