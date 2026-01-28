import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOverrideDto {
  @ApiProperty({ example: 'segment-uuid' })
  @IsString()
  @IsNotEmpty()
  segmentId: string;

  @ApiProperty({ example: 'true' })
  @IsString()
  @IsNotEmpty()
  valueJson: string;
}
