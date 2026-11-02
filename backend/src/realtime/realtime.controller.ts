import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('realtime')
export class RealtimeController {
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    // Send a heartbeat every 15 seconds to keep connection alive, plus sample live events
    return interval(15000).pipe(
      map((seq) => ({
        data: {
          type: 'HEARTBEAT',
          timestamp: new Date().toISOString(),
          sequence: seq,
        },
      })),
    );
  }
}
