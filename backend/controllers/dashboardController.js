const { Client, Lead, Task, User } = require('../models');

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Count statistics
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'active' });
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'new' });
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const totalUsers = await User.countDocuments({ isActive: true });

    // Revenue statistics
    const totalRevenue = await Client.aggregate([
      { $group: { _id: null, total: { $sum: '$revenue' } } },
    ]);

    const totalLeadValue = await Lead.aggregate([
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);

    // Recent activities
    const recentClients = await Client.find().sort({ createdAt: -1 }).limit(5).populate('assignedTo', 'name');

    const recentLeads = await Lead.find().sort({ createdAt: -1 }).limit(5).populate('assignedTo', 'name');

    // Task statistics
    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const leadsByStatus = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
    });

    res.json({
      overview: {
        totalClients,
        activeClients,
        totalLeads,
        newLeads,
        totalTasks,
        completedTasks,
        totalUsers,
        overdueTasks,
      },
      revenue: {
        totalClientRevenue: totalRevenue[0]?.total || 0,
        totalLeadValue: totalLeadValue[0]?.total || 0,
      },
      recentClients,
      recentLeads,
      tasksByStatus,
      leadsByStatus,
    });
  } catch (error) {
    next(error);
  }
};

// Get user dashboard (personalized)
exports.getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's assigned items
    const myClients = await Client.countDocuments({ assignedTo: userId });
    const myLeads = await Lead.countDocuments({ assignedTo: userId });
    const myTasks = await Task.countDocuments({ assignedTo: userId });
    const myCompletedTasks = await Task.countDocuments({ assignedTo: userId, status: 'completed' });

    // My tasks by status
    const myTasksByStatus = await Task.aggregate([
      { $match: { assignedTo: require('mongoose').Types.ObjectId(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // My leads by status
    const myLeadsByStatus = await Lead.aggregate([
      { $match: { assignedTo: require('mongoose').Types.ObjectId(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // My overdue tasks
    const myOverdueTasks = await Task.find({
      assignedTo: userId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
    })
      .populate('relatedClient', 'companyName')
      .populate('relatedLead', 'firstName lastName')
      .sort({ dueDate: 1 });

    // My today tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const myTodayTasks = await Task.find({
      assignedTo: userId,
      dueDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'completed' },
    })
      .populate('relatedClient', 'companyName')
      .populate('relatedLead', 'firstName lastName')
      .sort({ priority: 1 });

    res.json({
      summary: {
        myClients,
        myLeads,
        myTasks,
        myCompletedTasks,
      },
      myTasksByStatus,
      myLeadsByStatus,
      myOverdueTasks,
      myTodayTasks,
    });
  } catch (error) {
    next(error);
  }
};

// Get reports
exports.getReports = async (req, res, next) => {
  try {
    // Client conversion rate
    const clientsCreatedThisMonth = await Client.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(),
      },
    });

    // Lead conversion rate
    const leadsCreatedThisMonth = await Lead.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(),
      },
    });

    const convertedLeads = await Lead.countDocuments({
      status: 'converted',
      updatedAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(),
      },
    });

    // Task completion rate
    const tasksCreatedThisMonth = await Task.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(),
      },
    });

    const completedThisMonth = await Task.countDocuments({
      status: 'completed',
      completedDate: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(),
      },
    });

    // Top performers
    const topPerformers = await Lead.aggregate([
      { $match: { status: 'converted' } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
    ]);

    res.json({
      thisMonth: {
        clientsCreated: clientsCreatedThisMonth,
        leadsCreated: leadsCreatedThisMonth,
        leadsConverted: convertedLeads,
        conversionRate: leadsCreatedThisMonth > 0 ? ((convertedLeads / leadsCreatedThisMonth) * 100).toFixed(2) : 0,
        tasksCreated: tasksCreatedThisMonth,
        tasksCompleted: completedThisMonth,
        completionRate: tasksCreatedThisMonth > 0 ? ((completedThisMonth / tasksCreatedThisMonth) * 100).toFixed(2) : 0,
      },
      topPerformers,
    });
  } catch (error) {
    next(error);
  }
};
