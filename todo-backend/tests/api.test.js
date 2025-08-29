const request = require("supertest");
const mongoose = require("mongoose");

// Test database
const MONGODB_TEST_URI =
  process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/todoapp_test";

process.env.MONGODB_URI = MONGODB_TEST_URI;

const app = require("../server");
const User = require("../models/User");
const Task = require("../models/Task");

describe("Todo API Tests", () => {
  let authToken;
  let userId;
  let taskId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_TEST_URI);

    // Clean test database
    await User.deleteMany({});
    await Task.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Task.deleteMany({});
    await mongoose.connection.close();
  });

  describe("Authentication", () => {
    const testUser = {
      email: "test@example.com",
      password: "TestPassword123!",
    };

    test("Should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();

      authToken = response.body.data.token;
      userId = response.body.data.user._id;
    });

    test("Should reject registration with invalid email", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "invalid-email",
        password: "TestPassword123!",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("Should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send(testUser);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test("Should reject login with invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("Should get user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    test("Should reject profile access without token", async () => {
      const response = await request(app).get("/api/auth/profile");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Tasks", () => {
    const testTask = {
      title: "Test Task",
      description: "This is a test task",
      priority: "High",
      due_date: "2025-12-31T10:00:00Z",
    };

    test("Should create a new task", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(testTask);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe(testTask.title);
      expect(response.body.data.task.priority).toBe(testTask.priority);

      taskId = response.body.data.task._id;
    });

    test("Should reject task creation without title", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          description: "Task without title",
          priority: "Medium",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("Should get all user tasks", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toBeInstanceOf(Array);
      expect(response.body.data.tasks.length).toBe(1);
    });

    test("Should get a single task", async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task._id).toBe(taskId);
    });

    test("Should return 404 for non-existent task", async () => {
      const nonExistentTaskId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tasks/${nonExistentTaskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test("Should update a task", async () => {
      const updateData = {
        title: "Updated Test Task",
        is_completed: true,
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe(updateData.title);
      expect(response.body.data.task.is_completed).toBe(true);
    });

    test("Should toggle task completion", async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/toggle-completion`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.is_completed).toBe(false); // Should toggle from true to false
    });

    test("Should delete a task", async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("Should return 404 when deleting non-existent task", async () => {
      const nonExistentTaskId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/tasks/${nonExistentTaskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Error Handling", () => {
    test("Should return 404 for non-existent API endpoint", async () => {
      const response = await request(app)
        .get("/api/non-existent-endpoint")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    test("Should return 401 for task operations without token", async () => {
      const response = await request(app).get("/api/tasks");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("Should return 500 for server errors", async () => {
      // Mock a server error by causing a database connection issue
      jest.spyOn(mongoose.Model, "find").mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Restore the original implementation
      jest.restoreAllMocks();
    });
  });
});
