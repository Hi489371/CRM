const { Lead } = require('../models');
const { applyStatusChange, LEAD_STATUSES, STATUS_LABELS } = require('../utils/leadStatusHelper');

// Create lead
exports.createLead = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, company, source, value, probability, notes, tags } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }

    const lead = new Lead({
      firstName,
      lastName,
      email,
      phone,
      company,
      source: source || 'other',
      value: value || 0,
      probability: probability || 0,
      status: 'new',
      assignedTo: req.user.id,
      notes,
      tags,
      statusHistory: [{ status: 'new', changedAt: new Date(), note: 'Lead created manually' }],
    });

    await lead.save();
    await lead.populate('assignedTo', 'name email');

    res.status(201).json({
      message: 'Lead created successfully',
      lead,
    });
  } catch (error) {
    next(error);
  }
};

// Get all leads
exports.getLeads = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, assignedTo, source } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter.$text = { $search: search };
    }
    if (status) {
      filter.status = status;
    }
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    if (source) {
      filter.source = source;
    }

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name email')
      .populate('relatedClient', 'companyName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Lead.countDocuments(filter);

    res.json({
      data: leads,
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

// Get single lead
exports.getLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(id)
      .populate('assignedTo', 'name email')
      .populate('relatedClient', 'companyName contactName email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json({
      ...lead.toObject(),
      statusLabel: STATUS_LABELS[lead.status] || lead.status,
      availableStatuses: LEAD_STATUSES,
      statusLabels: STATUS_LABELS,
    });
  } catch (error) {
    next(error);
  }
};

// Update lead
exports.updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (updates.status && updates.status !== lead.status) {
      applyStatusChange(lead, updates.status, updates.statusNote || 'Lead updated');
      delete updates.status;
      delete updates.statusNote;
    }

    Object.assign(lead, updates);
    await lead.save();
    await lead.populate('assignedTo', 'name email');
    await lead.populate('relatedClient', 'companyName');

    res.json({
      message: 'Lead updated successfully',
      lead,
    });
  } catch (error) {
    if (error.message?.includes('Invalid lead status')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// Delete lead
exports.deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Convert lead to client
exports.convertLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyName, clientStatus } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Update lead status
    lead.status = 'converted';
    await lead.save();

    res.json({
      message: 'Lead converted successfully',
      lead,
    });
  } catch (error) {
    next(error);
  }
};

// Get lead statistics
exports.getLeadStats = async (req, res, next) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'new' });
    const contactedLeads = await Lead.countDocuments({ status: 'contacted' });
    const convertedLeads = await Lead.countDocuments({ status: 'converted' });
    const lostLeads = await Lead.countDocuments({ status: 'lost' });

    const totalValue = await Lead.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$value' },
        },
      },
    ]);

    const averageProbability = await Lead.aggregate([
      {
        $group: {
          _id: null,
          avg: { $avg: '$probability' },
        },
      },
    ]);

    res.json({
      totalLeads,
      newLeads,
      contactedLeads,
      convertedLeads,
      lostLeads,
      totalValue: totalValue[0]?.total || 0,
      averageProbability: Math.round(averageProbability[0]?.avg || 0),
    });
  } catch (error) {
    next(error);
  }
};
