# Shopit Frontend

React frontend for Shopit, an e-commerce platform. Built with React 18, TypeScript, Vite, and Tailwind CSS.

## Getting Started

npm install
npm run dev

The app runs at http://localhost:5173.

## Environment Variables

Create a .env.local file in the project root with:

VITE_API_URL=http://localhost:5129

Set this to wherever your local Shopit.API backend is running. For production builds, the equivalent variable lives in .env.production and should point to the deployed backend URL.

## Project Structure

src/
├── api/          # Axios instance and API call definitions
├── components/   # Reusable components (route guards, shared UI)
├── context/      # React context providers (e.g. AuthContext) and supporting stores
├── hooks/        # Custom React hooks
├── pages/        # Top-level route components
└── types/        # Shared TypeScript types

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- React Router
- TanStack Query (@tanstack/react-query)
- Axios
- react-hot-toast
