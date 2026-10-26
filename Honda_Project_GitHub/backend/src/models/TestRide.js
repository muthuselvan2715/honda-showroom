import mongoose from 'mongoose';

const testRideSchema = new mongoose.Schema(
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
      required: [true, 'Bike model is required'],
      index: true,
    },
    bikeUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BikeUnit',
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      index: true,
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required (e.g. 10:00 AM - 11:00 AM)'],
    },
    licenseNumber: {
      type: String,
      required: [true, 'Driving license number is mandatory for test ride'],
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const TestRide = mongoose.model('TestRide', testRideSchema);
