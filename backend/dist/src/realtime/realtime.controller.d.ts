import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class RealtimeController {
    stream(): Observable<MessageEvent>;
}
