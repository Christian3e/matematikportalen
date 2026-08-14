# Task 3 report — reusable structured answer validation

## Base and audit

- Authoritative base: `build/vendor-phaser-runtime` at `4df0b60ae2ad884cde253165b031c41c060536d1`.
- Remote-ref check before publication: identical to the base.
- Initial isolated reconstruction omitted three existing test files. The authoritative GitHub contents API audit established the complete six-file base test directory and restored `app-story-progress.test.js`, `restored-game-assets.test.js`, `restored-game-routing.test.js`, and `story-progress.test.js` before final verification.
- The final publish tree is built from remote base tree `99081a7a833820192681173b758910759b9924cd`, replacing only task files; unchanged base blobs therefore remain byte-identical.

## RED/GREEN evidence

- RED: `node --test tests/answer-validator.test.js` failed because `answer-validator.js` did not exist; 1 failed, 12 intentionally skipped.
- GREEN: the same command passed 13/13 after implementing the public API.
- RED: after extending the existing ordering/inventory regression, `node --test tests/question-bank.test.js tests/answer-validator.test.js` failed because the validator script and build/check inventory entries were absent.
- GREEN: the paired suite passed 28/28 after updating `index.html` and `package.json`.
- RED: the restored complete suite caught the exact recovered-game script-order snapshot; it failed until `answer-validator.js` was inserted immediately after `question-bank.js` in that existing expectation.
- GREEN: final full suite passed 57/57.

## Behavioral matrix

| Type | Accepted normalization | Validation outcome |
| --- | --- | --- |
| number | strict integer/decimal, comma or dot decimal | finite, no prose/exponents, declared precision only |
| fraction | structured `{n,d}` | integer fields, nonzero denominator, reduced canonical sign |
| choice | stable primitive option value | exact identity comparison |
| time | canonical `HH:MM` | 00–23 and 00–59 boundaries |
| interval | structured `{from,to}` | valid strictly increasing same-day times |
| unit | structured `{value,unit}` | number rules plus canonical unit-id comparison |

All formats distinguish empty required input (`empty`), malformed input (`format`), and wrong/missing unit (`unit`); well-formed wrong answers return `error: null`. The suite covers negative zero, whitespace, comma/dot decimals, finite/prose/exponent rejection, fraction sign/GCD/zero handling, time/interval boundaries, precision, mutation safety, browser/CommonJS parity, and Node-global isolation.

## Files

- Created: `answer-validator.js`, `tests/answer-validator.test.js`.
- Updated: `index.html`, `package.json`, `tests/question-bank.test.js`, `tests/phaser-assets.test.js`, `tests/restored-game-assets.test.js`.
- Reconstructed for complete isolated verification only: all six authoritative base test files.

## Verification and parity

- `node --test tests/answer-validator.test.js`: 13/13 pass.
- `node --test tests/question-bank.test.js tests/answer-validator.test.js`: 28/28 pass.
- `npm.cmd test`: 57/57 pass, 0 failures.
- `npm.cmd run check`: pass.
- `npm.cmd run build`: pass.
- Explicit build inventory: 20 source files and 20 dist files; missing `[]`, extra `[]`, changed `[]`.
- The existing `phaser-assets.test.js` remains the single destructive-build owner.

## Self-review and concerns

- Reviewed every task-modified file and the recovered script-order regression.
- No changes were made to question generation or existing activity answer behavior.
- The PowerShell `npm` shim is execution-policy blocked in this environment; verified equivalent `npm.cmd` commands were used.
- Publication commit/tree SHAs are recorded after connector publication.

