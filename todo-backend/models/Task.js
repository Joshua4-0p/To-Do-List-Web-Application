const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Subtask:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the subtask
 *         title:
 *           type: string
 *           description: The subtask title
 *         is_completed:
 *           type: boolean
 *           default: false
 *           description: Whether the subtask is completed
 *       example:
 *         _id: 507f1f77bcf86cd799439012
 *         title: "Review code"
 *         is_completed: false
 *
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - user_id
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the task
 *         user_id:
 *           type: string
 *           description: The id of the user who owns this task
 *         title:
 *           type: string
 *           description: The task title
 *         description:
 *           type: string
 *           description: The task description
 *         is_completed:
 *           type: boolean
 *           default: false
 *           description: Whether the task is completed
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High]
 *           default: Low
 *           description: The task priority level
 *         due_date:
 *           type: string
 *           format: date-time
 *           description: The task due date
 *         subtasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Subtask'
 *           description: Array of subtasks
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the task was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the task was last updated
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         user_id: 507f1f77bcf86cd799439010
 *         title: "Complete project documentation"
 *         description: "Write comprehensive documentation for the project"
 *         is_completed: false
 *         priority: "High"
 *         due_date: "2025-09-01T10:00:00.000Z"
 *         subtasks: []
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *         updatedAt: "2023-01-01T00:00:00.000Z"
 */

// Subtask schema
const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Subtask title is required"],
      trim: true,
      maxlength: [200, "Subtask title cannot exceed 200 characters"],
    },
    is_completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Main task schema
const taskSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true, // Index for fast user-specific queries
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Task title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Task description cannot exceed 1000 characters"],
    },
    is_completed: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High"],
        message: "Priority must be Low, Medium, or High",
      },
      default: "Low",
    },
    due_date: {
      type: Date,
      validate: {
        validator: function (value) {
          // Due date cannot be in the past (only for new tasks)
          if (this.isNew && value && value < new Date()) {
            return false;
          }
          return true;
        },
        message: "Due date cannot be in the past",
      },
    },
    subtasks: [subtaskSchema],
    notification_sent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
taskSchema.index({ user_id: 1, createdAt: -1 });
taskSchema.index({ user_id: 1, priority: 1 });
taskSchema.index({ user_id: 1, due_date: 1 });
taskSchema.index({ user_id: 1, is_completed: 1 });

// Virtual for overdue tasks
taskSchema.virtual("isOverdue").get(function () {
  return this.due_date && this.due_date < new Date() && !this.is_completed;
});

// Virtual for completed subtasks count
taskSchema.virtual("completedSubtasksCount").get(function () {
  return this.subtasks.filter((subtask) => subtask.is_completed).length;
});

// Virtual for total subtasks count
taskSchema.virtual("totalSubtasksCount").get(function () {
  return this.subtasks.length;
});

// Instance method to add a subtask
taskSchema.methods.addSubtask = function (subtaskData) {
  this.subtasks.push(subtaskData);
  return this.save();
};

// Instance method to update a subtask
taskSchema.methods.updateSubtask = function (subtaskId, updateData) {
  const subtask = this.subtasks.id(subtaskId);
  if (!subtask) {
    throw new Error("Subtask not found");
  }

  Object.keys(updateData).forEach((key) => {
    subtask[key] = updateData[key];
  });

  return this.save();
};

// Instance method to remove a subtask
taskSchema.methods.removeSubtask = function (subtaskId) {
  this.subtasks.pull(subtaskId);
  return this.save();
};

// Static method to find tasks by user with filters
taskSchema.statics.findByUserWithFilters = function (userId, filters = {}) {
  const query = { user_id: userId };

  // Filter by completion status
  if (filters.is_completed !== undefined) {
    query.is_completed = filters.is_completed;
  }

  // Filter by priority
  if (filters.priority) {
    query.priority = filters.priority;
  }

  // Filter by due date range
  if (filters.due_date_from || filters.due_date_to) {
    query.due_date = {};
    if (filters.due_date_from) {
      query.due_date.$gte = new Date(filters.due_date_from);
    }
    if (filters.due_date_to) {
      query.due_date.$lte = new Date(filters.due_date_to);
    }
  }

  // Search in title and description
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } },
    ];
  }

  let queryBuilder = this.find(query);

  // Sorting
  if (filters.sort_by) {
    const sortOptions = {};
    switch (filters.sort_by) {
      case "due_date":
        sortOptions.due_date = filters.sort_order === "desc" ? -1 : 1;
        break;
      case "priority":
        // Custom priority sorting: High > Medium > Low
        sortOptions.priority = filters.sort_order === "desc" ? -1 : 1;
        break;
      case "created_at":
        sortOptions.createdAt = filters.sort_order === "desc" ? -1 : 1;
        break;
      default:
        sortOptions.createdAt = -1; // Default sort by newest first
    }
    queryBuilder = queryBuilder.sort(sortOptions);
  } else {
    queryBuilder = queryBuilder.sort({ createdAt: -1 });
  }

  // Pagination
  if (filters.page && filters.limit) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).limit(limit);
  }

  return queryBuilder;
};

// Static method to find overdue tasks for notifications
taskSchema.statics.findOverdueTasks = function () {
  return this.find({
    due_date: { $lt: new Date() },
    is_completed: false,
    notification_sent: false,
  }).populate("user_id", "email");
};

// Pre-save middleware to update completion status based on subtasks
taskSchema.pre("save", function (next) {
  if (this.subtasks.length > 0) {
    const completedSubtasks = this.subtasks.filter(
      (subtask) => subtask.is_completed
    ).length;
    // If all subtasks are completed, mark the main task as completed
    if (completedSubtasks === this.subtasks.length) {
      this.is_completed = true;
    }
  }
  next();
});

module.exports = mongoose.model("Task", taskSchema);
