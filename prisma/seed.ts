import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: `${process.env.DATABASE_URL}` }) });

const SALT_ROUNDS = 10;

async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function main() {
  // Clear existing data in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.aiSearchLog.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──
  const password = await hash("password123");

  const landlord1 = await prisma.user.create({
    data: {
      name: "Rahim Khan",
      email: "rahim@example.com",
      phone: "01711111111",
      passwordHash: password,
      role: "LANDLORD",
      isVerified: true,
    },
  });

  const landlord2 = await prisma.user.create({
    data: {
      name: "Karim Uddin",
      email: "karim@example.com",
      phone: "01722222222",
      passwordHash: password,
      role: "LANDLORD",
      isVerified: true,
    },
  });

  const tenant1 = await prisma.user.create({
    data: {
      name: "Fatima Begum",
      email: "fatima@example.com",
      phone: "01733333333",
      passwordHash: password,
      role: "TENANT",
      isVerified: true,
    },
  });

  const tenant2 = await prisma.user.create({
    data: {
      name: "Hasan Ali",
      email: "hasan@example.com",
      phone: "01744444444",
      passwordHash: password,
      role: "TENANT",
      isVerified: true,
    },
  });

  // ── Listings ──
  const listingsData = [
    {
      landlordId: landlord1.id,
      title: "Modern 2BR Flat in Panchlaish",
      description: "A spacious 2-bedroom flat in a quiet residential area. Close to schools, markets, and public transport. Features tiled floors, gas connection, and ample natural light.",
      price: 15000,
      sizeSqft: 1100,
      bedrooms: 2,
      bathrooms: 2,
      floorNumber: 3,
      address: "House 12, Road 5, Panchlaish",
      area: "Panchlaish",
      city: "Chattogram",
      latitude: 22.3569,
      longitude: 91.7832,
      amenities: ["Gas", "Electricity", "Water", "Parking"],
      status: "AVAILABLE",
    },
    {
      landlordId: landlord1.id,
      title: "Cozy 1BR Near IIUC Campus",
      description: "Affordable single-bedroom unit perfect for students. Walking distance to IIUC main gate. Shared rooftop access. Monthly cleaning included.",
      price: 8000,
      sizeSqft: 550,
      bedrooms: 1,
      bathrooms: 1,
      floorNumber: 2,
      address: "IIUC Road, Kumira",
      area: "Kumira",
      city: "Chattogram",
      latitude: 22.3852,
      longitude: 91.8115,
      amenities: ["Electricity", "Water", "Internet"],
      status: "AVAILABLE",
    },
    {
      landlordId: landlord1.id,
      title: "3BR Family Apartment in Khulshi",
      description: "Well-maintained 3-bedroom apartment in a family-friendly neighbourhood. Large living room, modern kitchen with built-in cabinets, and a balcony with city view.",
      price: 25000,
      sizeSqft: 1500,
      bedrooms: 3,
      bathrooms: 2,
      floorNumber: 5,
      address: "House 8, Road 12, Khulshi",
      area: "Khulshi",
      city: "Chattogram",
      latitude: 22.3685,
      longitude: 91.7983,
      amenities: ["Gas", "Electricity", "Water", "Parking", "Lift", "Generator"],
      status: "AVAILABLE",
    },
    {
      landlordId: landlord2.id,
      title: "Studio Flat in GEC Circle",
      description: "Compact studio apartment in the heart of Chattogram city. Walking distance to GEC circle, restaurants, and shopping malls. Fully furnished option available.",
      price: 12000,
      sizeSqft: 400,
      bedrooms: 1,
      bathrooms: 1,
      floorNumber: 6,
      address: "GEC Circle, Nasirabad",
      area: "Nasirabad",
      city: "Chattogram",
      latitude: 22.3601,
      longitude: 91.7902,
      amenities: ["Electricity", "Water", "Lift", "CCTV"],
      status: "AVAILABLE",
    },
    {
      landlordId: landlord2.id,
      title: "Duplex Villa in O.R. Nizam Road",
      description: "Premium duplex apartment with modern interiors. 4 bedrooms, servant quarters, rooftop garden, and dedicated parking for 2 cars. Ideal for a large family or executive living.",
      price: 45000,
      sizeSqft: 2200,
      bedrooms: 4,
      bathrooms: 3,
      floorNumber: 1,
      address: "O.R. Nizam Road, Panchlaish",
      area: "Panchlaish",
      city: "Chattogram",
      latitude: 22.3534,
      longitude: 91.7756,
      amenities: ["Gas", "Electricity", "Water", "Parking", "Lift", "Generator", "CCTV", "Garden"],
      status: "AVAILABLE",
    },
    {
      landlordId: landlord2.id,
      title: "Budget 2BR in Agrabad",
      description: "No-frills 2-bedroom flat in commercial area. Suitable for bachelors or small families. Close to Agrabad Access Road and bus stops. Rent slightly negotiable for long-term.",
      price: 10000,
      sizeSqft: 750,
      bedrooms: 2,
      bathrooms: 1,
      floorNumber: 4,
      address: "Agrabad Access Road",
      area: "Agrabad",
      city: "Chattogram",
      latitude: 22.3203,
      longitude: 91.8173,
      amenities: ["Electricity", "Water"],
      status: "AVAILABLE",
    },
    {
      landlordId: landlord1.id,
      title: "Newly Built 2BR in Halishahar",
      description: "Brand new flat in a developing area. Modern fittings, prepaid gas meter, individual water tank, and intercom facility. 5 min walk to Halishahar market.",
      price: 14000,
      sizeSqft: 950,
      bedrooms: 2,
      bathrooms: 2,
      floorNumber: 2,
      address: "Block D, Halishahar",
      area: "Halishahar",
      city: "Chattogram",
      latitude: 22.3194,
      longitude: 91.7739,
      amenities: ["Gas", "Electricity", "Water", "Parking", "CCTV"],
      status: "AVAILABLE",
    },
  ];

  const listings: { id: string }[] = [];
  for (const data of listingsData) {
    const listing = await prisma.listing.create({ data });
    listings.push(listing);
  }

  // ── Listing Images (placeholder) ──
  for (let i = 0; i < listings.length; i++) {
    await prisma.listingImage.create({
      data: {
        listingId: listings[i].id,
        imageUrl: `https://picsum.photos/seed/listing${i + 1}/800/600`,
        isPrimary: true,
        orderIndex: 0,
      },
    });

    await prisma.listingImage.create({
      data: {
        listingId: listings[i].id,
        imageUrl: `https://picsum.photos/seed/listing${i + 1}_alt/800/600`,
        isPrimary: false,
        orderIndex: 1,
      },
    });
  }

  // ── Favorites ──
  await prisma.favorite.create({
    data: { userId: tenant1.id, listingId: listings[0].id },
  });
  await prisma.favorite.create({
    data: { userId: tenant1.id, listingId: listings[2].id },
  });
  await prisma.favorite.create({
    data: { userId: tenant2.id, listingId: listings[1].id },
  });
  await prisma.favorite.create({
    data: { userId: tenant2.id, listingId: listings[4].id },
  });

  // ── Inquiries ──
  await prisma.inquiry.create({
    data: {
      listingId: listings[0].id,
      tenantId: tenant1.id,
      message: "Hello, is this flat still available? I'm interested in viewing it this weekend. Please let me know a convenient time.",
      status: "PENDING",
    },
  });
  await prisma.inquiry.create({
    data: {
      listingId: listings[3].id,
      tenantId: tenant2.id,
      message: "Hi, I'm looking for a studio and yours seems perfect. Is the furnished option still available? What is the utility cost?",
      status: "PENDING",
    },
  });
  await prisma.inquiry.create({
    data: {
      listingId: listings[1].id,
      tenantId: tenant1.id,
      message: "Is the rent negotiable for a 6-month lease? I am a student at IIUC and looking for long-term accommodation.",
      status: "PENDING",
    },
  });

  console.log("Seed complete:");
  console.log(`  Users: 2 landlords + 2 tenants`);
  console.log(`  Listings: ${listings.length}`);
  console.log(`  Images: ${listings.length * 2}`);
  console.log(`  Favorites: 4`);
  console.log(`  Inquiries: 3`);
  console.log(`\nLogin credentials for all users: password123`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
