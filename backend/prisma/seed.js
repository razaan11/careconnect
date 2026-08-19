// Seed script for local development / demo purposes.
// NOTE: This is NOT executed automatically in this environment (no
// live DATABASE_URL is configured here). Once a real Postgres DB is
// plugged into .env and migrated, run this with:
//   node prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('Seeding CareConnect database...');

  const defaultPassword = await bcrypt.hash('Password123!', SALT_ROUNDS);

  // --- Admin -----------------------------------------------------------
  const admin = await prisma.user.create({
    data: {
      name: 'CareConnect Admin',
      email: 'admin@careconnect.org',
      passwordHash: defaultPassword,
      role: 'ADMIN',
      phone: '+94770000001',
      address: 'CareConnect HQ, Colombo',
      lat: 6.9271,
      lng: 79.8612,
      isVerified: true,
    },
  });

  // --- Trusts (verified, with needs) -----------------------------------
  const trust1User = await prisma.user.create({
    data: {
      name: 'Hope Children\'s Home Coordinator',
      email: 'hope@careconnect.org',
      passwordHash: defaultPassword,
      role: 'TRUST',
      phone: '+94770000002',
      address: '12 Galle Road, Colombo 03',
      lat: 6.9147,
      lng: 79.8489,
      isVerified: true,
    },
  });

  const trust1 = await prisma.trust.create({
    data: {
      userId: trust1User.id,
      orgName: "Hope Children's Home",
      darpanId: 'TN/2019/0123456',
      landmark: 'Opposite Galle Face Green',
      pincode: '00300',
      district: 'Colombo',
      state: 'Western Province',
      lat: 6.9147,
      lng: 79.8489,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: admin.id,
    },
  });

  await prisma.trustNeed.createMany({
    data: [
      {
        trustId: trust1.id,
        type: 'FOOD',
        title: 'Dry rations for 40 children',
        description: 'Rice, lentils, and canned goods needed weekly.',
        urgency: 'HIGH',
      },
      {
        trustId: trust1.id,
        type: 'BOOKS',
        title: 'School textbooks (grades 3-5)',
        description: 'Term is starting soon and several children lack full sets.',
        urgency: 'MEDIUM',
      },
    ],
  });

  const trust2User = await prisma.user.create({
    data: {
      name: 'Sunshine Elders Shelter Coordinator',
      email: 'sunshine@careconnect.org',
      passwordHash: defaultPassword,
      role: 'TRUST',
      phone: '+94770000003',
      address: '45 Kandy Road, Kadawatha',
      lat: 7.0059,
      lng: 79.9531,
      isVerified: true,
    },
  });

  const trust2 = await prisma.trust.create({
    data: {
      userId: trust2User.id,
      orgName: 'Sunshine Elders Shelter',
      darpanId: 'WB/2020/0456789',
      landmark: 'Near Kadawatha Junction',
      pincode: '11850',
      district: 'Gampaha',
      state: 'Western Province',
      lat: 7.0059,
      lng: 79.9531,
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: admin.id,
    },
  });

  await prisma.trustNeed.createMany({
    data: [
      {
        trustId: trust2.id,
        type: 'CLOTHES',
        title: 'Warm blankets and clothing',
        description: 'Cold season is approaching, elders need warm clothing.',
        urgency: 'CRITICAL',
      },
      {
        trustId: trust2.id,
        type: 'FOOD',
        title: 'Perishable-friendly meal donations',
        description: 'Fresh produce and cooked meals for daily distribution.',
        urgency: 'MEDIUM',
      },
    ],
  });

  // --- Donors ------------------------------------------------------------
  const donor1 = await prisma.user.create({
    data: {
      name: 'Amara Perera',
      email: 'amara.donor@careconnect.org',
      passwordHash: defaultPassword,
      role: 'DONOR',
      phone: '+94770000004',
      address: '7 Marine Drive, Colombo 06',
      lat: 6.9101,
      lng: 79.8567,
      isVerified: true,
    },
  });

  const donor2 = await prisma.user.create({
    data: {
      name: 'Nadeesha Silva',
      email: 'nadeesha.donor@careconnect.org',
      passwordHash: defaultPassword,
      role: 'DONOR',
      phone: '+94770000005',
      address: '20 Baseline Road, Colombo 09',
      lat: 6.9214,
      lng: 79.8801,
      isVerified: true,
    },
  });

  const donor3 = await prisma.user.create({
    data: {
      name: 'Ruwan Fernando',
      email: 'ruwan.donor@careconnect.org',
      passwordHash: defaultPassword,
      role: 'DONOR',
      phone: '+94770000006',
      address: '3 Negombo Road, Wattala',
      lat: 6.9890,
      lng: 79.8990,
      isVerified: true,
    },
  });

  // --- Volunteers ----------------------------------------------------------
  const volunteer1User = await prisma.user.create({
    data: {
      name: 'Kasun Jayasuriya',
      email: 'kasun.volunteer@careconnect.org',
      passwordHash: defaultPassword,
      role: 'VOLUNTEER',
      phone: '+94770000007',
      address: 'Colombo 05',
      lat: 6.9022,
      lng: 79.8607,
      isVerified: true,
    },
  });

  const volunteer1 = await prisma.volunteerProfile.create({
    data: {
      userId: volunteer1User.id,
      vehicleType: 'Motorbike',
      currentLat: 6.9022,
      currentLng: 79.8607,
      isAvailable: true,
      totalDeliveries: 3,
    },
  });

  const volunteer2User = await prisma.user.create({
    data: {
      name: 'Dilani Wickramasinghe',
      email: 'dilani.volunteer@careconnect.org',
      passwordHash: defaultPassword,
      role: 'VOLUNTEER',
      phone: '+94770000008',
      address: 'Kadawatha',
      lat: 7.0012,
      lng: 79.9502,
      isVerified: true,
    },
  });

  const volunteer2 = await prisma.volunteerProfile.create({
    data: {
      userId: volunteer2User.id,
      vehicleType: 'Van',
      currentLat: 7.0012,
      currentLng: 79.9502,
      isAvailable: true,
      totalDeliveries: 1,
    },
  });

  // --- Donations across a spread of statuses --------------------------

  // 1. PENDING - not yet matched
  await prisma.donation.create({
    data: {
      donorId: donor1.id,
      type: 'BOOKS',
      title: 'Assorted children\'s storybooks',
      description: 'Box of ~30 gently used storybooks.',
      quantity: 30,
      unit: 'books',
      status: 'PENDING',
      photos: [],
      landmark: 'Near Bambalapitiya Flats',
      pincode: '00600',
      district: 'Colombo',
      state: 'Western Province',
      lat: 6.9101,
      lng: 79.8567,
    },
  });

  // 2. MATCHED - matched to trust1, no volunteer yet
  await prisma.donation.create({
    data: {
      donorId: donor2.id,
      type: 'BOOKS',
      title: 'Grade 4 textbook set',
      description: 'Complete set of grade 4 textbooks, like new.',
      quantity: 15,
      unit: 'sets',
      status: 'MATCHED',
      matchedTrustId: trust1.id,
      photos: [],
      landmark: 'Near Borella Junction',
      pincode: '00900',
      district: 'Colombo',
      state: 'Western Province',
      lat: 6.9214,
      lng: 79.8801,
    },
  });

  // 3. PICKUP_SCHEDULED - matched, volunteer assigned, OTPs generated
  await prisma.donation.create({
    data: {
      donorId: donor3.id,
      type: 'CLOTHES',
      title: 'Winter blankets (20 units)',
      description: 'Brand new blankets, still in packaging.',
      quantity: 20,
      unit: 'blankets',
      status: 'PICKUP_SCHEDULED',
      matchedTrustId: trust2.id,
      volunteerId: volunteer2.id,
      pickupOtp: '482913',
      deliveryOtp: '736210',
      photos: [],
      landmark: 'Near Wattala Railway Station',
      pincode: '11300',
      district: 'Gampaha',
      state: 'Western Province',
      lat: 6.9890,
      lng: 79.8990,
    },
  });

  // 4. PICKED_UP - en route to trust
  const pickedUpDonation = await prisma.donation.create({
    data: {
      donorId: donor1.id,
      type: 'FOOD',
      title: 'Rice and lentils (dry rations)',
      description: '25kg rice, 10kg lentils, assorted canned goods.',
      quantity: 35,
      unit: 'kg',
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days out
      status: 'PICKED_UP',
      matchedTrustId: trust1.id,
      volunteerId: volunteer1.id,
      pickupOtp: '119284',
      deliveryOtp: '558903',
      photos: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
      landmark: 'Near Bambalapitiya Flats',
      pincode: '00600',
      district: 'Colombo',
      state: 'Western Province',
      lat: 6.9101,
      lng: 79.8567,
    },
  });

  // 5. DELIVERED - full lifecycle complete, with a DeliveryLog
  const deliveredDonation = await prisma.donation.create({
    data: {
      donorId: donor2.id,
      type: 'FOOD',
      title: 'Fresh vegetables and fruit crates',
      description: 'Locally sourced produce for daily meals.',
      quantity: 12,
      unit: 'crates',
      expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'DELIVERED',
      matchedTrustId: trust2.id,
      volunteerId: volunteer2.id,
      pickupOtp: '304857',
      deliveryOtp: '627148',
      photos: ['https://res.cloudinary.com/demo/image/upload/sample2.jpg'],
      landmark: 'Near Borella Junction',
      pincode: '00900',
      district: 'Colombo',
      state: 'Western Province',
      lat: 6.9214,
      lng: 79.8801,
    },
  });

  await prisma.deliveryLog.create({
    data: {
      donationId: deliveredDonation.id,
      volunteerId: volunteer2.id,
      status: 'DELIVERED',
      photoProofUrl: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg',
      completedAt: new Date(),
    },
  });

  console.log('Seed complete:');
  console.log(`  Admin: ${admin.email}`);
  console.log(`  Trusts: ${trust1.orgName}, ${trust2.orgName}`);
  console.log(`  Donors: ${donor1.email}, ${donor2.email}, ${donor3.email}`);
  console.log(`  Volunteers: ${volunteer1User.email}, ${volunteer2User.email}`);
  console.log('  Donations: 1 PENDING, 1 MATCHED, 1 PICKUP_SCHEDULED, 1 PICKED_UP, 1 DELIVERED');
  console.log(`  (in-progress donation still awaiting delivery confirmation: ${pickedUpDonation.id})`);
  console.log('  All seeded users share the password: Password123!');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
