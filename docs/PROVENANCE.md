# Extraction provenance

These are selected, adapted source excerpts from the owner's local Ansolari project, inspected on 2026-09-22. The full application remains private. The source checkout had local changes and untracked calendar files: these excerpts represent that working tree, **not a released or committed upstream revision**.

Paths below are relative to the private project's `apps/api/src/` directory.

| Public file | Private origin | Changes |
| --- | --- | --- |
| `examples/calendar/calendar.service.ts` | `calendar/calendar.service.ts` | Abstract provider contract retained. |
| `examples/calendar/calendar.types.ts` | `calendar/calendar.types.ts` | Type declarations retained; no actual customer data. |
| `examples/calendar/calendar-provider.interface.ts` | `calendar/calendar.module.ts` and client usage | Provider factory extracted; new structural ports replace Nest configuration and private OAuth client. |
| `examples/calendar/google-calendar.service.ts` | `calendar/google-calendar.service.ts` | Nest decorator removed and imports replaced with ports. Availability and booking methods retained together to preserve the original implementation. |
| `examples/calendar/fake-calendar.service.ts` | `calendar/fake-calendar.service.ts` | Nest decorator removed; original fake behaviour retained. |
| `examples/calendar/calendar-date.util.ts` | `calendar/calendar-date.util.ts` | Original date helpers retained. |
| `examples/calendar/google-calendar.service.spec.ts` | `calendar/google-calendar.service.spec.ts` | Original three tests with structural ports and synthetic customer fixtures. |
| `examples/calendar/fake-calendar.service.spec.ts` | `calendar/fake-calendar.service.spec.ts` | Original duplicate test with synthetic customers and a future date. |
| `examples/voice/media-stream-events.example.ts` | `telephony/twilio-media-stream.gateway.ts` | Selected event types, counters, forwarding and cleanup. New dispatcher and stats hook. Nest decorators, sockets, logs, caller propagation, outbound audio, marks and interruption logic omitted. |

`conflict.spec.ts`, the voice tests, package configuration and `scripts/demo.ts` were added for this public example. They are not claimed to be original private tests. No complete webhook server, OAuth client, prompts, business configuration or Realtime integration is included.

Only these selected source files were used; environment files and real recordings were not copied. Personal test fixture names, phone numbers and vehicle details were replaced. No upstream licence grant is inferred: this example remains UNLICENSED. Local inspection cannot establish employment-related ownership; publication rights must be established by the repository owner before external distribution.

## Behavioural boundaries

- Google FreeBusy revalidation detects an existing conflict before insertion. Successfully booked offers cannot be reused sequentially in the same service instance.
- FreeBusy and event insertion are separate asynchronous operations. Two concurrent requests can both succeed; `conflict.spec.ts` deliberately reproduces this limitation. There is no distributed lock or atomic reservation.
- Offered slots live in a process-local set keyed only by start time, without caller identity, expiry or duration binding.
- The fake provider checks identical start times, not arbitrary overlapping appointment intervals. It is not a production calendar.
- The original date helper derives the UTC offset at noon. Transition-hour scheduling and strict date validation are outside this demonstration's coverage.
- Voice examples accept typed application events, not untrusted network messages. HTTP/WebSocket authentication, signature verification, runtime payload validation and real audio transport are outside this isolated example.
