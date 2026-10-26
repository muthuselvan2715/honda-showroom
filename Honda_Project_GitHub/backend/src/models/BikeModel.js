import mongoose from 'mongoose';

const bikeModelSchema = new mongoose.Schema(
  {
    modelName: {
      type: String,
      required: [true, 'Model name is required (e.g. Activa 6G, Shine 125, CB350)'],
      trim: true,
    },
    variant: {
      type: String,
      required: [true, 'Variant is required (e.g. Standard, Deluxe, H-Smart, Disc)'],
      trim: true,
    },
    modelYear: {
      type: Number,
      required: [true, 'Model year is required'],
      min: [2000, 'Model year must be valid'],
    },
    category: {
      type: String,
      enum: ['Scooter', 'Commuter', 'Street', 'Cruiser', 'Adventure'],
      default: 'Scooter',
    },
    colours: {
      type: [String],
      default: ['Black', 'Pearl Siren Blue', 'Rebel Red Metallic'],
    },
    engineCapacityCc: {
      type: Number,
      required: [true, 'Engine displacement in CC is required'],
    },
    fuelType: {
      type: String,
      default: 'Petrol',
    },
    basePrice: {
      type: Number,
      required: [true, 'Base ex-showroom price is required'],
      min: [0, 'Base price cannot be negative'],
    },
    reorderThreshold: {
      type: Number,
      default: 3,
      min: [1, 'Reorder threshold must be at least 1'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so duplicate model name + variant + year cannot be created
bikeModelSchema.index({ modelName: 1, variant: 1, modelYear: 1 }, { unique: true });

export const BikeModel = mongoose.model('BikeModel', bikeModelSchema);
