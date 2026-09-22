// Extracted lifecycle and inbound forwarding from Ansolari's gateway.
// NestJS transport, caller data, logs, outbound audio and interruption logic omitted.
interface TwilioConnectedEvent {
  event: 'connected';
  protocol: string;
  version: string;
}

interface TwilioStartEvent {
  event: 'start';
  start: {
    callSid: string;
    streamSid: string;
    tracks: string[];
    mediaFormat: { encoding: string; sampleRate: number };
    customParameters?: { callerPhone?: string };
  };
}

interface TwilioMediaEvent {
  event: 'media';
  media: { track: string; timestamp: string; payload: string };
  streamSid: string;
}

interface TwilioStopEvent {
  event: 'stop';
  streamSid: string;
}


export interface RealtimePort {
  openSession(streamSid: string): void;
  appendAudio(streamSid: string, payload: string): void;
  closeSession(streamSid: string): void;
}
export class MediaStreamExample {
  private readonly bridges = new Map<string, { chunks: number; audioBytes: number }>();
  constructor(private readonly realtimeService: RealtimePort) {}

  handle(message: TwilioConnectedEvent | TwilioStartEvent | TwilioMediaEvent | TwilioStopEvent): void {
    switch (message.event) {
      case 'connected': return;
      case 'start':
        this.bridges.set(message.start.streamSid, { chunks: 0, audioBytes: 0 });
        this.realtimeService.openSession(message.start.streamSid);
        return;
      case 'media': return this.handleMedia(message);
      case 'stop': return this.disconnect(message.streamSid);
    }
  }
  handleMedia(message: TwilioMediaEvent): void {
    const bridge = this.bridges.get(message.streamSid);
    if (!bridge) return;

    bridge.chunks += 1;
    bridge.audioBytes += Buffer.byteLength(message.media.payload, 'base64');
    this.realtimeService.appendAudio(message.streamSid, message.media.payload);
  }

  disconnect(streamSid: string): void {
    this.realtimeService.closeSession(streamSid);
    this.bridges.delete(streamSid);
  }

  // Public-demo observation hook, absent from the private gateway.
  stats(streamSid: string) {
    const bridge = this.bridges.get(streamSid);
    return bridge ? { ...bridge } : undefined;
  }
}
