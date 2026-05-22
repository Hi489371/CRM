const { Client } = require('../models');

// Create client
exports.createClient = async (req, res, next) => {
  try {
    const { companyName, contactName, email, phone, website, address, industry, status, notes, tags } = req.body;

    if (!companyName || !contactName || !email) {
      return res.status(400).json({ message: 'Company name, contact name, and email are required' });
    }

    const client = new Client({
      companyName,
      contactName,
      email,
      phone,
      website,
      address,
      industry,
      status: status || 'prospect',
      notes,
      assignedTo: req.user.id,
      tags,
    });

    await client.save();
    await client.populate('assignedTo', 'name email');

    res.status(201).json({
      message: 'Client created successfully',
      client,
    });
  } catch (error) {
    next(error);
  }
};

// Get all clients
exports.getClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, assignedTo } = req.query;
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

    const clients = await Client.find(filter)
      .populate('assignedTo', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Client.countDocuments(filter);

    res.json({
      data: clients,
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

// Get single client
exports.getClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id).populate('assignedTo', 'name email');
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};

// Update client
exports.updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const client = await Client.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate(
      'assignedTo',
      'name email'
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({
      message: 'Client updated successfully',
      client,
    });
  } catch (error) {
    next(error);
  }
};

// Delete client
exports.deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findByIdAndDelete(id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get client statistics
exports.getClientStats = async (req, res, next) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'active' });
    const prospectClients = await Client.countDocuments({ status: 'prospect' });
    const inactiveClients = await Client.countDocuments({ status: 'inactive' });

    const totalRevenue = await Client.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$revenue' },
        },
      },
    ]);

    res.json({
      totalClients,
      activeClients,
      prospectClients,
      inactiveClients,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
};
