import type { PriceType } from "./types";
import type { AvailabilitySlot } from "./types";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Format time "09:00" -> "9am", "17:00" -> "5pm" */
function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "am" : "pm";
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, "0")}${ampm}`;
}

/** Human-readable price label per type */
export function formatPriceUnit(priceType: PriceType): string {
  switch (priceType) {
    case "daily":
      return "/day";
    case "weekly":
      return "/week";
    case "commission":
    case "hybrid":
      return "";
    default:
      return "/day";
  }
}

/** Short label for price type (e.g. for selects) */
export function formatPriceTypeLabel(priceType: PriceType): string {
  switch (priceType) {
    case "daily":
      return "Per day";
    case "weekly":
      return "Per week";
    case "commission":
      return "Commission";
    case "hybrid":
      return "Hybrid";
    default:
      return String(priceType);
  }
}

/** Format availability slots for display (e.g. "Mon 9am–5pm, Tue 9am–5pm" or grouped) */
export function formatAvailability(slots: AvailabilitySlot[]): string {
  if (!slots?.length) return "—";
  const parts = slots
    .sort((a, b) => a.day - b.day)
    .map((s) => `${DAY_NAMES[s.day]} ${formatTime(s.start)}–${formatTime(s.end)}`);
  return parts.join(", ");
}

export { DAY_NAMES, formatTime };
