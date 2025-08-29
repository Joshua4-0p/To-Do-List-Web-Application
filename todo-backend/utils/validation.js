const { body, param, query, validationResult } = require("express-validator");

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * User registration validation rules
 */
const validateRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  handleValidationErrors,
];

/**
 * User login validation rules
 */
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

/**
 * Task creation/update validation rules
 */
const validateTask = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Task title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Task description cannot exceed 1000 characters"),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
  body("due_date")
    .optional()
    .isISO8601()
    .toDate()
    .custom((value, { req }) => {
      if (value && new Date(value) < new Date()) {
        throw new Error("Due date cannot be in the past");
      }
      return true;
    }),
  body("subtasks")
    .optional()
    .isArray()
    .withMessage("Subtasks must be an array"),
  body("subtasks.*.title")
    .if(body("subtasks").exists())
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Subtask title must be between 1 and 200 characters"),
  body("subtasks.*.is_completed")
    .if(body("subtasks").exists())
    .optional()
    .isBoolean()
    .withMessage("Subtask completion status must be a boolean"),
  handleValidationErrors,
];

/**
 * Subtask validation rules
 */
const validateSubtask = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Subtask title must be between 1 and 200 characters"),
  body("is_completed")
    .optional()
    .isBoolean()
    .withMessage("Completion status must be a boolean"),
  handleValidationErrors,
];

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (field) => [
  param(field).isMongoId().withMessage(`Invalid ${field} format`),
  handleValidationErrors,
];

/**
 * Query parameter validation for task filtering
 */
const validateTaskQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
  query("is_completed")
    .optional()
    .isBoolean()
    .withMessage("is_completed must be a boolean"),
  query("sort_by")
    .optional()
    .isIn(["due_date", "priority", "created_at"])
    .withMessage("sort_by must be due_date, priority, or created_at"),
  query("sort_order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sort_order must be asc or desc"),
  query("due_date_from")
    .optional()
    .isISO8601()
    .withMessage("due_date_from must be a valid date"),
  query("due_date_to")
    .optional()
    .isISO8601()
    .withMessage("due_date_to must be a valid date"),
  query("search")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),
  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateTask,
  validateSubtask,
  validateObjectId,
  validateTaskQuery,
  handleValidationErrors,
};
