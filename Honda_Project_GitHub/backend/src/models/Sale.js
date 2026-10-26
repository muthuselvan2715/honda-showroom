import mongoose from 'mongoose';

const accessoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    bikeUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BikeUnit',
      required: [true, 'Bike physical unit reference is required'],
      index: true,
    },
    bikeModel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BikeModel',
      required: [true, 'Bike model reference is required'],
      index: true,
    },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sales representative is required'],
    },
    saleDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Financial Breakdown
    exShowroomPrice: {
      type: Number,
      required: [true, 'Ex-showroom price is required'],
      min: [0, 'Price cannot be negative'],
    },
    insuranceCharge: {
      type: Number,
      default: 0,
      min: [0, 'Insurance charge cannot be negative'],
    },
    rtoRegistrationCharge: {
      type: Number,
      default: 0,
      min: [0, 'RTO charge cannot be negative'],
    },
    accessoriesList: {
      type: [accessoryItemSchema],
      default: [],
    },
    accessoriesTotal: {
      type: Number,
      default: 0,
      min: [0, 'Accessories total cannot be negative'],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    taxableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    gstRate: {
      type: Number,
      default: 28, // Indian standard for motorcycles
      min: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTaxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total invoice amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
      index: true,
    },
    saleStatus: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Sale = mongoose.model('Sale', saleSchema);
