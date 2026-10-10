# SheAlert

A women's safety web application where users can trigger an SOS to immediately notify their emergency contacts with a live GPS tracking link.

## Tech Stack
- Frontend: React.js (Vite), Tailwind CSS, Google Maps JS API
- Backend: Node.js, Express.js, MongoDB (Mongoose), Socket.io
- Notifications: Nodemailer

## Prerequisites
- Node.js (v16+)
- MongoDB (running locally on port 27017 or a MongoDB URI)

## Setup & Run

### 1. Backend Setup
1. Navigate to the server folder: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file and verify variables (defaults are set):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/sheAlert
   JWT_SECRET=super_secret_jwt_key
   CLIENT_URL=http://localhost:5173
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_mailtrap_user
   SMTP_PASS=your_mailtrap_pass
   ```
4. Start the server: `node src/index.js`

### 2. Frontend Setup
1. Navigate to the client folder: `cd client`
2. Install dependencies: `npm install`
3. Create a `.env` file in the `client` folder:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```
4. Start the frontend: `npm run dev`

Open your browser to `http://localhost:5173`. 
Note: Ensure you allow location permissions in your browser when using the app.

## Features
- User Authentication (JWT)
- Add up to 5 Emergency Contacts
- Panic Button with a 5-second cancel countdown
- Real-time GPS Location tracking via Socket.io
- Public Live Map tracking for contacts
- Email and Telegram Notifications
- WhatsApp wa.me and SMS fallback buttons on active alert
- Alert History log

## Architecture
- **Frontend**: React application structure managed by Vite, utilizing context for state management. Uses `useLiveLocation` custom hook to throttle GPS updates and a dedicated `TrackingView` for contacts.
- **Backend**: Express API with Mongoose schemas (User, Contact, Alert, Trip, LocationPing). Modular architecture separating routes, controllers, services (`alertService.js`, `notificationService.js`, `tokenService.js`), and validators.
- **Real-time**: Socket.io handles live location events (`locationSocket.js`). 

## SOS Flow
1. User triggers SOS via panic button.
2. `alertService.js` creates a new Alert document and generates a random, unguessable `shareToken`.
3. `notificationService.js` dispatches emails/Telegram messages containing the tracking link to all registered contacts.
4. User's device starts transmitting location via the `location:update` socket event.
5. Contacts open the public tracking link using the `shareToken`, join the alert's socket room, and receive live coordinates via `location:broadcast`.

## Socket Events
- `location:update` - Sent by the user to the server with their current latitude/longitude.
- `location:broadcast` - Sent by the server to all public viewers in the alert room.
- `alert:ended` - Broadcast when the user cancels or resolves the SOS.
