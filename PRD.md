📘 TaskFlow – Product Requirements Document (PRD)
VERSION: 1.0
DATE: November 25, 2025
AUTHOR: Racheal Joseph
REPOSITORY: https://github.com/Racheal-stack/TaskFlow

1. 🔎 Project Overview
1.1 What is TaskFlow?
TaskFlow is a project and task management SaaS designed for individuals and teams to organize projects, manage tasks, collaborate in real time, and monitor productivity through analytics.
1.2 Goal of this PRD
This PRD provides clear product expectations for QA testers, including:
Functional requirements


Expected behaviors


Acceptance criteria


User flows


Test boundaries


Success indicators



2. 👥 User Types
User Type
Description
Permissions
Admin
Workspace owner
Full access to projects, tasks, users, settings
User
Team member
Manage assigned tasks, view project boards, limited edits


3. 🎯 Core Modules & Requirements
Each module includes:
 ✔ Feature description
 ✔ Expected behavior
 ✔ Acceptance criteria
 ✔ Edge cases

3.1 USER AUTHENTICATION & MANAGEMENT
Description
System allows registration, login, logout, email verification, password reset, and role management.
Functional Requirements
3.1.1 Registration
User enters name, email, and password.


System sends verification email with OTP or link.


User verifies and is redirected to dashboard.


Acceptance Criteria
User cannot register without valid email format


Password must meet security rules (min 6 chars)


Verification email is sent within 5 seconds


Unverified users cannot log in


After verification, account becomes “active”



3.1.2 Login
User logs in with email & password.


JWT token is generated.


User is redirected to the workspace.


Acceptance Criteria
Valid credentials → login success


Invalid credentials → error message


User receives new JWT token


Session stores user role & workspace



3.1.3 Password Reset
User requests reset link.


Link opens password reset page.


Reset completes successfully.


Acceptance Criteria
Reset email is sent


Reset link expires after 15 min


Old password cannot be reused



3.1.4 Profile Management
User updates name, photo, password.


Acceptance Criteria
Changes persist after page refresh


Upload errors handled gracefully



3.2 PROJECT MANAGEMENT
Description
Users create, edit, delete, and manage multiple projects.
Functional Requirements
3.2.1 Project CRUD
Create project (name, description, due date)


Edit project details


Delete project


View project dashboard


Acceptance Criteria
Required fields cannot be empty


Project name must be unique per workspace


Deleted project should not appear in list


Editing updates project everywhere in real time



3.2.2 Project Members
Admin invites members via email


Members accept invitation


Members are added to workspace


Acceptance Criteria
Only Admin can invite


Invitation email sent instantly


Member appears in project after accepting


Duplicate invites prevented



3.2.3 Project Analytics
Dashboard displays:
Completed tasks count


Tasks in progress


Overdue tasks


Productivity graph


Acceptance Criteria
Analytics load within 2 seconds


Graph updates when tasks change



3.3 TASK MANAGEMENT (KANBAN BOARD)
Description
Drag-and-drop task board with columns:
To Do


In Progress


Review


Done


Functional Requirements
3.3.1 Create Task
Fields: title, description, assignee, due date, priority.
Acceptance Criteria
Task appears in "To Do" by default


Assigning user sends notification


Missing required fields blocks submission



3.3.2 Edit Task
All fields editable except ID.
Acceptance Criteria
Updates reflect in real time on all clients


Change history preserved (optional)



3.3.3 Delete Task
Confirmation required


Acceptance Criteria
Task disappears from all clients in real time


Deleted tasks cannot be restored (MVP)



3.3.4 Drag & Drop
Users can move tasks between columns.
Acceptance Criteria
Drag event smooth and responsive


Task status updates instantly


Board rearranges correctly


Socket.io updates other users in real time


Edge Cases
Task cannot be dragged if lacking permissions


No jumping or duplicate rendering during drag



3.3.5 Task Filtering & Search
Filter by:
Priority


Status


Assignee


Acceptance Criteria
Search returns matching results only


Removing filters restores full list



3.4 WORKSPACE MANAGEMENT
Description
Users can belong to and switch between multiple workspaces.
Functional Requirements
3.4.1 Create Workspace
Name and logo required


Acceptance Criteria
Workspace appears on switcher


User becomes Admin of workspace



3.4.2 Switch Workspace
User changes active workspace


Acceptance Criteria
Page reloads data correctly


Correct role applied per workspace



3.4.3 Invite Members
Same logic as project invites.

3.5 REAL-TIME COLLABORATION
Description
Using Socket.io for instant updates.
Functional Requirements
Updating a task updates all connected users


Creating a project reflects instantly for all members


Notification badge count updates in real time


Acceptance Criteria
Socket reconnects automatically after network failure


Real-time events trigger within <1 second



3.6 NOTIFICATIONS & EMAILS
Functional Requirements
Email on registration


Email on password reset


In-app notifications for:


Assigned tasks


Completed tasks


Invites


Acceptance Criteria
Emails formatted correctly


Notifications appear in Inbox view


Mark as read updates badge count



3.7 FILE UPLOADS
Functional Requirements
Upload file to tasks (limit 10MB)


Supported: PDF, images, docs


Acceptance Criteria
Upload shows progress bar


Large unsupported files give error


Fully uploaded files are downloadable



3.8 UI/UX REQUIREMENTS
Functional Requirements
Mobile responsive


Light/Dark mode


Clear typography and spacing


Acceptance Criteria
No layout breaks on mobile


Theme persists after refresh



4. 🗺️ User Flows (QA Should Understand)
4.1 Registration Flow
User fills form


System sends email


User verifies


User logs in


Redirect to workspace



4.2 Create Task Flow
Click “New Task”


Enter details


Save → Task appears in “To Do”


Other users see new task instantly



4.3 Drag & Drop Flow
Grab task


Move to another column


Status updates


All users updated instantly



4.4 Workspace Switch Flow
Open switcher


Select workspace


All data reloads



5. 🔐 Non-Functional Requirements
Performance
Page should load < 3 seconds


Kanban actions < 200ms


Security
JWT tokens must be valid


Passwords hashed


File uploads sanitized


Scalability
Should support 1,000+ tasks per board


Reliability
Socket reconnect must be automatic



6. 📌 Out of Scope (MVP)
QA should not test:
Billing / Stripe (phase 2)


SSO login


Task comments


Activity logs


Offline mode



7. 🧪 QA Test Coverage Summary
Test Categories
Authentication


Project CRUD


Workspace switching


Task board & Kanban behavior


Real-time collaboration


Notifications


Permissions


UI/UX responsiveness


File uploads



8. 🐞 Known Issues
JWT stored in localStorage (not httpOnly yet)


File uploads limited


No rate limiting on login


Socket drops on very slow internet



9. 📞 Contact
Developer: Racheal Joseph
 Email: [contact-email-hidden-for-security]

