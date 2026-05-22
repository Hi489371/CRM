const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const requirementsSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    company: { type: String, default: '' },
    projectDescription: { type: String, default: '' },
    budgetRange: { type: String, default: '' },
    timeline: { type: String, default: '' },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const scheduledCallSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    preferredTime: { type: String, default: '' },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      type: String,
      default: '',
    },
    company: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'new',
        'email_sent',
        'interested',
        'negotiating',
        'won',
        'lost',
        'no_response',
        'follow_up',
        'meeting_scheduled',
        'contacted',
        'qualified',
        'proposal',
        'converted',
      ],
      default: 'new',
    },
    source: {
      type: String,
      enum: ['website', 'referral', 'social-media', 'email', 'event', 'client-finder', 'other'],
      default: 'other',
    },
    value: {
      type: Number,
      default: 0,
    },
    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    relatedClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    tags: [String],
    lastContacted: Date,
    nextFollowUp: Date,
    customFields: mongoose.Schema.Types.Mixed,
    token: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    clientResponse: {
      interestedAt: Date,
      notInterestedAt: Date,
      requirements: requirementsSchema,
      scheduledCall: scheduledCallSchema,
    },
    proposalSent: {
      type: String,
      default: '',
    },
    emailSubject: { type: String, default: '' },
    industry: { type: String, default: '' },
    location: { type: String, default: '' },
    likelyNeed: { type: String, default: '' },
    estimatedBudget: { type: String, default: '' },
    decisionMakerTitle: { type: String, default: '' },
    skills: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ firstName: 'text', lastName: 'text', email: 'text', company: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
