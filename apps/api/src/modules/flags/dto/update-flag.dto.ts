import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdateFlagDto {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ example: 'true', required: false })
  @IsString()
  @IsOptional()
  defaultValueJson?: string;

  @ApiProperty({ example: 75, required: false, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercent?: number;
}
