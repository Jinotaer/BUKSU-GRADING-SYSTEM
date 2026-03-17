# 🎓 Buksu Grading System

A comprehensive full-stack grading management system designed for Bukidnon State University. This platform streamlines grade management, student consultations, activity tracking, and academic monitoring with robust security features and seamless Google integration.

## Bug ID Comment Index

bug id | file name | code #
---|---|---
D001 | frontend/src/component/admin/ui/users/SearchAndFilters.jsx | 11
D010 | frontend/src/component/admin/instructorManagement.jsx | 94
D015 | frontend/src/component/studentRegister.jsx | 98
D016 | frontend/src/component/instructor/ui/grades/PageHeader.jsx | 32
D019 | frontend/.env | 3
D050 | backend/controller/adminController.js | 185
D055 | frontend/src/component/admin/semesterManagement.jsx | 29
D067 | backend/controller/semesterController.js | 200
D069 | backend/models/sections.js | 21
D069 | backend/controller/sectionController.js | 917

## 🚀 Tech Stack

### 🖥️ Frontend
- **Vite + React** — modern, fast development setup
- **React Router DOM** — for page routing
- **Tailwind CSS** — for utility-first styling
- **Axios** — for API requests
- **React Icons** — for icons
- **React Big Calendar** — for calendar views
- **Recharts** — for data visualization
- **Google OAuth** (@react-oauth/google) — for Google authentication
- **React Google reCAPTCHA** — for bot protection
- **date-fns & Moment.js** — for date manipulation

### ⚙️ Backend
- **Node.js + Express** — scalable backend architecture
- **MongoDB + Mongoose** — NoSQL database and ODM
- **JWT (jsonwebtoken)** — for authentication
- **bcrypt & bcryptjs** — for password hashing
- **Passport.js + Google OAuth 2.0** — for authentication strategies
- **Helmet** — for security headers
- **CORS** — for cross-origin resource sharing
- **Express Rate Limit** — for request limiting
- **Winston** — for logging with daily rotation
- **Nodemailer** — for email notifications
- **Google APIs (googleapis)** — for Google Calendar and Sheets integration
- **PDFKit** — for PDF generation
- **Express Session** — for session management
- **dotenv** — for environment configuration

## ⚙️ Project Setup Guide

This section will help you set up the project locally for development.

### 🧩 Prerequisites

Make sure you have these installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)

### 🗂️ Folder Structure

```
buksu-grading-system/
├── backend/                    # Backend (Node + Express)
│   ├── config/                 # Configuration files (DB, Passport, Helmet, Logger)
│   ├── controller/             # Request handlers
│   ├── middleware/             # Custom middleware (Auth, Audit, Rate limiting)
│   ├── models/                 # Mongoose models
│   ├── routes/                 # API routes
│   ├── services/               # Business logic & external services
│   ├── utils/                  # Utility functions
│   ├── docs/                   # Documentation
│   ├── server.js               # Entry point
│   └── package.json
│
├── frontend/                   # Frontend (Vite + React)
│   ├── src/
│   │   ├── component/          # React components
│   │   ├── hooks/              # Custom hooks
│   │   ├── utils/              # Utility functions
│   │   ├── assets/             # Static assets
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── BUKSU_Database_Schema.md    # Database schema documentation
├── TEST_CASES.md               # Test cases documentation
└── README.md
```

## ⚡ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone <your-repository-url>
cd Buksu-Grading-System
```

### 2️⃣ Setup and Run the Backend

Open the project directory in terminal:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/buksu_grading

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Bcrypt
BCRYPT_SALT=10

# Server
PORT=5000
FRONTEND_URL=http://localhost:5001

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Google Calendar API
GOOGLE_CALENDAR_API_KEY=your_calendar_api_key

# Google Sheets API
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email
GOOGLE_SHEETS_PRIVATE_KEY=your_service_account_private_key

# Email Configuration (Nodemailer)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_SERVICE=gmail

# reCAPTCHA
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Session
SESSION_SECRET=your_session_secret_here

# Environment
NODE_ENV=development
```

Run in development mode:

```bash
npm run dev
```

This will start the backend on **http://localhost:5000** (or your configured PORT).

### 3️⃣ Setup and Run the Frontend

Open the project directory in another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

Run in development mode:

```bash
npm run dev
```

The frontend will start on **http://localhost:5001** by default.

## 🔧 Development Workflow

- **Frontend** and **Backend** run independently.
- Make sure both are running for full functionality.
- API calls from the client use the `VITE_API_URL` environment variable.
- Backend API is accessible at `http://localhost:5000/api/`

## 📝 Available Scripts

### Backend

```bash
npm run dev       # Run with nodemon (auto-reload)
npm start         # Run in production mode
```

### Frontend

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm start         # Serve production build
npm run lint      # Lint code
```

## 🔑 Key Features

- **User Authentication**: JWT-based authentication with Google OAuth integration
- **Role-Based Access Control**: Admin, Instructor, and Student roles
- **Grade Management**: Create, update, and track student grades and activities
- **Activity Tracking**: Monitor student activities and scores
- **Schedule Management**: Manage class schedules and sections
- **Google Calendar Integration**: Sync schedules with Google Calendar
- **Google Sheets Export**: Export grades and data to Google Sheets
- **PDF Export**: Generate PDF reports for grades
- **Audit Logging**: Track all system activities with Winston logger
- **Security Features**: Rate limiting, brute force protection, helmet security headers
- **Email Notifications**: Automated email notifications via Nodemailer
- **Data Encryption**: Secure data handling with encryption utilities
- **Semester Management**: Organize data by academic semesters

## 🛡️ Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Brute force protection
- Google reCAPTCHA integration
- Helmet security headers
- CORS configuration
- Session management
- Audit logging middleware
- Input validation and sanitization

## 📚 Documentation

Additional documentation can be found in:

- [backend/docs/authentication_api.md](backend/docs/authentication_api.md) - Authentication API documentation
- [backend/docs/DOCUMENTATION_PHASE.md](backend/docs/DOCUMENTATION_PHASE.md) - Documentation phase details
- [backend/docs/TESTING_AND_VALIDATION.md](backend/docs/TESTING_AND_VALIDATION.md) - Testing and validation guide
- [BUKSU_Database_Schema.md](BUKSU_Database_Schema.md) - Database schema documentation
- [TEST_CASES.md](TEST_CASES.md) - Test cases

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for Bukidnon State University.

## 👥 Support

For support and questions, please contact the development team.

---

**Built with ❤️ for Bukidnon State University**
