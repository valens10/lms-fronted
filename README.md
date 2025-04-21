# 🖥️ Leave Management System - Frontend

This is the frontend of the **Leave Management System (LMS)** developed using **Angular 19**. It allows employees to manage leave applications and enables HR/admins to handle approvals and reporting. This project was built as part of a coding challenge and follows an **AI-first development approach**.

---

## 🚀 Features

- 🧑‍💼 Employee Dashboard
  - View leave balance
  - View application history & statuses
  - Apply for leave
  - Upload supporting documents

- 📝 Leave Application Form
  - Full-day or half-day selection
  - Leave type selection (Annual, Sick, Maternity, etc.)
  - Optional document upload

- ✅ Approval Workflow
  - Manager/Admin can approve/reject leave

- 📅 Team Calendar
  - View who’s on leave
  - Filter by department

- 🔔 Notifications
  - Leave submitted
  - Approved/rejected status

- 🔐 Authentication
  - Google login used as placeholder

---

## 🧰 Tech Stack

- Angular 19
- TypeScript
- Tailwind
- Google OAuth (can be swapped to Microsoft Auth in future(Production))
- Docker + Docker Compose

---

## 🛠️ Prerequisites

Ensure the following tools are installed:

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Angular CLI](https://angular.io/cli)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

---
## Locally
- npm install
- ng serve
 or using docker `docker-compose up --build -d`

## View application
- `http://localhost:4200` 
 
## 📦 Installation (Manual Dev Mode)

Clone the frontend repo:

```bash
git clone https://github.com/valens10/lms-fronted.git
cd lms-fronted
