import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EnvironmentsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, createEnvironmentDto: CreateEnvironmentDto) {
    // Verifica se projeto existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with id '${projectId}' not found`);
    }

    // Gera API key e hash
    const apiKey = this.generateApiKey();
    const apiKeyHash = await bcrypt.hash(apiKey, 10);

    try {
      const environment = await this.prisma.environment.create({
        data: {
          projectId,
          key: createEnvironmentDto.key,
          name: createEnvironmentDto.name,
          runtimeApiKeyHash: apiKeyHash,
        },
      });

      // Retorna environment com API key (somente na criação)
      return {
        ...environment,
        runtimeApiKey: apiKey, // Retornado apenas uma vez
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Environment with key '${createEnvironmentDto.key}' already exists in this project`
        );
      }
      throw error;
    }
  }

  async findAll(projectId: string) {
    return this.prisma.environment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        key: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        // Não retorna runtimeApiKeyHash
      },
    });
  }

  async rotateApiKey(envId: string) {
    const environment = await this.prisma.environment.findUnique({
      where: { id: envId },
    });

    if (!environment) {
      throw new NotFoundException(`Environment with id '${envId}' not found`);
    }

    // Gera nova API key e hash
    const apiKey = this.generateApiKey();
    const apiKeyHash = await bcrypt.hash(apiKey, 10);

    await this.prisma.environment.update({
      where: { id: envId },
      data: { runtimeApiKeyHash: apiKeyHash },
    });

    // Retorna API key (somente uma vez)
    return {
      runtimeApiKey: apiKey,
    };
  }

  private generateApiKey(): string {
    // Formato: ff_<uuid>
    return `ff_${uuidv4().replace(/-/g, '')}`;
  }
}
