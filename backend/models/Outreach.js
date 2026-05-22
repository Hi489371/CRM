const mongoose = require('mongoose');

const outreachSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    likelyNeed: {
      type: String,
      default: '',
      trim: true,
    },
    decisionMaker: {
      type: String,
      default: '',
      trim: true,
    },
    estimatedBudget: {
      type: String,
      default: '',
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    emailSubject: {
      type: String,
      default: '',
      trim: true,
    },
    emailBody: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['drafted', 'sent', 'replied'],
      default: 'drafted',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Outreach', outreachSchema);
