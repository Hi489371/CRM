const { Note } = require('../models');

// Create note
exports.createNote = async (req, res, next) => {
  try {
    const { content, relatedClient, relatedLead, type, isPrivate } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    if (!relatedClient && !relatedLead) {
      return res.status(400).json({ message: 'Note must be related to a client or lead' });
    }

    const note = new Note({
      content,
      relatedClient,
      relatedLead,
      type: type || 'note',
      isPrivate,
      createdBy: req.user.id,
    });

    await note.save();
    await note.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Note created successfully',
      note,
    });
  } catch (error) {
    next(error);
  }
};

// Get notes for client or lead
exports.getNotes = async (req, res, next) => {
  try {
    const { relatedClient, relatedLead, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!relatedClient && !relatedLead) {
      return res.status(400).json({ message: 'Either relatedClient or relatedLead is required' });
    }

    let filter = {};
    if (relatedClient) {
      filter.relatedClient = relatedClient;
    }
    if (relatedLead) {
      filter.relatedLead = relatedLead;
    }

    // Don't show private notes from other users
    const notes = await Note.find({
      ...filter,
      $or: [{ isPrivate: false }, { createdBy: req.user.id }],
    })
      .populate('createdBy', 'name email profileImage')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Note.countDocuments({
      ...filter,
      $or: [{ isPrivate: false }, { createdBy: req.user.id }],
    });

    res.json({
      data: notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single note
exports.getNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const note = await Note.findById(id).populate('createdBy', 'name email');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check permission
    if (note.isPrivate && note.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to view this note' });
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
};

// Update note
exports.updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, isPrivate } = req.body;

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check permission
    if (note.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own notes' });
    }

    if (content) note.content = content;
    if (typeof isPrivate === 'boolean') note.isPrivate = isPrivate;

    await note.save();
    await note.populate('createdBy', 'name email');

    res.json({
      message: 'Note updated successfully',
      note,
    });
  } catch (error) {
    next(error);
  }
};

// Delete note
exports.deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check permission
    if (note.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own notes' });
    }

    await Note.findByIdAndDelete(id);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get activity feed
exports.getActivityFeed = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await Note.find({ type: { $in: ['activity', 'comment'] } })
      .populate('createdBy', 'name profileImage')
      .populate('relatedClient', 'companyName')
      .populate('relatedLead', 'firstName lastName')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (error) {
    next(error);
  }
};
