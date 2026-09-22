// Tests adapted from Ansolari; all customer fixtures are synthetic.
import { FakeCalendarService } from './fake-calendar.service';

describe('FakeCalendarService', () => {
  it('returns normalized ISO slots and prevents double booking', async () => {
    const service = new FakeCalendarService();
    const slots = await service.getAvailableSlots('2099-08-25 matin', 60);

    expect(slots).toHaveLength(3);
    expect(slots[0]).toEqual({
      startAt: '2099-08-25T09:00:00+02:00',
      durationMinutes: 60,
    });

    await service.createAppointment({
      customerName: 'Example Customer',
      phone: 'PHONE_REDACTED',
      vehicle: 'Example vehicle',
      reason: 'Vidange',
      ...slots[0],
    });
    await expect(
      service.createAppointment({
        customerName: 'Another Customer',
        phone: 'PHONE_REDACTED',
        vehicle: 'Example vehicle',
        reason: 'Freinage',
        ...slots[0],
      }),
    ).rejects.toThrow('Ce créneau vient d’être réservé');
  });
});
