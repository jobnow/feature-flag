import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { CreateOverrideDto } from './dto/create-override.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('admin/segments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post('environments/:environmentId/segments')
  @ApiOperation({ summary: 'Create a new segment' })
  @ApiResponse({ status: 201, description: 'Segment created successfully' })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  @ApiResponse({ status: 409, description: 'Segment key already exists' })
  create(@Param('environmentId') environmentId: string, @Body() createSegmentDto: CreateSegmentDto) {
    return this.segmentsService.create(environmentId, createSegmentDto);
  }

  @Get('environments/:environmentId/segments')
  @ApiOperation({ summary: 'List all segments for an environment' })
  @ApiResponse({ status: 200, description: 'List of segments' })
  findAll(@Param('environmentId') environmentId: string) {
    return this.segmentsService.findAll(environmentId);
  }

  @Post('segments/:segmentId/users')
  @ApiOperation({ summary: 'Add users to a segment' })
  @ApiResponse({ status: 200, description: 'Users added successfully' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  addUsers(@Param('segmentId') segmentId: string, @Body() addUsersDto: AddUsersDto) {
    return this.segmentsService.addUsers(segmentId, addUsersDto);
  }

  @Delete('segments/:segmentId/users/:userId')
  @ApiOperation({ summary: 'Remove a user from a segment' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  removeUser(@Param('segmentId') segmentId: string, @Param('userId') userId: string) {
    return this.segmentsService.removeUser(segmentId, userId);
  }

  @Post('flags/:flagId/overrides')
  @ApiOperation({ summary: 'Create a flag segment override' })
  @ApiResponse({ status: 201, description: 'Override created successfully' })
  @ApiResponse({ status: 404, description: 'Flag or segment not found' })
  @ApiResponse({ status: 409, description: 'Override already exists' })
  createOverride(@Param('flagId') flagId: string, @Body() createOverrideDto: CreateOverrideDto) {
    return this.segmentsService.createOverride(flagId, createOverrideDto);
  }
}
