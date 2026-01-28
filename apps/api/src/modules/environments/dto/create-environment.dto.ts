import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateEnvironmentDto {
  @ApiProperty({ example: 'production' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Key must contain only lowercase letters, numbers, and hyphens',
  })
  key: string;

  @ApiProperty({ example: 'Production' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
