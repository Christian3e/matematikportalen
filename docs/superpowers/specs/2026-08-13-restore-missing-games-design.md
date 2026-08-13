# Gendannelse af forsvundne spil

## Formål

Gendan de fem spil, som fandtes i den fungerende manuelle Vercel-deployment fra 6. august 2026, men som aldrig blev gemt i GitHub-repositoryet og derfor forsvandt, da Vercel begyndte at bygge fra `main`.

## Kilde

Den autoritative kilde er Vercel-deployment `BYvQpRJ12SXo8Cft5uLdL2CnRLbW` og dens Source-visning. Gendannelsen skal kopiere den oprindelige spiladfærd og de oprindelige tekster, ikke genopfinde spillene.

## Spil, der gendannes

- Brøkslangen (`game-fraction-snake`)
- Asteroideforsvaret
- Labyrintslugeren
- Blokfald
- Trafikspringeren

Talduellen og Brøkbyggeren findes allerede i GitHub og må ikke ændres funktionelt.

## Filer og integration

De oprindelige filer `snake-game.js`, `arcade-games.js` og `arcade-engine.js` gendannes fra Vercel-kilden. `index.html` indlæser dem i den oprindelige afhængighedsrækkefølge. `package.json` inkluderer dem i syntakskontrol og statisk Vercel-build.

Den nuværende portalrouting bevares, så hvert spil kan åbnes med sin egen `?aktivitet=<id>`-adresse og browserens tilbageknap fortsat virker. Spillene skal bruge det nuværende header-, kort- og modaldesign uden at ændre fortællingsflowet.

## Sprog og data

De eksisterende danske, engelske, franske, spanske, ukrainske, russiske og albanske tekster fra deploymentet bevares. Der tilføjes ingen login, database, cookies eller persondata. Spilstatus lever kun i den åbne fane.

## Fejlhåndtering

Hvis en oprindelig fil ikke kan udtrækkes bytepræcist, rekonstrueres kun den manglende del ud fra den kørende deployment og Source-visningen. Rekonstruktionen dokumenteres og kontrolleres mod den gamle version i browseren.

## Testkrav

- Spilkategorien viser syv spil igen.
- Alle fem gendannede spil kan startes fra deres kort og fra deres egen URL.
- Tastatur- og klikstyring virker som i den gamle deployment.
- Matematikspørgsmål kan besvares korrekt og forkert uden ødelagt spiltilstand.
- Genstart og navigation tilbage til forsiden virker.
- Talduellen og Brøkbyggeren fungerer fortsat.
- Fortællinger, opgavesæt og udfordringer har ingen regressioner.
- Chromebook- og mobilvisning er brugbar.
- Ingen konsolfejl.
- `npm test`, `npm run check` og `npm run build` passerer.
- Vercel-produktionen er Ready på det nye `main`-commit.
