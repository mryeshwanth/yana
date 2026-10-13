const PARKING_NAME =
  /\b(parking|car park|parkade|valet|parkplatz|carpark)\b/i;

const TWO_WHEELER =
  /\b(bike|bikes|bicycle|bicycles|cycle|cycles|scooter|scooty|two[\s-]?wheeler|2[\s-]?wheeler|motorbike|motorcycle|moped)\b/i;

const AUTO_SHOP =
  /\b(spares?|repair|workshop|mechanic|tyres?|tires?|puncture|showroom|dealership|auto[\s-]?parts|service centre|service center|bike[\s-]*point|bike[\s-]*works|auto[\s-]*works|automobiles?|auto|mahindra|maruti|hyundai|tata motors|honda cars)\b/i;

const SHOP_TYPES = new Set([
  "car_repair",
  "car_dealer",
  "car_rental",
  "car_wash",
  "car_inspection",
  "auto_parts_store",
  "bicycle_store",
  "gas_station",
  "store",
]);

export function isCarParkingPlace(
  name: string,
  types: string[] = [],
  options?: { requireParkingSignal?: boolean },
) {
  const parkingName = PARKING_NAME.test(name);
  const parkingType = types.some((type) => /parking/i.test(type));
  const shopType = types.some((type) => SHOP_TYPES.has(type));

  if (TWO_WHEELER.test(name)) return false;
  if (AUTO_SHOP.test(name) && !parkingName) return false;
  if (shopType && !parkingName && !parkingType) return false;
  if (shopType && !parkingName) return false;
  if (options?.requireParkingSignal) return parkingName || parkingType;
  return true;
}
