// Adapted from Ansolari; extraction details: docs/PROVENANCE.md.
import { ExampleConfig as ConfigService } from './calendar-provider.interface';
import {
  formatInstantInTimeZone,
  resolvePreferredDate,
  zonedDateTime,
} from './calendar-date.util';
import { CalendarService } from './calendar.service';
import {
  Appointment,
  AvailableSlot,
  CreateAppointmentInput,
} from './calendar.types';
import { GoogleCalendarClientService } from './calendar-provider.interface';

export class GoogleCalendarService extends CalendarService {
  private readonly offeredSlots = new Set<string>();

  constructor(
    private readonly client: GoogleCalendarClientService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async getAvailableSlots(
    preferredDate: string,
    durationMinutes: number,
  ): Promise<AvailableSlot[]> {
    const date = resolvePreferredDate(preferredDate);
    const timeZone = this.config('GOOGLE_CALENDAR_TIMEZONE', 'Europe/Paris');
    const workdayStart = this.config('GOOGLE_CALENDAR_WORKDAY_START', '08:00');
    const workdayEnd = this.config('GOOGLE_CALENDAR_WORKDAY_END', '18:00');
    const windowStart = zonedDateTime(date, workdayStart, timeZone);
    const windowEnd = zonedDateTime(date, workdayEnd, timeZone);
    const busy = await this.client.getBusyPeriods(windowStart, windowEnd);
    const configuredStepMinutes = Number(
      this.config('GOOGLE_CALENDAR_SLOT_STEP_MINUTES', '30'),
    );
    const stepMinutes =
      Number.isFinite(configuredStepMinutes) && configuredStepMinutes > 0
        ? configuredStepMinutes
        : 30;
    const requestedPeriod = preferredDate.toLocaleLowerCase('fr-FR');
    const slots: AvailableSlot[] = [];

    for (
      let start = Date.parse(windowStart);
      start + durationMinutes * 60_000 <= Date.parse(windowEnd);
      start += stepMinutes * 60_000
    ) {
      const end = start + durationMinutes * 60_000;
      const localHour = Number(
        new Intl.DateTimeFormat('fr-FR', {
          timeZone,
          hour: '2-digit',
          hourCycle: 'h23',
        })
          .formatToParts(new Date(start))
          .find((part) => part.type === 'hour')?.value,
      );
      if (requestedPeriod.includes('matin') && localHour >= 12) continue;
      if (requestedPeriod.includes('après') && localHour < 13) continue;
      if (start <= Date.now()) continue;
      if (
        busy.some(
          (period) =>
            start < Date.parse(period.end) && end > Date.parse(period.start),
        )
      )
        continue;
      const startAt = formatInstantInTimeZone(new Date(start), timeZone);
      slots.push({ startAt, durationMinutes });
      this.offeredSlots.add(startAt);
      if (slots.length === 3) break;
    }
    return slots;
  }

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    if (!this.offeredSlots.has(input.startAt))
      throw new Error('Le créneau doit provenir de get_available_slots');

    const start = Date.parse(input.startAt);
    const end = start + input.durationMinutes * 60_000;
    const busy = await this.client.getBusyPeriods(
      input.startAt,
      new Date(end).toISOString(),
    );
    if (
      busy.some(
        (period) =>
          start < Date.parse(period.end) && end > Date.parse(period.start),
      )
    ) {
      this.offeredSlots.delete(input.startAt);
      throw new Error('SLOT_NO_LONGER_AVAILABLE');
    }

    const event = await this.client.insertEvent({
      summary: `${input.reason} - ${input.vehicle} - ${input.customerName}`,
      description: [
        `Client : ${input.customerName}`,
        `Téléphone : ${input.phone}`,
        `Véhicule : ${input.vehicle}`,
        `Motif : ${input.reason}`,
        'Origine : Ansolari',
      ].join('\n'),
      startAt: input.startAt,
      endAt: new Date(end).toISOString(),
    });
    this.offeredSlots.delete(input.startAt);
    return { ...input, id: event.id, status: 'confirmed' };
  }

  private config(key: string, fallback: string): string {
    return this.configService.get<string>(key) ?? fallback;
  }
}
