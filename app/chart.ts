import * as Astronomy from "astronomy-engine";

export type BirthProfile = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthTimeCertainty: "official_recorded" | "family_reported" | "approximate" | "rectified" | "unknown";
  locationLabel: string;
};

export type Placement = {
  body: string;
  sign: string;
  degree: number;
  minute: number;
  element: string;
  modality: string;
  retrograde: boolean;
};

const signs = [
  ["Aries", "Fire", "Cardinal"],
  ["Taurus", "Earth", "Fixed"],
  ["Gemini", "Air", "Mutable"],
  ["Cancer", "Water", "Cardinal"],
  ["Leo", "Fire", "Fixed"],
  ["Virgo", "Earth", "Mutable"],
  ["Libra", "Air", "Cardinal"],
  ["Scorpio", "Water", "Fixed"],
  ["Sagittarius", "Fire", "Mutable"],
  ["Capricorn", "Earth", "Cardinal"],
  ["Aquarius", "Air", "Fixed"],
  ["Pisces", "Water", "Mutable"]
] as const;

const bodies: Array<[string, Astronomy.Body]> = [
  ["Sun", Astronomy.Body.Sun],
  ["Moon", Astronomy.Body.Moon],
  ["Mercury", Astronomy.Body.Mercury],
  ["Venus", Astronomy.Body.Venus],
  ["Mars", Astronomy.Body.Mars],
  ["Jupiter", Astronomy.Body.Jupiter],
  ["Saturn", Astronomy.Body.Saturn],
  ["Uranus", Astronomy.Body.Uranus],
  ["Neptune", Astronomy.Body.Neptune],
  ["Pluto", Astronomy.Body.Pluto]
];

const normalize = (value: number): number => ((value % 360) + 360) % 360;

const longitudeFor = (body: Astronomy.Body, time: Astronomy.AstroTime): number => {
  const vector = body === Astronomy.Body.Moon ? Astronomy.GeoMoon(time) : Astronomy.GeoVector(body, time, true);
  return normalize(Astronomy.Ecliptic(vector).elon);
};

const retrograde = (body: Astronomy.Body, time: Astronomy.AstroTime): boolean => {
  if (body === Astronomy.Body.Sun || body === Astronomy.Body.Moon) return false;
  const before = new Astronomy.AstroTime(new Date(time.date.getTime() - 86400000));
  const after = new Astronomy.AstroTime(new Date(time.date.getTime() + 86400000));
  return normalize(longitudeFor(body, after) - longitudeFor(body, before)) > 180;
};

export const calculatePlacements = (profile: BirthProfile): Placement[] => {
  const birthTime = profile.birthTimeCertainty === "unknown" ? "12:00" : profile.birthTime;
  const time = new Astronomy.AstroTime(new Date(`${profile.birthDate}T${birthTime}:00.000Z`));

  return bodies.map(([bodyName, body]) => {
    const longitude = longitudeFor(body, time);
    const [sign, element, modality] = signs[Math.floor(longitude / 30)];
    const inSign = longitude % 30;
    const degree = Math.floor(inSign);
    const minute = Math.round((inSign - degree) * 60);
    return { body: bodyName, sign, degree, minute, element, modality, retrograde: retrograde(body, time) };
  });
};
