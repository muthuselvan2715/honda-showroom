import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Customer name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9+ -]{10,15}$/, 'Please enter a valid phone number'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
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
      trim: true,
      default: '',
    },
    idProofType: {
      type: String,
      enum: ['Aadhaar', 'PAN', 'Driving License', 'Passport', 'Voter ID', 'Other'],
      default: 'Aadhaar',
    },
    idProofNumber: {
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

export const Customer = mongoose.model('Customer', customerSchema);
