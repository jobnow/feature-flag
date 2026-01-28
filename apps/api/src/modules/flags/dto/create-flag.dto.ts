import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsInt, Min, Max, Matches } from 'class-validator';

export enum FlagType {
  boolean = 'boolean',
  string = 'string',
  number = 'number',
  json = 'json',
}

export class CreateFlagDto {
  @ApiProperty({ example: 'new-feature' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Key must contain only lowercase letters, numbers, and hyphens',
  })
  key: string;

  @ApiProperty({ enum: FlagType, example: FlagType.boolean })
  @IsEnum(FlagType)
  type: FlagType;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ example: 'false' })
  @IsString()
  @IsNotEmpty()
  defaultValueJson: string;

  @ApiProperty({ example: 50, required: false, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercent?: number;
}
