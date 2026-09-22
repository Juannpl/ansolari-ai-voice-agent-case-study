import { MediaStreamExample } from './media-stream-events.example';

it('handles connected → start → media → stop using synthetic audio', () => {
  const port = { openSession: jest.fn(), appendAudio: jest.fn(), closeSession: jest.fn() };
  const gateway = new MediaStreamExample(port);
  gateway.handle({ event: 'connected', protocol: 'Call', version: '1.0.0' });
  gateway.handle({ event: 'start', start: { callSid: 'synthetic-call', streamSid: 'synthetic-stream', tracks: ['inbound'], mediaFormat: { encoding: 'audio/x-mulaw', sampleRate: 8000 } } });
  const media = { event: 'media' as const, streamSid: 'synthetic-stream', media: { track: 'inbound', timestamp: '20', payload: Buffer.alloc(160, 255).toString('base64') } };
  gateway.handle(media);
  expect(port.openSession).toHaveBeenCalledWith('synthetic-stream');
  expect(port.appendAudio).toHaveBeenCalledWith('synthetic-stream', media.media.payload);
  expect(gateway.stats('synthetic-stream')).toEqual({ chunks: 1, audioBytes: 160 });
  gateway.handle({ event: 'stop', streamSid: 'synthetic-stream' });
  expect(port.closeSession).toHaveBeenCalledWith('synthetic-stream');
  expect(gateway.stats('synthetic-stream')).toBeUndefined();
  gateway.handle(media);
  expect(port.appendAudio).toHaveBeenCalledTimes(1);
});

it('ignores media from unknown streams', () => {
  const port = { openSession: jest.fn(), appendAudio: jest.fn(), closeSession: jest.fn() };
  new MediaStreamExample(port).handle({ event: 'media', streamSid: 'unknown', media: { track: 'inbound', timestamp: '0', payload: '/w==' } });
  expect(port.appendAudio).not.toHaveBeenCalled();
});
