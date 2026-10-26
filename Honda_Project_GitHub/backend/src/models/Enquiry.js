import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    bikeModel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BikeModel',
      required: [true, 'Interested bike model is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'test_ride_scheduled', 'negotiating', 'converted', 'lost'],
      default: 'new',
      index: true,
    },
    source: {
      type: String,
      enum: ['Walk-in', 'Phone Call', 'Website', 'Referral', 'Social Media'],
      default: 'Walk-in',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    followUpDate: {
      type: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Enquiry = mongoose.model('Enquiry', enquirySchema);
