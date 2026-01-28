import { Module } from '@nestjs/common';
import { FlagsController } from './flags.controller';
import { FlagsService } from './flags.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [FlagsController],
  providers: [FlagsService],
  exports: [FlagsService],
})
export class FlagsModule {}
