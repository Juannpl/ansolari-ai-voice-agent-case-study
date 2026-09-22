// Adapted from Ansolari; extraction details: docs/PROVENANCE.md.
import {
  Appointment,
  AvailableSlot,
  CreateAppointmentInput,
} from './calendar.types';

export abstract class CalendarService {
  abstract getAvailableSlots(
    preferredDate: string,
    durationMinutes: number,
  ): Promise<AvailableSlot[]>;

  abstract createAppointment(
    appointment: CreateAppointmentInput,
  ): Promise<Appointment>;
}
