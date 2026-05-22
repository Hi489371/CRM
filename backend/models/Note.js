const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    relatedClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    relatedLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    type: {
      type: String,
      enum: ['note', 'comment', 'activity', 'email'],
      default: 'note',
    },
    attachments: [String],
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
noteSchema.index({ content: 'text' });
noteSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
