import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { BikeModel } from '../src/models/BikeModel.js';
import { BikeUnit } from '../src/models/BikeUnit.js';
import { Customer } from '../src/models/Customer.js';
import { Enquiry } from '../src/models/Enquiry.js';
import { TestRide } from '../src/models/TestRide.js';
import { Sale } from '../src/models/Sale.js';
import { Payment } from '../src/models/Payment.js';
import { ShowroomSettings } from '../src/models/ShowroomSettings.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { calculateSaleTotals } from '../src/services/calculationService.js';

async function seedDatabase() {
  console.log('========================================================');
  console.log('  HONDA MOTORCYCLE SHOWROOM - DATABASE SEED SCRIPT       ');
  console.log('========================================================');

  const connected = await connectDB();
  if (!connected) {
    console.error('[ABORT] Cannot seed without an active MongoDB connection.');
    console.error('Please configure your MONGODB_URI in backend/.env');
    process.exit(1);
  }

  try {
    // 1. Showroom Settings
    console.log('[Seed] Configuring Showroom Settings...');
    let settings = await ShowroomSettings.findOne();
    if (!settings) {
      settings = await ShowroomSettings.create({
        showroomName: 'Apex Honda Motors',
        tagline: 'Authorized Honda 2-Wheelers Sales & Service',
        dealerCode: 'HND-BLR-042',
        address: 'Plot 42, Outer Ring Road, Mahadevapura',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560048',
        phone: '+91 80 4123 4567',
        email: 'sales@apexhonda.example.com',
        gstin: '29AABCH1234F1Z5',
        invoicePrefix: 'HND-2026',
        nextInvoiceNumber: 1005,
        defaultGstRate: 28,
        defaultInsuranceRate: 5500,
        defaultRtoCharge: 8500,
        defaultReorderThreshold: 3,
      });
      console.log('  -> Default settings created.');
    } else {
      console.log('  -> Showroom settings already exist.');
    }

    // 2. Demo Users (Admin & Staff)
    console.log('[Seed] Seeding authorized demo users...');
    const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@honda-dealership.com';
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@Honda2026!';
    const staffEmail = process.env.STAFF_SEED_EMAIL || 'staff@honda-dealership.com';
    const staffPassword = process.env.STAFF_SEED_PASSWORD || 'Staff@Honda2026!';

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Rajesh Sharma (Showroom Manager)',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '+91 98450 11223',
        isActive: true,
      });
      console.log(`  -> Demo Admin created: ${adminEmail}`);
    } else {
      console.log(`  -> Demo Admin already exists: ${adminEmail}`);
    }

    let staffUser = await User.findOne({ email: staffEmail });
    if (!staffUser) {
      staffUser = await User.create({
        name: 'Kavita Menon (Sales Executive)',
        email: staffEmail,
        password: staffPassword,
        role: 'staff',
        phone: '+91 98450 44556',
        isActive: true,
      });
      console.log(`  -> Demo Staff created: ${staffEmail}`);
    } else {
      console.log(`  -> Demo Staff already exists: ${staffEmail}`);
    }

    // 3. Bike Models (Authentic Honda 2026 specifications)
    console.log('[Seed] Seeding Honda motorcycle and scooter models...');
    const modelsData = [
      {
        modelName: 'Activa 6G',
        variant: 'Standard',
        modelYear: 2026,
        category: 'Scooter',
        colours: ['Pearl Siren Blue', 'Decent Blue Metallic', 'Rebel Red Metallic', 'Black'],
        engineCapacityCc: 109.51,
        fuelType: 'Petrol',
        basePrice: 76684,
        reorderThreshold: 4,
        description: "India's favorite scooter featuring the reliable eSP engine, telescopic front suspension, and external fuel cap.",
      },
      {
        modelName: 'Activa 6G',
        variant: 'H-Smart',
        modelYear: 2026,
        category: 'Scooter',
        colours: ['Pearl Siren Blue', 'Pearl Nightstar Black', 'Matte Axis Grey'],
        engineCapacityCc: 109.51,
        fuelType: 'Petrol',
        basePrice: 82684,
        reorderThreshold: 3,
        description: 'Smart key functionality with smart find, smart unlock, smart safe, and smart start technology.',
      },
      {
        modelName: 'Activa 125',
        variant: 'Disc',
        modelYear: 2026,
        category: 'Scooter',
        colours: ['Rebel Red', 'Heavy Grey Metallic', 'Midnight Blue Metallic'],
        engineCapacityCc: 124.0,
        fuelType: 'Petrol',
        basePrice: 88979,
        reorderThreshold: 2,
        description: 'Premium 125cc scooter with front disc brake, digital-analog meter with real-time mileage, and idle start-stop system.',
      },
      {
        modelName: 'Shine 125',
        variant: 'Disc',
        modelYear: 2026,
        category: 'Commuter',
        colours: ['Black', 'Geny Grey Metallic', 'Rebel Red', 'Decent Blue'],
        engineCapacityCc: 123.94,
        fuelType: 'Petrol',
        basePrice: 84800,
        reorderThreshold: 3,
        description: "The trusted commuter motorcycle with 5-speed transmission, DC headlamp, and Honda's proven eSP technology.",
      },
      {
        modelName: 'SP125',
        variant: 'Disc',
        modelYear: 2026,
        category: 'Commuter',
        colours: ['Imperial Red Metallic', 'Pearl Siren Blue', 'Matte Axis Grey Metallic'],
        engineCapacityCc: 123.94,
        fuelType: 'Petrol',
        basePrice: 90567,
        reorderThreshold: 3,
        description: 'Sporty commuter with full LED headlamp, fully digital instrument console, and aggressive tank shrouds.',
      },
      {
        modelName: 'Unicorn',
        variant: 'Standard',
        modelYear: 2026,
        category: 'Commuter',
        colours: ['Pearl Igneous Black', 'Imperial Red Metallic', 'Matte Axis Grey'],
        engineCapacityCc: 162.7,
        fuelType: 'Petrol',
        basePrice: 109678,
        reorderThreshold: 2,
        description: 'Legendary smooth 160cc engine, monoshock suspension, and long comfortable seating for all-day commuting.',
      },
      {
        modelName: 'Hornet 2.0',
        variant: 'Standard',
        modelYear: 2026,
        category: 'Street',
        colours: ['Matte Axis Grey Metallic', 'Pearl Igneous Black', 'Radiant Red'],
        engineCapacityCc: 184.4,
        fuelType: 'Petrol',
        basePrice: 139000,
        reorderThreshold: 2,
        description: 'Streetfighter styling with golden USD front forks, fully digital meter, hazard light switch, and dual petal disc brakes.',
      },
      {
        modelName: 'Hness CB350',
        variant: 'DLX Pro',
        modelYear: 2026,
        category: 'Cruiser',
        colours: ['Precious Red Metallic', 'Pearl Nightstar Black', 'Athletic Blue Metallic'],
        engineCapacityCc: 348.36,
        fuelType: 'Petrol',
        basePrice: 214856,
        reorderThreshold: 2,
        description: 'Classic retro roadster with Honda Selectable Torque Control (HSTC), assist and slipper clutch, and dual-channel ABS.',
      },
    ];

    const modelMap = {};
    for (const mData of modelsData) {
      let model = await BikeModel.findOne({
        modelName: mData.modelName,
        variant: mData.variant,
        modelYear: mData.modelYear,
      });

      if (!model) {
        model = await BikeModel.create(mData);
        console.log(`  -> Model created: ${model.modelName} ${model.variant}`);
      } else {
        console.log(`  -> Model already exists: ${model.modelName} ${model.variant}`);
      }
      modelMap[`${model.modelName}_${model.variant}`] = model;
    }

    // 4. Physical Bike Units (Chassis VIN & Engine Numbers)
    console.log('[Seed] Seeding physical bike units...');
    const unitsData = [
      // Activa 6G Standard
      {
        chassisNumber: 'ME4JF501LK000101',
        engineNumber: 'JF50E700101',
        modelKey: 'Activa 6G_Standard',
        colour: 'Pearl Siren Blue',
        variant: 'Standard',
        purchaseCost: 68000,
        status: 'available',
        location: 'Showroom Floor',
      },
      {
        chassisNumber: 'ME4JF501LK000102',
        engineNumber: 'JF50E700102',
        modelKey: 'Activa 6G_Standard',
        colour: 'Rebel Red Metallic',
        variant: 'Standard',
        purchaseCost: 68000,
        status: 'available',
        location: 'Showroom Floor',
      },
      {
        chassisNumber: 'ME4JF501LK000103',
        engineNumber: 'JF50E700103',
        modelKey: 'Activa 6G_Standard',
        colour: 'Black',
        variant: 'Standard',
        purchaseCost: 68000,
        status: 'available',
        location: 'Storage Warehouse A',
      },
      // Activa 6G H-Smart
      {
        chassisNumber: 'ME4JF502LK000201',
        engineNumber: 'JF50E700201',
        modelKey: 'Activa 6G_H-Smart',
        colour: 'Matte Axis Grey',
        variant: 'H-Smart',
        purchaseCost: 73500,
        status: 'available',
        location: 'Showroom Floor',
      },
      {
        chassisNumber: 'ME4JF502LK000202',
        engineNumber: 'JF50E700202',
        modelKey: 'Activa 6G_H-Smart',
        colour: 'Pearl Siren Blue',
        variant: 'H-Smart',
        purchaseCost: 73500,
        status: 'reserved',
        location: 'Delivery Bay',
      },
      // Activa 125 Disc
      {
        chassisNumber: 'ME4JF511LK000301',
        engineNumber: 'JF51E700301',
        modelKey: 'Activa 125_Disc',
        colour: 'Rebel Red',
        variant: 'Disc',
        purchaseCost: 79000,
        status: 'available',
        location: 'Showroom Floor',
      },
      // Shine 125 Disc
      {
        chassisNumber: 'ME4JC801LK000401',
        engineNumber: 'JC80E700401',
        modelKey: 'Shine 125_Disc',
        colour: 'Geny Grey Metallic',
        variant: 'Disc',
        purchaseCost: 75000,
        status: 'available',
        location: 'Showroom Floor',
      },
      {
        chassisNumber: 'ME4JC801LK000402',
        engineNumber: 'JC80E700402',
        modelKey: 'Shine 125_Disc',
        colour: 'Black',
        variant: 'Disc',
        purchaseCost: 75000,
        status: 'available',
        location: 'Storage Warehouse B',
      },
      // SP125 Disc
      {
        chassisNumber: 'ME4JC851LK000501',
        engineNumber: 'JC85E700501',
        modelKey: 'SP125_Disc',
        colour: 'Imperial Red Metallic',
        variant: 'Disc',
        purchaseCost: 80500,
        status: 'available',
        location: 'Showroom Floor',
      },
      // Unicorn Standard
      {
        chassisNumber: 'ME4KC451LK000601',
        engineNumber: 'KC45E700601',
        modelKey: 'Unicorn_Standard',
        colour: 'Pearl Igneous Black',
        variant: 'Standard',
        purchaseCost: 98000,
        status: 'available',
        location: 'Showroom Floor',
      },
      // Hornet 2.0
      {
        chassisNumber: 'ME4MC501LK000701',
        engineNumber: 'MC50E700701',
        modelKey: 'Hornet 2.0_Standard',
        colour: 'Radiant Red',
        variant: 'Standard',
        purchaseCost: 124000,
        status: 'available',
        location: 'Showroom Floor',
      },
      // Hness CB350 DLX Pro
      {
        chassisNumber: 'ME4NC551LK000801',
        engineNumber: 'NC55E700801',
        modelKey: 'Hness CB350_DLX Pro',
        colour: 'Precious Red Metallic',
        variant: 'DLX Pro',
        purchaseCost: 192000,
        status: 'available',
        location: 'BigWing Section',
      },
      // Sold Units for historical data
      {
        chassisNumber: 'ME4JF501LK000991',
        engineNumber: 'JF50E700991',
        modelKey: 'Activa 6G_Standard',
        colour: 'Pearl Siren Blue',
        variant: 'Standard',
        purchaseCost: 68000,
        status: 'sold',
        location: 'Customer Handover',
      },
      {
        chassisNumber: 'ME4NC551LK000992',
        engineNumber: 'NC55E700992',
        modelKey: 'Hness CB350_DLX Pro',
        colour: 'Athletic Blue Metallic',
        variant: 'DLX Pro',
        purchaseCost: 192000,
        status: 'sold',
        location: 'Customer Handover',
      },
    ];

    const unitMap = {};
    for (const uData of unitsData) {
      let unit = await BikeUnit.findOne({ chassisNumber: uData.chassisNumber });
      const model = modelMap[uData.modelKey];
      if (!unit && model) {
        unit = await BikeUnit.create({
          chassisNumber: uData.chassisNumber,
          engineNumber: uData.engineNumber,
          model: model._id,
          colour: uData.colour,
          variant: uData.variant,
          purchaseCost: uData.purchaseCost,
          status: uData.status,
          location: uData.location,
        });
        console.log(`  -> Bike unit created: ${unit.chassisNumber} (${uData.modelKey})`);
      } else {
        console.log(`  -> Unit already exists: ${uData.chassisNumber}`);
      }
      unitMap[uData.chassisNumber] = unit;
    }

    // 5. Customers
    console.log('[Seed] Seeding demo customers...');
    const customersData = [
      {
        name: 'Arun Kumar',
        phone: '9845012345',
        email: 'arun.kumar@example.com',
        address: '#14, 5th Cross, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        idProofType: 'Aadhaar',
        idProofNumber: '4512-8974-2314',
      },
      {
        name: 'Priya Sharma',
        phone: '9845067890',
        email: 'priya.sharma@example.com',
        address: 'Flat 302, Prestige Palms, Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066',
        idProofType: 'Driving License',
        idProofNumber: 'KA-03-20210045678',
      },
      {
        name: 'Rajesh Patel',
        phone: '9876543210',
        email: 'rajesh.patel@example.com',
        address: '#88, 12th Main, Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        idProofType: 'PAN',
        idProofNumber: 'ABCDE1234F',
      },
      {
        name: 'Sneha Rao',
        phone: '9741098765',
        email: 'sneha.rao@example.com',
        address: '#55, 7th Sector, HSR Layout',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
        idProofType: 'Aadhaar',
        idProofNumber: '7894-5612-3214',
      },
    ];

    const customerMap = {};
    for (const cData of customersData) {
      let cust = await Customer.findOne({ phone: cData.phone });
      if (!cust) {
        cust = await Customer.create(cData);
        console.log(`  -> Customer created: ${cust.name}`);
      } else {
        console.log(`  -> Customer already exists: ${cust.name}`);
      }
      customerMap[cust.phone] = cust;
    }

    // 6. Enquiries
    console.log('[Seed] Seeding customer enquiries...');
    const activaModel = modelMap['Activa 6G_Standard'];
    const cb350Model = modelMap['Hness CB350_DLX Pro'];
    const arun = customerMap['9845012345'];
    const priya = customerMap['9845067890'];

    if (arun && activaModel) {
      const existingEnquiry = await Enquiry.findOne({ customer: arun._id, bikeModel: activaModel._id });
      if (!existingEnquiry) {
        await Enquiry.create({
          customer: arun._id,
          bikeModel: activaModel._id,
          status: 'contacted',
          source: 'Walk-in',
          notes: 'Customer interested in Activa 6G Blue. Inquired about festival discount and finance options.',
          followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          assignedTo: staffUser._id,
        });
        console.log('  -> Enquiry created for Arun Kumar.');
      }
    }

    if (priya && cb350Model) {
      const existingEnquiry = await Enquiry.findOne({ customer: priya._id, bikeModel: cb350Model._id });
      if (!existingEnquiry) {
        await Enquiry.create({
          customer: priya._id,
          bikeModel: cb350Model._id,
          status: 'test_ride_scheduled',
          source: 'Website',
          notes: 'Customer requested test ride for CB350 DLX Pro on Saturday morning.',
          followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          assignedTo: staffUser._id,
        });
        console.log('  -> Enquiry created for Priya Sharma.');
      }
    }

    // 7. Test Rides
    console.log('[Seed] Seeding test-ride bookings...');
    if (priya && cb350Model) {
      const existingRide = await TestRide.findOne({ customer: priya._id, bikeModel: cb350Model._id });
      if (!existingRide) {
        await TestRide.create({
          customer: priya._id,
          bikeModel: cb350Model._id,
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          timeSlot: '11:00 AM - 12:00 PM',
          licenseNumber: 'KA-03-20210045678',
          status: 'scheduled',
          feedback: 'Requested helmet and highway test route.',
          handledBy: staffUser._id,
        });
        console.log('  -> Test ride scheduled for Priya Sharma.');
      }
    }

    // 8. Completed Historic Sales & Invoices
    console.log('[Seed] Seeding sample sales and invoices...');
    const soldUnit1 = unitMap['ME4JF501LK000991'];
    const soldUnit2 = unitMap['ME4NC551LK000992'];
    const rajesh = customerMap['9876543210'];
    const sneha = customerMap['9741098765'];

    if (rajesh && soldUnit1) {
      let sale1 = await Sale.findOne({ invoiceNumber: 'HND-2026-1001' });
      if (!sale1) {
        const breakdown1 = calculateSaleTotals({
          exShowroomPrice: activaModel.basePrice,
          insuranceCharge: 5200,
          rtoRegistrationCharge: 7800,
          accessoriesList: [
            { name: 'All-Round Chrome Guard', price: 2400 },
            { name: 'Seat Cover & Floor Mat', price: 950 },
          ],
          discountAmount: 1500,
          gstRate: 28,
        });

        sale1 = await Sale.create({
          invoiceNumber: 'HND-2026-1001',
          customer: rajesh._id,
          bikeUnit: soldUnit1._id,
          bikeModel: activaModel._id,
          soldBy: staffUser._id,
          saleDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          ...breakdown1,
          accessoriesList: [
            { name: 'All-Round Chrome Guard', price: 2400 },
            { name: 'Seat Cover & Floor Mat', price: 950 },
          ],
          amountPaid: breakdown1.totalAmount, // Fully settled
          outstandingBalance: 0,
          paymentStatus: 'paid',
          saleStatus: 'confirmed',
          notes: 'Customer paid entire amount via UPI on vehicle delivery.',
        });

        await Payment.create({
          sale: sale1._id,
          customer: rajesh._id,
          amount: breakdown1.totalAmount,
          paymentType: 'full_settlement',
          paymentMethod: 'upi',
          transactionReference: 'UPI/HDFC/2026102201948',
          paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'success',
          receivedBy: staffUser._id,
          notes: 'Full payment received at delivery.',
        });

        console.log('  -> Confirmed paid sale created: HND-2026-1001');
      }
    }

    if (sneha && soldUnit2) {
      let sale2 = await Sale.findOne({ invoiceNumber: 'HND-2026-1002' });
      if (!sale2) {
        const breakdown2 = calculateSaleTotals({
          exShowroomPrice: cb350Model.basePrice,
          insuranceCharge: 8500,
          rtoRegistrationCharge: 18500,
          accessoriesList: [
            { name: 'Engine Crash Guard with Sliders', price: 4200 },
            { name: 'Pillion Backrest', price: 2800 },
          ],
          discountAmount: 2000,
          gstRate: 28,
        });

        const advanceAmount = 50000;
        const balance = breakdown2.totalAmount - advanceAmount;

        sale2 = await Sale.create({
          invoiceNumber: 'HND-2026-1002',
          customer: sneha._id,
          bikeUnit: soldUnit2._id,
          bikeModel: cb350Model._id,
          soldBy: adminUser._id,
          saleDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          ...breakdown2,
          accessoriesList: [
            { name: 'Engine Crash Guard with Sliders', price: 4200 },
            { name: 'Pillion Backrest', price: 2800 },
          ],
          amountPaid: advanceAmount,
          outstandingBalance: balance,
          paymentStatus: 'partial',
          saleStatus: 'confirmed',
          notes: 'Customer paid booking advance. Balance to be settled upon RTO registration completion.',
        });

        await Payment.create({
          sale: sale2._id,
          customer: sneha._id,
          amount: advanceAmount,
          paymentType: 'advance',
          paymentMethod: 'card',
          transactionReference: 'POS-TXN-9847291',
          paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: 'success',
          receivedBy: adminUser._id,
          notes: 'Booking advance via Debit Card.',
        });

        console.log('  -> Confirmed partial sale created: HND-2026-1002');
      }
    }

    // 9. Initial Audit Logs
    const auditCount = await AuditLog.countDocuments();
    if (auditCount === 0) {
      await AuditLog.create([
        {
          action: 'DATABASE_SEEDED',
          entity: 'System',
          entityId: 'SEED-INIT',
          userName: 'System Installer',
          userRole: 'system',
          details: 'Demonstration seed data populated successfully.',
        },
      ]);
    }

    console.log('========================================================');
    console.log('  DATABASE SEED COMPLETED SUCCESSFULLY!                 ');
    console.log('========================================================');
    console.log('Demo Credentials:');
    console.log(`  Admin : ${adminEmail}  |  Password: ${adminPassword}`);
    console.log(`  Staff : ${staffEmail}  |  Password: ${staffPassword}`);
    console.log('========================================================');

    process.exit(0);
  } catch (error) {
    console.error('[FATAL SEED ERROR]', error);
    process.exit(1);
  }
}

seedDatabase();
