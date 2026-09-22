import { GoogleCalendarService } from './google-calendar.service';
import { FakeCalendarService } from './fake-calendar.service';
import { ExampleConfig, selectCalendarProvider } from './calendar-provider.interface';

const config: ExampleConfig = { get: () => undefined };
const customer = { customerName: 'Example Customer', phone: 'PHONE_REDACTED', vehicle: 'Example vehicle', reason: 'Maintenance' };

it('rejects an unoffered slot without inserting an event', async () => {
  const client = { getBusyPeriods: jest.fn(), insertEvent: jest.fn() };
  const service = new GoogleCalendarService(client, config);
  await expect(service.createAppointment({ ...customer, startAt: '2099-08-25T08:00:00+02:00', durationMinutes: 60 })).rejects.toThrow('get_available_slots');
  expect(client.getBusyPeriods).not.toHaveBeenCalled();
  expect(client.insertEvent).not.toHaveBeenCalled();
});

it('rejects sequential reuse of a successfully booked Google slot', async () => {
  const client = { getBusyPeriods: jest.fn().mockResolvedValue([]), insertEvent: jest.fn().mockResolvedValue({ id: 'synthetic-event' }) };
  const service = new GoogleCalendarService(client, config);
  const [slot] = await service.getAvailableSlots('2099-08-25 matin', 60);
  await service.createAppointment({ ...customer, ...slot });
  await expect(service.createAppointment({ ...customer, ...slot })).rejects.toThrow('get_available_slots');
  expect(client.insertEvent).toHaveBeenCalledTimes(1);
});

it('documents the existing Google race: two requests can pass revalidation together', async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const client = { getBusyPeriods: jest.fn().mockResolvedValue([]), insertEvent: jest.fn().mockResolvedValue({ id: 'synthetic-event' }) };
  const service = new GoogleCalendarService(client, config);
  const [slot] = await service.getAvailableSlots('2099-08-25 matin', 60);
  client.getBusyPeriods.mockImplementation(async () => { await gate; return []; });
  const first = service.createAppointment({ ...customer, ...slot });
  const second = service.createAppointment({ ...customer, ...slot });
  release();
  await Promise.all([first, second]);
  expect(client.insertEvent).toHaveBeenCalledTimes(2);
});

it('selects fake by default, Google explicitly, and rejects invalid providers', () => {
  const fake = new FakeCalendarService();
  const google = new GoogleCalendarService({ getBusyPeriods: async () => [], insertEvent: async () => ({ id: 'synthetic' }) }, config);
  expect(selectCalendarProvider(config, fake, google)).toBe(fake);
  const configured = (value: string) => ({ get: () => value }) as ExampleConfig;
  expect(selectCalendarProvider(configured('google'), fake, google)).toBe(google);
  expect(() => selectCalendarProvider(configured('invalid'), fake, google)).toThrow('invalide');
});
