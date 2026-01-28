import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { evaluateFlag, EvaluationResult } from './engine/evaluate';
import * as bcrypt from 'bcrypt';

export interface SnapshotData {
  flags: Array<{
    id: string;
    key: string;
    type: string;
    enabled: boolean;
    defaultValueJson: string;
    rolloutPercent: number | null;
  }>;
  segments: Array<{
    id: string;
    key: string;
    userIds: string[];
  }>;
  overrides: Array<{
    flagId: string;
    segmentId: string;
    valueJson: string;
  }>;
}

@Injectable()
export class RuntimeService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  async validateApiKey(apiKey: string, environmentId: string): Promise<boolean> {
    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
      select: { runtimeApiKeyHash: true },
    });

    if (!environment) {
      return false;
    }

    return bcrypt.compare(apiKey, environment.runtimeApiKeyHash);
  }

  async getSnapshot(projectKey: string, envKey: string): Promise<SnapshotData> {
    const cacheKey = this.cache.getSnapshotKey(projectKey, envKey);
    
    // Tenta buscar do cache
    const cached = await this.cache.get<SnapshotData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Busca do banco
    const project = await this.prisma.project.findUnique({
      where: { key: projectKey },
    });

    if (!project) {
      throw new NotFoundException(`Project with key '${projectKey}' not found`);
    }

    const environment = await this.prisma.environment.findFirst({
      where: {
        projectId: project.id,
        key: envKey,
      },
    });

    if (!environment) {
      throw new NotFoundException(
        `Environment with key '${envKey}' not found in project '${projectKey}'`
      );
    }

    // Busca flags
    const flags = await this.prisma.flag.findMany({
      where: { environmentId: environment.id },
      select: {
        id: true,
        key: true,
        type: true,
        enabled: true,
        defaultValueJson: true,
        rolloutPercent: true,
      },
    });

    // Busca segmentos com usuários
    const segments = await this.prisma.segment.findMany({
      where: { environmentId: environment.id },
      include: {
        users: {
          select: {
            userId: true,
          },
        },
      },
    });

    // Busca overrides
    const overrides = await this.prisma.flagSegmentOverride.findMany({
      where: {
        flag: {
          environmentId: environment.id,
        },
      },
      select: {
        flagId: true,
        segmentId: true,
        valueJson: true,
      },
    });

    // Monta snapshot
    const snapshot: SnapshotData = {
      flags: flags.map((f) => ({
        id: f.id,
        key: f.key,
        type: f.type,
        enabled: f.enabled,
        defaultValueJson: f.defaultValueJson,
        rolloutPercent: f.rolloutPercent,
      })),
      segments: segments.map((s) => ({
        id: s.id,
        key: s.key,
        userIds: s.users.map((u) => u.userId),
      })),
      overrides: overrides.map((o) => ({
        flagId: o.flagId,
        segmentId: o.segmentId,
        valueJson: o.valueJson,
      })),
    };

    // Salva no cache
    await this.cache.set(cacheKey, snapshot);

    return snapshot;
  }

  async evaluateFlags(
    projectKey: string,
    envKey: string,
    userId?: string
  ): Promise<Array<{ flagKey: string; value: any; type: string; evaluatedFrom: string }>> {
    const snapshot = await this.getSnapshot(projectKey, envKey);

    return snapshot.flags.map((flag) => {
      const result = evaluateFlag(flag, { userId }, snapshot);
      return {
        flagKey: flag.key,
        value: result.value,
        type: flag.type,
        evaluatedFrom: result.source,
      };
    });
  }

  async evaluateFlag(
    projectKey: string,
    envKey: string,
    flagKey: string,
    userId?: string
  ): Promise<{ flagKey: string; value: any; type: string; evaluatedFrom: string }> {
    const snapshot = await this.getSnapshot(projectKey, envKey);

    const flag = snapshot.flags.find((f) => f.key === flagKey);
    if (!flag) {
      throw new NotFoundException(`Flag with key '${flagKey}' not found`);
    }

    const result = evaluateFlag(flag, { userId }, snapshot);

    return {
      flagKey: flag.key,
      value: result.value,
      type: flag.type,
      evaluatedFrom: result.source,
    };
  }
}
