# Phaser-spilplatform og statisk opgavebank

Dato: 14. august 2026  
Status: Godkendt design

## Formål

Matematikportalen skal have et bedre fundament for elevvenlige 2D-spil. Første leverance introducerer Phaser som lokal spilmotor, en fælles statisk opgavebank, ét nyt pilotspil og en kortere pause efter korrekte quizsvar. Portalen forbliver en statisk Vercel-side uden login, backend, database-server eller lagring af persondata.

De syv eksisterende spil bevares i første leverance. De betragtes som ældre spil, der senere kan erstattes ét ad gangen, når Phaser-fundamentet er afprøvet.

## Afgrænsning

Første leverance omfatter:

- en lokalt lagret og versionsfastlåst Phaser-runtime;
- en fælles adapter mellem portalen, opgavebanken og Phaser;
- en statisk, udvidelig opgavebank;
- ét nyt pilotspil med arbejdstitlen **Matematikmissionen**;
- valg af emne, relevant underemne og sværhedsgrad;
- samtidig understøttelse af tastatur og touch;
- dansk, engelsk og fransk;
- ændring af relevante eksisterende quizforsinkelser fra 2.000 ms til 1.000 ms;
- automatiske tests og browserkontrol på mobil- og Chromebook-layout.

Første leverance omfatter ikke:

- udskiftning eller omskrivning af alle syv eksisterende spil;
- lærerlogin eller en visuel editor til opgavebanken;
- en online database;
- synkronisering af elevfremskridt;
- multiplayer;
- et Tower of Doom-lignende spil.

En senere kort- og kampbaseret spiltype inspireret af den overordnede idé i klassiske skoletårnspil kan bygges på samme fundament, men skal have originalt navn, grafik, regler og kode.

## Teknisk retning

Phaser vælges frem for en egen Canvas-motor, KAPLAY og PixiJS. Phaser er en moden, MIT-licenseret 2D-webspilmotor med scener, animation, kollision, lyd og input til både desktop og mobile browsere. Den officielle runtime gemmes i repositoryet på en bestemt version sammen med licensteksten. Portalen må ikke være afhængig af et eksternt CDN ved afvikling.

Phaser indlæses kun på ruter, der bruger motoren. Forsiden, fortællingerne og de eksisterende aktiviteter må derfor ikke betale runtime- eller netværksomkostningen ved almindelig navigation.

Arkitekturen opdeles i klare enheder:

1. **Portalrouter** — læser og skriver aktivitet, emne, underemne og sværhedsgrad i URL'en og bevarer browserens tilbageknap.
2. **Phaser-loader** — indlæser den lokale runtime én gang, håndterer fejl og starter den ønskede scene.
3. **Spiladapter** — har en stabil grænseflade til start, pause, fortsæt, sprogskift og destroy. Den ejer event listeners, timere, lyd og oprydning.
4. **Opgavebank** — filtrerer og genererer spørgsmål uden kendskab til et bestemt spil.
5. **Svarvalidator** — kontrollerer strukturerede svar og enheder på samme måde på tværs af spil.
6. **HTML-quizoverlay** — viser spørgsmål, hint, feedback og fokusstyring over canvas.
7. **Matematikmissionen** — pilotspillets egne Phaser-scener og regler.

En fejlet runtime eller et manglende aktiv må aldrig efterlade en tom canvas. Eleven får en lokaliseret fejlmeddelelse, en prøv igen-knap og en vej tilbage til spiloversigten.

## Pilotspillet Matematikmissionen

En runde varer cirka 5–8 minutter. Eleven styrer en figur gennem korte banesektioner og samler energikrystaller. Matematik indgår på to måder:

- Svarporte i banen viser mulige svar. Den rigtige port giver bonus og fortsætter banen.
- Efter korte spilsektioner pauser spillet og viser et tilgængeligt HTML-spørgsmål. Et forkert svar giver et kort, relevant hint og en ny mulighed. Et korrekt svar låses, overlayet lukkes, og spillet fortsætter efter præcis 1.000 ms.

Spillet har tydelig score, fremgang, liv/energi og pausefunktion. Resultatet er kun midlertidigt i fanen og sendes ikke til en server.

Spillet skal fungere med:

- piletaster og WASD;
- store touchknapper;
- skift mellem touch og tastatur midt i samme runde;
- reduceret bevægelse, når brugerens system foretrækker det;
- pause ved skjult fane og sikker fortsættelse;
- responsive mål til mobil og Chromebook.

Touchknapper vises automatisk på touch-enheder og kan slås til manuelt på Chromebooks. Tastaturstyringen ignorerer formularfelter, sprogmenuer og quizknapper, så globale genveje ikke forstyrrer almindelig navigation.

## Valg før spilstart

Før start vælger eleven:

1. hovedemne;
2. underemne, hvis emnet har meningsfulde underemner;
3. Let, Mellem eller Svær;
4. eventuelt synlige touchknapper.

Første version har fire hovedområder:

- Tal og regning;
- Brøker og procent;
- Geometri;
- Blandet problemløsning.

Sværhedsgrader beskrives med elevvenlig tekst og et eksempel fra det aktuelle emne. Eksempelvis kan procent vise:

- **Let:** ét direkte trin, fx “Hvad er 25 % af 100?”
- **Mellem:** flere beregningstrin eller mindre runde tal, fx “Hvad er 35 % af 240?”
- **Svær:** anvendelse og ræsonnement, fx “En vare stiger 20 % og falder derefter 20 %. Hvad koster den nu, hvis startprisen er 500 kr.?”

Geometri, brøker og andre emner bruger deres egne relevante eksempler. Beskrivelsen må ikke love en bestemt opgavetype, som filtret ikke leverer.

## Statisk opgavebank

Opgavebanken ligger i separate JavaScript- eller JSON-kompatible datafiler og kræver ingen server. Hver opgaveskabelon har:

- stabilt id og versionsfelt;
- klassetrin;
- hovedemne og eventuelt underemne;
- sværhedsgrad;
- lokaliseret spørgsmålstekst;
- spørgsmålstype;
- parametergenerator med kontrollerede talområder;
- facit og svarvalidator;
- forventet enhed og præcision;
- hint og kort forklaring;
- markering af, om den egner sig til svarporte, overlay eller begge.

Første version sigter efter cirka 12 kvalitetssikrede skabeloner pr. hovedområde fordelt på tre sværhedsgrader. Skabelonerne genererer konkrete variationer, men alle variationer skal overholde faste regler, så der ikke opstår tvetydige facitter, division med nul, uønskede decimaler eller uklare enheder.

Opgavebankens offentlige grænseflade skal kunne bede om et bestemt antal opgaver ud fra klassetrin, emne, underemne, sværhedsgrad og tilladte spørgsmålstyper. Den skal undgå umiddelbare gentagelser i samme runde og give et kontrolleret fallback, hvis et filter har for få skabeloner.

## Svarformater og tilgængelighed

Svar vises som den kontrol, der matcher opgaven: heltal/decimaltal, brøk, multiple choice, klokkeslæt, interval eller tal med synlig enhed. Eleven skal ikke gætte, om der forventes meter, centimeter, kolon, punktum eller tekst omkring tallet.

Quizoverlayet er almindelig semantisk HTML frem for tekst inde i canvas. Det skal:

- have dialog- og statussemantik;
- flytte fokus til spørgsmålet ved åbning;
- fokusere første relevante felt efter fejl;
- låse et korrekt svar;
- have synlige fokusmarkeringer og høj kontrast;
- understøtte tastatur uden at spillets genveje opsnapper input;
- være fuldt oversat til dansk, engelsk og fransk.

## Timerændring i eksisterende spil

Alle relevante eksisterende arkadespil gennemgås for den ekstra ventetid, der fortsætter efter quizfeedback/overlay. Den tilsigtede fortsættelsestid ændres fra 2.000 ms til 1.000 ms og samles om muligt i én navngivet konstant. Selve feedbacken skal fortsat være læsbar; andre timere, animationer og nedtællinger ændres ikke uden særskilt begrundelse.

## Licenser og genbrug

Kun kode og aktiver med en dokumenteret kompatibel licens må genbruges. Phaser-runtimen og dens MIT-licens inkluderes. Andre kilder registreres med navn, version/commit, URL, licens og hvilke filer der anvendes.

Komplette tredjepartsspil kopieres ikke ukritisk. Officielle eksempler kan bruges som reference eller afgrænsede byggesten, når licensen tillader det, men portalens spilregler, matematikindhold, tilgængelighed og visuelle identitet skal være egne og gennemgåede.

## Test og acceptkriterier

Automatiske tests dækker mindst:

- filtrering på emne, underemne, klassetrin og sværhedsgrad;
- generatorernes matematiske gyldighed på mange deterministiske seeds;
- svarvalidering, enheder, brøker, decimaler og intervaller;
- korrekte og forkerte svar, hints og låsning;
- præcis 1.000 ms fortsættelsesforsinkelse;
- URL-navigation og tilbageknap;
- samtidig tastatur- og touchstyring;
- isolation fra formularfelter og sprogmenu;
- pause, destroy og oprydning af events, timere og lyd;
- fejltilstand ved manglende Phaser-runtime eller aktiv.

En browser-smoketest dækker hele flowet på dansk, engelsk og fransk ved mobil- og Chromebook-størrelse: valg, eksempel på sværhedsgrad, start, tastatur, touch, svarport, forkert overlay-svar, korrekt overlay-svar, 1-sekunds fortsættelse, afslutning, tilbageknap og genstart. Der må ikke være konsolfejl, ødelagte knapper eller vandret scrolling i målvisningerne.

## Leverance og senere udbygning

Pilotleverancen skal bevise, at motoren, opgavebanken og adapteren fungerer stabilt. Først derefter planlægges migrering eller erstatning af de eksisterende spil. Nye spil skal genbruge opgavebank, overlay, inputprofil, lokalisering og lifecycle-adapter frem for at implementere dem igen.

Et senere tårn-/kortspil behandles som en separat designspecifikation. Det kan genbruge opgavebanken og Phaser-fundamentet, men er ikke en skjult del af denne leverance.
