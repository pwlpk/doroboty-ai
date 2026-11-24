/**
 * Public site copy shared by the React pages and the site assistant's knowledge prompt.
 * Keep imports relative and framework-free: the serverless function in api/ imports it too.
 */
export const siteCategories = [
  {
    slug: "build",
    label: "Build",
    description: "Tworzysz modele, systemy i produkty wykorzystujące AI.",
  },
  {
    slug: "apply",
    label: "Apply",
    description: "Używasz AI, żeby lepiej wykonywać swoją właściwą pracę.",
  },
  {
    slug: "lead",
    label: "Lead",
    description: "Prowadzisz zmianę, decyzje i zespoły w świecie AI.",
  },
] as const;

export const methodologyCriteria = [
  ["AI zmienia pracę", "Technologia wpływa na odpowiedzialność, decyzje lub rezultat stanowiska."],
  [
    "Wynik da się zobaczyć",
    "Opis roli wskazuje problem, odbiorcę i efekt, a nie samą listę narzędzi.",
  ],
  [
    "Człowiek zachowuje odpowiedzialność",
    "Automatyzacja wspiera decyzję; nie ukrywa jej autora ani konsekwencji.",
  ],
  [
    "Oferta daje konkret",
    "Pokazuje tryb pracy, poziom, formę współpracy i — kiedy to możliwe — wynagrodzenie.",
  ],
] as const;
