import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';

@Injectable()
export class FlagsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  async create(environmentId: string, createFlagDto: CreateFlagDto) {
    // Verifica se environment existe
    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
      include: { project: true },
    });

    if (!environment) {
      throw new NotFoundException(`Environment with id '${environmentId}' not found`);
    }

    // Valida defaultValueJson conforme o tipo
    this.validateDefaultValue(createFlagDto.type, createFlagDto.defaultValueJson);

    try {
      const flag = await this.prisma.flag.create({
        data: {
          environmentId,
          key: createFlagDto.key,
          type: createFlagDto.type,
          enabled: createFlagDto.enabled ?? true,
          defaultValueJson: createFlagDto.defaultValueJson,
          rolloutPercent: createFlagDto.rolloutPercent,
        },
      });

      // Invalida cache do snapshot
      await this.cache.invalidateSnapshot(environment.project.key, environment.key);

      return flag;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Flag with key '${createFlagDto.key}' already exists in this environment`
        );
      }
      throw error;
    }
  }

  async findAll(environmentId: string) {
    return this.prisma.flag.findMany({
      where: { environmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(flagId: string, updateFlagDto: UpdateFlagDto) {
    const flag = await this.prisma.flag.findUnique({
      where: { id: flagId },
      include: {
        environment: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!flag) {
      throw new NotFoundException(`Flag with id '${flagId}' not found`);
    }

    // Valida defaultValueJson se fornecido
    if (updateFlagDto.defaultValueJson !== undefined) {
      this.validateDefaultValue(flag.type, updateFlagDto.defaultValueJson);
    }

    const updatedFlag = await this.prisma.flag.update({
      where: { id: flagId },
      data: {
        ...(updateFlagDto.enabled !== undefined && { enabled: updateFlagDto.enabled }),
        ...(updateFlagDto.defaultValueJson !== undefined && {
          defaultValueJson: updateFlagDto.defaultValueJson,
        }),
        ...(updateFlagDto.rolloutPercent !== undefined && {
          rolloutPercent: updateFlagDto.rolloutPercent,
        }),
      },
    });

    // Invalida cache do snapshot
    await this.cache.invalidateSnapshot(
      flag.environment.project.key,
      flag.environment.key
    );

    return updatedFlag;
  }

  private validateDefaultValue(type: string, valueJson: string) {
    try {
      const value = JSON.parse(valueJson);
      switch (type) {
        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new BadRequestException('defaultValueJson must be a boolean for type boolean');
          }
          break;
        case 'string':
          if (typeof value !== 'string') {
            throw new BadRequestException('defaultValueJson must be a string for type string');
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            throw new BadRequestException('defaultValueJson must be a number for type number');
          }
          break;
        case 'json':
          // Qualquer JSON válido é aceito
          break;
        default:
          throw new BadRequestException(`Invalid flag type: ${type}`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('defaultValueJson must be valid JSON');
    }
  }
}
