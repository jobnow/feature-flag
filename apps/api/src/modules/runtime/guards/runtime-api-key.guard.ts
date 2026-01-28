import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RuntimeService } from '../runtime.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RuntimeApiKeyGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private runtimeService: RuntimeService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-env-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-env-key header');
    }

    const { projectKey, envKey } = request.params;

    // Busca environment
    const project = await this.prisma.project.findUnique({
      where: { key: projectKey },
    });

    if (!project) {
      throw new UnauthorizedException('Invalid project');
    }

    const environment = await this.prisma.environment.findFirst({
      where: {
        projectId: project.id,
        key: envKey,
      },
    });

    if (!environment) {
      throw new UnauthorizedException('Invalid environment');
    }

    // Valida API key
    const isValid = await this.runtimeService.validateApiKey(apiKey, environment.id);

    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Armazena environmentId no request para uso posterior
    request.environmentId = environment.id;

    return true;
  }
}
