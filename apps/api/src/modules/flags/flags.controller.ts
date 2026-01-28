import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FlagsService } from './flags.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('admin/flags')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}

  @Post('environments/:environmentId/flags')
  @ApiOperation({ summary: 'Create a new flag' })
  @ApiResponse({ status: 201, description: 'Flag created successfully' })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  @ApiResponse({ status: 409, description: 'Flag key already exists' })
  create(@Param('environmentId') environmentId: string, @Body() createFlagDto: CreateFlagDto) {
    return this.flagsService.create(environmentId, createFlagDto);
  }

  @Get('environments/:environmentId/flags')
  @ApiOperation({ summary: 'List all flags for an environment' })
  @ApiResponse({ status: 200, description: 'List of flags' })
  findAll(@Param('environmentId') environmentId: string) {
    return this.flagsService.findAll(environmentId);
  }

  @Patch('flags/:flagId')
  @ApiOperation({ summary: 'Update a flag' })
  @ApiResponse({ status: 200, description: 'Flag updated successfully' })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  update(@Param('flagId') flagId: string, @Body() updateFlagDto: UpdateFlagDto) {
    return this.flagsService.update(flagId, updateFlagDto);
  }
}
