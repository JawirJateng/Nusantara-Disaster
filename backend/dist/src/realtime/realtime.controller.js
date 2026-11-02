"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let RealtimeController = class RealtimeController {
    stream() {
        return (0, rxjs_1.interval)(15000).pipe((0, operators_1.map)((seq) => ({
            data: {
                type: 'HEARTBEAT',
                timestamp: new Date().toISOString(),
                sequence: seq,
            },
        })));
    }
};
exports.RealtimeController = RealtimeController;
__decorate([
    (0, common_1.Sse)('stream'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", rxjs_1.Observable)
], RealtimeController.prototype, "stream", null);
exports.RealtimeController = RealtimeController = __decorate([
    (0, common_1.Controller)('realtime')
], RealtimeController);
//# sourceMappingURL=realtime.controller.js.map