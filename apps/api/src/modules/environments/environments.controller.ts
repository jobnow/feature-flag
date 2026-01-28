import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnvironmentsService } from './environments.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('admin/environments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Post('projects/:projectId/environments')
  @ApiOperation({ summary: 'Create a new environment' })
  @ApiResponse({ status: 201, description: 'Environment created successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'Environment key already exists' })
  create(@Param('projectId') projectId: string, @Body() createEnvironmentDto: CreateEnvironmentDto) {
    return this.environmentsService.create(projectId, createEnvironmentDto);
  }

  @Get('projects/:projectId/environments')
  @ApiOperation({ summary: 'List all environments for a project' })
  @ApiResponse({ status: 200, description: 'List of environments' })
  findAll(@Param('projectId') projectId: string) {
    return this.environmentsService.findAll(projectId);
  }

  @Post('environments/:envId/rotate-key')
  @ApiOperation({ summary: 'Rotate environment API key' })
  @ApiResponse({ status: 200, description: 'New API key generated' })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  rotateKey(@Param('envId') envId: string) {
    return this.environmentsService.rotateApiKey(envId);
  }
}
