export const LOT_KINDS = [
  { id: "vendor_managed", label: "The lot is managed by a vendor" },
  { id: "free_lot", label: "The lot is free parking" },
  { id: "roadside_free", label: "Road side free parking" },
  { id: "paid_public", label: "Paid public parking" },
  { id: "building_visitor", label: "Building / office visitor parking" },
  { id: "other", label: "Other" },
] as const;

export type LotKind = (typeof LOT_KINDS)[number]["id"];

export const LOT_KIND_IDS = LOT_KINDS.map((item) => item.id) as [LotKind, ...LotKind[]];

export function lotKindLabel(id?: string | null) {
  return LOT_KINDS.find((item) => item.id === id)?.label ?? null;
}
