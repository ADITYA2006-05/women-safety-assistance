# Product Requirement Document (PRD)

## Project: Safeguard — Women Safety & Emergency Assistance Platform
**Document Version:** 1.0.0  
**Target Role:** Software Engineering / Full-Stack Product Intern  
**Date:** July 11, 2026  
**Status:** Ready for Review / Deployment  

---

## Table of Contents
1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [Problem Statement & Value Proposition](#2-problem-statement--value-proposition)
3. [User Personas & Role Requirements](#3-user-personas--role-requirements)
4. [Functional Requirements & Features](#4-functional-requirements-and-features)
   - [4.1 One-Touch SOS Distress Button](#41-one-touch-sos-distress-button)
   - [4.2 Real-time Interactive Tracking Map](#42-real-time-interactive-tracking-map)
   - [4.3 Volunteer / Responder Dashboard](#43-volunteer--responder-dashboard)
   - [4.4 Centralized Admin Dashboard & KPI Monitor](#44-centralized-admin-dashboard--kpi-monitor)
5. [System Architecture & Data Flow](#5-system-architecture--data-flow)
   - [5.1 Architecture Block Diagram](#51-architecture-block-diagram)
   - [5.2 Real-Time WebSocket Messaging Protocol](#52-real-time-websocket-messaging-protocol)
   - [5.3 Geospatial Proximity Matchmaking Algorithm](#53-geospatial-proximity-matchmaking-algorithm)
6. [Database Schema & Data Models](#6-database-schema--data-models)
7. [Non-Functional Requirements & Security](#7-non-functional-requirements--security)
8. [Future Enhancements & Product Roadmap](#8-future-enhancements--product-roadmap)

---

## 1. Executive Summary & Product Vision

**Safeguard** is a production-ready, ultra-responsive, real-time safety network designed to bridge the critical gap between distress occurrence and emergency assistance. By combining instant WebSocket broadcasts, responsive Leaflet-based geospatial maps, and automated proximity-based volunteer matchmaking, Safeguard enables citizens in danger to broadcast their location immediately to a surrounding safety network (contacts, police, and verified community volunteers).

The platform is designed to run in environments with or without dedicated hosting, including a smart database-fallback system that transitions automatically from Postgres/PostGIS to an in-memory database configuration for demonstration, testing, and rapid local deployment.

---

## 2. Problem Statement & Value Proposition

### The Problem
* **Delayed Emergency Response:** Traditional emergency dispatch lines (e.g., calling 100/112) can be slow to reach, require verbal explanation of coordinates, and experience latency during high-congestion periods.
* **Lack of Nearby Helpers:** Official emergency units are often centralized. In many cases, a bystander or neighbor just 200 meters away is in the best position to offer first-line protection if alerted immediately.
* **Lack of Real-time Visibility:** Distressed individuals and their family members frequently suffer from a "black hole" of information, not knowing if someone has received their alert, who is responding, or where they currently are.

### Value Proposition
* **Instantaneous Broadcast:** One single press of the SOS button triggers an instant socket message to dispatch centers and triggers mock SMS messages to predetermined family contacts.
* **Hyper-Local Dispatch (Proximity-based):** Rather than querying general responders, the platform executes a 5-kilometer geospatial search to identify online, verified volunteers.
* **Continuous Real-Time Tracking:** Live bidirectional coordinates are shared using WebSockets, allowing victims and responders to monitor movement on a zero-overhead Leaflet Map interface.

---

## 3. User Personas & Role Requirements

The platform serves three primary user personas, each accessing a role-specific dashboard:

```mermaid
graph TD
    A[User Roles] --> B[Distress User (Woman)]
    A --> C[Verified Responder (Volunteer)]
    A --> D[System Admin]
    
    B --> B1[Instant SOS Broadcast]
    B --> B2[Simulated SMS alerts to Family]
    B --> B3[Track Responder approach live]
    
    C --> C1[Online/Offline Status Toggle]
    C --> C2[Proximity Alert Notifications]
    C --> C3[Location Share & Simulation Pathing]
    
    D --> D1[Admin KPI Charts & MAU Metrics]
    D --> D2[Volunteer Verification Approval]
    D --> D3[Safe Zone & Resource Management]
```

### Persona 1: Distress User (Woman)
* **Goal:** Send an alert as quickly and discreetly as possible, tracking when help is coming.
* **Needs:**
  - Fast-action UI requiring minimal taps to alert authorities/contacts.
  - Reassurance through real-time maps showing the helper's live movement.
  - Safe-zone navigation assistance to find local police stations or safe areas.

### Persona 2: Verified Volunteer / Responder
* **Goal:** Receive local safety alerts and navigate safely to render support.
* **Needs:**
  - Simple controls to set Online/Offline availability.
  - Visual navigation details linking directly to the victim’s location.
  - Post-incident reporting to document resolution steps and alert severity.

### Persona 3: System Administrator
* **Goal:** Monitor community safety health, verify volunteers, and register safe havens.
* **Needs:**
  - Aggregated KPIs (Alert counts, successful response rates, monthly active users).
  - List views of pending volunteer profiles to review and approve/reject credentials.
  - Dynamic forms to register new hospitals, police stations, and safe havens.

---

## 4. Functional Requirements & Features

### 4.1 One-Touch SOS Distress Button
* **Warning Countdown:** Clicking the SOS button initiates a 3-second visual count down with a cancellation option to prevent false alarms.
* **Distress Broadcast:** Once the countdown reaches 0:
  - An HTTP POST request triggers the alert on the backend.
  - Proximity search checks for verified volunteers within a 5km radius.
  - System logs details: user location, user contacts, and timestamp.
* **Emergency Broadcast Simulation:** Sends mock SMS notifications containing coordinates and tracking links to configured family emergency contacts.

### 4.2 Real-time Interactive Tracking Map
* **Zero-API Key Mapping:** Integrates OpenStreetMap with Leaflet.js rendering a rich, interactive map of the local area.
* **Interactive Live Positions:** If an SOS alert is active, the map overlays the user’s position, nearby safe zones (hospitals/police), and the responding volunteer's location.
* **Path Movement Simulation:** Allows responders to send live coordinate feeds, simulating a real-time crawl toward the distress signal.

### 4.3 Volunteer / Responder Dashboard
* **Online/Offline Switch:** Volunteers can toggle their status, controlling whether they receive incoming alerts.
* **Accept SOS Request Flow:** Upon an alert broadcast, verified volunteers within the radius receive a dynamic card notifications on their console. Accepting the alert links the volunteer's identity directly to the SOS ticket.
* **Report Forms:** Post-resolution, the responder must complete a severity report (Low, Medium, High) with field notes to close the incident ticket.

### 4.4 Centralized Admin Dashboard & KPI Monitor
* **KPI Metrics Board:** Displays real-time operational statistics:
  - **Registered Users:** Total system count.
  - **Success Rate:** Calculated dynamically as `Resolved / (Resolved + Cancelled)`.
  - **Average Response Time:** Speed of volunteer acceptance.
  - **Active Users (MAU):** Calculated from active users and online responders.
* **Recharts Trend Graph:** Renders a 7-day trend chart showing daily SOS alerts.
* **Directory Controls:** Action panels to verify/approve volunteer applicants.
* **Safe Haven Cataloging:** Forms to add/edit/delete Safe Zones, Hospital sites, and Police Stations.

---

## 5. System Architecture & Data Flow

### 5.1 Architecture Block Diagram

The application leverages a classic decoupled full-stack architecture built on Next.js, Node.js/Express, and dual database support (PostgreSQL/Sequelize or In-Memory fallback).

```
+------------------------------------------------------------+
|                       Next.js Frontend                     |
|  +----------------+  +-----------------+  +-------------+  |
|  |   SOS Dashboard|  | Volunteer Panel |  | Admin Board |  |
|  +----------------+  +-----------------+  +-------------+  |
|         ^                     ^                  ^         |
+---------|---------------------|------------------|---------+
          | (HTTP/WS)           | (HTTP/WS)        | (HTTP)
          v                     v                  v
+------------------------------------------------------------+
|                  Express.js Backend Server                 |
|       +---------------------------------------------+      |
|       |         JSON Web Token (JWT) Guard          |      |
|       +---------------------------------------------+      |
|                               |                            |
|       +-----------------------+---------------------+      |
|       |       REST Routes (Auth, SOS, Admin)        |      |
|       +---------------------------------------------+      |
|       |     Socket.io Event Dispatch / Listener     |      |
|       +---------------------------------------------+      |
+------------------------------------------------------------+
                               |
                               v
+------------------------------------------------------------+
|                       Database Engine                      |
|       +---------------------------------------------+      |
|       |             PostgreSQL + PostGIS            |      |
|       +---------------------------------------------+      |
|                              OR                             |
|       +---------------------------------------------+      |
|       | In-Memory Fallback Store (Mocks & Seeds)    |      |
|       +---------------------------------------------+      |
+------------------------------------------------------------+
```

### 5.2 Real-Time WebSocket Messaging Protocol

WebSockets maintain persistent connections for instant data transmission during active incident tracking. 

| Event Name | Sender | Receiver | Payload Details | Description |
| :--- | :--- | :--- | :--- | :--- |
| `join-alert-room` | Client | Server | `{ alertId: string }` | Places the socket connection into a specific room labeled `alert_{alertId}`. |
| `leave-alert-room`| Client | Server | `{ alertId: string }` | Disassociates the client socket from the active tracking room. |
| `new-sos-alert` | Server | Clients | `{ alert: Alert, nearbyCount: number }` | Broadcasted globally. Subscribing volunteer consoles trigger local UI warning audio and visual indicators. |
| `alert-updated` | Server | Clients | `{ alert: Alert }` | Broadcasts status updates (e.g., transition from "Active" to "Accepted"). |
| `volunteer-location-share` | Volunteer | Server | `{ alertId, volunteerId, name, phone, coords: [lng, lat] }` | Dispatched by volunteers performing steps. |
| `volunteer-location-update` | Server | Room | `{ volunteerId, name, phone, coords: [lng, lat] }` | Server relays location updates to all listeners within room `alert_{alertId}`. |
| `user-location-share` | User | Server | `{ alertId, userId, coords: [lng, lat] }` | Sends victim's real-time coordinate changes. |
| `user-location-update` | Server | Room | `{ userId, coords: [lng, lat] }` | Server relays updated victim coordinates to responder client map in real-time. |

---

### 5.3 Geospatial Proximity Matchmaking Algorithm

#### Primary Method (Production Database)
When PostgreSQL with PostGIS is activated, the system executes an optimized spatial distance query using the `ST_DWithin` function. It queries for volunteers whose most recently posted `currentLocation` is within 5000 meters of the SOS incident coordinates.

```sql
SELECT * FROM "Volunteers" 
WHERE "verificationStatus" = 'Approved' 
  AND "isOnline" = true 
  AND ST_DWithin("currentLocation", ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, 5000);
```

#### Fallback Method (In-Memory Database)
If the server falls back to the in-memory database store, distances are calculated using the Haversine mathematical model which determines the great-circle distance between two points on a sphere.

$$\text{Distance} = 2r \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{long}}{2}\right)} \right)$$

```javascript
// Haversine Formulation implementation in proximity.js
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
```

---

## 6. Database Schema & Data Models

The system has support for PostgreSQL schemas managed via Sequelize. The main tables defined are:

### User Model
Stores authorization records, contact details, and platform access roles.
* `_id`: UUID (Primary Key, Autogenerated)
* `name`: String (Not Null)
* `email`: String (Unique, Not Null)
* `passwordHash`: String (Not Null)
* `role`: Enum ('User', 'Volunteer', 'Admin') (Default: 'User')
* `phone`: String (Not Null)
* `createdAt`: DateTime
* `updatedAt`: DateTime

### Volunteer Model
Tracks registration verification steps and coordinates for verified responders.
* `_id`: UUID / String (Primary Key)
* `userId`: UUID (Foreign Key linking to User)
* `name`: String (Not Null)
* `phone`: String (Not Null)
* `verificationStatus`: Enum ('Pending', 'Approved', 'Rejected') (Default: 'Pending')
* `isOnline`: Boolean (Default: false)
* `currentLocation`: Geospatial Point Coordinates `[longitude, latitude]`
* `updatedAt`: DateTime

### Alert Model
Maintains active and historical incident records.
* `_id`: UUID / String (Primary Key)
* `userId`: UUID / String (Foreign Key linking to distress User)
* `userName`: String (Not Null)
* `userPhone`: String (Not Null)
* `status`: Enum ('Active', 'Accepted', 'Resolved', 'Cancelled') (Default: 'Active')
* `location`: Geospatial Point Coordinates `[longitude, latitude]`
* `responderId`: UUID / String (Foreign Key linking to accepted Volunteer)
* `responderName`: String (Nullable)
* `responderPhone`: String (Nullable)
* `createdAt`: DateTime
* `resolvedAt`: DateTime (Nullable)

### EmergencyContact Model
Stores priority mobile numbers for simulated SMS dispatch.
* `_id`: UUID / String (Primary Key)
* `userId`: UUID / String (Foreign Key linking to distress User)
* `name`: String (Not Null)
* `phone`: String (Not Null)
* `relationship`: String (e.g., Parent, Spouse)
* `isNotifiedBySOS`: Boolean (Default: true)
* `createdAt`: DateTime

### SafetyResource Model
Maintains catalog of emergency safe zones.
* `_id`: UUID / String (Primary Key)
* `name`: String (Not Null)
* `type`: Enum ('SafeZone', 'PoliceStation', 'Hospital') (Not Null)
* `location`: Geospatial Point Coordinates `[longitude, latitude]`
* `address`: String
* `phone`: String
* `createdAt`: DateTime

### IncidentReport Model
Logs post-incident write-ups written by volunteers.
* `_id`: UUID / String (Primary Key)
* `alertId`: UUID / String (Foreign Key linking to Alert)
* `userId`: UUID / String (Foreign Key linking to Alert Creator)
* `userName`: String (Not Null)
* `volunteerId`: UUID / String (Foreign Key linking to Alert Responder)
* `volunteerName`: String (Not Null)
* `notes`: Text (Not Null)
* `severity`: Enum ('Low', 'Medium', 'High') (Default: 'Medium')
* `createdAt`: DateTime

---

## 7. Non-Functional Requirements & Security

* **Low Latency Communications:** Active location tracking updates must be delivered with sub-500ms latency to provide smooth tracking visual paths on the map.
* **Authentication Guarding:** Passwords are encrypted using bcrypt hashing (salt factor 10). Access routes are protected using JSON Web Token (JWT) middleware matching roles.
* **Geospatial Privacy:** A user's location coordinates are only exposed to responders while an SOS alert is marked `Active` or `Accepted`. Once marked `Resolved` or `Cancelled`, the backend restricts real-time updates.
* **High Availability Fallbacks:** Automatically detects database server disconnection and serves requests using pre-seeded, in-memory structures to guarantee continuous operation.

---

## 8. Future Enhancements & Product Roadmap

* **Wearable Integration:** Companion mobile application offering bluetooth sync to safety rings, wristbands, or smartwatches to trigger SOS distress without opening the phone.
* **Native SMS Gateway Fallback:** Integrates Twilio or regional SMS servers to send actual SMS and WhatsApp alerts to emergency contacts when internet connectivity is spotty.
* **Geofencing & Safe Route Planning:** Warns users if they steer into locations with historically higher reports and provides voice-guided directions to nearest mapped "Safe Zones".
