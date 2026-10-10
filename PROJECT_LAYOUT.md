# SheAlert Project Layout

SheAlert is a full-stack web application designed for women's safety, consisting of a React frontend and a Node.js/Express backend. 

Here's a breakdown of the project layout:

## Root Directory
- **`client/`**: Contains the frontend React application.
- **`server/`**: Contains the backend Node.js application.
- **`README.md`**: Main documentation with setup instructions and features.

---

## Client (Frontend)
Built with **React.js (Vite)**, **Tailwind CSS**, and **Google Maps JS API**. 
Located in the `/client` directory.

### Key Directories
- **`src/`**: The main source code for the React application.
  - **`components/`**: Reusable React components (e.g., Navbar, Map, Buttons).
  - **`pages/`**: Full page components representing different routes (e.g., Dashboard, Login, Active Alert).
    - `TrackingView`: Public, token-based, read-only map.
  - **`context/`**: React Context providers for global state management (e.g., AuthContext, AlertContext).
  - **`hooks/`**: Custom React hooks for shared logic.
    - `useLiveLocation`: Browser geolocation, throttled to one update every few seconds, handles permission denied.
  - **`services/`**: API and Socket.io communication services to interact with the backend.
    - `socket.js`: Connect, reconnect, resend last location on reconnect.
  - **`assets/`**: Static assets like images or icons used in the app.
  - **`App.jsx`**: The root component configuring routes and main layout.
  - **`main.jsx`**: Entry point that mounts the React app to the DOM.
- **`public/`**: Public assets and `index.html`.
- **`vite.config.js`**: Configuration file for Vite bundler.
- **`tailwind.config.js`**: Configuration file for Tailwind CSS.

---

## Server (Backend)
Built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **Socket.io**.
Located in the `/server` directory.

### Key Directories
- **`src/`**: The main source code for the backend.
  - **`controllers/`**: Functions that handle incoming HTTP requests and send responses (e.g., auth controller, alert controller).
  - **`routes/`**: Express route definitions that map URLs to their respective controllers.
  - **`models/`**: Mongoose schemas defining the structure of MongoDB documents.
    - `User`, `Contact`, `Trip`
    - `Alert`: `user`, `status` (active/resolved/cancelled), `startedAt`, `endedAt`, `lastLocation {lat, lng, at}`, `shareToken` (random, unguessable), `tokenExpiresAt`, `notificationStatus` (pending/sent/failed).
    - `LocationPing`: `alert`, `lat`, `lng`, `accuracy`, `at` (index on `alert` + `at`).
  - **`middleware/`**: Functions that intercept requests before they hit controllers.
    - `authMiddleware`, `errorHandler`, `rateLimiter` (limit SOS and auth routes), `validate` (simple request validation).
  - **`services/`**: Core business logic and external integrations.
    - `notificationService.js`: Nodemailer email + Telegram message, simple retry up to 3 times with delay, updates `Alert.notificationStatus`.
    - `alertService.js`: Start alert, resolve alert, generate `shareToken`.
    - `tokenService.js`: Create and verify share tokens.
  - **`sockets/`**: Socket.io event handlers for real-time communication.
    - `locationSocket.js`: Auth the socket via JWT; one room per alert (room name = alert id). Events: `location:update` (from the user), `location:broadcast` (to the room), `alert:ended`. Public viewers join with the `shareToken`, read-only.
  - **`config/`**: Configuration files (e.g., database connection setup).
  - **`validators/`**: One file per resource.
  - **`index.js`**: The main entry point that initializes the Express app, connects to DB, and starts the server.
- **`tests/`**: Jest + Supertest for auth, create alert, resolve alert, share token rejects expired/invalid tokens.

### Configuration Files
- **`.env`**: Environment variables (e.g., DB URI, JWT secret, SMTP credentials). *Note: Ensure this is created based on `.env.example`.*
