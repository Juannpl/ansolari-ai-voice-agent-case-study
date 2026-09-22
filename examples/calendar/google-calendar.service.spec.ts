// Tests adapted from Ansolari; all customer fixtures are synthetic.
import { ExampleConfig as ConfigService } from './calendar-provider.interface';
import { GoogleCalendarClientService } from './calendar-provider.interface';
import { GoogleCalendarService } from './google-calendar.service';

describe('GoogleCalendarService', () => {
  function setup(busy: Array<{ start: string; end: string }> = []) {
    const getBusyPeriods = jest.fn().mockResolvedValue(busy);
    const insertEvent = jest.fn().mockResolvedValue({ id: 'google-event-001' });
    const client = {
      getBusyPeriods,
      insertEvent,
    } as unknown as GoogleCalendarClientService;
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          GOOGLE_CALENDAR_TIMEZONE: 'Europe/Paris',
          GOOGLE_CALENDAR_WORKDAY_START: '08:00',
          GOOGLE_CALENDAR_WORKDAY_END: '18:00',
          GOOGLE_CALENDAR_SLOT_STEP_MINUTES: '30',
        };
        return values[key];
      }),
    } as unknown as ConfigService;
    return {
      service: new GoogleCalendarService(client, config),
      getBusyPeriods,
      insertEvent,
    };
  }

  it('calculates three free afternoon slots around Google busy periods', async () => {
    const { service } = setup([
      {
        start: '2099-08-25T14:00:00+02:00',
        end: '2099-08-25T15:00:00+02:00',
      },
    ]);

    await expect(
      service.getAvailableSlots('2099-08-25 après-midi', 60),
    ).resolves.toEqual([
      { startAt: '2099-08-25T13:00:00+02:00', durationMinutes: 60 },
      { startAt: '2099-08-25T15:00:00+02:00', durationMinutes: 60 },
      { startAt: '2099-08-25T15:30:00+02:00', durationMinutes: 60 },
    ]);
  });

  it('rechecks FreeBusy immediately before inserting the event', async () => {
    const { service, getBusyPeriods, insertEvent } = setup();
    const [slot] = await service.getAvailableSlots('2099-08-25 matin', 60);
    getBusyPeriods.mockResolvedValueOnce([]);

    await expect(
      service.createAppointment({
        customerName: 'Example Customer',
        phone: 'PHONE_REDACTED',
        vehicle: 'Example vehicle',
        reason: 'Vidange',
        ...slot,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ id: 'google-event-001', status: 'confirmed' }),
    );
    expect(insertEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'Vidange - Example vehicle - Example Customer',
        startAt: slot.startAt,
      }),
    );
  });

  it('rejects a slot that became busy after it was offered', async () => {
    const { service, getBusyPeriods, insertEvent } = setup();
    const [slot] = await service.getAvailableSlots('2099-08-25 matin', 60);
    getBusyPeriods.mockResolvedValueOnce([
      {
        start: slot.startAt,
        end: new Date(
          Date.parse(slot.startAt) + slot.durationMinutes * 60_000,
        ).toISOString(),
      },
    ]);

    await expect(
      service.createAppointment({
        customerName: 'Example Customer',
        phone: 'PHONE_REDACTED',
        vehicle: 'Example vehicle',
        reason: 'Vidange',
        ...slot,
      }),
    ).rejects.toThrow('SLOT_NO_LONGER_AVAILABLE');
    expect(insertEvent).not.toHaveBeenCalled();
  });
});
