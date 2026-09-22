# Public example verification

Verified locally on 2026-09-22 with Node.js 22.23.2 and pnpm 11.20.0.

| Check | Result |
| --- | --- |
| Dependency installation with frozen lockfile | Passed, including an offline repeat using the downloaded store |
| `pnpm typecheck` | Passed |
| `pnpm test` | 4 suites, 10 tests passed |
| `pnpm demo` | Three slots; synthetic booking confirmed; sequential duplicate and changed-availability conflict rejected; synthetic audio forwarded and counted as 160 bytes |
| `git diff --check` | Passed |

The pnpm store was placed under `/tmp` for this restricted environment. The committed workspace configuration disables the transitive `unrs-resolver` build script; these checks passed with it disabled.

The 10 tests cover three adapted Google tests, one adapted fake-calendar test, four new provider/conflict/race tests and two new voice tests. The concurrent booking test explicitly characterizes a missing guarantee rather than claiming to solve it.

Selected public files were reviewed for customer fixtures, credentials and private application dependencies. A targeted pattern scan found no private-key headers, OpenAI-style keys, Twilio account identifiers, Google token patterns or French phone fixtures. This is a scoped review, not a guarantee of ownership or an audit of the private repository. No real environment files or call recordings were included.
