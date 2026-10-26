import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: [true, 'Sale reference is required'],
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Payment amount must be at least ₹1'],
    },
    paymentType: {
      type: String,
      enum: ['advance', 'partial', 'full_settlement'],
      required: [true, 'Payment type is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque'],
      required: [true, 'Payment method is required'],
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed', 'refunded'],
      default: 'success',
      index: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiving staff reference is required'],
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

export const Payment = mongoose.model('Payment', paymentSchema);
