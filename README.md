# Doctor Tracker

A full-stack healthcare management application for administrators to manage doctors, patient records, and healthcare analytics.

## Features

- **Secure authentication:** administrator login with HTTP-only cookie authentication.
- **Dashboard:** doctor and patient totals, doctor status summaries, patient conditions, and recent patient records.
- **Doctor management:** create, view, update, delete, search, and paginate doctor records.
- **Patient management:** create, view, update, delete, search, and paginate patient records, with doctor assignment.
- **Validation:** server-side validation and duplicate doctor email protection.
- **Security:** Helmet security headers, credentialed CORS, password hashing, and protected API routes.
- **Responsive UI:** Next.js and Tailwind CSS layout for desktop and mobile screens.

## Technology Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JSON Web Tokens and HTTP-only cookies

## Project Structure

```text
doctor-tracker/
├── backend/
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── app.js
│       └── server.js
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── dashboard/
│       │   ├── doctors/
│       │   ├── login/
│       │   └── patients/
│       └── lib/
├── screenshots/
└── README.md
```

## Prerequisites

- Node.js and npm
- MongoDB instance or MongoDB Atlas connection
- Git

## Setup

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd doctor-tracker
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `backend/.env` file using the variable names expected by the backend configuration. Set your MongoDB URI, port, frontend origin, JWT secret, and administrator credentials. Use unique secrets and never commit this file.

### 3. Start the backend

```bash
npm run dev
```

The API runs on `http://localhost:5000` when configured with the default port.

### 4. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Administrator login |
| GET | `/api/auth/me` | Check authenticated user |
| GET | `/api/health` | API health check |
| GET | `/api/dashboard` | Dashboard analytics |
| GET | `/api/doctors` | List and search doctors |
| POST | `/api/doctors` | Create a doctor |
| GET | `/api/doctors/:id` | Get a doctor |
| PATCH | `/api/doctors/:id` | Update a doctor |
| DELETE | `/api/doctors/:id` | Delete a doctor |
| GET | `/api/patients` | List and search patients |
| POST | `/api/patients` | Create a patient |
| GET | `/api/patients/:id` | Get a patient |
| PATCH | `/api/patients/:id` | Update a patient |
| DELETE | `/api/patients/:id` | Delete a patient |

Doctor and patient management routes require authentication. The frontend uses cookie credentials for API requests.

## Production Build

```bash
cd frontend
npm run build
```

## Security Notes

- Keep `.env` files, credentials, and authentication cookies out of version control.
- Use a strong, unique JWT secret and administrator password.
- Configure the allowed frontend origin for the deployment environment.
- Use HTTPS and secure cookie settings in production.
- Use fictional patient data for demonstrations and screenshots.

## Status

The frontend production build completes successfully, and the main login, dashboard, doctor management, and patient management workflows have been tested locally.
