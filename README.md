# Safeguard | Women Safety & Emergency Assistance Platform

A production-ready, ultra-responsive security hub offering one-click distress SOS broadcasting, live location sharing, and proximity-based volunteer dispatch.

## Features

1. **One-Touch SOS Distress Button**:
   - Pulse-warning countdown with immediate cancellation option.
   - Broadcasts user location instantly via WebSockets and sends simulated SMS alerts to emergency contacts.
   - Proximity volunteer matchmaking (queries volunteers within 5km of coordinates).

2. **Interactive Live Tracking Map (Leaflet)**:
   - Full OpenStreetMap integration (requires zero API keys).
   - Real-time volunteer crawling simulation showing responders approaching distress signals.

3. **Volunteer/Responder Console**:
   - Verification status check tags.
   - Proximity alert push alerts.
   - Simulated step navigator letting volunteers post mock location updates.
   - Post-incident severity reporting form.

4. **Admin KPIs & Systems Operations Board**:
   - Live emergency monitor logs tracking active incidents.
   - Graphical line charts (Recharts) displaying alert trend variables.
   - Volunteer verification and approval directory lists.
   - Integrated form to add/remove safe zones, police stations, and hospitals.

5. **Flexible Persistence Engine**:
   - Connects to local or remote MongoDB.
   - **Automated Fallback**: If MongoDB isn't running or configured, the server automatically boots with a rich in-memory mock database populated with sample data so you can test the platform immediately.

---

## Tech Stack

* **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide React, Socket.io-client, Recharts, Leaflet.js
* **Backend**: Node.js, Express, Socket.io, Mongoose, JWT (JSON Web Tokens)

---

## Getting Started

### 1. Backend Server Setup

```bash
cd backend
npm install
npm start
```
*The server will start on port `5000` (e.g. `http://localhost:5000/health`).*
*Note: If no MONGODB_URI is provided in `backend/.env`, it will automatically boot using the in-memory fallback engine.*

### 2. Frontend App Setup

```bash
cd frontend
npm install
npm run dev
```
*The Next.js server will launch at `http://localhost:3000`.*

---

## Default Demo Credentials

Log in using these seeded test accounts to explore the various role dashboards:

* **System Admin Console**:
  - Email: `admin@safeguard.com`
  - Password: `password123`
* **Distress User Dashboard (Woman)**:
  - Email: `priya@example.com`
  - Password: `password123`
* **Verified Proximity Volunteer**:
  - Email: `amit@volunteer.com`
  - Password: `password123`

---

## Incident Simulation Guide

To see the platform's real-time features in action:
1. Open **two browser tabs** (or use an incognito window).
2. **Tab 1**: Log in as `priya@example.com` (User Dashboard).
3. **Tab 2**: Log in as `amit@volunteer.com` (Volunteer Dashboard) and toggle your status to **Online**.
4. In **Tab 1**, click the big red **SOS** button. Wait for the 3-second countdown to complete.
5. Watch **Tab 2**: An alert will appear in the Volunteer dashboard. Click **Accept SOS Request**.
6. The map will load. Click **Simulate Step Closer** in the Volunteer console to watch the responder icon crawl towards the user on both screens in real-time.
