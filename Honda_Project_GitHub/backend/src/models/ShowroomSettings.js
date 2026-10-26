import mongoose from 'mongoose';

const showroomSettingsSchema = new mongoose.Schema(
  {
    showroomName: {
      type: String,
      default: 'Apex Honda Motors',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Authorized Honda 2-Wheelers Sales & Service',
      trim: true,
    },
    dealerCode: {
      type: String,
      default: 'HND-BLR-042',
      trim: true,
    },
    address: {
      type: String,
      default: '#42, Ring Road, Outer Ring Road Junction',
      trim: true,
    },
    city: {
      type: String,
      default: 'Bengaluru',
      trim: true,
    },
    state: {
      type: String,
      default: 'Karnataka',
      trim: true,
    },
    pincode: {
      type: String,
      default: '560048',
      trim: true,
    },
    phone: {
      type: String,
      default: '+91 80 4123 4567',
      trim: true,
    },
    email: {
      type: String,
      default: 'sales@apexhonda.example.com',
      trim: true,
    },
    gstin: {
      type: String,
      default: '29AABCH1234F1Z5',
      trim: true,
    },
    cin: {
      type: String,
      default: 'U50100KA2020PTC123456',
      trim: true,
    },
    invoicePrefix: {
      type: String,
      default: 'HND-2026',
      trim: true,
    },
    nextInvoiceNumber: {
      type: Number,
      default: 1001,
    },
    defaultGstRate: {
      type: Number,
      default: 28,
    },
    defaultInsuranceRate: {
      type: Number,
      default: 5500,
    },
    defaultRtoCharge: {
      type: Number,
      default: 8500,
    },
    defaultReorderThreshold: {
      type: Number,
      default: 3,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const ShowroomSettings = mongoose.model('ShowroomSettings', showroomSettingsSchema);
