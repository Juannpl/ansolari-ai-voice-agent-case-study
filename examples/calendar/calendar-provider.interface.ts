import { CalendarService } from './calendar.service';

// Structural substitutes for private NestJS configuration and OAuth transport.
export interface ExampleConfig {
  get<T extends string>(key: string): T | undefined;
}
export interface GoogleCalendarClientService {
  getBusyPeriods(startAt: string, endAt: string): Promise<Array<{ start: string; end: string }>>;
  insertEvent(event: { summary: string; description: string; startAt: string; endAt: string }): Promise<{ id: string }>;
}

// Extracted from CalendarModule's useFactory; dependencies supplied by the caller.
export function selectCalendarProvider(
  config: ExampleConfig,
  fake: CalendarService,
  google: CalendarService,
): CalendarService {
  const provider = config.get<string>('CALENDAR_PROVIDER') ??
    (config.get<string>('GOOGLE_CALENDAR_ENABLED') === 'true' ? 'google' : 'fake');
  if (provider === 'fake') return fake;
  if (provider === 'google') return google;
  throw new Error(`CALENDAR_PROVIDER invalide : ${provider}`);
}
