export type PriceTag = "Free" | "Free + paid" | "Paid";

export function priceTag(priceText?: string | null): PriceTag | null {
  if (!priceText) return null;
  const value = priceText.trim();
  if (!value) return null;
  if (/^free\s*\+/i.test(value)) return "Free + paid";
  if (/^free$/i.test(value)) return "Free";
  if (/₹|rs\.?|paid/i.test(value)) return "Paid";
  return null;
}
