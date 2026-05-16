'use strict';

/**
 * Seed script — creates a demo project that showcases all app features.
 * Requires the test users to already exist (run seed-test-users.js first).
 *
 * Run from backend/:
 *   node scripts/seed-demo-project.js
 *
 * Safe to re-run — skips if the demo project already exists.
 */

require('dotenv').config();
const sequelize = require('../models/index');
const createMigrationRunner = require('../migrations/runner');
const User = require('../models/User');
const { Project, ProjectMembers } = require('../models/Project');
const Task = require('../models/Task');
const { ActivityLog, Comment } = require('../models/Extras');

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function findUser(email) {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error(`User ${email} not found — run seed-test-users.js first`);
  return user;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  await sequelize.authenticate();
  console.log('Database connected.');

  const umzug = createMigrationRunner(sequelize);
  await umzug.up();
  console.log('Migrations applied.');

  // ── 1. Resolve users ──────────────────────────────────────────────────────
  const admin  = await findUser('admin@test.com');
  const member = await findUser('member@test.com');

  // ── 2. Create project (idempotent) ────────────────────────────────────────
  const DEMO_NAME = '🚀 Team Task Manager — Feature Showcase';
  const existing = await Project.findOne({ where: { name: DEMO_NAME } });
  if (existing) {
    console.log(`  [skip] Demo project already exists (id=${existing._id})`);
    await sequelize.close();
    return;
  }

  const project = await Project.create({
    name: DEMO_NAME,
    description:
      'This demo project walks through every feature of the app: ' +
      'task statuses, labels, milestones, due dates, assignees, comments, and activity logs. ' +
      'Use it to explore the UI or as a reference for your own projects.',
    createdBy: admin._id,
  });
  console.log(`  [created] Project "${project.name}" (id=${project._id})`);

  // ── 3. Add both users as members ──────────────────────────────────────────
  await ProjectMembers.bulkCreate([
    { projectId: project._id, userId: admin._id },
    { projectId: project._id, userId: member._id },
  ]);
  console.log('  [members] admin + member added to project');

  // ── 4. Create tasks ───────────────────────────────────────────────────────
  const taskDefs = [
    // ── Milestone: Onboarding ──────────────────────────────────────────────
    {
      title: '👋 Welcome — read this first',
      description:
        'This project is a live demo of the Team Task Manager.\n\n' +
        '**What you can do here:**\n' +
        '- Drag tasks between columns on the Kanban board\n' +
        '- Click any task to edit its title, description, labels, due date, and assignee\n' +
        '- Add comments to collaborate with teammates\n' +
        '- Upload file attachments (images, PDFs, docs)\n' +
        '- Watch the Activity Log update in real-time\n\n' +
        'Feel free to edit, move, or delete anything in this project.',
      status: 'done',
      assignedTo: admin._id,
      dueDate: daysFromNow(-5),
      labels: JSON.stringify(['onboarding', 'docs']),
      milestone: 'Onboarding',
    },
    {
      title: '🔐 Log in as both users to see role differences',
      description:
        'The app has two roles:\n\n' +
        '**Admin** (`admin@test.com` / `Admin1234!`)\n' +
        '- Can create and delete projects\n' +
        '- Can create and delete tasks\n' +
        '- Can add / remove team members\n' +
        '- Sees all projects and all activity\n\n' +
        '**Member** (`member@test.com` / `Member1234!`)\n' +
        '- Can view and update tasks in projects they belong to\n' +
        '- Can add comments and attachments\n' +
        '- Cannot create projects or manage team members',
      status: 'done',
      assignedTo: member._id,
      dueDate: daysFromNow(-3),
      labels: JSON.stringify(['onboarding', 'auth']),
      milestone: 'Onboarding',
    },

    // ── Milestone: Task Management ─────────────────────────────────────────
    {
      title: '📋 Create a task with all fields filled in',
      description:
        'Try creating a new task using the "+ New Task" button.\n\n' +
        'Fields you can set:\n' +
        '- **Title** — required, up to 200 characters\n' +
        '- **Description** — markdown-friendly text area\n' +
        '- **Status** — todo / in-progress / done\n' +
        '- **Assignee** — any team member\n' +
        '- **Due date** — ISO date picker\n' +
        '- **Labels** — comma-separated tags (e.g. `bug, urgent`)\n' +
        '- **Milestone** — group tasks into phases',
      status: 'in-progress',
      assignedTo: admin._id,
      dueDate: daysFromNow(2),
      labels: JSON.stringify(['feature', 'tasks']),
      milestone: 'Task Management',
    },
    {
      title: '🗂️ Move this card across the Kanban board',
      description:
        'The Task Board view (`/tasks`) shows tasks in three columns:\n\n' +
        '1. **To Do** — not started\n' +
        '2. **In Progress** — actively being worked on\n' +
        '3. **Done** — completed\n\n' +
        'Drag this card to "Done" to mark it complete, or use the status dropdown inside the task detail.',
      status: 'todo',
      assignedTo: member._id,
      dueDate: daysFromNow(4),
      labels: JSON.stringify(['kanban', 'ui']),
      milestone: 'Task Management',
    },
    {
      title: '🏷️ Filter tasks by label',
      description:
        'Labels let you tag tasks with custom categories like `bug`, `feature`, `urgent`, or `blocked`.\n\n' +
        'This task has the labels: `labels`, `filtering`.\n\n' +
        'Use the label filter on the Task Board to narrow down what you see.',
      status: 'todo',
      assignedTo: null,
      dueDate: daysFromNow(6),
      labels: JSON.stringify(['labels', 'filtering']),
      milestone: 'Task Management',
    },
    {
      title: '⏰ Overdue task — notice the red due date',
      description:
        'This task has a due date in the past to demonstrate how overdue tasks are highlighted in the UI.\n\n' +
        'Overdue tasks show their due date in red so nothing slips through the cracks.',
      status: 'in-progress',
      assignedTo: member._id,
      dueDate: daysFromNow(-2),
      labels: JSON.stringify(['overdue', 'demo']),
      milestone: 'Task Management',
    },

    // ── Milestone: Collaboration ───────────────────────────────────────────
    {
      title: '💬 Add a comment to this task',
      description:
        'Open this task and scroll to the Comments section at the bottom.\n\n' +
        'Type a message and hit "Add Comment". Comments are timestamped and attributed to the logged-in user.\n\n' +
        'Both admins and members can comment on any task in their projects.',
      status: 'todo',
      assignedTo: member._id,
      dueDate: daysFromNow(7),
      labels: JSON.stringify(['comments', 'collaboration']),
      milestone: 'Collaboration',
    },
    {
      title: '📎 Upload a file attachment',
      description:
        'Open any task and use the attachment upload button to attach a file.\n\n' +
        '**Supported formats:** JPEG, PNG, GIF, WebP, PDF, Word (.doc/.docx), plain text\n' +
        '**Max size:** 5 MB per file\n\n' +
        'Uploaded files are stored securely on the server and served through an authenticated endpoint.',
      status: 'todo',
      assignedTo: admin._id,
      dueDate: daysFromNow(8),
      labels: JSON.stringify(['attachments', 'files']),
      milestone: 'Collaboration',
    },

    // ── Milestone: Admin Features ──────────────────────────────────────────
    {
      title: '👥 Add a new team member from the Team page',
      description:
        'Navigate to the **Team** page and click "Add Member" (admin only).\n\n' +
        'Fill in name, email, password, and role. The new user can immediately log in.\n\n' +
        'You can also promote an existing member to admin or delete a member from this page.',
      status: 'todo',
      assignedTo: admin._id,
      dueDate: daysFromNow(3),
      labels: JSON.stringify(['admin', 'team']),
      milestone: 'Admin Features',
    },
    {
      title: '📊 Check the Dashboard for project stats',
      description:
        'The **Dashboard** gives a bird\'s-eye view of the whole workspace:\n\n' +
        '- Total tasks, completed tasks, and in-progress tasks\n' +
        '- Per-project task breakdown\n' +
        '- Recent activity feed\n\n' +
        'Admins see stats across all projects; members see only their own projects.',
      status: 'done',
      assignedTo: admin._id,
      dueDate: daysFromNow(-1),
      labels: JSON.stringify(['admin', 'dashboard']),
      milestone: 'Admin Features',
    },

    // ── Milestone: Real-time ───────────────────────────────────────────────
    {
      title: '⚡ Watch real-time updates via WebSocket',
      description:
        'Open this app in two browser tabs (or two different browsers) logged in as different users.\n\n' +
        'When one user moves a task or adds a comment, the other user\'s view updates automatically — no refresh needed.\n\n' +
        'This is powered by **Socket.IO** on the backend.',
      status: 'todo',
      assignedTo: null,
      dueDate: daysFromNow(10),
      labels: JSON.stringify(['realtime', 'websocket']),
      milestone: 'Real-time',
    },
  ];

  const createdTasks = [];
  for (const def of taskDefs) {
    const task = await Task.create({ ...def, projectId: project._id });
    createdTasks.push(task);
    console.log(`  [task] "${task.title.substring(0, 50)}..." (${task.status})`);
  }

  // ── 5. Add seed comments ──────────────────────────────────────────────────
  // Comment on the "welcome" task
  await Comment.create({
    text: 'Welcome to the demo project! Feel free to explore every feature here.',
    userId: admin._id,
    taskId: createdTasks[0]._id,
  });
  await Comment.create({
    text: 'Thanks! I\'ll start by checking out the Kanban board.',
    userId: member._id,
    taskId: createdTasks[0]._id,
  });

  // Comment on the overdue task
  await Comment.create({
    text: 'This task is overdue — notice the red due date badge on the card.',
    userId: admin._id,
    taskId: createdTasks[5]._id,
  });

  console.log('  [comments] seed comments added');

  // ── 6. Seed activity logs ─────────────────────────────────────────────────
  const activityEntries = [
    { action: 'Project Created',  details: `Project "${DEMO_NAME}" created`,                    userId: admin._id,  taskId: null },
    { action: 'Task Created',     details: `Task "Welcome — read this first" created`,           userId: admin._id,  taskId: createdTasks[0]._id },
    { action: 'Status Changed',   details: 'Task status changed from todo to done',              userId: admin._id,  taskId: createdTasks[0]._id },
    { action: 'Task Created',     details: `Task "Log in as both users..." created`,             userId: admin._id,  taskId: createdTasks[1]._id },
    { action: 'Status Changed',   details: 'Task status changed from todo to done',              userId: member._id, taskId: createdTasks[1]._id },
    { action: 'Task Created',     details: `Task "Create a task with all fields filled in" created`, userId: admin._id, taskId: createdTasks[2]._id },
    { action: 'Status Changed',   details: 'Task status changed from todo to in-progress',      userId: admin._id,  taskId: createdTasks[2]._id },
    { action: 'Comment Added',    details: 'Added a comment',                                   userId: admin._id,  taskId: createdTasks[0]._id },
    { action: 'Comment Added',    details: 'Added a comment',                                   userId: member._id, taskId: createdTasks[0]._id },
    { action: 'Comment Added',    details: 'Added a comment',                                   userId: admin._id,  taskId: createdTasks[5]._id },
  ];

  await ActivityLog.bulkCreate(activityEntries);
  console.log('  [activity] seed activity logs added');

  // ── 7. Summary ────────────────────────────────────────────────────────────
  console.log('\n✅ Demo project seeded successfully!');
  console.log(`   Project : "${DEMO_NAME}"`);
  console.log(`   Tasks   : ${createdTasks.length}`);
  console.log(`   Members : admin@test.com, member@test.com`);
  console.log('\n   Log in at http://localhost:5173 (or your frontend URL)');
  console.log('   Admin  — admin@test.com  / Admin1234!');
  console.log('   Member — member@test.com / Member1234!');

  await sequelize.close();
}

seed().catch(err => {
  console.error('Demo seed failed:', err.message);
  process.exit(1);
});
