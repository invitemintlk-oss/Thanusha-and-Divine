// Single source of truth for the wedding details, guest name logic and
// invitation links. Used by both the invitation (App.tsx) and /admin (Admin.tsx).

export type EventKey = "church" | "homecoming";
export type EventSelection = "church" | "homecoming" | "both";

export interface WeddingEvent {
  key: EventKey;
  title: string;
  shortTitle: string;
  dateLong: string;
  dateNumeric: string;
  weekday: string;
  time: string;
  countdownTarget: string;
  venueName: string;
  venueArea: string;
  googleMapsLink: string;
  mapEmbedQuery: string;
  dressNote?: string;
}

export const INVITATION = {
  couple: {
    groom: "Thanusha",
    bride: "Divine",
    groomFull: "Thanusha Wijewardena",
    brideFull: "Divine Fernando",
  },
  parents: {
    groom: ["Mr. H. D. Sudath Wijewardena", "Mrs. J. S. P. Jayasingha"],
    bride: ["Mr. M. A. Suban Fernando", "Mrs. M. Wasanthi Kurera"],
  },
  events: {
    church: {
      key: "church",
      title: "Holy Matrimony",
      shortTitle: "Church Ceremony",
      dateLong: "16th December 2026",
      dateNumeric: "16 . 12 . 2026",
      weekday: "Wednesday",
      time: "3.30 PM",
      countdownTarget: "2026-12-16T15:30:00+05:30",
      venueName: "St. Sebastian's Church",
      venueArea: "Katuwapitiya, Negombo",
      googleMapsLink: "https://maps.app.goo.gl/7HeeC9fqVXpYCJTK6",
      mapEmbedQuery: "7.2111137,79.8592034",
    },
    homecoming: {
      key: "homecoming",
      title: "Homecoming Celebration",
      shortTitle: "Homecoming",
      dateLong: "20th December 2026",
      dateNumeric: "20 . 12 . 2026",
      weekday: "Sunday",
      time: "7.00 PM",
      countdownTarget: "2026-12-20T19:00:00+05:30",
      venueName: "The Maze",
      venueArea: "Glass House Venue",
      googleMapsLink: "https://maps.app.goo.gl/pf9En4AAaBEjS9k69",
      mapEmbedQuery: "7.3498117,79.8380201",
      dressNote: "No theme — come dressed in any colour you love",
    },
  } satisfies Record<EventKey, WeddingEvent>,
  rsvpContacts: [] as string[],
};

/* ----------------------------- Event selection ---------------------------- */

export const EVENT_OPTIONS: { value: EventSelection; label: string; hint: string }[] = [
  { value: "both", label: "Both", hint: "Church ceremony + Homecoming" },
  { value: "church", label: "Church only", hint: "16 Dec · St. Sebastian's Church" },
  { value: "homecoming", label: "Homecoming only", hint: "20 Dec · The Maze" },
];

export function parseEventSelection(value: string | null | undefined): EventSelection {
  return value === "church" || value === "homecoming" ? value : "both";
}

export function eventsFor(selection: EventSelection): WeddingEvent[] {
  if (selection === "church") return [INVITATION.events.church];
  if (selection === "homecoming") return [INVITATION.events.homecoming];
  return [INVITATION.events.church, INVITATION.events.homecoming];
}

/** Heading used on the invitation for the selected events. */
export function occasionTitle(selection: EventSelection): string {
  if (selection === "church") return "Holy Matrimony";
  if (selection === "homecoming") return "Homecoming Celebration";
  return "Homecoming Celebration";
}

/** Phrase that completes "...as we celebrate the ___ of". */
export function occasionPhrase(selection: EventSelection): string {
  if (selection === "church") return "Holy Matrimony";
  if (selection === "homecoming") return "Homecoming";
  return "Holy Matrimony & Homecoming";
}

/* ------------------------------ Guest prefixes ----------------------------- */

export const PREFIXES = [
  { code: "mr", label: "Mr." },
  { code: "mrs", label: "Mrs." },
  { code: "miss", label: "Miss" },
  { code: "mrmrs", label: "Mr. & Mrs." },
  { code: "family", label: "Family" },
  { code: "dear", label: "Dear" },
] as const;

export type PrefixCode = (typeof PREFIXES)[number]["code"];

export function parsePrefix(value: string | null | undefined): PrefixCode {
  const v = (value || "").trim().toLowerCase();
  const found = PREFIXES.find((p) => p.code === v || p.label.toLowerCase() === v);
  return found ? found.code : "dear";
}

export function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

/**
 * Combines prefix + name for display. "Dear" is a greeting style, not a title,
 * so it is never part of the display name (avoids "Dear Dear Sanjaya").
 */
export function displayName(prefix: PrefixCode, rawName: string): string {
  const name = cleanName(rawName);
  if (!name) return "";
  switch (prefix) {
    case "mr":
      return `Mr. ${name}`;
    case "mrs":
      return `Mrs. ${name}`;
    case "miss":
      return `Miss ${name}`;
    case "mrmrs":
      return `Mr. & Mrs. ${name}`;
    case "family":
      return `${name} and Family`;
    case "dear":
    default:
      return name;
  }
}

/* ---------------------------------- Links --------------------------------- */

/** {baseURL}/{guestName}?p={prefix}&e={events} */
export function buildInviteLink(
  baseUrl: string,
  prefix: PrefixCode,
  rawName: string,
  events: EventSelection,
): string {
  const name = cleanName(rawName);
  const base = baseUrl.replace(/\/+$/, "");
  const params = new URLSearchParams({ p: prefix, e: events });
  return `${base}/${encodeURIComponent(name)}?${params.toString()}`;
}

export interface GuestInfo {
  name: string;
  prefix: PrefixCode;
  displayName: string;
  events: EventSelection;
}

/** Reads the guest from the current URL (path segment + query). */
export function readGuestFromLocation(loc: Location = window.location): GuestInfo {
  const params = new URLSearchParams(loc.search);
  const segment = loc.pathname.replace(/^\/+|\/+$/g, "").split("/")[0] || "";
  let name = "";
  try {
    name = cleanName(decodeURIComponent(segment));
  } catch {
    name = cleanName(segment);
  }
  // Backwards compatibility with old ?prefix=&name= links.
  if (!name && params.get("name")) name = cleanName(params.get("name") || "");

  const prefix = parsePrefix(params.get("p") ?? params.get("prefix"));
  return {
    name,
    prefix,
    displayName: displayName(prefix, name),
    events: parseEventSelection(params.get("e")),
  };
}

/* -------------------------------- Message --------------------------------- */

export function buildInviteMessage(displayNameText: string, link: string): string {
  return `Dear ${displayNameText} ❤️

With joyful hearts, we warmly invite you to celebrate one of the most special days of our lives as we begin our journey together.

Please view our wedding invitation and all the event details through the link below 🌐:

${link}

Your presence would truly mean the world to us, and we would be honored to celebrate this beautiful moment together.

With love,
❤️ ${INVITATION.couple.groom} & ${INVITATION.couple.bride}`;
}
