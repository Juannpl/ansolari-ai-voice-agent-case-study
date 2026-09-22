// Adapted from Ansolari; extraction details: docs/PROVENANCE.md.
import { CalendarService } from './calendar.service';
import { resolvePreferredDate, zonedDateTime } from './calendar-date.util';
import {
  Appointment,
  AvailableSlot,
  CreateAppointmentInput,
} from './calendar.types';

export class FakeCalendarService extends CalendarService {
  private readonly appointments = new Map<string, Appointment>();
  private readonly offeredSlots = new Set<string>();
  private nextId = 1;

  getAvailableSlots(
    preferredDate: string,
    durationMinutes: number,
  ): Promise<AvailableSlot[]> {
    const period = preferredDate.toLocaleLowerCase('fr-FR').includes('après')
      ? ['14:00', '15:30', '17:00']
      : ['09:00', '10:30', '11:30'];
    const date = resolvePreferredDate(preferredDate);
    const slots = period
      .map((time) => ({
        startAt: zonedDateTime(date, time, 'Europe/Paris'),
        durationMinutes,
      }))
      .filter(
        (slot) =>
          ![...this.appointments.values()].some(
            (appointment) => appointment.startAt === slot.startAt,
          ),
      );
    for (const slot of slots) this.offeredSlots.add(slot.startAt);
    return Promise.resolve(slots);
  }

  createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    if (
      [...this.appointments.values()].some(
        (appointment) => appointment.startAt === input.startAt,
      )
    ) {
      return Promise.reject(new Error('Ce créneau vient d’être réservé'));
    }
    if (!this.offeredSlots.has(input.startAt)) {
      return Promise.reject(
        new Error('Le créneau doit provenir de get_available_slots'),
      );
    }
    const appointment: Appointment = {
      ...input,
      id: `fake-${String(this.nextId).padStart(3, '0')}`,
      status: 'confirmed',
    };
    this.nextId += 1;
    this.appointments.set(appointment.id, appointment);
    this.offeredSlots.delete(appointment.startAt);
    return Promise.resolve(appointment);
  }
}
