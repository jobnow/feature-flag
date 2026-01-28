import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'my-project' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Key must contain only lowercase letters, numbers, and hyphens',
  })
  key: string;

  @ApiProperty({ example: 'My Project' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
