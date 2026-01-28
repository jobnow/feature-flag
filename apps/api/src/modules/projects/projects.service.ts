import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    try {
      return await this.prisma.project.create({
        data: {
          key: createProjectDto.key,
          name: createProjectDto.name,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Project with key '${createProjectDto.key}' already exists`);
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        environments: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with id '${id}' not found`);
    }

    return project;
  }
}
