const Task = require("../models/Task");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @desc    Get all tasks for the authenticated user
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    priority,
    is_completed,
    sort_by,
    sort_order = "desc",
    due_date_from,
    due_date_to,
    search,
  } = req.query;

  const filters = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort_by,
    sort_order,
  };

  // Add filters if provided
  if (priority) filters.priority = priority;
  if (is_completed !== undefined)
    filters.is_completed = is_completed === "true";
  if (due_date_from) filters.due_date_from = due_date_from;
  if (due_date_to) filters.due_date_to = due_date_to;
  if (search) filters.search = search;

  // Get tasks with filters
  const tasks = await Task.findByUserWithFilters(req.user.userId, filters);

  // Get total count for pagination
  const totalTasks = await Task.countDocuments({ user_id: req.user.userId });
  const totalPages = Math.ceil(totalTasks / filters.limit);

  res.json({
    success: true,
    data: {
      tasks,
      pagination: {
        currentPage: filters.page,
        totalPages,
        totalTasks,
        hasNextPage: filters.page < totalPages,
        hasPrevPage: filters.page > 1,
      },
    },
  });
});

/**
 * @desc    Get a single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user_id: req.user.userId,
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  res.json({
    success: true,
    data: {
      task,
    },
  });
});

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    priority = "Low",
    due_date,
    subtasks = [],
  } = req.body;

  const task = await Task.create({
    user_id: req.user.userId,
    title,
    description,
    priority,
    due_date,
    subtasks,
  });

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: {
      task,
    },
  });
});

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
  const { title, description, priority, due_date, is_completed } = req.body;

  let task = await Task.findOne({
    _id: req.params.id,
    user_id: req.user.userId,
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Update fields if provided
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (due_date !== undefined) task.due_date = due_date;
  if (is_completed !== undefined) task.is_completed = is_completed;

  await task.save();

  res.json({
    success: true,
    message: "Task updated successfully",
    data: {
      task,
    },
  });
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user_id: req.user.userId,
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  await Task.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Task deleted successfully",
  });
});

/**
 * @desc    Add a subtask to a task
 * @route   POST /api/tasks/:id/subtasks
 * @access  Private
 */
const addSubtask = asyncHandler(async (req, res) => {
  const { title, is_completed = false } = req.body;

  const task = await Task.findOne({
    _id: req.params.id,
    user_id: req.user.userId,
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  await task.addSubtask({ title, is_completed });

  res.status(201).json({
    success: true,
    message: "Subtask added successfully",
    data: {
      task,
    },
  });
});

/**
 * @desc    Update a subtask
 * @route   PUT /api/tasks/:taskId/subtasks/:subtaskId
 * @access  Private
 */
const updateSubtask = asyncHandler(async (req, res) => {
  const { title, is_completed } = req.body;
  const { taskId, subtaskId } = req.params;

  const task = await Task.findOne({
    _id: taskId,
    user_id: req.user.userId,
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (is_completed !== undefined) updateData.is_completed = is_completed;

    await task.updateSubtask(subtaskId, updateData);

    res.json({
      success: true,
      message: "Subtask updated successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    if (error.message === "Subtask not found") {
      return res.status(404).json({
        success: false,
        message: "Subtask not found",
      });
    }
    throw error;
  }
});

/**
 * @desc    Delete a subtask
 * @route   DELETE /api/tasks/:taskId/subtasks/:subtaskId
 * @access  Private
 */
const deleteSubtask = asyncHandler(async (req, res) => {
  const { taskId, subtaskId } = req.params;

  const task = await Task.findOne({
    _id: taskId,
    user_id: req.user.userId,
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  const subtaskExists = task.subtasks.id(subtaskId);
  if (!subtaskExists) {
    return res.status(404).json({
      success: false,
      message: "Subtask not found",
    });
  }

  await task.removeSubtask(subtaskId);

  res.json({
    success: true,
    message: "Subtask deleted successfully",
    data: {
      task,
    },
  });
});

/**
 * @desc    Get task statistics for the user
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getTaskStats = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const stats = await Task.aggregate([
    { $match: { user_id: userId } },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$is_completed", true] }, 1, 0] },
        },
        pendingTasks: {
          $sum: { $cond: [{ $eq: ["$is_completed", false] }, 1, 0] },
        },
        highPriorityTasks: {
          $sum: { $cond: [{ $eq: ["$priority", "High"] }, 1, 0] },
        },
        overdueTasks: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ["$due_date", new Date()] },
                  { $eq: ["$is_completed", false] },
                  { $ne: ["$due_date", null] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    highPriorityTasks: 0,
    overdueTasks: 0,
  };

  res.json({
    success: true,
    data: {
      stats: result,
    },
  });
});

/**
 * @desc    Get tasks due today
 * @route   GET /api/tasks/due-today
 * @access  Private
 */
const getTasksDueToday = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasksDueToday = await Task.find({
    user_id: req.user.userId,
    due_date: {
      $gte: today,
      $lt: tomorrow,
    },
    is_completed: false,
  }).sort({ due_date: 1 });

  res.json({
    success: true,
    data: {
      tasks: tasksDueToday,
      count: tasksDueToday.length,
    },
  });
});

/**
 * @desc    Toggle task completion status
 * @route   PATCH /api/tasks/:id/toggle-completion
 * @access  Private
 */
const toggleTaskCompletion = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user_id: req.user.userId,
  });
  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }
  task.is_completed = !task.is_completed;
  await task.save();
  res.json({
    success: true,
    data: { task },
  });
});

/**
 * @desc    Toggle subtask completion status
 * @route   PATCH /api/tasks/:taskId/subtasks/:subtaskId/toggle
 * @access  Private
 */
const toggleSubtaskCompletion = asyncHandler(async (req, res) => {
  const { taskId, subtaskId } = req.params;

  const task = await Task.findOne({
    _id: taskId,
    user_id: req.user.userId,
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  const subtask = task.subtasks.id(subtaskId);
  if (!subtask) {
    return res.status(404).json({
      success: false,
      message: "Subtask not found",
    });
  }

  subtask.is_completed = !subtask.is_completed;
  await task.save();

  res.json({
    success: true,
    message: "Subtask completion status toggled successfully",
    data: { task },
  });
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  getTaskStats,
  getTasksDueToday,
  toggleTaskCompletion,
  toggleSubtaskCompletion,
};
