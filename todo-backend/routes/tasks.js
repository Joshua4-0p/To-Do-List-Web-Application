const express = require("express");
const {
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
} = require("../controllers/taskController");
const { authenticateToken } = require("../middleware/auth");
const {
  validateTask,
  validateSubtask,
  validateObjectId,
  validateTaskQuery,
} = require("../utils/validation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for authenticated user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of tasks per page
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High]
 *         description: Filter by priority
 *       - in: query
 *         name: is_completed
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [due_date, priority, created_at]
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: due_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks due from this date
 *       - in: query
 *         name: due_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks due until this date
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalTasks:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticateToken, validateTaskQuery, getTasks);

/**
 * @swagger
 * /api/tasks/stats:
 *   get:
 *     summary: Get task statistics for authenticated user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalTasks:
 *                           type: integer
 *                         completedTasks:
 *                           type: integer
 *                         pendingTasks:
 *                           type: integer
 *                         highPriorityTasks:
 *                           type: integer
 *                         overdueTasks:
 *                           type: integer
 */
router.get("/stats", authenticateToken, getTaskStats);

/**
 * @swagger
 * /api/tasks/due-today:
 *   get:
 *     summary: Get tasks due today
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tasks due today retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     count:
 *                       type: integer
 */
router.get("/due-today", authenticateToken, getTasksDueToday);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: Complete project documentation
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Write comprehensive documentation for the todo app
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *                 default: Low
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-09-01T10:00:00Z
 *               subtasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       maxLength: 200
 *                     is_completed:
 *                       type: boolean
 *                       default: false
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", authenticateToken, validateTask, createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.get("/:id", authenticateToken, validateObjectId("id"), getTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               is_completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.put(
  "/:id",
  authenticateToken,
  validateObjectId("id"),
  validateTask,
  updateTask
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.delete("/:id", authenticateToken, validateObjectId("id"), deleteTask);

/**
 * @swagger
 * /api/tasks/{id}/subtasks:
 *   post:
 *     summary: Add a subtask to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: Review documentation
 *               is_completed:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Subtask added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.post(
  "/:id/subtasks",
  authenticateToken,
  validateObjectId("id"),
  validateSubtask,
  addSubtask
);

/**
 * @swagger
 * /api/tasks/{taskId}/subtasks/{subtaskId}:
 *   put:
 *     summary: Update a subtask
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subtask ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               is_completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Subtask updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task or subtask not found
 */
router.put(
  "/:taskId/subtasks/:subtaskId",
  authenticateToken,
  validateObjectId("taskId"),
  validateObjectId("subtaskId"),
  validateSubtask,
  updateSubtask
);

/**
 * @swagger
 * /api/tasks/{taskId}/subtasks/{subtaskId}:
 *   delete:
 *     summary: Delete a subtask
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subtask ID
 *     responses:
 *       200:
 *         description: Subtask deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task or subtask not found
 */
router.delete(
  "/:taskId/subtasks/:subtaskId",
  authenticateToken,
  validateObjectId("taskId"),
  validateObjectId("subtaskId"),
  deleteSubtask
);

/**
 * @swagger
 * /api/tasks/{id}/toggle-completion:
 *   patch:
 *     summary: Toggle task completion status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task completion status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.patch("/:id/toggle-completion", authenticateToken, toggleTaskCompletion);

/**
 * @swagger
 * /api/tasks/{taskId}/subtasks/{subtaskId}/toggle:
 *   patch:
 *     summary: Toggle subtask completion status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subtask ID
 *     responses:
 *       200:
 *         description: Subtask completion status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task or subtask not found
 */
router.patch(
  "/:taskId/subtasks/:subtaskId/toggle",
  authenticateToken,
  toggleSubtaskCompletion
);

module.exports = router;
