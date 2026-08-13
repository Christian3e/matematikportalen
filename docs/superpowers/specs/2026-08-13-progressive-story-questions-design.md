# Progressive spørgsmål i fortællinger

## Formål
Elever skal kunne se tidligere spørgsmål og deres korrekte svar, når de løser senere spørgsmål i samme kapitel. Det reducerer behovet for at navigere tilbage og støtter opgaver, hvor et tidligere resultat bruges igen.

## Adfærd
- Et nyt kapitel viser kun det første spørgsmål.
- Et forkert eller tomt svar åbner ikke næste spørgsmål.
- Et korrekt svar bliver stående og låses, så det ikke kan ændres.
- Efter et korrekt svar tilføjes næste spørgsmål umiddelbart nedenunder.
- Alle løste spørgsmål og korrekte svar forbliver synlige resten af kapitlet.
- Progressionsvisningen viser det aktuelle antal åbnede spørgsmål ud af kapitlets samlede antal.
- Kapitelopgaven og kapitelkoden bliver først tilgængelige efter den eksisterende løsningslogik.
- Åbne refleksionsspørgsmål vises, når eleven når til dem, men de låses ikke og blokerer ikke næste matematisk kontrollerede spørgsmål eller kapitelopgaven.

## Teknisk afgrænsning
Ændringen gælder kun aktiviteter af typen `story`. Opgavesæt, spil og udfordringer beholder deres nuværende flow. Den eksisterende svarvalidering, URL-routing, kapitelkoder og Vercel-struktur bevares.

## Tilgængelighed
Låste svarfelter bruger native `disabled`-tilstand og en tydelig løst-markering. Tekst og svar skal fortsat have læsbar kontrast. Fokus flyttes ikke automatisk væk fra elevens aktuelle område.

## Testkrav
- Før løsningen vises præcis ét fortællingsspørgsmål.
- Et forkert svar efterlader antallet af synlige spørgsmål uændret.
- Et korrekt svar gør feltet låst og viser næste spørgsmål.
- To korrekte svar efterlader begge spørgsmål synlige og låste samt viser det tredje.
- Andre aktivitetstyper viser fortsat deres normale spørgsmålslister.
- Produktionsbuild og browserkonsol er uden fejl.
