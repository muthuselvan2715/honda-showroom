import mongoose from 'mongoose';

const bikeUnitSchema = new mongoose.Schema(
  {
    chassisNumber: {
      type: String,
      required: [true, 'Chassis / VIN number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [10, 'Chassis number must be at least 10 characters'],
      maxlength: [20, 'Chassis number cannot exceed 20 characters'],
    },
    engineNumber: {
      type: String,
      required: [true, 'Engine number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [6, 'Engine number must be at least 6 characters'],
      maxlength: [25, 'Engine number cannot exceed 25 characters'],
    },
    model: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BikeModel',
      required: [true, 'Bike model reference is required'],
      index: true,
    },
    colour: {
      type: String,
      required: [true, 'Bike colour is required'],
      trim: true,
    },
    variant: {
      type: String,
      required: [true, 'Variant is required'],
      trim: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    purchaseCost: {
      type: Number,
      required: [true, 'Purchase/dealer cost is required'],
      min: [0, 'Purchase cost cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'reserved', 'sold'],
        message: '{VALUE} is not a valid status',
      },
      default: 'available',
      index: true,
    },
    location: {
      type: String,
      default: 'Showroom Floor',
      trim: true,
    },
    batteryNumber: {
      type: String,
      trim: true,
      default: '',
    },
    keyNumber: {
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

export const BikeUnit = mongoose.model('BikeUnit', bikeUnitSchema);
