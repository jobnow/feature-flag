import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { CreateOverrideDto } from './dto/create-override.dto';

@Injectable()
export class SegmentsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  async create(environmentId: string, createSegmentDto: CreateSegmentDto) {
    const environment = await this.prisma.environment.findUnique({
      where: { id: environmentId },
      include: { project: true },
    });

    if (!environment) {
      throw new NotFoundException(`Environment with id '${environmentId}' not found`);
    }

    try {
      const segment = await this.prisma.segment.create({
        data: {
          environmentId,
          key: createSegmentDto.key,
          name: createSegmentDto.name,
        },
      });

      // Invalida cache
      await this.cache.invalidateSnapshot(environment.project.key, environment.key);

      return segment;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Segment with key '${createSegmentDto.key}' already exists in this environment`
        );
      }
      throw error;
    }
  }

  async findAll(environmentId: string) {
    return this.prisma.segment.findMany({
      where: { environmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async addUsers(segmentId: string, addUsersDto: AddUsersDto) {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
      include: {
        environment: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id '${segmentId}' not found`);
    }

    // Adiciona usuários (ignora duplicatas)
    const users = addUsersDto.userIds.map((userId) => ({
      segmentId,
      userId,
    }));

    try {
      await this.prisma.segmentUser.createMany({
        data: users,
        skipDuplicates: true,
      });

      // Invalida cache
      await this.cache.invalidateSnapshot(
        segment.environment.project.key,
        segment.environment.key
      );

      return { message: 'Users added successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to add users');
    }
  }

  async removeUser(segmentId: string, userId: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
      include: {
        environment: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id '${segmentId}' not found`);
    }

    await this.prisma.segmentUser.deleteMany({
      where: {
        segmentId,
        userId,
      },
    });

    // Invalida cache
    await this.cache.invalidateSnapshot(
      segment.environment.project.key,
      segment.environment.key
    );

    return { message: 'User removed successfully' };
  }

  async createOverride(flagId: string, createOverrideDto: CreateOverrideDto) {
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

    // Verifica se segmento existe e está no mesmo environment
    const segment = await this.prisma.segment.findUnique({
      where: { id: createOverrideDto.segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id '${createOverrideDto.segmentId}' not found`);
    }

    if (segment.environmentId !== flag.environmentId) {
      throw new BadRequestException('Segment must be in the same environment as the flag');
    }

    // Valida valueJson conforme o tipo da flag
    this.validateOverrideValue(flag.type, createOverrideDto.valueJson);

    try {
      const override = await this.prisma.flagSegmentOverride.create({
        data: {
          flagId,
          segmentId: createOverrideDto.segmentId,
          valueJson: createOverrideDto.valueJson,
        },
      });

      // Invalida cache
      await this.cache.invalidateSnapshot(
        flag.environment.project.key,
        flag.environment.key
      );

      return override;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Override for this flag and segment already exists');
      }
      throw error;
    }
  }

  private validateOverrideValue(type: string, valueJson: string) {
    try {
      const value = JSON.parse(valueJson);
      switch (type) {
        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new BadRequestException('valueJson must be a boolean for type boolean');
          }
          break;
        case 'string':
          if (typeof value !== 'string') {
            throw new BadRequestException('valueJson must be a string for type string');
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            throw new BadRequestException('valueJson must be a number for type number');
          }
          break;
        case 'json':
          // Qualquer JSON válido é aceito
          break;
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('valueJson must be valid JSON');
    }
  }
}
