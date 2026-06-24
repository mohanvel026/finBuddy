const mongoose = require('mongoose');

const emiSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'EMI Name is required'],
    trim: true
  },
  principal: {
    type: Number,
    required: [true, 'Principal amount is required'],
    min: 0
  },
  annualRate: {
    type: Number,
    required: [true, 'Annual rate is required'],
    min: 0
  },
  tenureMonths: {
    type: Number,
    required: [true, 'Tenure in months is required'],
    min: 1
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  category: {
    type: String,
    default: 'Other',
    trim: true
  },
  monthlyPayment: {
    type: Number,
    required: true
  },
  totalPayment: {
    type: Number,
    required: true
  },
  totalInterest: {
    type: Number,
    required: true
  },
  amortizationSchedule: {
    type: Array,
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('EMI', emiSchema);
