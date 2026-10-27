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
import { calculateSaleTotals, roundToTwo } from '../src/services/calculationService.js';

/*
 * Demo data for a Honda two-wheeler showroom in Kallakurichi district, Tamil Nadu.
 * Safe to run more than once: existing records (matched by email, model, chassis,
 * phone or invoice number) are left untouched. Sales are only created on a database
 * that has no sales yet.
 */

// Small deterministic random generator so every run creates the same demo data
let seedState = 20261027;
const rand = () => {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
};
const pick = (list) => list[Math.floor(rand() * list.length)];
const daysAgo = (d, hour = 11) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, Math.floor(rand() * 59), 0, 0);
  return date;
};

const SHOWROOM = {
  showroomName: 'Apex Honda Motors',
  tagline: 'Authorised Honda 2-Wheeler Sales & Service',
  dealerCode: 'HND-TN-KLK-07',
  address: '12/4, Salem Main Road, Near New Bus Stand',
  city: 'Kallakurichi',
  state: 'Tamil Nadu',
  pincode: '606202',
  phone: '+91 4151 222 345',
  email: 'sales@apexhonda.example.com',
  gstin: '33AAPFA1234K1Z8',
  invoicePrefix: 'HND-2026',
  nextInvoiceNumber: 1001,
  defaultGstRate: 28,
  defaultInsuranceRate: 5500,
  defaultRtoCharge: 8500,
  defaultReorderThreshold: 3,
};

const MODELS = [
  { key: 'activa6g-std', modelName: 'Activa 6G', variant: 'Standard', category: 'Scooter', cc: 109.51, price: 76684, reorder: 4, colours: ['Pearl Siren Blue', 'Decent Blue Metallic', 'Rebel Red Metallic', 'Black'], prefix: 'ME4JF501', eng: 'JF50E', cost: 68000, insurance: 5200, weight: 7 },
  { key: 'activa6g-smart', modelName: 'Activa 6G', variant: 'H-Smart', category: 'Scooter', cc: 109.51, price: 82684, reorder: 3, colours: ['Pearl Siren Blue', 'Pearl Nightstar Black', 'Matte Axis Grey'], prefix: 'ME4JF502', eng: 'JF50E', cost: 73500, insurance: 5400, weight: 4 },
  { key: 'activa125', modelName: 'Activa 125', variant: 'Disc', category: 'Scooter', cc: 124.0, price: 88979, reorder: 2, colours: ['Rebel Red', 'Heavy Grey Metallic', 'Midnight Blue Metallic'], prefix: 'ME4JF511', eng: 'JF51E', cost: 79000, insurance: 5600, weight: 3 },
  { key: 'dio125', modelName: 'Dio 125', variant: 'Smart', category: 'Scooter', cc: 123.92, price: 92500, reorder: 2, colours: ['Pearl Siren Blue', 'Matte Marvel Blue', 'Sports Red'], prefix: 'ME4JK125', eng: 'JK12E', cost: 82000, insurance: 5600, weight: 2 },
  { key: 'shine100', modelName: 'Shine 100', variant: 'Standard', category: 'Commuter', cc: 98.98, price: 66900, reorder: 3, colours: ['Black with Red', 'Black with Blue', 'Black with Grey'], prefix: 'ME4JC871', eng: 'JC87E', cost: 59500, insurance: 4800, weight: 5 },
  { key: 'shine125', modelName: 'Shine 125', variant: 'Disc', category: 'Commuter', cc: 123.94, price: 84800, reorder: 3, colours: ['Black', 'Geny Grey Metallic', 'Rebel Red', 'Decent Blue'], prefix: 'ME4JC801', eng: 'JC80E', cost: 75000, insurance: 5300, weight: 5 },
  { key: 'sp125', modelName: 'SP125', variant: 'Disc', category: 'Commuter', cc: 123.94, price: 90567, reorder: 3, colours: ['Imperial Red Metallic', 'Pearl Siren Blue', 'Matte Axis Grey Metallic'], prefix: 'ME4JC851', eng: 'JC85E', cost: 80500, insurance: 5500, weight: 3 },
  { key: 'unicorn', modelName: 'Unicorn', variant: 'Standard', category: 'Commuter', cc: 162.71, price: 109678, reorder: 2, colours: ['Pearl Igneous Black', 'Imperial Red Metallic', 'Mat Axis Grey'], prefix: 'ME4KC451', eng: 'KC45E', cost: 98000, insurance: 6200, weight: 2 },
  { key: 'hornet', modelName: 'Hornet 2.0', variant: 'Standard', category: 'Street', cc: 184.4, price: 139245, reorder: 2, colours: ['Radiant Red', 'Pearl Igneous Black', 'Matte Sangria Red'], prefix: 'ME4MC501', eng: 'MC50E', cost: 124000, insurance: 7200, weight: 1 },
  { key: 'cb350', modelName: 'Hness CB350', variant: 'DLX Pro', category: 'Cruiser', cc: 348.36, price: 214856, reorder: 2, colours: ['Precious Red Metallic', 'Pearl Nightstar Black', 'Athletic Blue Metallic'], prefix: 'ME4NC551', eng: 'NC55E', cost: 192000, insurance: 9500, weight: 1 },
];

// 30 customers from Kallakurichi district (sample data – phone numbers are not real)
const PLACES = [
  { town: 'Kallakurichi', pin: '606202', streets: ['Gandhi Road', 'Durgam Road', 'Kacheri Road', 'Neelamangalam Road', 'Thiruvalluvar Nagar'] },
  { town: 'Chinnasalem', pin: '606201', streets: ['Bazaar Street', 'Station Road', 'Kamaraj Nagar'] },
  { town: 'Sankarapuram', pin: '606401', streets: ['Main Road', 'Anna Nagar', 'Pillaiyar Koil Street'] },
  { town: 'Ulundurpet', pin: '606107', streets: ['Trichy Main Road', 'Periyar Nagar', 'Market Street'] },
  { town: 'Tirukoilur', pin: '605757', streets: ['Car Street', 'Keezhaiyur Road', 'Arasur Road'] },
  { town: 'Thiyagadurgam', pin: '606206', streets: ['Fort Road', 'Mettu Street'] },
  { town: 'Vadakkanandal', pin: '606207', streets: ['Kallakurichi Road', 'School Street'] },
];
const CUSTOMER_NAMES = [
  'Murugan Subramani', 'Selvi Ramasamy', 'Karthikeyan Palanisamy', 'Anbarasan Kandasamy', 'Meena Kumari Velu',
  'Saravanan Muthusamy', 'Lakshmi Priya Senthil', 'Rajendran Veerappan', 'Vijay Anand Govindan', 'Kavitha Sundaram',
  'Senthil Murugan Arumugam', 'Deepa Ramalingam', 'Arul Prakash Natarajan', 'Gomathi Krishnan', 'Balamurugan Thangavel',
  'Revathi Manickam', 'Manikandan Annamalai', 'Sangeetha Perumal', 'Prabhu Dhanasekar', 'Malarkodi Elumalai',
  'Ilango Rajasekar', 'Bhuvaneswari Sivakumar', 'Sathish Kumar Chinnasamy', 'Jayanthi Vadivel', 'Gopinath Kaliyaperumal',
  'Nithya Shree Ganesan', 'Dinesh Babu Mariappan', 'Thenmozhi Ayyanar', 'Ramesh Kannan Selvaraj', 'Vanitha Murugesan',
];
const ID_TYPES = ['Aadhaar', 'Aadhaar', 'Aadhaar', 'Driving License', 'PAN', 'Voter ID'];

const ACCESSORIES = [
  { name: 'Helmet (ISI marked)', price: 1450 },
  { name: 'Seat Cover', price: 650 },
  { name: 'Floor Mat', price: 450 },
  { name: 'Crash Guard', price: 2200 },
  { name: 'Pillion Backrest', price: 1800 },
  { name: 'Body Cover', price: 550 },
  { name: 'Mobile Holder with Charger', price: 900 },
];
const FINANCIERS = ['Shriram Finance', 'Muthoot Capital Services', 'Sundaram Finance', 'Indian Bank', 'HDFC Bank', 'IDFC First Bank'];
const PAYMENT_METHODS = ['upi', 'upi', 'cash', 'cash', 'card', 'bank_transfer', 'cheque'];

async function seedDatabase() {
  console.log('========================================================');
  console.log('  HONDA MOTORCYCLE SHOWROOM - DATABASE SEED SCRIPT       ');
  console.log('========================================================');

  const connected = await connectDB();
  if (!connected) {
    console.error('[ABORT] Cannot seed without an active MongoDB connection.');
    process.exit(1);
  }

  try {
    // 1. Showroom settings
    let settings = await ShowroomSettings.findOne();
    if (!settings) {
      settings = await ShowroomSettings.create(SHOWROOM);
      console.log('[Seed] Showroom settings created.');
    }

    // 2. Users
    const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@honda-dealership.com';
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@Honda2026!';
    const staffEmail = process.env.STAFF_SEED_EMAIL || 'staff@honda-dealership.com';
    const staffPassword = process.env.STAFF_SEED_PASSWORD || 'Staff@Honda2026!';

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({ name: 'Senthil Kumar (Manager)', email: adminEmail, password: adminPassword, role: 'admin', phone: '+91 90000 00001', isActive: true });
    }
    let staffUser = await User.findOne({ email: staffEmail });
    if (!staffUser) {
      staffUser = await User.create({ name: 'Priya Dharshini (Sales)', email: staffEmail, password: staffPassword, role: 'staff', phone: '+91 90000 00002', isActive: true });
    }
    const sellers = [adminUser, staffUser, staffUser];
    console.log('[Seed] Users ready.');

    // 3. Bike models
    const modelMap = {};
    for (const m of MODELS) {
      let model = await BikeModel.findOne({ modelName: m.modelName, variant: m.variant, modelYear: 2026 });
      if (!model) {
        model = await BikeModel.create({
          modelName: m.modelName,
          variant: m.variant,
          modelYear: 2026,
          category: m.category,
          colours: m.colours,
          engineCapacityCc: m.cc,
          fuelType: 'Petrol',
          basePrice: m.price,
          reorderThreshold: m.reorder,
          description: '',
          isActive: true,
        });
      }
      modelMap[m.key] = model;
    }
    console.log(`[Seed] ${MODELS.length} bike models ready.`);

    // 4. Customers
    const customers = [];
    for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
      const phone = `90000${String(10001 + i)}`;
      let cust = await Customer.findOne({ phone });
      if (!cust) {
        const place = PLACES[i % PLACES.length];
        const idType = pick(ID_TYPES);
        const first = CUSTOMER_NAMES[i].split(' ')[0].toLowerCase();
        cust = await Customer.create({
          name: CUSTOMER_NAMES[i],
          phone,
          email: i % 3 === 0 ? `${first}${10 + i}@example.com` : '',
          address: `${1 + Math.floor(rand() * 120)}, ${pick(place.streets)}`,
          city: place.town,
          state: 'Tamil Nadu',
          pincode: place.pin,
          idProofType: idType,
          idProofNumber: idType === 'Aadhaar' ? `XXXX-XXXX-${String(1000 + Math.floor(rand() * 8999))}` : '',
          createdAt: daysAgo(150 - i * 4),
        });
      }
      customers.push(cust);
    }
    console.log(`[Seed] ${customers.length} customers ready.`);

    // 5. Sales, payments and stock (only on a database with no sales yet)
    const existingSales = await Sale.countDocuments();
    if (existingSales === 0) {
      // Weighted model choice: popular scooters and commuters sell most
      const weighted = MODELS.flatMap((m) => Array(m.weight).fill(m));
      const serialByModel = {};
      const nextUnit = async (m, status, ageDays) => {
        serialByModel[m.key] = (serialByModel[m.key] || 100) + 1;
        const serial = String(serialByModel[m.key]).padStart(6, '0');
        return BikeUnit.create({
          chassisNumber: `${m.prefix}LK${serial}`,
          engineNumber: `${m.eng}${m.prefix.slice(-1)}${serial}`,
          model: modelMap[m.key]._id,
          colour: pick(m.colours),
          variant: m.variant,
          purchaseCost: m.cost,
          status,
          location: status === 'sold' ? 'Delivered' : pick(['Showroom Floor', 'Showroom Floor', 'Godown']),
          purchaseDate: daysAgo(ageDays),
          createdAt: daysAgo(ageDays),
        });
      };

      let invoiceNo = settings.nextInvoiceNumber || 1001;
      const salesCount = 30;
      for (let i = 0; i < salesCount; i++) {
        const m = weighted[Math.floor(rand() * weighted.length)];
        const cust = customers[i];
        const seller = sellers[i % sellers.length];
        // Spread sales over roughly the last five months, oldest first
        const saleAge = Math.max(1, Math.round(150 - i * 5 - rand() * 3));
        const saleDate = daysAgo(saleAge, 10 + Math.floor(rand() * 7));
        const cancelled = i === 11 || i === 24;
        const unit = await nextUnit(m, cancelled ? 'available' : 'sold', saleAge + 10);

        const accessoriesList = [];
        const accCount = Math.floor(rand() * 3);
        const pool = [...ACCESSORIES];
        for (let a = 0; a < accCount; a++) accessoriesList.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
        if (!accessoriesList.some((a) => a.name.startsWith('Helmet')) && rand() < 0.6) accessoriesList.unshift(ACCESSORIES[0]);

        const discount = [0, 0, 500, 1000, 1500, 2000][Math.floor(rand() * 6)];
        const rto = Math.round((m.price * 0.1) / 100) * 100;
        const totals = calculateSaleTotals({
          exShowroomPrice: m.price,
          insuranceCharge: m.insurance,
          rtoRegistrationCharge: rto,
          accessoriesList,
          discountAmount: discount,
          gstRate: settings.defaultGstRate || 28,
        });

        // Payment pattern: most pay in full, some on finance with balance, a few pending
        const financed = i % 4 === 1;
        const pattern = cancelled ? 'cancelled' : i >= 27 ? 'pending' : financed ? 'partial' : i % 7 === 3 ? 'partial' : 'full';
        const payments = [];
        if (pattern === 'full') {
          payments.push({ amount: totals.totalAmount, type: 'full_settlement', date: saleDate });
        } else if (pattern === 'partial' || pattern === 'cancelled') {
          const advance = Math.min(totals.totalAmount, [10000, 15000, 20000, 25000][Math.floor(rand() * 4)]);
          payments.push({ amount: advance, type: 'advance', date: saleDate });
          // Older partial sales have received a second instalment or been settled
          if (pattern === 'partial' && saleAge > 40) {
            const settle = i % 2 === 0;
            const remaining = roundToTwo(totals.totalAmount - advance);
            const amount = settle ? remaining : roundToTwo(Math.min(remaining, 30000));
            payments.push({ amount, type: settle ? 'full_settlement' : 'partial', date: daysAgo(Math.max(1, saleAge - 12)) });
          }
        } else if (pattern === 'pending') {
          // booked today/yesterday, payment to follow
        }
        const amountPaid = roundToTwo(payments.reduce((s, p) => s + p.amount, 0));
        const outstandingBalance = roundToTwo(Math.max(0, totals.totalAmount - amountPaid));
        const paymentStatus = amountPaid <= 0 ? 'pending' : outstandingBalance <= 0 ? 'paid' : 'partial';
        const invoiceNumber = `${settings.invoicePrefix || 'HND-2026'}-${String(invoiceNo).padStart(4, '0')}`;
        invoiceNo += 1;

        const sale = await Sale.create({
          invoiceNumber,
          customer: cust._id,
          bikeUnit: unit._id,
          bikeModel: modelMap[m.key]._id,
          soldBy: seller._id,
          saleDate,
          ...totals,
          accessoriesList,
          amountPaid,
          outstandingBalance,
          paymentStatus,
          saleStatus: cancelled ? 'cancelled' : 'confirmed',
          cancellationReason: cancelled ? 'Customer postponed purchase' : '',
          financeProvider: financed ? pick(FINANCIERS) : '',
          notes: financed ? 'Balance through vehicle loan' : '',
          createdAt: saleDate,
        });

        for (const p of payments) {
          await Payment.create({
            sale: sale._id,
            customer: cust._id,
            amount: p.amount,
            paymentType: p.type,
            paymentMethod: financed && p.type !== 'advance' ? 'bank_transfer' : pick(PAYMENT_METHODS),
            transactionReference: `REF-${invoiceNumber}-${payments.indexOf(p) + 1}`,
            paymentDate: p.date,
            status: cancelled ? 'refunded' : 'success',
            receivedBy: seller._id,
            notes: p.type === 'advance' ? 'Booking advance' : p.type === 'full_settlement' ? 'Full payment' : 'Instalment',
            createdAt: p.date,
          });
        }
      }
      settings.nextInvoiceNumber = invoiceNo;
      await settings.save();

      // Stock currently on the floor: 2–3 bikes of each model
      for (const m of MODELS) {
        const count = 2 + Math.floor(rand() * 2);
        for (let c = 0; c < count; c++) await nextUnit(m, 'available', 5 + Math.floor(rand() * 40));
      }
      // One bike on hold for a booking
      const held = await BikeUnit.findOne({ status: 'available' }).sort({ createdAt: -1 });
      if (held) {
        held.status = 'reserved';
        held.location = 'Delivery Bay';
        await held.save();
      }
      console.log(`[Seed] ${salesCount} invoices with payments and current stock created.`);

      // 6. Enquiries and test rides from new walk-in customers
      const leads = [
        { name: 'Arjun Velmurugan', town: 0, model: 'sp125', status: 'new', source: 'Walk-in', notes: 'Wants SP125 in red. Asked about exchange of old Splendor.' },
        { name: 'Pavithra Rajkumar', town: 1, model: 'activa6g-smart', status: 'contacted', source: 'Phone Call', notes: 'College student, needs finance with low down payment.' },
        { name: 'Kumaresan Duraisamy', town: 3, model: 'shine100', status: 'test_ride_scheduled', source: 'Referral', notes: 'Referred by Murugan. Test ride on Saturday.' },
        { name: 'Abirami Sekar', town: 2, model: 'dio125', status: 'negotiating', source: 'Social Media', notes: 'Asking for extra discount and free helmet.' },
        { name: 'Vignesh Paramasivam', town: 4, model: 'hornet', status: 'test_ride_scheduled', source: 'Website', notes: 'Interested in Hornet 2.0, compares with other brands.' },
        { name: 'Sumathi Pandian', town: 0, model: 'activa125', status: 'lost', source: 'Walk-in', notes: 'Bought elsewhere due to delivery time.' },
      ];
      for (let l = 0; l < leads.length; l++) {
        const lead = leads[l];
        const place = PLACES[lead.town];
        const cust = await Customer.create({
          name: lead.name,
          phone: `90000${String(20001 + l)}`,
          address: `${10 + l * 7}, ${place.streets[0]}`,
          city: place.town,
          state: 'Tamil Nadu',
          pincode: place.pin,
          idProofType: 'Aadhaar',
        });
        await Enquiry.create({
          customer: cust._id,
          bikeModel: modelMap[lead.model]._id,
          status: lead.status,
          source: lead.source,
          notes: lead.notes,
          followUpDate: daysAgo(-1 - l),
          assignedTo: staffUser._id,
        });
        if (lead.status === 'test_ride_scheduled') {
          await TestRide.create({
            customer: cust._id,
            bikeModel: modelMap[lead.model]._id,
            scheduledDate: daysAgo(-2 - l),
            timeSlot: l % 2 ? '04:00 PM - 05:00 PM' : '10:00 AM - 11:00 AM',
            licenseNumber: `TN-32-2019000${4500 + l}`,
            status: 'scheduled',
            feedback: 'Highway and town route',
            handledBy: staffUser._id,
          });
        }
      }
      console.log('[Seed] Enquiries and test rides created.');

      await AuditLog.create({
        action: 'DATABASE_SEEDED',
        entity: 'System',
        userName: 'System',
        userRole: 'system',
        details: 'Demo data for Kallakurichi showroom loaded.',
      });
    } else {
      console.log('[Seed] Sales already exist – skipped demo sales.');
    }

    console.log('========================================================');
    console.log('  DATABASE SEED COMPLETED SUCCESSFULLY!                 ');
    console.log('========================================================');
    console.log('Demo Credentials:');
    console.log(`  Admin : ${adminEmail}  |  Password: ${adminPassword}`);
    console.log(`  Staff : ${staffEmail}  |  Password: ${staffPassword}`);
    console.log('========================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[FATAL SEED ERROR]', error);
    process.exit(1);
  }
}

seedDatabase();
