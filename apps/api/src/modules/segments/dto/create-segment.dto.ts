import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateSegmentDto {
  @ApiProperty({ example: 'beta-users' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Key must contain only lowercase letters, numbers, and hyphens',
  })
  key: string;

  @ApiProperty({ example: 'Beta Users' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
