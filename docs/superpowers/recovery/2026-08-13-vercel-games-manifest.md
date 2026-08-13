# Vercel games recovery manifest

Recovered on 2026-08-13 from the authoritative Vercel deployment.

## Provenance

- Deployment ID: `BYvQpRJ12SXo8Cft5uLdL2CnRLbW` (canonical API/dashboard ID: `dpl_BYvQpRJ12SXo8Cft5uLdL2CnRLbW`)
- Source: https://vercel.com/christian-c053/matematikportalen/BYvQpRJ12SXo8Cft5uLdL2CnRLbW/source
- Running deployment: https://matematikportalen-o2oeedr03-christian-c053.vercel.app/

## Extraction

Each target file was selected in Vercel's authenticated Source view. The internal virtualized code scroller (`data-virtuoso-scroller`) was moved through the complete file, and every rendered line was captured by its zero-based `data-item-index`. The captured indexes were checked for a contiguous range before the source was joined with LF line separators. The final rendered line was the final source line in every file; there was no numbered terminal blank line.

This was exact extraction from the Source view. No file or line was reconstructed from observed behavior.

## Recovered files

| File | Lines | Characters | UTF-8 bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `snake-game.js` | 16 | 1,691 | 1,933 | `94ae953a7126fca53e70cdc1e85f9f16c6e65e9a8823005cf50c1f2893f10384` |
| `arcade-games.js` | 34 | 10,592 | 11,663 | `09addb6f1614c0b3759546e94e0a611c6cc244052f70bcb16711d659b9018453` |
| `arcade-engine.js` | 39 | 9,452 | 9,456 | `c2b3c5e9facfa115497f2c0f23954b3a5c6a0457610c2643f47598abde228446` |

Lengths and hashes are for the recovered UTF-8 source bytes without a final newline, matching the complete numbered Source-view lines.

## Recovered game registrations

| Activity ID | Game kind | Danish title |
| --- | --- | --- |
| `game-fraction-snake` | `fraction-snake` | Brøkslangen |
| `game-arcade-space` | `arcade-space` | Asteroideforsvaret |
| `game-arcade-racer` | `arcade-racer` | Labyrintslugeren |
| `game-arcade-balloons` | `arcade-balloons` | Blokfald |
| `game-arcade-tower` | `arcade-tower` | Trafikspringeren |

## Verification

All three recovered files passed Node syntax checking with `node --check`. The game registrations above were resolved by evaluating `arcade-games.js` in an isolated context containing only a mock `window.PORTAL_CONTENT.activities`; `snake-game.js` was inspected directly for `game-fraction-snake`.
