import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { BmkgAdapter } from './adapters/bmkg.adapter';
import { SOURCE_ADAPTERS, SourceAdapter } from './sync.core';

@Module({
  providers: [
    SyncService,
    BmkgAdapter,
    {
      provide: SOURCE_ADAPTERS,
      useFactory: (bmkg: BmkgAdapter): SourceAdapter[] => [bmkg],
      inject: [BmkgAdapter],
    },
  ],
  exports: [SyncService],
})
export class SyncModule {}
