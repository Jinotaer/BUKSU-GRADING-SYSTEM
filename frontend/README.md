# 🖥️ Buksu Grading System - Frontend

The frontend application for the Buksu Grading System, built with React and Vite.

## 📋 Quick Start

For complete setup instructions, please refer to the [main README](../README.md) in the project root.

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will start on **http://localhost:5001**

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🛠️ Tech Stack

- **Vite** - Fast build tool and dev server
- **React 19** - UI library
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Icons & Tabler Icons** - Icon libraries
- **React Big Calendar** - Calendar component
- **Recharts** - Charting library
- **Google OAuth** - Authentication
- **React Google reCAPTCHA** - Bot protection

## 📁 Project Structure

```
src/
├── component/        # React components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── assets/          # Static assets
├── App.jsx          # Root component
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## 🔧 Configuration

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

## 🚀 Available Scripts

- `npm run dev` - Start development server on port 5001
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm start` - Serve production build
- `npm run lint` - Run ESLint

## 📚 More Information

For complete documentation, setup guides, and backend information, see the [main README](../README.md).
