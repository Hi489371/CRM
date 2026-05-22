const { Task } = require('../models');

// Create task
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, category, relatedClient, relatedLead, assignedTo, tags } =
      req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = new Task({
      title,
      description,
      dueDate,
      priority: priority || 'medium',
      category: category || 'other',
      relatedClient,
      relatedLead,
      assignedTo: assignedTo || req.user.id,
      createdBy: req.user.id,
      status: 'todo',
      tags,
    });

    await task.save();
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'relatedClient', select: 'companyName' },
      { path: 'relatedLead', select: 'firstName lastName' },
    ]);

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
};

// Get all tasks
exports.getTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, assignedTo, priority, search, dueDate } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) {
      filter.status = status;
    }
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('relatedClient', 'companyName')
      .populate('relatedLead', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dueDate: 1, priority: 1 });

    const total = await Task.countDocuments(filter);

    res.json({
      data: tasks,
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

// Get single task
exports.getTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'relatedClient', select: 'companyName contactName' },
      { path: 'relatedLead', select: 'firstName lastName email' },
    ]);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// Update task
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'relatedClient', select: 'companyName' },
      { path: 'relatedLead', select: 'firstName lastName' },
    ]);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
};

// Delete task
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get task statistics
exports.getTaskStats = async (req, res, next) => {
  try {
    const totalTasks = await Task.countDocuments();
    const todoTasks = await Task.countDocuments({ status: 'todo' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const completedTasks = await Task.countDocuments({ status: 'completed' });

    const tasksByPriority = await Task.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
    });

    res.json({
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      tasksByPriority,
    });
  } catch (error) {
    next(error);
  }
};

// Get today's tasks
exports.getTodayTasks = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await Task.find({
      dueDate: {
        $gte: today,
        $lt: tomorrow,
      },
      status: { $ne: 'completed' },
    })
      .populate('assignedTo', 'name email')
      .populate('relatedClient', 'companyName')
      .populate('relatedLead', 'firstName lastName')
      .sort({ priority: 1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};
