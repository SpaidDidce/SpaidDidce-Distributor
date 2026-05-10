# 🚀 SpaidDidce Game Launcher & Distribution Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Electron](https://img.shields.io/badge/Electron-Desktop-47848f.svg)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-8.0-512bd4.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791.svg)

A full-stack, enterprise-grade game distribution platform. This project features a custom desktop client built with **Electron** and a highly secure, scalable backend powered by **C# ASP.NET Core** and **PostgreSQL**.

Designed to handle user authentication, game library management, and secure large-file distribution.

## ✨ Key Features

### 🖥️ Frontend (Electron Desktop Client)
- **Modern UI/UX:** Premium user interface built with vanilla HTML/CSS and JavaScript.
- **Secure Architecture:** Complete separation of concerns using `contextIsolation`. The UI (Renderer Process) never touches sensitive tokens directly.
- **Encrypted Local Storage:** Uses `electron-store` to securely encrypt and store JWT tokens on the user's filesystem.
- **Live File Downloading:** Native Node.js stream implementation (`fs.createWriteStream`) to handle the downloading of massive `.zip` game files directly from the backend, complete with real-time progress bars.

### ⚙️ Backend (C# ASP.NET Core API)
- **Robust Authentication:** Implements JWT (JSON Web Tokens) for secure, stateless user sessions (Access and Refresh tokens).
- **Relational Database:** Entity Framework Core integration with **PostgreSQL**. 
- **DRM & Authorization:** Custom Action Filters (`[GameKey]`) to ensure only users with a valid license in the database can download specific games.
- **Secure File Streaming:** Uses `PhysicalFile` to securely stream game files to authenticated clients without exposing internal server paths.

---

## 🏗️ Architecture & Security Model

The security of the user's session and the integrity of the downloads were the top priorities in this architecture:

1. **IPC Communication:** The Renderer Process requests data via Inter-Process Communication (IPC). It is completely unaware of the API endpoints or the JWT tokens.
2. **Main Process as a Proxy:** Node.js acts as a secure proxy. It attaches the `Authorization: Bearer <token>` headers to every request made to the ASP.NET Core server.
3. **Database Validation:** The backend intercepts requests using custom Middleware and Filters to validate the user's identity and their ownership of the requested game before initiating any file streams.

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
| `GET`  | `/games/{id}/latest/description` | `Guid id` (Route) + `[GameKey]` | `200 OK` `string` | Gets the description of a game (Requires Player License). |
| `GET`  | `/games/{id}/latest/download` | `Guid id` (Route) + `[GameKey]` | `200 OK` `application/zip` | Streams the latest `.zip` game file. |

### 🛠️ Developer Center (`/programer`)
Endpoints restricted to developers and teams using the `[TeamKey]` DRM filter.

| Method | Endpoint | Request Body / Params | Response | Description |
|---|---|---|---|---|
| `POST` | `/programer/createteam` | TBD | `200 OK` | Creates a new developer team. |
| `POST` | `/programer/creategame` | `Guid TeamId` + `[TeamKey(OnlyOwner)]` | `200 OK` | Registers a new game. Only the Team Owner can do this. |
| `POST` | `/programer/uploadgame` | `multipart/form-data`: `TeamId`, `Gameid`, `gameFile`, `versionDescription` | `200 OK` `{ message, fileSize }` | Uploads a new `.zip` build for a game. Any team member can do this. |

---

## 🛠️ Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [.NET SDK](https://dotnet.microsoft.com/) (v8.0 or higher)
- [PostgreSQL](https://www.postgresql.org/) database server running locally.

### 1. Setting up the Backend
1. Navigate to the backend folder:
   ```bash
   cd BackendSource
   ```
2. Open `appsettings.json` (or `appsettings.Development.json`) and update the `"DefaultConnection"` string with your PostgreSQL credentials.
3. Run the application:
   ```bash
   dotnet run
   ```
   *(Note: The server will typically run on `https://localhost:7045`).*

### 2. Setting up the Launcher
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd LauncherSource
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Start the Electron application:
   ```bash
   npm start
   ```

---
*Built as a showcase of Full-Stack Desktop & Backend Engineering.*
