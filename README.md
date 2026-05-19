# 🚀 SpaidDidce Game Launcher & Distribution Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Electron](https://img.shields.io/badge/Electron-Desktop-47848f.svg)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-8.0-512bd4.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791.svg)
![Docker](https://img.shields.io/badge/Docker-Containers-2496ED.svg)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635bff.svg)
![AWS S3](https://img.shields.io/badge/Amazon_S3-Storage-569A31.svg)

A full-stack, enterprise-grade game distribution platform. This project features a custom desktop client built with **Electron** and a highly secure, scalable backend powered by **C# ASP.NET Core**, **PostgreSQL**, and **AWS S3** compatible storage, with integrated **Stripe** payment processing.

Designed to handle user authentication, game library management, secure large-file distribution, and real payment flows.

---

## ✨ Key Features

### 🖥️ Player Launcher (Electron Desktop Client)
- **Modern UI/UX:** Premium user interface built with vanilla HTML/CSS and JavaScript.
- **Secure Architecture:** Complete separation of concerns using `contextIsolation`. The UI (Renderer Process) never touches sensitive tokens directly.
- **Encrypted Local Storage:** Uses `electron-store` to securely encrypt and store JWT tokens on the user's filesystem.
- **Live File Downloading:** Native Node.js stream implementation (`fs.createWriteStream`) to handle downloading of massive `.zip` game files directly from the backend, with real-time progress bars.
- **Automatic Extraction:** Downloaded `.zip` files are automatically extracted into a per-game folder (`~/LauncherGames/<gameId>/`) and the archive is deleted afterward.
- **Play Button Logic:** The launcher automatically detects if a game is installed locally and shows a **Play** button instead of a **Download** button.

### 🛠️ Developer Center (Electron Desktop Client)
- **Team Management:** Developers can create and dissolve development teams.
- **Game Registration:** Teams can register new games (Free or Paid) within their team portfolio.
- **Large File Uploads:** Dedicated flow utilizing `axios` and `form-data` to handle massive `.zip` uploads directly to the backend.
- **Stripe Connect Dashboard:** Built-in dashboard allowing developers to seamlessly complete Stripe onboarding to receive payouts for their game sales.
- **Secure Architecture:** Adheres to the same strict security practices as the player launcher with `contextIsolation` and encrypted token storage.

### ⚙️ Backend (C# ASP.NET Core API)
- **Robust Authentication:** Implements JWT (JSON Web Tokens) for secure, stateless user sessions (Access and Refresh tokens).
- **Relational Database:** Entity Framework Core integration with **PostgreSQL**.
- **S3 Object Storage:** Seamlessly supports AWS S3 (or MinIO/LocalStack) for robust and scalable game file hosting, with a fallback to local file system storage.
- **DRM & Authorization:** Custom Action Filters (`[GameKey]`) ensure only users with a valid license in the database can download specific games.
- **Secure File Streaming:** Uses `PhysicalFile` or S3 streams to securely stream game files to authenticated clients without exposing internal server paths.
- **Stripe Payments:** Full Stripe Checkout integration — creates payment sessions and processes webhook events to automatically grant game licenses after a successful purchase.
- **Email Notifications:** Built-in SMTP support for sending emails (e.g., account verification, notifications), configured for seamless local testing with MailHog.
- **Global Error Handling:** Implements a global exception handler middleware to catch fatal unhandled exceptions, preventing server crashes and returning clean HTTP 500 JSON responses.

---

## 🏗️ Architecture & Security Model

1. **IPC Communication:** The Renderer Process requests data via Inter-Process Communication (IPC). It is completely unaware of API endpoints or JWT tokens.
2. **Main Process as a Proxy:** Node.js acts as a secure proxy, attaching `Authorization: Bearer <token>` headers to every request made to the ASP.NET Core server.
3. **Database Validation:** The backend intercepts requests using custom Middleware and Filters to validate the user's identity and their ownership of the requested game before initiating any file streams.
4. **Stripe Webhook Verification:** Incoming Stripe webhook events are cryptographically verified using the `Stripe-Signature` header before any license is granted.

---

## 💳 Stripe Connect Integration Setup

This project uses **Stripe Connect** (Destination Charges) to allow developer teams to receive payouts directly, while the platform retains an automated 15% commission on each sale.

### Step 1 — Create and Configure a Stripe Platform
1. Go to [https://dashboard.stripe.com/connect](https://dashboard.stripe.com/connect) and activate Connect for your account.
2. Complete your Platform Profile (you must define how your platform works, usually as a "Marketplace" selling digital goods).
3. In **Developers → API Keys**, copy your **Secret Key** (`sk_test_...` or `sk_live_...`).

Paste your **Secret Key** into `BackendSource/appsettings.json`:
```json
"Stripe": {
  "SecretKey": "sk_test_YOUR_KEY_HERE",
  "WebhookSecret": "whsec_YOUR_WEBHOOK_SECRET_HERE"
}
```

### Step 2 — Configure the Webhook Endpoint
Stripe must be able to call your backend when a payment completes or an onboarding finishes. 

#### Local Development (Stripe CLI)
1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Run the following command to forward events (both from your platform and connected accounts) to your local backend:
   ```powershell
   stripe listen --forward-to https://localhost:7045/Stripe/webhook --forward-connect-to https://localhost:7045/Stripe/webhook
   ```
3. The CLI will output a webhook signing secret (`whsec_...`). Paste it into `appsettings.json` under `Stripe.WebhookSecret`.

### Step 3 — Developer Onboarding
1. In the **Developer Center**, go to the **Stripe Connect** tab.
2. Select your team and click **Conectar con Stripe**.
3. You will be redirected to the Stripe Express onboarding flow. Fill out the required test details to activate your team's connected account.
4. Back in the Developer Center, the status will show ✅ when the account is ready.

### Step 4 — Test a Payment
1. Open the **Launcher** and click a paid game in the Store tab.
2. Click **Buy Now** — a Stripe Checkout page will open in your browser.
3. Use the test card number `4242 4242 4242 4242` with any future expiry and any CVC.
4. After payment, the money is routed to the team's connected account (minus the 15% platform fee).
5. Stripe sends a webhook to your backend, which automatically grants the license. The game will then appear in the **Library** tab.

---

## 📡 API Documentation

All secured endpoints require the `Authorization: Bearer <accessToken>` header unless specified otherwise.

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Request Body / Params | Response | Description |
|---|---|---|---|---|
| `POST` | `/auth/login` | `{ Email, Password }` | `200 OK` `{ accessToken, refreshToken }` | Authenticates a user. |
| `POST` | `/auth/register` | `{ UserName, Email, Password }` | `200 OK` `{ accessToken, refreshToken }` | Registers a new user. |
| `GET`  | `/auth/logout` | Header: `refresh_token` | `200 OK` | Logs out the user and invalidates tokens. |

### 🎮 Game Library (`/games`)
| Method | Endpoint | Request Body / Params | Response | Description |
|---|---|---|---|---|
| `GET`  | `/games` | None | `200 OK` `List<GamesTable>` | Retrieves all public games. |
| `POST` | `/games/searchbyname` | `{ gameName }` | `200 OK` `List<GamesTable>` | Searches for games by name. |
| `GET`  | `/games/{id}/latest/description` | `Guid id` (Route) + `[GameKey]` | `200 OK` `string` | Gets the description of a game (requires license). |
| `GET`  | `/games/{id}/latest/download` | `Guid id` (Route) + `[GameKey]` | `200 OK` `application/zip` | Streams the latest `.zip` game file (requires license). |

### 👤 My Account (`/Me`)
| Method | Endpoint | Request Body / Params | Response | Description |
|---|---|---|---|---|
| `GET`  | `/Me` | None | `200 OK` `List<GamesTable>` | Returns all games owned by the logged-in user. |
| `POST` | `/Me` | `Guid gameId` | `200 OK` | Adds a free game to the user's library. |
| `GET`  | `/Me/getifgameihaveit` | Query: `?GameId=<guid>` | `200 OK` `bool` | Returns whether the user owns a specific game. |

### 💳 Payments (`/Stripe`)
| Method | Endpoint | Request Body / Params | Response | Description |
|---|---|---|---|---|
| `POST` | `/Stripe/create-checkout-session` | `Guid gameId` | `200 OK` `{ url }` | Creates a Stripe Checkout session and returns the payment URL. |
| `POST` | `/Stripe/webhook` | Stripe signed payload | `200 OK` | Receives Stripe events and grants licenses on `checkout.session.completed`. |

### 🛠️ Developer Center (`/programer`)
Endpoints restricted to developers and teams using the `[TeamKey]` DRM filter.

| Method | Endpoint | Request Body / Params | Response | Description |
|---|---|---|---|---|
| `POST` | `/programer/createteam` | TBD | `200 OK` | Creates a new developer team. |
| `POST` | `/programer/creategame` | `Guid TeamId` + `[TeamKey(OnlyOwner)]` | `200 OK` | Registers a new game. Only the Team Owner can do this. |
| `POST` | `/programer/uploadgame` | `multipart/form-data`: `TeamId`, `GameId`, `gameFile`, `versionDescription` | `200 OK` `{ message, fileSize }` | Uploads a new `.zip` build for a game. Any team member can do this. |

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [.NET SDK](https://dotnet.microsoft.com/) (v8.0 or higher)
- [Docker](https://www.docker.com/) *(Used to run PostgreSQL, Floci, and MailHog locally)*
- [Stripe CLI](https://stripe.com/docs/stripe-cli) *(for webhook testing)*
- An S3-compatible object storage (e.g., AWS S3, MinIO, or LocalStack) *(Optional, can fallback to local file storage)*

### 🐳 Docker Infrastructure
This project utilizes Docker to simplify the setup of essential backend services. The following technologies are containerized:
- **PostgreSQL:** Primary relational database for the platform.
- **Floci:** Local s3 storage emulator.
- **MailHog:** Used for capturing and testing email notifications sent by the backend during development.

### 1. Setting up the Backend

1. Navigate to the backend folder:
   ```bash
   cd BackendSource
   ```
2. Open `appsettings.json` and fill in all required values:
   ```json
    {
      "DatabaseSettings": {
        "Server": "127.0.0.1",
        "Port": 5432,
        "Database": "your_db_name",
        "User": "your_db_user",
        "Password": "your_db_password"
      },
      "Jwt": {
        "Key": "a-long-random-secret-string-min-32-chars",
        "Issuer": "YourAppName",
        "Audience": "YourAppClient",
        "ExpiresInMinutes": 15
      },
      "Stripe": {
        "SecretKey": "sk_test_YOUR_STRIPE_SECRET_KEY",
        "WebhookSecret": "whsec_YOUR_STRIPE_WEBHOOK_SECRET"
      },
      "Smtp": {
        "Host": "127.0.0.1",
        "Port": 1025,
        "Username": "your_smtp_user",
        "Password": "your_smtp_password",
        "From": "noreply@spaiddidce.com"
      }
    }
   ```
3. Run the application:
   ```bash
   dotnet run
   ```
   *(The server will run on `https://localhost:7045` by default.)*

4. *(Optional)* In a separate terminal, start the Stripe CLI webhook forwarder:
   ```bash
   stripe listen --forward-to https://localhost:7045/Stripe/webhook
   ```

### 2. Setting up the Launcher

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd LauncherSource
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Electron application:
   ```bash
   npm start
   ```

### 3. Setting up the Developer Center

1. Open a new terminal and navigate to the developer center folder:
   ```bash
   cd Tools/DeveloperCenter
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Developer Center application:
   ```bash
   npm start
   ```

---

## 🔑 Configuration Reference

| File | Key | Description |
|------|-----|-------------|
| `appsettings.json` | `DatabaseSettings.*` | PostgreSQL connection details |
| `appsettings.json` | `Jwt.Key` | JWT signing secret (min. 32 characters, keep secret) |
| `appsettings.json` | `Stripe.SecretKey` | Stripe API secret key (`sk_test_...` or `sk_live_...`) |
| `appsettings.json` | `Stripe.WebhookSecret` | Stripe webhook signing secret (`whsec_...`) |
| `appsettings.json` | `Smtp.*` | SMTP server configuration for sending emails (e.g., MailHog) |
| `appsettings.json` | `UseS3` | Boolean flag to toggle between S3 storage or local file system |
| `appsettings.json` | `Aws.*` | Credentials, bucket name, and service URL for the S3-compatible storage |
| `LauncherSource/main.js` | `API_URL` | URL of the running backend (default: `https://localhost:7045`) |
| `LauncherSource/main.js` | `encryptionKey` | Key used to encrypt the local token store — change before shipping |

---

*Built as a showcase of Full-Stack Desktop & Backend Engineering with real payment integration.*
