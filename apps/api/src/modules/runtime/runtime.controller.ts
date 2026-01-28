import { Controller, Get, Param, Query, Headers, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { RuntimeService } from './runtime.service';
import { RuntimeApiKeyGuard } from './guards/runtime-api-key.guard';

@ApiTags('runtime')
@ApiSecurity('runtime-api-key')
@UseGuards(RuntimeApiKeyGuard)
@Controller('runtime')
export class RuntimeController {
  constructor(private readonly runtimeService: RuntimeService) {}

  @Get(':projectKey/:envKey/flags')
  @ApiOperation({ summary: 'Get all flags for an environment' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for evaluation' })
  @ApiResponse({ status: 200, description: 'List of evaluated flags' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 404, description: 'Project or environment not found' })
  async getAllFlags(
    @Param('projectKey') projectKey: string,
    @Param('envKey') envKey: string,
    @Query('userId') userId?: string,
  ) {
    return this.runtimeService.evaluateFlags(projectKey, envKey, userId);
  }

  @Get(':projectKey/:envKey/flags/:flagKey')
  @ApiOperation({ summary: 'Get a specific flag' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID for evaluation' })
  @ApiResponse({ status: 200, description: 'Evaluated flag' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  async getFlag(
    @Param('projectKey') projectKey: string,
    @Param('envKey') envKey: string,
    @Param('flagKey') flagKey: string,
    @Query('userId') userId?: string,
  ) {
    return this.runtimeService.evaluateFlag(projectKey, envKey, flagKey, userId);
  }
}
