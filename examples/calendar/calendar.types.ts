// Adapted from Ansolari; extraction details: docs/PROVENANCE.md.
export interface AvailableSlot {
  startAt: string;
  durationMinutes: number;
}

export interface CreateAppointmentInput {
  customerName: string;
  phone: string;
  vehicle: string;
  reason: string;
  startAt: string;
  durationMinutes: number;
}

export interface Appointment extends CreateAppointmentInput {
  id: string;
  status: 'confirmed';
}
