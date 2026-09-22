# Technical demonstration

Use Node.js 22.13 or newer and the pnpm version pinned in package.json:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm demo
```

After dependency installation, the examples run offline. No `.env` file, Google account, Twilio number or OpenAI key is required. `.env.example` documents variable names only and is not loaded by the demo.

## Suggested walkthrough (2–3 minutes)

1. Open `calendar.service.ts` and `calendar-provider.interface.ts`: show the shared contract and fake/Google selection.
2. Open `google-calendar.service.ts`: explain working-hour filtering, interval overlap checks, then revalidation before insertion.
3. Run `pnpm demo`: show three slots, a confirmed synthetic appointment, sequential duplicate rejection and a slot becoming unavailable after it was offered.
4. Show the synthetic Media Streams lifecycle and its 160-byte counter. No caller recording is used.
5. Run `pnpm test`: show both the protections and the test reproducing the concurrent Google race.

This is reproducible evidence of selected algorithms and event handling. It does not establish a live Google integration, a real Twilio call, or a complete voice-to-booking conversation. No video or production measurement is fabricated.
