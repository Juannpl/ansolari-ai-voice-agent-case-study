import { GoogleCalendarService } from '../examples/calendar/google-calendar.service';
import { MediaStreamExample } from '../examples/voice/media-stream-events.example';

async function main() {
  const busy: Array<{ start: string; end: string }> = [];
  const service = new GoogleCalendarService({
    getBusyPeriods: async () => [...busy],
    insertEvent: async (event) => {
      busy.push({ start: event.startAt, end: event.endAt });
      return { id: 'synthetic-event-001' };
    },
  }, { get: () => undefined });
  const slots = await service.getAvailableSlots('2099-08-25 matin', 60);
  console.log('Synthetic demo: no network calls, credentials or real customers.');
  console.log('Available slots:', slots);
  const input = { ...slots[0], customerName: 'Example Customer', phone: 'PHONE_REDACTED', vehicle: 'Example vehicle', reason: 'Maintenance' };
  console.log('Booking:', (await service.createAppointment(input)).status);
  try { await service.createAppointment(input); }
  catch (error) { console.log('Sequential duplicate rejected:', (error as Error).message); }
  const [next] = await service.getAvailableSlots('2099-08-25 matin', 60);
  busy.push({ start: next.startAt, end: new Date(Date.parse(next.startAt) + 3600000).toISOString() });
  try { await service.createAppointment({ ...input, ...next }); }
  catch (error) { console.log('Conflict after offer rejected:', (error as Error).message); }
  const gateway = new MediaStreamExample({
    openSession: () => console.log('Voice: start'),
    appendAudio: () => console.log('Voice: synthetic audio forwarded'),
    closeSession: () => console.log('Voice: stop'),
  });
  gateway.handle({ event: 'connected', protocol: 'Call', version: '1.0.0' });
  gateway.handle({ event: 'start', start: { callSid: 'synthetic-call', streamSid: 'synthetic-stream', tracks: ['inbound'], mediaFormat: { encoding: 'audio/x-mulaw', sampleRate: 8000 } } });
  gateway.handle({ event: 'media', streamSid: 'synthetic-stream', media: { track: 'inbound', timestamp: '20', payload: Buffer.alloc(160, 255).toString('base64') } });
  console.log('Voice counters:', gateway.stats('synthetic-stream'));
  gateway.handle({ event: 'stop', streamSid: 'synthetic-stream' });
}
void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
