const nodemailer = require("nodemailer");
const cron = require("node-cron");
const Task = require("../models/Task");

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send email notification
 */
const sendEmailNotification = async (to, subject, html) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Todo App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate HTML template for task reminder
 */
const generateTaskReminderHTML = (task, userEmail) => {
  const dueDate = new Date(task.due_date).toLocaleString();
  const priorityColor = {
    High: "#ef4444",
    Medium: "#f59e0b",
    Low: "#10b981",
  }[task.priority];

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .task-card { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid ${priorityColor}; }
            .priority-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: white; background: ${priorityColor}; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Task Reminder</h1>
                <p>You have a task due soon!</p>
            </div>
            
            <div class="content">
                <div class="task-card">
                    <h2>${task.title}</h2>
                    ${
                      task.description
                        ? `<p><strong>Description:</strong> ${task.description}</p>`
                        : ""
                    }
                    <p><strong>Due Date:</strong> ${dueDate}</p>
                    <p><strong>Priority:</strong> <span class="priority-badge">${
                      task.priority
                    }</span></p>
                    ${
                      task.subtasks.length > 0
                        ? `
                        <div>
                            <strong>Subtasks:</strong>
                            <ul>
                                ${task.subtasks
                                  .map(
                                    (subtask) =>
                                      `<li>${
                                        subtask.is_completed ? "✅" : "⏳"
                                      } ${subtask.title}</li>`
                                  )
                                  .join("")}
                            </ul>
                        </div>
                    `
                        : ""
                    }
                </div>
                
                <p>Don't forget to complete your task on time!</p>
                <a href="${
                  process.env.CLIENT_URL
                }/dashboard" class="btn">View in Todo App</a>
            </div>
            
            <div class="footer">
                <p>This is an automated reminder from your Todo App.</p>
                <p>If you no longer wish to receive these notifications, you can disable them in your settings.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Check for tasks due soon and send notifications
 */
const checkAndSendNotifications = async () => {
  try {
    console.log("🔔 Checking for tasks due soon...");

    // Find tasks due within the next 24 hours that haven't been notified
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasksDueSoon = await Task.find({
      due_date: {
        $gte: now,
        $lte: tomorrow,
      },
      is_completed: false,
      notification_sent: false,
    }).populate("user_id", "email");

    console.log(`Found ${tasksDueSoon.length} tasks due soon`);

    for (const task of tasksDueSoon) {
      if (task.user_id && task.user_id.email) {
        const subject = `📋 Reminder: "${task.title}" is due soon`;
        const html = generateTaskReminderHTML(task, task.user_id.email);

        const result = await sendEmailNotification(
          task.user_id.email,
          subject,
          html
        );

        if (result.success) {
          // Mark notification as sent
          task.notification_sent = true;
          await task.save();
          console.log(`✅ Notification sent for task: ${task.title}`);
        } else {
          console.error(
            `❌ Failed to send notification for task: ${task.title}`
          );
        }
      }
    }
  } catch (error) {
    // console.error("Error in notification check:", error);
  }
};

/**
 * Initialize notification cron job
 * Runs every hour to check for upcoming tasks
 */
const initializeNotificationService = () => {
  if (process.env.NODE_ENV === "production") {
    // Run every hour in production
    cron.schedule("0 * * * *", checkAndSendNotifications);
    console.log("📧 Notification service initialized - checking every hour");
  } else {
    // Run every 5 minutes in development for testing
    cron.schedule("*/5 * * * *", checkAndSendNotifications);
    console.log(
      "📧 Notification service initialized - checking every 5 minutes (dev mode)"
    );
  }
};

/**
 * Manually trigger notification check (for testing)
 */
const triggerNotificationCheck = async () => {
  console.log("🔔 Manually triggering notification check...");
  await checkAndSendNotifications();
};

/**
 * Send test email
 */
const sendTestEmail = async (email) => {
  const subject = "Todo App - Email Configuration Test";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px;">
        <h2>📧 Email Configuration Test</h2>
        <p>Your email notifications are working correctly!</p>
      </div>
      <div style="background: #f9fafb; padding: 20px; margin-top: 20px; border-radius: 8px;">
        <p>This is a test email to confirm that your Todo App notification system is properly configured.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p>You will receive task reminders at this email address when tasks are due soon.</p>
      </div>
    </div>
  `;

  return await sendEmailNotification(email, subject, html);
};

module.exports = {
  sendEmailNotification,
  generateTaskReminderHTML,
  checkAndSendNotifications,
  initializeNotificationService,
  triggerNotificationCheck,
  sendTestEmail,
};
