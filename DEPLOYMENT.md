# Deployment Guide for Women Safety Platform

This guide outlines the steps required to deploy the **Women Safety Assistance Platform** to production. The project contains a monorepo structure with a **Next.js frontend** and an **Express.js backend** (which uses PostgreSQL and WebSockets).

---

## ⚡ Deployment Recommendations (Crucial)

Because this platform uses **WebSockets (`socket.io`)** for real-time SOS alerts and live volunteer tracking, deploying the backend to **Vercel Serverless is NOT recommended for full functionality**. Vercel Serverless Functions do not support persistent connection states.

We recommend **Option A** for a fully functional deployment:

| Component | Recommended Platform (Option A) | Alternative (Option B) |
|---|---|---|
| **Frontend** | 🚀 **Vercel** (Excellent for Next.js) | 🚀 Vercel |
| **Backend** | 🌐 **Render / Railway / Fly.io** (Supports WebSockets) | 🌐 Vercel Serverless (WebSockets disabled) |
| **Database** | 🐘 **Neon / Supabase / ElephantSQL** (PostgreSQL) | 🐘 Neon / Supabase |

---

## 🚀 Option A: Next.js on Vercel + Backend on Render/Railway (Recommended)

This setup ensures that all features, including **real-time volunteer tracking and live SOS maps**, function perfectly.

### Step 1: Provision a PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech/) or [Supabase](https://supabase.com/).
2. Create a new PostgreSQL database project.
3. Enable the **PostGIS** extension if not already enabled (the backend will automatically attempt to run `CREATE EXTENSION IF NOT EXISTS postgis;` if database credentials have schema creation permissions).
4. Copy the connection string (`DATABASE_URL` / `POSTGRES_URI`).

### Step 2: Deploy the Backend (e.g., Render)
1. Go to [Render](https://render.com/) and create a new **Web Service**.
2. Connect your Git repository.
3. Configure the following service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `DATABASE_URL`: *Your PostgreSQL Connection URI*
   - `JWT_SECRET`: *A strong, secure secret string*
   - `DB_SSL`: `true`
5. Deploy the Web Service and copy the generated service URL (e.g. `https://women-safety-backend.onrender.com`).

### Step 3: Deploy the Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/) and import your project repository.
2. In the deployment configuration, set:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
3. Expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL`: *The URL of your deployed backend* (e.g., `https://women-safety-backend.onrender.com`)
4. Click **Deploy**.

---

## ☁️ Option B: Deploying Both Frontend and Backend to Vercel (Using Root Monorepo Configuration)

We have created a root-level [vercel.json](file:///c:/Users/bvssa/OneDrive/Desktop/women%20safety/vercel.json) configuration that leverages Vercel's multi-service monorepo feature. This allows you to deploy both services as a single project under the same domain, with automatic routing!

> [!WARNING]
> In this configuration, **real-time Socket.io connections will not work** because Vercel functions terminate after responding. The standard HTTP API endpoints (Auth, contacts, active alerts lists, adding resources, etc.) will still work.

### Step 1: Import the Monorepo to Vercel
1. Go to [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
2. Import your Git repository.
3. Keep the **Root Directory** as the root folder of the repository (do not change it to `frontend` or `backend`). Vercel will automatically read the root-level `vercel.json` file to manage the services.
4. Under **Environment Variables**, configure the variables for both services:
   - `NEXT_PUBLIC_API_URL`: `/api/backend` (Relative path works automatically since they are served on the same domain!)
   - `DATABASE_URL`: *Your remote PostgreSQL connection string* (In-memory fallbacks do not persist in serverless environments)
   - `JWT_SECRET`: *A strong secure secret string*
   - `DB_SSL`: `true`
5. Click **Deploy**.
