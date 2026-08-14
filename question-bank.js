(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.QUESTION_BANK = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const LANGUAGES = ["da", "en", "fr"];
  const DIFFICULTIES = ["easy", "medium", "hard"];
  const MODES = ["gate", "overlay"];
  const TYPES = ["choice", "number"];
  const UNITS = [null, "%", "cm", "cm²", "cm³", "m", "kr", "min"];

  const TOPICS = [
    {
      id: "arithmetic",
      labels: {da: "Regning", en: "Arithmetic", fr: "Calcul"},
      subtopics: [
        {id: "addition-subtraction", labels: {da: "Plus og minus", en: "Addition and subtraction", fr: "Addition et soustraction"}},
        {id: "multiplication-division", labels: {da: "Gange og division", en: "Multiplication and division", fr: "Multiplication et division"}},
        {id: "order-of-operations", labels: {da: "Regnearternes rækkefølge", en: "Order of operations", fr: "Priorité des opérations"}}
      ]
    },
    {
      id: "fractions-percent",
      labels: {da: "Brøker og procent", en: "Fractions and percentages", fr: "Fractions et pourcentages"},
      subtopics: [
        {id: "fractions", labels: {da: "Brøker", en: "Fractions", fr: "Fractions"}},
        {id: "percentages", labels: {da: "Procent", en: "Percentages", fr: "Pourcentages"}},
        {id: "ratios", labels: {da: "Forhold", en: "Ratios", fr: "Proportions"}}
      ]
    },
    {
      id: "geometry",
      labels: {da: "Geometri", en: "Geometry", fr: "Géométrie"},
      subtopics: [
        {id: "perimeter", labels: {da: "Omkreds", en: "Perimeter", fr: "Périmètre"}},
        {id: "measurement", labels: {da: "Måling", en: "Measurement", fr: "Mesures"}},
        {id: "area", labels: {da: "Areal", en: "Area", fr: "Aire"}},
        {id: "volume", labels: {da: "Rumfang", en: "Volume", fr: "Volume"}}
      ]
    },
    {
      id: "mixed",
      labels: {da: "Blandede opgaver", en: "Mixed problems", fr: "Problèmes variés"},
      subtopics: [
        {id: "money", labels: {da: "Penge", en: "Money", fr: "Argent"}},
        {id: "time", labels: {da: "Tid", en: "Time", fr: "Temps"}},
        {id: "data", labels: {da: "Data", en: "Data", fr: "Données"}},
        {id: "rates", labels: {da: "Rater og fart", en: "Rates and speed", fr: "Taux et vitesse"}}
      ]
    }
  ];

  const DIFFICULTY_METADATA = {
    arithmetic: {
      easy: {
        da: ["Let", "Korte regnestykker med hele tal.", "18 + 7 = ?"],
        en: ["Easy", "Short calculations with whole numbers.", "18 + 7 = ?"],
        fr: ["Facile", "Calculs courts avec des nombres entiers.", "18 + 7 = ?"]
      },
      medium: {
        da: ["Mellem", "Gange og division med større tal.", "96 ÷ 8 = ?"],
        en: ["Medium", "Multiplication and division with larger numbers.", "96 ÷ 8 = ?"],
        fr: ["Moyen", "Multiplications et divisions avec de plus grands nombres.", "96 ÷ 8 = ?"]
      },
      hard: {
        da: ["Svær", "Flere regnearter i samme opgave.", "45 − 6 × 4 = ?"],
        en: ["Hard", "Several operations in one problem.", "45 − 6 × 4 = ?"],
        fr: ["Difficile", "Plusieurs opérations dans un même problème.", "45 − 6 × 4 = ?"]
      }
    },
    "fractions-percent": {
      easy: {
        da: ["Let", "Find en enkel brøkdel eller procentdel.", "1/4 af 20 = ?"],
        en: ["Easy", "Find a simple fraction or percentage.", "1/4 of 20 = ?"],
        fr: ["Facile", "Trouve une fraction ou un pourcentage simple.", "1/4 de 20 = ?"]
      },
      medium: {
        da: ["Mellem", "Arbejd med ækvivalente brøker og procent.", "25% af 160 = ?"],
        en: ["Medium", "Work with equivalent fractions and percentages.", "25% of 160 = ?"],
        fr: ["Moyen", "Travaille les fractions équivalentes et les pourcentages.", "25% de 160 = ?"]
      },
      hard: {
        da: ["Svær", "Kombinér brøker, decimaler og forhold.", "3/8 + 2/8 som decimal = ?"],
        en: ["Hard", "Combine fractions, decimals, and ratios.", "3/8 + 2/8 as a decimal = ?"],
        fr: ["Difficile", "Combine fractions, décimaux et proportions.", "3/8 + 2/8 en décimal = ?"]
      }
    },
    geometry: {
      easy: {
        da: ["Let", "Mål længde og omkreds i cm og m.", "Omkreds af 4 cm × 7 cm = ?"],
        en: ["Easy", "Measure length and perimeter in cm and m.", "Perimeter of 4 cm × 7 cm = ?"],
        fr: ["Facile", "Mesure les longueurs et le périmètre en cm et m.", "Périmètre de 4 cm × 7 cm = ?"]
      },
      medium: {
        da: ["Mellem", "Beregn areal af kendte figurer.", "Areal af et rektangel 6 cm × 8 cm = ?"],
        en: ["Medium", "Calculate the area of familiar shapes.", "Area of a 6 cm × 8 cm rectangle = ?"],
        fr: ["Moyen", "Calcule l’aire de figures connues.", "Aire d’un rectangle de 6 cm × 8 cm = ?"]
      },
      hard: {
        da: ["Svær", "Brug areal og rumfang til at finde ukendte mål.", "Rumfang af 3 cm × 4 cm × 5 cm = ?"],
        en: ["Hard", "Use area and volume to find unknown measures.", "Volume of 3 cm × 4 cm × 5 cm = ?"],
        fr: ["Difficile", "Utilise l’aire et le volume pour trouver une mesure.", "Volume de 3 cm × 4 cm × 5 cm = ?"]
      }
    },
    mixed: {
      easy: {
        da: ["Let", "Brug matematik med penge og tid.", "35 kr + 28 kr = ?"],
        en: ["Easy", "Use mathematics with money and time.", "35 kr + 28 kr = ?"],
        fr: ["Facile", "Utilise les mathématiques avec l’argent et le temps.", "35 kr + 28 kr = ?"]
      },
      medium: {
        da: ["Mellem", "Find gennemsnit og pris pr. stk.", "60 kr for 4: pris pr. stk. = ?"],
        en: ["Medium", "Find averages and unit prices.", "60 kr for 4: money per item = ?"],
        fr: ["Moyen", "Trouve des moyennes et des prix unitaires.", "60 kr pour 4 : argent par article = ?"]
      },
      hard: {
        da: ["Svær", "Løs problemer med afstand og budget.", "300 m på 5 min: afstand pr. minut = ?"],
        en: ["Hard", "Solve distance and budget problems.", "300 m in 5 min: distance per minute = ?"],
        fr: ["Difficile", "Résous des problèmes de distance et de budget.", "300 m en 5 min : distance par minute = ?"]
      }
    }
  };

  const RULES = {
    addition: {
      da: ["Læg de to tal sammen.", "Summen er {a} + {b} = {answer}."],
      en: ["Add the two numbers.", "The sum is {a} + {b} = {answer}."],
      fr: ["Additionne les deux nombres.", "La somme est {a} + {b} = {answer}."]
    },
    subtraction: {
      da: ["Træk det mindste tal fra det største.", "Forskellen er {a} − {b} = {answer}."],
      en: ["Subtract the smaller number from the larger one.", "The difference is {a} − {b} = {answer}."],
      fr: ["Soustrais le plus petit nombre du plus grand.", "La différence est {a} − {b} = {answer}."]
    },
    multiplication: {
      da: ["Tænk i lige store grupper.", "{a} grupper med {b} giver {answer}."],
      en: ["Think in equal groups.", "{a} groups of {b} make {answer}."],
      fr: ["Pense en groupes égaux.", "{a} groupes de {b} donnent {answer}."]
    },
    division: {
      da: ["Find hvor mange lige store grupper der er.", "{a} delt i grupper på {b} giver {answer}."],
      en: ["Find how many equal groups there are.", "{a} split into groups of {b} gives {answer}."],
      fr: ["Trouve le nombre de groupes égaux.", "{a} partagé en groupes de {b} donne {answer}."]
    },
    order: {
      da: ["Regn gange eller division før plus og minus.", "Først findes {middle}; derefter bliver svaret {answer}."],
      en: ["Multiply or divide before adding or subtracting.", "First find {middle}; then the answer is {answer}."],
      fr: ["Multiplie ou divise avant d’additionner ou soustraire.", "Calcule d’abord {middle}, puis la réponse est {answer}."]
    },
    fraction: {
      da: ["Del helheden i nævnerens antal dele.", "Én del er {part}; {n} dele er {answer}."],
      en: ["Divide the whole into the denominator’s number of parts.", "One part is {part}; {n} parts are {answer}."],
      fr: ["Divise le tout selon le dénominateur.", "Une part vaut {part} ; {n} parts valent {answer}."]
    },
    percent: {
      da: ["Omskriv procenten til en del af 100.", "{pct}% af {whole} er {answer}."],
      en: ["Rewrite the percentage as a part of 100.", "{pct}% of {whole} is {answer}."],
      fr: ["Écris le pourcentage comme une part de 100.", "{pct}% de {whole} vaut {answer}."]
    },
    equivalent: {
      da: ["Gang tæller og nævner med samme tal.", "Nævneren ganges med {factor}, så tælleren bliver {answer}."],
      en: ["Multiply numerator and denominator by the same number.", "The denominator is multiplied by {factor}, so the numerator becomes {answer}."],
      fr: ["Multiplie le numérateur et le dénominateur par le même nombre.", "Le dénominateur est multiplié par {factor}, donc le numérateur devient {answer}."]
    },
    fractionAdd: {
      da: ["Læg tællerne sammen, når nævnerne er ens.", "{n1} + {n2} dele af {d} er decimalen {answer}."],
      en: ["Add the numerators when the denominators match.", "{n1} + {n2} parts out of {d} is the decimal {answer}."],
      fr: ["Additionne les numérateurs quand les dénominateurs sont égaux.", "{n1} + {n2} parts sur {d} donnent le décimal {answer}."]
    },
    ratio: {
      da: ["Find hvor mange hele grupper der er.", "{total} er {factor} grupper; {n} i hver giver {answer}."],
      en: ["Find how many complete groups there are.", "{total} is {factor} groups; {n} in each gives {answer}."],
      fr: ["Trouve le nombre de groupes complets.", "{total} représente {factor} groupes ; {n} dans chacun donnent {answer}."]
    },
    perimeter: {
      da: ["Læg alle fire sider sammen.", "Omkredsen er 2 × ({a} + {b}) = {answer} cm."],
      en: ["Add all four sides.", "The perimeter is 2 × ({a} + {b}) = {answer} cm."],
      fr: ["Additionne les quatre côtés.", "Le périmètre est 2 × ({a} + {b}) = {answer} cm."]
    },
    conversion: {
      da: ["Der er 100 cm i 1 m.", "{a} m × 100 = {answer} cm."],
      en: ["There are 100 cm in 1 m.", "{a} m × 100 = {answer} cm."],
      fr: ["Il y a 100 cm dans 1 m.", "{a} m × 100 = {answer} cm."]
    },
    rectangleArea: {
      da: ["Gang rektanglets længde med bredden.", "Arealet er {a} × {b} = {answer} cm²."],
      en: ["Multiply the rectangle’s length by its width.", "The area is {a} × {b} = {answer} cm²."],
      fr: ["Multiplie la longueur du rectangle par sa largeur.", "L’aire est {a} × {b} = {answer} cm²."]
    },
    triangleArea: {
      da: ["Gang grundlinje med højde og del med 2.", "Arealet er {a} × {b} ÷ 2 = {answer} cm²."],
      en: ["Multiply base by height and divide by 2.", "The area is {a} × {b} ÷ 2 = {answer} cm²."],
      fr: ["Multiplie la base par la hauteur et divise par 2.", "L’aire est {a} × {b} ÷ 2 = {answer} cm²."]
    },
    volume: {
      da: ["Gang længde, bredde og højde.", "Rumfanget er {a} × {b} × {c} = {answer} cm³."],
      en: ["Multiply length, width, and height.", "The volume is {a} × {b} × {c} = {answer} cm³."],
      fr: ["Multiplie la longueur, la largeur et la hauteur.", "Le volume est {a} × {b} × {c} = {answer} cm³."]
    },
    missingSide: {
      da: ["Del arealet med den kendte side.", "Den ukendte side er {area} ÷ {b} = {answer} cm."],
      en: ["Divide the area by the known side.", "The unknown side is {area} ÷ {b} = {answer} cm."],
      fr: ["Divise l’aire par le côté connu.", "Le côté inconnu vaut {area} ÷ {b} = {answer} cm."]
    },
    money: {
      da: ["Læg priserne sammen.", "Den samlede pris er {a} kr + {b} kr = {answer} kr."],
      en: ["Add the prices.", "The total price is {a} kr + {b} kr = {answer} kr."],
      fr: ["Additionne les prix.", "Le prix total est {a} kr + {b} kr = {answer} kr."]
    },
    time: {
      da: ["Tæl minutterne fra start til slut.", "Tidsrummet er {answer} minutter."],
      en: ["Count the minutes from start to finish.", "The elapsed time is {answer} minutes."],
      fr: ["Compte les minutes du début à la fin.", "La durée est de {answer} minutes."]
    },
    average: {
      da: ["Læg tallene sammen og del med 3.", "Summen er {sum}; {sum} ÷ 3 = {answer}."],
      en: ["Add the numbers and divide by 3.", "The sum is {sum}; {sum} ÷ 3 = {answer}."],
      fr: ["Additionne les nombres et divise par 3.", "La somme est {sum} ; {sum} ÷ 3 = {answer}."]
    },
    unitPrice: {
      da: ["Del den samlede pris med antallet.", "{total} kr ÷ {items} = {answer} kr pr. stk."],
      en: ["Divide the total price by the number of items.", "{total} kr ÷ {items} = {answer} kr per item."],
      fr: ["Divise le prix total par le nombre d’articles.", "{total} kr ÷ {items} = {answer} kr par article."]
    },
    distance: {
      da: ["Gang afstanden pr. minut med tiden.", "{rate} m pr. minut × {minutes} min = {answer} m."],
      en: ["Multiply the distance per minute by the time.", "{rate} m per minute × {minutes} min = {answer} m."],
      fr: ["Multiplie la distance par minute par le temps.", "{rate} m par minute × {minutes} min = {answer} m."]
    },
    budget: {
      da: ["Læg udgifterne sammen og træk dem fra budgettet.", "Udgifterne er {spent} kr; der er {answer} kr tilbage."],
      en: ["Add the costs and subtract them from the budget.", "The costs are {spent} kr; {answer} kr remains."],
      fr: ["Additionne les dépenses et soustrais-les du budget.", "Les dépenses sont de {spent} kr ; il reste {answer} kr."]
    }
  };

  class QuestionBankError extends Error {
    constructor(code, filter) {
      super(`Question bank error: ${code}`);
      this.name = "QuestionBankError";
      this.code = code;
      this.filter = clone(filter);
    }
  }

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
    }
    return value;
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function frozenCopy(value) {
    return deepFreeze(clone(value));
  }

  function language(lang) {
    return LANGUAGES.includes(lang) ? lang : "da";
  }

  function integer(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function pick(rng, values) {
    return values[integer(rng, 0, values.length - 1)];
  }

  function round(value, precision) {
    const factor = 10 ** precision;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function shuffle(values, rng) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = integer(rng, 0, index);
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function interpolate(text, values, lang) {
    return text.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, key) => {
      const value = values[key];
      const rendered = String(value);
      return typeof value === "number" && !Number.isInteger(value) && lang !== "en"
        ? rendered.replace(".", ",")
        : rendered;
    });
  }

  function choiceOptions(answer, precision, rng) {
    const scale = 10 ** precision;
    const answerUnits = Math.round(answer * scale);
    const step = Math.max(1, integer(rng, 1, Math.max(2, Math.min(10, Math.ceil(Math.abs(answerUnits) / 4) || 2))));
    const candidateUnits = [answerUnits + step, answerUnits - step, answerUnits + step * 2, answerUnits - step * 2, answerUnits + step * 3];
    const choices = new Set();
    for (const units of candidateUnits) {
      if (units >= 0 && units !== answerUnits) choices.add(units);
      if (choices.size === 3) break;
    }
    for (let offset = 1; choices.size < 3; offset += 1) choices.add(answerUnits + step * (offset + 3));
    return shuffle([answerUnits, ...choices].slice(0, 4), rng).map(units => round(units / scale, precision));
  }

  function localeSet(prompt, rule) {
    return Object.fromEntries(LANGUAGES.map(lang => [lang, {
      prompt: values => interpolate(prompt[lang], values, lang),
      hint: RULES[rule][lang][0],
      explanation: values => interpolate(RULES[rule][lang][1], values, lang)
    }]));
  }

  const templates = [];

  function addScenario(config) {
    for (const mode of MODES) {
      const type = mode === "gate" ? "choice" : "number";
      templates.push({
        id: `${config.topic}-${config.slug}-${mode}@v1`,
        grades: [4, 5, 6],
        topic: config.topic,
        subtopic: config.subtopic,
        difficulty: config.difficulty,
        mode,
        type,
        unit: config.unit,
        precision: config.precision,
        locales: localeSet(config.prompt, config.rule),
        generate(rng) {
          const generated = config.generate(rng);
          const answer = round(generated.answer, config.precision);
          const values = {...generated.values, answer};
          return {
            values,
            answer,
            options: mode === "gate" ? choiceOptions(answer, config.precision, rng) : null
          };
        }
      });
    }
  }

  addScenario({
    topic: "arithmetic", slug: "addition", subtopic: "addition-subtraction", difficulty: "easy", unit: null, precision: 0, rule: "addition",
    prompt: {da: "{a} + {b} = ?", en: "{a} + {b} = ?", fr: "{a} + {b} = ?"},
    generate: rng => { const a = integer(rng, 12, 99); const b = integer(rng, 3, 60); return {values: {a, b}, answer: a + b}; }
  });
  addScenario({
    topic: "arithmetic", slug: "subtraction", subtopic: "addition-subtraction", difficulty: "easy", unit: null, precision: 0, rule: "subtraction",
    prompt: {da: "{a} − {b} = ?", en: "{a} − {b} = ?", fr: "{a} − {b} = ?"},
    generate: rng => { const b = integer(rng, 2, 70); const answer = integer(rng, 1, 80); const a = b + answer; return {values: {a, b}, answer}; }
  });
  addScenario({
    topic: "arithmetic", slug: "multiplication", subtopic: "multiplication-division", difficulty: "medium", unit: null, precision: 0, rule: "multiplication",
    prompt: {da: "{a} × {b} = ?", en: "{a} × {b} = ?", fr: "{a} × {b} = ?"},
    generate: rng => { const a = integer(rng, 4, 19); const b = integer(rng, 3, 15); return {values: {a, b}, answer: a * b}; }
  });
  addScenario({
    topic: "arithmetic", slug: "division", subtopic: "multiplication-division", difficulty: "medium", unit: null, precision: 0, rule: "division",
    prompt: {da: "{a} ÷ {b} = ?", en: "{a} ÷ {b} = ?", fr: "{a} ÷ {b} = ?"},
    generate: rng => { const b = integer(rng, 2, 12); const answer = integer(rng, 3, 40); const a = b * answer; return {values: {a, b}, answer}; }
  });
  addScenario({
    topic: "arithmetic", slug: "multiply-then-add", subtopic: "order-of-operations", difficulty: "hard", unit: null, precision: 0, rule: "order",
    prompt: {da: "{a} + {b} × {c} = ?", en: "{a} + {b} × {c} = ?", fr: "{a} + {b} × {c} = ?"},
    generate: rng => { const a = integer(rng, 10, 80); const b = integer(rng, 3, 12); const c = integer(rng, 2, 10); const middle = b * c; return {values: {a, b, c, middle}, answer: a + middle}; }
  });
  addScenario({
    topic: "arithmetic", slug: "divide-then-subtract", subtopic: "order-of-operations", difficulty: "hard", unit: null, precision: 0, rule: "order",
    prompt: {da: "{a} − {b} ÷ {c} = ?", en: "{a} − {b} ÷ {c} = ?", fr: "{a} − {b} ÷ {c} = ?"},
    generate: rng => { const c = integer(rng, 2, 10); const middle = integer(rng, 2, 12); const b = c * middle; const a = integer(rng, middle + 5, middle + 100); return {values: {a, b, c, middle}, answer: a - middle}; }
  });

  addScenario({
    topic: "fractions-percent", slug: "fraction-of", subtopic: "fractions", difficulty: "easy", unit: null, precision: 0, rule: "fraction",
    prompt: {da: "Hvad er {n}/{d} af {whole}?", en: "What is {n}/{d} of {whole}?", fr: "Combien vaut {n}/{d} de {whole} ?"},
    generate: rng => { const d = integer(rng, 2, 10); const n = integer(rng, 1, d - 1); const part = integer(rng, 2, 30); const whole = d * part; return {values: {n, d, part, whole}, answer: n * part}; }
  });
  addScenario({
    topic: "fractions-percent", slug: "simple-percent", subtopic: "percentages", difficulty: "easy", unit: null, precision: 0, rule: "percent",
    prompt: {da: "Hvad er {pct}% af {whole}?", en: "What is {pct}% of {whole}?", fr: "Combien vaut {pct}% de {whole} ?"},
    generate: rng => { const pct = pick(rng, [10, 20, 25, 50]); const whole = integer(rng, 2, 30) * 20; return {values: {pct, whole}, answer: whole * pct / 100}; }
  });
  addScenario({
    topic: "fractions-percent", slug: "equivalent-fraction", subtopic: "fractions", difficulty: "medium", unit: null, precision: 0, rule: "equivalent",
    prompt: {da: "{n}/{d} = ?/{targetD}", en: "{n}/{d} = ?/{targetD}", fr: "{n}/{d} = ?/{targetD}"},
    generate: rng => { const d = integer(rng, 2, 9); const n = integer(rng, 1, d - 1); const factor = integer(rng, 2, 8); return {values: {n, d, factor, targetD: d * factor}, answer: n * factor}; }
  });
  addScenario({
    topic: "fractions-percent", slug: "percent-of", subtopic: "percentages", difficulty: "medium", unit: null, precision: 0, rule: "percent",
    prompt: {da: "Beregn {pct}% af {whole}.", en: "Calculate {pct}% of {whole}.", fr: "Calcule {pct}% de {whole}."},
    generate: rng => { const pct = pick(rng, [15, 20, 25, 30, 40, 60, 75]); const whole = integer(rng, 3, 35) * 20; return {values: {pct, whole}, answer: whole * pct / 100}; }
  });
  addScenario({
    topic: "fractions-percent", slug: "fraction-sum-decimal", subtopic: "fractions", difficulty: "hard", unit: null, precision: 2, rule: "fractionAdd",
    prompt: {da: "Skriv {n1}/{d} + {n2}/{d} som decimaltal.", en: "Write {n1}/{d} + {n2}/{d} as a decimal.", fr: "Écris {n1}/{d} + {n2}/{d} en décimal."},
    generate: rng => { const d = pick(rng, [4, 5, 10, 20, 25]); const n1 = integer(rng, 1, d - 1); const n2 = integer(rng, 1, d - 1); return {values: {n1, n2, d}, answer: (n1 + n2) / d}; }
  });
  addScenario({
    topic: "fractions-percent", slug: "ratio-groups", subtopic: "ratios", difficulty: "hard", unit: null, precision: 0, rule: "ratio",
    prompt: {da: "{n} ud af hver {d} vælger blå. Hvor mange af {total}?", en: "{n} out of every {d} choose blue. How many out of {total}?", fr: "{n} sur {d} choisissent le bleu. Combien sur {total} ?"},
    generate: rng => { const d = integer(rng, 3, 10); const n = integer(rng, 1, d - 1); const factor = integer(rng, 3, 20); const total = d * factor; return {values: {n, d, factor, total}, answer: n * factor}; }
  });

  addScenario({
    topic: "geometry", slug: "rectangle-perimeter", subtopic: "perimeter", difficulty: "easy", unit: "cm", precision: 0, rule: "perimeter",
    prompt: {da: "Find omkredsen af et rektangel på {a} cm × {b} cm.", en: "Find the perimeter of a {a} cm × {b} cm rectangle.", fr: "Trouve le périmètre d’un rectangle de {a} cm × {b} cm."},
    generate: rng => { const a = integer(rng, 2, 30); const b = integer(rng, 2, 25); return {values: {a, b}, answer: 2 * (a + b)}; }
  });
  addScenario({
    topic: "geometry", slug: "metres-to-centimetres", subtopic: "measurement", difficulty: "easy", unit: "cm", precision: 0, rule: "conversion",
    prompt: {da: "Hvor mange cm er {a} m?", en: "How many cm are {a} m?", fr: "Combien de cm font {a} m ?"},
    generate: rng => { const a = integer(rng, 1, 40); return {values: {a}, answer: a * 100}; }
  });
  addScenario({
    topic: "geometry", slug: "rectangle-area", subtopic: "area", difficulty: "medium", unit: "cm²", precision: 0, rule: "rectangleArea",
    prompt: {da: "Find arealet af et rektangel på {a} cm × {b} cm.", en: "Find the area of a {a} cm × {b} cm rectangle.", fr: "Trouve l’aire d’un rectangle de {a} cm × {b} cm."},
    generate: rng => { const a = integer(rng, 3, 30); const b = integer(rng, 2, 25); return {values: {a, b}, answer: a * b}; }
  });
  addScenario({
    topic: "geometry", slug: "triangle-area", subtopic: "area", difficulty: "medium", unit: "cm²", precision: 0, rule: "triangleArea",
    prompt: {da: "Find arealet af en trekant med grundlinje {a} cm og højde {b} cm.", en: "Find the area of a triangle with base {a} cm and height {b} cm.", fr: "Trouve l’aire d’un triangle de base {a} cm et de hauteur {b} cm."},
    generate: rng => { const a = integer(rng, 2, 20) * 2; const b = integer(rng, 2, 25); return {values: {a, b}, answer: a * b / 2}; }
  });
  addScenario({
    topic: "geometry", slug: "box-volume", subtopic: "volume", difficulty: "hard", unit: "cm³", precision: 0, rule: "volume",
    prompt: {da: "Find rumfanget af en kasse på {a} cm × {b} cm × {c} cm.", en: "Find the volume of a {a} cm × {b} cm × {c} cm box.", fr: "Trouve le volume d’une boîte de {a} cm × {b} cm × {c} cm."},
    generate: rng => { const a = integer(rng, 2, 15); const b = integer(rng, 2, 12); const c = integer(rng, 2, 10); return {values: {a, b, c}, answer: a * b * c}; }
  });
  addScenario({
    topic: "geometry", slug: "missing-rectangle-side", subtopic: "area", difficulty: "hard", unit: "cm", precision: 0, rule: "missingSide",
    prompt: {da: "Et rektangel har areal {area} cm² og bredde {b} cm. Find længden.", en: "A rectangle has area {area} cm² and width {b} cm. Find its length.", fr: "Un rectangle a une aire de {area} cm² et une largeur de {b} cm. Trouve sa longueur."},
    generate: rng => { const b = integer(rng, 2, 15); const answer = integer(rng, 3, 30); const area = b * answer; return {values: {area, b}, answer}; }
  });

  addScenario({
    topic: "mixed", slug: "money-total", subtopic: "money", difficulty: "easy", unit: "kr", precision: 0, rule: "money",
    prompt: {da: "En bog koster {a} kr, og en pen koster {b} kr. Hvad koster de tilsammen?", en: "A book costs {a} kr and a pen costs {b} kr. What is the total?", fr: "Un livre coûte {a} kr et un stylo {b} kr. Quel est le total ?"},
    generate: rng => { const a = integer(rng, 20, 150); const b = integer(rng, 5, 80); return {values: {a, b}, answer: a + b}; }
  });
  addScenario({
    topic: "mixed", slug: "elapsed-time", subtopic: "time", difficulty: "easy", unit: "min", precision: 0, rule: "time",
    prompt: {da: "En aktivitet starter kl. {start} og slutter kl. {end}. Hvor mange minutter varer den?", en: "An activity starts at {start} and ends at {end}. How many minutes does it last?", fr: "Une activité commence à {start} et finit à {end}. Combien de minutes dure-t-elle ?"},
    generate: rng => { const startMinutes = integer(rng, 8 * 60, 15 * 60); const answer = integer(rng, 3, 24) * 5; const endMinutes = startMinutes + answer; const clock = minutes => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`; return {values: {start: clock(startMinutes), end: clock(endMinutes)}, answer}; }
  });
  addScenario({
    topic: "mixed", slug: "average", subtopic: "data", difficulty: "medium", unit: null, precision: 0, rule: "average",
    prompt: {da: "Find gennemsnittet af {a}, {b} og {c}.", en: "Find the average of {a}, {b}, and {c}.", fr: "Trouve la moyenne de {a}, {b} et {c}."},
    generate: rng => { const answer = integer(rng, 5, 80); const delta = integer(rng, 1, Math.min(15, answer)); const a = answer - delta; const b = answer; const c = answer + delta; return {values: {a, b, c, sum: a + b + c}, answer}; }
  });
  addScenario({
    topic: "mixed", slug: "unit-price", subtopic: "money", difficulty: "medium", unit: "kr", precision: 1, rule: "unitPrice",
    prompt: {da: "{items} ens varer koster {total} kr. Hvad koster én vare?", en: "{items} identical items cost {total} kr. What does one item cost?", fr: "{items} articles identiques coûtent {total} kr. Quel est le prix d’un article ?"},
    generate: rng => { const items = integer(rng, 2, 12); const answer = integer(rng, 5, 200) / 2; const total = round(items * answer, 1); return {values: {items, total}, answer}; }
  });
  addScenario({
    topic: "mixed", slug: "walking-distance", subtopic: "rates", difficulty: "hard", unit: "m", precision: 0, rule: "distance",
    prompt: {da: "Du går {rate} m pr. minut i {minutes} minutter. Hvor langt går du?", en: "You walk {rate} m per minute for {minutes} minutes. How far do you walk?", fr: "Tu marches {rate} m par minute pendant {minutes} minutes. Quelle distance parcours-tu ?"},
    generate: rng => { const rate = integer(rng, 30, 100); const minutes = integer(rng, 3, 25); return {values: {rate, minutes}, answer: rate * minutes}; }
  });
  addScenario({
    topic: "mixed", slug: "two-cost-budget", subtopic: "money", difficulty: "hard", unit: "kr", precision: 0, rule: "budget",
    prompt: {da: "Du har {budget} kr og køber ting til {a} kr og {b} kr. Hvor meget har du tilbage?", en: "You have {budget} kr and buy items for {a} kr and {b} kr. How much remains?", fr: "Tu as {budget} kr et achètes des articles à {a} kr et {b} kr. Combien reste-t-il ?"},
    generate: rng => { const a = integer(rng, 20, 150); const b = integer(rng, 10, 100); const spent = a + b; const answer = integer(rng, 5, 150); const budget = spent + answer; return {values: {a, b, spent, budget}, answer}; }
  });

  function fail(template, detail) {
    const id = template && template.id ? template.id : "<missing-id>";
    throw new Error(`Invalid question template ${id}: ${detail}`);
  }

  function validateRendered(template, generated, lang) {
    if (!generated || typeof generated !== "object") fail(template, "generator output is missing");
    if (!Object.prototype.hasOwnProperty.call(generated, "answer")) fail(template, "answer is missing");
    if (!Number.isFinite(generated.answer) || generated.answer < 0) fail(template, "answer must be a nonnegative finite number");
    if (round(generated.answer, template.precision) !== generated.answer) fail(template, "answer exceeds declared precision");
    const values = generated.values && typeof generated.values === "object" ? generated.values : {};
    if (Object.values(values).some(value => typeof value === "number" && (!Number.isFinite(value) || value < 0))) {
      fail(template, "generated numeric values must be nonnegative and finite");
    }
    const localized = template.locales[lang];
    let prompt;
    let hint;
    let explanation;
    try {
      prompt = typeof localized.prompt === "function" ? localized.prompt(values) : localized.prompt;
      hint = typeof localized.hint === "function" ? localized.hint(values) : localized.hint;
      explanation = typeof localized.explanation === "function" ? localized.explanation(values) : localized.explanation;
    } catch (error) {
      fail(template, `${lang} localization failed: ${error.message}`);
    }
    if (typeof prompt !== "string" || !prompt.trim()) fail(template, `${lang} prompt must render a nonempty string`);
    if (typeof hint !== "string" || !hint.trim()) fail(template, `${lang} hint must render a nonempty string`);
    if (typeof explanation !== "string" || !explanation.trim()) fail(template, `${lang} explanation must render a nonempty string`);
    if ([prompt, hint, explanation].some(text => /\b(?:undefined|null|NaN)\b|\{[^}]+\}/.test(String(text)))) fail(template, `${lang} localization contains missing values`);
    if (/(?:÷|\/)\s*0(?:\D|$)/.test(prompt)) fail(template, "division by zero");

    if (template.type === "choice") {
      if (!Array.isArray(generated.options) || generated.options.length !== 4) fail(template, "four options are required");
      if (!generated.options.every(option => Number.isFinite(option) && option >= 0)) fail(template, "options must be nonnegative finite numbers");
      if (!generated.options.every(option => round(option, template.precision) === option)) fail(template, "option exceeds declared precision");
      if (new Set(generated.options.map(String)).size !== 4) fail(template, "options must be unique");
      if (generated.options.filter(option => Object.is(option, generated.answer)).length !== 1) fail(template, "exactly one option must be correct");
    } else if (generated.options !== null) {
      fail(template, "structured questions must declare null options");
    }
  }

  function validateTemplate(template) {
    if (!template || typeof template !== "object") fail(template, "template is missing");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*@v[1-9][0-9]*$/.test(template.id || "")) fail(template, "id must be stable and versioned");
    if (!Array.isArray(template.grades) || template.grades.length === 0 || template.grades.some(grade => ![4, 5, 6].includes(grade))) fail(template, "grades are unsupported");
    const topic = TOPICS.find(item => item.id === template.topic);
    if (!topic) fail(template, "topic is unsupported");
    if (!topic.subtopics.some(item => item.id === template.subtopic)) fail(template, "subtopic is unsupported for topic");
    if (!DIFFICULTIES.includes(template.difficulty)) fail(template, "difficulty is unsupported");
    if (!MODES.includes(template.mode)) fail(template, "mode is unsupported");
    if (!TYPES.includes(template.type)) fail(template, "type is unsupported");
    if ((template.mode === "gate") !== (template.type === "choice")) fail(template, "mode and type are incompatible");
    if (!Object.prototype.hasOwnProperty.call(template, "unit") || !UNITS.includes(template.unit)) fail(template, "unit must be declared and supported");
    if (![0, 1, 2].includes(template.precision)) fail(template, "precision is unsupported");
    if (!template.locales || typeof template.locales !== "object") fail(template, "localization is missing");
    for (const lang of LANGUAGES) {
      const localized = template.locales[lang];
      if (!localized) fail(template, `${lang} localization is incomplete`);
      for (const field of ["prompt", "hint", "explanation"]) {
        if (!["string", "function"].includes(typeof localized[field])) fail(template, `${lang} ${field} must be a string or function`);
        if (typeof localized[field] === "string" && !localized[field].trim()) fail(template, `${lang} ${field} is missing`);
      }
    }
    if (typeof template.generate !== "function") fail(template, "generator is missing");
    for (const sample of [0, 0.5, 0.999999]) {
      let generated;
      try {
        generated = template.generate(() => sample);
      } catch (error) {
        fail(template, `generator failed: ${error.message}`);
      }
      for (const lang of LANGUAGES) validateRendered(template, generated, lang);
    }
    return true;
  }

  templates.forEach(validateTemplate);
  deepFreeze(templates);

  function topics(lang) {
    const selected = language(lang);
    return frozenCopy(TOPICS.map(topic => ({
      id: topic.id,
      label: topic.labels[selected],
      subtopics: topic.subtopics.map(subtopic => ({id: subtopic.id, label: subtopic.labels[selected]}))
    })));
  }

  function difficulties(topic, lang) {
    const selected = language(lang);
    const metadata = DIFFICULTY_METADATA[topic];
    if (!metadata) return frozenCopy([]);
    return frozenCopy(DIFFICULTIES.map(id => ({
      id,
      label: metadata[id][selected][0],
      explanation: metadata[id][selected][1],
      example: metadata[id][selected][2]
    })));
  }

  function hash(text) {
    let value = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      value ^= text.charCodeAt(index);
      value = Math.imul(value, 16777619);
    }
    return (value >>> 0).toString(36);
  }

  function renderTemplate(template, rng, lang, grade) {
    const generated = template.generate(rng);
    validateRendered(template, generated, lang);
    const localized = template.locales[lang];
    const values = generated.values;
    const prompt = typeof localized.prompt === "function" ? localized.prompt(values) : localized.prompt;
    const hint = typeof localized.hint === "function" ? localized.hint(values) : localized.hint;
    const explanation = typeof localized.explanation === "function" ? localized.explanation(values) : localized.explanation;
    const signature = JSON.stringify([template.id, prompt, generated.answer, generated.options, template.unit]);
    return {
      id: `${template.id}:${hash(signature)}`,
      templateId: template.id,
      grade,
      topic: template.topic,
      subtopic: template.subtopic,
      difficulty: template.difficulty,
      mode: template.mode,
      prompt,
      type: template.type,
      answer: generated.answer,
      options: generated.options,
      unit: template.unit,
      precision: template.precision,
      hint,
      explanation
    };
  }

  function generate(filter, count, rng) {
    const requested = filter && typeof filter === "object" ? filter : {};
    if (!Number.isInteger(count) || count < 0) throw new TypeError("count must be a nonnegative integer");
    if (count === 0) return [];
    const random = rng === undefined ? Math.random : rng;
    if (typeof random !== "function") throw new TypeError("rng must be a function");
    const checkedRandom = () => {
      const value = random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("rng must return a number in [0,1)");
      return value;
    };
    const allowedModes = requested.modes === undefined ? MODES : requested.modes;
    const matches = templates.filter(template =>
      template.grades.includes(requested.grade) &&
      template.topic === requested.topic &&
      (requested.subtopic === undefined || template.subtopic === requested.subtopic) &&
      (requested.difficulty === undefined || template.difficulty === requested.difficulty) &&
      Array.isArray(allowedModes) && allowedModes.includes(template.mode)
    );
    if (matches.length === 0) throw new QuestionBankError("NO_MATCH", requested);

    const selectedLanguage = language(requested.lang);
    const questions = [];
    const ids = new Set();
    const prompts = new Set();
    let activeTemplates = matches.slice();
    let batch = [];
    let cursor = 0;

    while (questions.length < count) {
      if (cursor >= batch.length) {
        batch = shuffle(activeTemplates, checkedRandom);
        cursor = 0;
        if (questions.length && batch.length > 1 && batch[0].id === questions[questions.length - 1].templateId) {
          [batch[0], batch[1]] = [batch[1], batch[0]];
        }
      }
      const template = batch[cursor];
      cursor += 1;
      let question = null;
      for (let attempt = 0; attempt < 512; attempt += 1) {
        const candidate = renderTemplate(template, checkedRandom, selectedLanguage, requested.grade);
        if (!ids.has(candidate.id) && !prompts.has(candidate.prompt)) {
          question = candidate;
          break;
        }
      }
      if (!question) {
        activeTemplates = activeTemplates.filter(candidate => candidate !== template);
        batch = [];
        cursor = 0;
        if (activeTemplates.length === 0) throw new QuestionBankError("UNIQUE_EXHAUSTED", requested);
        continue;
      }
      ids.add(question.id);
      prompts.add(question.prompt);
      questions.push(question);
    }
    return questions;
  }

  return deepFreeze({topics, difficulties, generate, validateTemplate, QuestionBankError});
});
