/**
 * ABN (Australian Business Number) validation and lookup utilities.
 *
 * To switch from stub → real ABR lookups:
 *  1. Register for a free GUID at https://www.abr.business.gov.au/Tools/WebServices
 *  2. Add ABR_GUID=<your-guid> to your .env.local
 *  3. Replace the stub body in lookupAbn() below with the real implementation.
 */

export interface AbnLookupResult {
  entityName: string;
  status: "Active" | "Cancelled" | string;
  entityType?: string;
  stateCode?: string;
}

/**
 * Validates an ABN using the official weighting checksum algorithm.
 * Strips spaces and hyphens before checking.
 *
 * Algorithm:
 *  1. Subtract 1 from the first digit.
 *  2. Multiply each digit by its weight: [10,1,3,5,7,9,11,13,15,17,19].
 *  3. Sum the products — if sum % 89 === 0, the ABN is valid.
 */
export function validateAbnFormat(abn: string): boolean {
  const digits = abn.replace(/[\s\-]/g, "");
  if (!/^\d{11}$/.test(digits)) return false;

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const nums = digits.split("").map(Number);
  nums[0] -= 1;

  const sum = nums.reduce((acc, d, i) => acc + d * weights[i], 0);
  return sum % 89 === 0;
}

export async function lookupAbn(abn: string): Promise<AbnLookupResult> {
  if (!validateAbnFormat(abn)) {
    throw new Error("Invalid ABN format.");
  }

  const guid = process.env.ABR_GUID;
  if (!guid) {
    throw new Error("ABR_GUID environment variable is not set.");
  }

  const digits = abn.replace(/[\s\-]/g, "");
  const url = `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${digits}&callback=callback&guid=${guid}`;

  const text = await fetch(url).then((r) => r.text());

  // Response is JSONP: callback({...}) — strip the wrapper
  const json = JSON.parse(text.replace(/^callback\(/, "").replace(/\);?$/, ""));

  if (json.Message) {
    throw new Error(`ABR lookup error: ${json.Message}`);
  }

  const entityName =
    json.EntityName ||
    json.MainName?.OrganisationName ||
    json.LegalName?.FullName ||
    "";

  return {
    entityName,
    status: json.AbnStatus ?? "Unknown",
    entityType: json.EntityTypeName,
    stateCode: json.AddressState,
  };
}

/**
 * Normalises a name string for fuzzy comparison:
 * lowercases, strips punctuation, collapses whitespace.
 */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The ABR returns individual/sole-trader names in "SURNAME, FIRSTNAME" format.
 * normaliseName() strips the comma before we can detect it, so we must split
 * on the comma in the *original* string first.
 */
function normaliseAbrName(name: string): string {
  const commaIdx = name.indexOf(",");
  if (commaIdx !== -1) {
    const surname = normaliseName(name.slice(0, commaIdx));
    const given = normaliseName(name.slice(commaIdx + 1));
    return `${given} ${surname}`.trim();
  }
  return normaliseName(name);
}

/**
 * Returns true if the ABN entity name is a reasonable match for the
 * profile display name. Handles:
 *  - Direct / substring match (both directions)
 *  - ABR "SURNAME, FIRSTNAME" reversal for sole traders
 *  - Fuzzy token-set match: all words of the shorter name appear in the longer
 */
export function namesMatch(entityName: string, displayName: string): boolean {
  const a = normaliseName(entityName);
  const b = normaliseName(displayName);

  if (a === b || a.includes(b) || b.includes(a)) return true;

  // Reverse ABR surname-first format → "firstname surname" and re-check
  const aReversed = normaliseAbrName(entityName);
  if (aReversed === b || aReversed.includes(b) || b.includes(aReversed)) return true;

  // Token-set fuzzy: every word in the shorter name must appear in the longer
  const wordsA = aReversed.split(" ").filter(Boolean);
  const wordsB = b.split(" ").filter(Boolean);
  const [shorter, longer] = wordsA.length <= wordsB.length
    ? [wordsA, wordsB]
    : [wordsB, wordsA];
  return shorter.length > 0 && shorter.every((w) => longer.includes(w));
}
