import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const lots = [
  {
    name: "Phoenix Marketcity Whitefield",
    lat: 12.9958,
    lng: 77.6964,
    address: "Whitefield Main Road, Mahadevapura",
    priceText: "₹60 first 3 hrs",
    hoursText: "11:00–23:00",
    notes: "Mall basement and surface lots. Entrance off Whitefield Main Road.",
  },
  {
    name: "Orion Mall Rajajinagar",
    lat: 13.0109,
    lng: 77.555,
    address: "Dr Rajkumar Road, Rajajinagar",
    priceText: "₹40 first 3 hrs",
    hoursText: "10:00–23:00",
    notes: "Large paid mall parking next to World Trade Center.",
  },
  {
    name: "UB City",
    lat: 12.9716,
    lng: 77.5958,
    address: "Vittal Mallya Road",
    priceText: "Paid, validation at some stores",
    hoursText: "10:00–22:00",
    notes: "Basement entrance from Vittal Mallya Road. Tight ramps.",
  },
  {
    name: "The Forum Koramangala",
    lat: 12.9346,
    lng: 77.6113,
    address: "Hosur Road, Koramangala",
    priceText: "₹50 first 3 hrs",
    hoursText: "10:00–22:30",
    notes: "Multi-level mall parking. Better than circling 80 Feet Road.",
  },
  {
    name: "Mantri Square Malleshwaram",
    lat: 12.9914,
    lng: 77.571,
    address: "Sampige Road, Malleshwaram",
    priceText: "₹40 first 3 hrs",
    hoursText: "10:00–22:00",
    notes: "Useful for Malleshwaram / Majestic-adjacent trips.",
  },
  {
    name: "Manyata Embassy Business Park",
    lat: 13.0488,
    lng: 77.6208,
    address: "Nagawara, Outer Ring Road",
    priceText: "Visitor paid parking",
    hoursText: "Office hours",
    notes: "Visitor lots near the main gates. Confirm building gate in advance.",
  },
  {
    name: "1 MG Lido Mall",
    lat: 12.9734,
    lng: 77.62,
    address: "Trinity / MG Road",
    priceText: "₹40–60",
    hoursText: "11:00–22:00",
    notes: "Handy for MG Road / Ulsoor without entering inner Church Street lanes.",
  },
  {
    name: "MG Road Metro parking",
    lat: 12.9757,
    lng: 77.6067,
    address: "MG Road Namma Metro",
    priceText: "Paid, limited",
    hoursText: "Metro hours",
    notes: "Small official lot. Fills early on weekends.",
  },
  {
    name: "Church Street public parking",
    lat: 12.9742,
    lng: 77.6073,
    address: "Church Street / Brigade Road",
    priceText: "₹40/hour typical",
    hoursText: "Daytime, evenings busy",
    notes: "Surface / stacked lots. Walk the last 3–6 minutes.",
  },
  {
    name: "Vega City Bannerghatta",
    lat: 12.89,
    lng: 77.5976,
    address: "Bannerghatta Road, Bilekahalli",
    priceText: "₹50 first 3 hrs",
    hoursText: "11:00–23:00",
    notes: "Mall parking for JP Nagar / Bannerghatta trips.",
  },
  {
    name: "Jayanagar 4th Block complex",
    lat: 12.9293,
    lng: 77.5836,
    address: "11th Main, Jayanagar 4th Block",
    priceText: "Paid civic / complex parking",
    hoursText: "Daytime",
    notes: "Better than hunting slots on 11th Main.",
  },
  {
    name: "HSR BDA Complex",
    lat: 12.9121,
    lng: 77.6446,
    address: "27th Main, HSR Layout",
    priceText: "Paid, modest",
    hoursText: "Mostly daytime",
    notes: "Useful for 27th Main / BDA Complex errands.",
  },
  {
    name: "RMZ Ecoworld Bellandur",
    lat: 12.9256,
    lng: 77.6753,
    address: "Outer Ring Road, Bellandur",
    priceText: "Visitor parking",
    hoursText: "Office hours",
    notes: "Park at the campus instead of ORR service roads.",
  },
  {
    name: "Electronic City Infosys visitor",
    lat: 12.8448,
    lng: 77.6632,
    address: "Infosys, Electronic City Phase 1",
    priceText: "Campus visitor",
    hoursText: "Office hours",
    notes: "Use the visitor gate, not the inner residential approaches.",
  },
  {
    name: "Lalbagh West Gate",
    lat: 12.9507,
    lng: 77.5848,
    address: "Lalbagh West Gate",
    priceText: "Paid street / lot mix",
    hoursText: "Garden hours",
    notes: "West gate is usually easier than the inner-road east approach.",
  },
  {
    name: "Cubbon Park / MG Road edge",
    lat: 12.9763,
    lng: 77.5929,
    address: "Near Cubbon Park, Kasturba Road",
    priceText: "Paid, limited",
    hoursText: "Daytime",
    notes: "Walk into Cubbon / MG Road rather than entering park-edge lanes.",
  },
  {
    name: "Esteem Mall Hebbal",
    lat: 13.0473,
    lng: 77.5935,
    address: "Bellary Road, Hebbal",
    priceText: "₹40 first 3 hrs",
    hoursText: "10:00–22:00",
    notes: "Mall parking off Bellary Road for Hebbal / airport-approach trips.",
  },
  {
    name: "ITPL Whitefield",
    lat: 12.9858,
    lng: 77.7353,
    address: "ITPL Main Road, Whitefield",
    priceText: "Campus / paid visitor",
    hoursText: "Office hours",
    notes: "Use campus visitor parking, not the inner Whitefield village roads.",
  },
  {
    name: "Koramangala 80 Feet Road lot",
    lat: 12.9352,
    lng: 77.6245,
    address: "80 Feet Road, Koramangala",
    priceText: "₹40/hour typical",
    hoursText: "Evenings busy",
    notes: "Park on 80 Feet and walk into the inner blocks.",
  },
  {
    name: "Indiranagar Metro parking",
    lat: 12.9791,
    lng: 77.6387,
    address: "100 Feet Road / CMH Road",
    priceText: "Paid, limited",
    hoursText: "Metro hours",
    notes: "Good for 100 Feet Road dinners without entering CMH inner streets.",
  },
  {
    name: "BTM 2nd Stage complex",
    lat: 12.9166,
    lng: 77.6101,
    address: "BTM 2nd Stage",
    priceText: "Paid civic / private mix",
    hoursText: "Daytime",
    notes: "Avoid Silk Board slip roads when you only need BTM.",
  },
  {
    name: "Malleshwaram 8th Cross",
    lat: 13.0055,
    lng: 77.5693,
    address: "8th Cross, Malleshwaram",
    priceText: "Paid street / small lots",
    hoursText: "Market hours",
    notes: "Leave the car on the wider cross and walk the market streets.",
  },
  {
    name: "Prestige Tech Park Kadubeesanahalli",
    lat: 12.931,
    lng: 77.691,
    address: "Outer Ring Road, Kadubeesanahalli",
    priceText: "Visitor parking",
    hoursText: "Office hours",
    notes: "Campus lots beat circling Sarjapur service roads.",
  },
  {
    name: "Nexus Koramangala",
    lat: 12.9349,
    lng: 77.6158,
    address: "Koramangala 7th Block / Hosur Road",
    priceText: "₹50 first 3 hrs",
    hoursText: "11:00–23:00",
    notes: "Mall parking for south Koramangala and Hosur Road.",
  },
];

async function main() {
  for (const lot of lots) {
    const existing = await prisma.parkingLot.findFirst({
      where: { name: lot.name, city: "bangalore" },
    });
    if (existing) {
      await prisma.parkingLot.update({
        where: { id: existing.id },
        data: { ...lot, source: "operator", availabilityState: "unknown", hidden: false },
      });
    } else {
      await prisma.parkingLot.create({
        data: { ...lot, city: "bangalore", source: "operator", availabilityState: "unknown" },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
