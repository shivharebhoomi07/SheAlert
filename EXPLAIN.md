# SheAlert Technical Explanation

## 1. Full SOS Flow (From Tap to View)
1. **User triggers SOS:** The user taps the SOS button on the frontend (`client/src/pages/Dashboard.jsx`). The `startAlert` function from `client/src/services/api.js` makes a POST request to `/api/alerts`.
2. **Backend initialization:** The request is intercepted by `server/src/middleware/authMiddleware.js` and `server/src/middleware/rateLimiter.js`. Once validated, it hits the `createAlert` controller in `server/src/controllers/alertController.js`.
3. **Database creation & token generation:** The controller calls `alertService.startAlert()` from `server/src/services/alertService.js`. The service utilizes `tokenService.createShareToken()` (`server/src/services/tokenService.js`) to generate a secure `shareToken`. A new `Alert` document (defined in `server/src/models/Alert.js`) is saved to MongoDB with `status: 'active'` and the generated `shareToken`.
4. **Notifications dispatched:** `alertService.js` triggers `notificationService.sendAlertNotifications(alertId)` from `server/src/services/notificationService.js`. This service fetches the user's `Contact` documents and attempts to send emails (via Nodemailer) and Telegram messages containing a link formatted as `CLIENT_URL/track/:shareToken`.
5. **Real-time socket connection:** The frontend's `client/src/hooks/useSocket.js` establishes a connection to the backend Socket.io server. The user authenticates with their JWT.
6. **Location tracking begins:** The `useGeolocation` hook (`client/src/hooks/useGeolocation.js`) begins tracking browser geolocation data. Throttled to every few seconds, it emits a `location:update` socket event containing coordinates.
7. **Contact view:** A contact receives the notification and clicks the link, opening the `TrackingPage` page (`client/src/pages/TrackingPage.jsx`). This page joins the public socket room associated with the alert id using the unguessable `shareToken`.
8. **Broadcasting location:** When `server/src/sockets/locationSocket.js` receives `location:update` from the authenticated user, it saves a `LocationPing` to the database and emits `location:broadcast` to the specific alert room. The `TrackingPage` map updates instantly with the new pin.

## 2. Tracking Link Privacy
- **Unguessable Tokens:** Tracking links use a `shareToken` dynamically generated when the alert is triggered (`tokenService.js`), utilizing secure random bytes. They are highly resistant to brute-forcing.
- **Time-bound Access:** The `Alert` model contains a `tokenExpiresAt` field. Once the alert is resolved (or when this duration expires), the token becomes invalid.
- **Read-Only Protocol:** `locationSocket.js` strictly enforces that users joining via `shareToken` are in a read-only state. They are restricted from emitting `location:update` or `alert:ended` events.

## 3. Failure Handlings
- **Socket Disconnect:** If the user's connection drops (e.g., entering an elevator), the frontend `useSocket.js` automatically attempts to reconnect. Once the connection is re-established, the socket resends the last known coordinates to catch up the server.
- **Email/Notification Failure:** `notificationService.js` utilizes a simple retry mechanism (up to 3 times with a delay). If the emails still fail to send, it updates the `Alert.notificationStatus` to `failed`. The frontend detects this state and prompts the user to manually hit the WhatsApp `wa.me` or SMS fallback buttons directly from their device.
- **GPS Permission Denied:** If the browser denies geolocation access, the `useGeolocation` hook catches the `PermissionDenied` error. The UI surfaces an error alert advising the user to fix their settings. The SOS alert remains technically active on the backend (contacts are notified), but live tracking is paused until permission is restored.

## 4. 10 Likely Interviewer Questions & Answers
1. **Q: Why use WebSockets instead of HTTP polling for location?**
   **A:** WebSockets provide a persistent, low-latency, bi-directional connection ideal for real-time tracking, avoiding the overhead of establishing HTTP connections and headers for every ping.
2. **Q: How do you prevent abuse of the SOS endpoint?**
   **A:** We use a `rateLimiter` middleware (`server/src/middleware/rateLimiter.js`) applied to the SOS route (`server/src/routes/alerts.routes.js`) to strictly throttle requests.
3. **Q: What happens if the database goes down during an active alert?**
   **A:** The `errorHandler` middleware catches the DB error. Initial alert creation would fail, but if an alert was already active, `location:broadcast` could theoretically continue in memory, though `LocationPing` history would fail to save.
4. **Q: Why separate `tokenService` from `alertService`?**
   **A:** To maintain single-responsibility. `tokenService` handles the isolated logic of cryptography and token lifecycle, making the code more modular and easier to unit test.
5. **Q: How is the React state managed for the active alert?**
   **A:** Global state is managed via React Context (`AlertContext`), which easily shares the active alert's status and socket connection state across the component tree.
6. **Q: How do you handle rapid location updates draining battery/network?**
   **A:** The `useGeolocation` hook throttles updates, ensuring coordinates are only emitted every few seconds rather than continuously firing on minor position changes.
7. **Q: Why store `LocationPing` data instead of just the `lastLocation`?**
   **A:** It allows the application to draw a historical route path on the map for contacts, and it serves as a critical historical log for post-incident review by authorities.
8. **Q: Can a contact accidentally turn off the alert?**
   **A:** No. `TrackingPage` is read-only and relies on a `shareToken`. Only the authenticated `User` holding the JWT can emit `alert:ended` or call the resolve API.
9. **Q: How are environment variables handled in the frontend?**
   **A:** Using Vite, environment variables must be prefixed with `VITE_` and are accessed globally via `import.meta.env`.
10. **Q: How do you ensure code consistency between client and server?**
    **A:** Strict naming rules are enforced. Every import, API route, and socket event name must match exactly across both codebases (e.g., `location:update`).

## 5. Honest Limitations and Next Steps
- **Limitation:** Background tracking on mobile web browsers is notoriously unreliable. If the screen locks, iOS Safari may throttle or completely kill JS execution, halting socket events. 
- **Next Step:** Migrate the frontend to a native app framework (React Native or Flutter) to leverage native background location permissions and push notifications.
- **Limitation:** The simple 3-retry email logic runs in-process and could block the event loop or drop events entirely if the Node.js server crashes mid-retry.
- **Next Step:** Implement a robust background job queue (e.g., BullMQ with Redis) for reliable, decoupled notification delivery.
