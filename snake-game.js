(() => {
  "use strict";
  const content = {
    da:{title:"Brøkslangen",description:"Styr slangen, saml æbler og løs brøkopgaver undervejs.",skills:["brøker","hovedregning"],finish:"Du trænede brøker, mens slangen voksede."},
    en:{title:"Fraction Snake",description:"Guide the snake, collect apples and solve fraction questions along the way.",skills:["fractions","mental maths"],finish:"You practised fractions while the snake grew."},
    fr:{title:"Serpent des fractions",description:"Guide le serpent, ramasse des pommes et résous des questions sur les fractions.",skills:["fractions","calcul mental"],finish:"Tu as travaillé les fractions pendant que le serpent grandissait."},
    es:{title:"Serpiente de fracciones",description:"Guía la serpiente, recoge manzanas y resuelve preguntas de fracciones.",skills:["fracciones","cálculo mental"],finish:"Practicaste fracciones mientras crecía la serpiente."},
    uk:{title:"Дробова змійка",description:"Керуй змійкою, збирай яблука та розв’язуй завдання з дробами.",skills:["дроби","усний рахунок"],finish:"Ти тренував дроби, поки змійка росла."},
    ru:{title:"Дробная змейка",description:"Управляй змейкой, собирай яблоки и решай задания с дробями.",skills:["дроби","устный счёт"],finish:"Ты тренировался с дробями, пока змейка росла."},
    sq:{title:"Gjarpri i thyesave",description:"Drejto gjarprin, mblidh mollë dhe zgjidh pyetje me thyesa.",skills:["thyesat","llogaritja mendore"],finish:"Ushtrove thyesat ndërsa gjarpri u rrit."}
  };
  window.PORTAL_CONTENT.activities.push({
    id:"game-fraction-snake",type:"game",grade:6,icon:"🐍",minutes:15,
    gameKind:"fraction-snake",noTeacherGuide:true,parts:[],content
  });
})();