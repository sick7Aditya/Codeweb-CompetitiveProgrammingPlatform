# Codeweb-CompetitiveProgrammingPlatform
<div align="center">

# ⚔️ CodeWeb

### A self-hosted competitive programming platform — built from scratch.

**Code. Compete. Rank.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Judge0](https://img.shields.io/badge/Judge0-CE-orange?style=flat-square)](https://judge0.com)

</div>

---

## 🧠 What is CodeWeb?

CodeWeb is a full-stack competitive programming platform that lets users solve algorithmic problems, participate in timed contests, and track their performance through a live rating system — all in one place.

Think of it as a self-hosted LeetCode/Codeforces hybrid, built with a modern Java + React stack.

---

## ✨ Features

### 👨‍💻 Code Execution
- Real-time online judge powered by **Judge0 API**
- Multi-language support (C++, Java, Python, and more)
- Verdict feedback: Accepted, Wrong Answer, TLE, Runtime Error, Compilation Error

### 🏆 Contests
- Timed contest management with start/end scheduling
- Problem sets per contest with difficulty tagging
- Live scoreboard during active contests

### 📊 Rating System
- Elo-inspired rating engine (base 400, +20 / −10 per contest)
- Three performance tiers based on cumulative rating
- Per-user rating history tracking

### 🔐 Authentication
- JWT-based stateless auth with refresh token support
- Google OAuth2 login
- Role-based access control (`ROLE_USER`, `ROLE_ADMIN`)

### 🗂️ Admin Panel
- Full user management (view, ban/unban users)
- Problem CRUD — create, edit, delete problems
- Contest creation and scheduling dashboard

### 📄 Reports & Leaderboards
- PDF leaderboard generation (client-side via jsPDF)
- Per-user performance reports with contest history
- Downloadable directly from the UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, jsPDF |
| Backend | Spring Boot 3.2.5, Spring Security |
| Database | MongoDB 7 (Spring Data MongoDB) |
| Auth | JWT + Google OAuth2 |
| Judge | Judge0 CE (RapidAPI) |
| Styling | Inline JSX styles, DM Mono + Syne fonts |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Java 17+
- MongoDB running locally or via Atlas
- Judge0 API key (from [RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce))

### 1. Clone the repo

```bash
git clone https://github.com/sick7Aditya/CodeWeb.git
cd CodeWeb
```

### 2. Backend setup

```bash
cd backend
# Configure your environment variables (see below)
./mvnw spring-boot:run
```

Create an `application.properties` or set the following env vars:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/codeweb
jwt.secret=YOUR_JWT_SECRET
google.client-id=YOUR_GOOGLE_CLIENT_ID
google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
judge0.api.key=YOUR_RAPIDAPI_KEY
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## 📁 Project Structure

```
CodeWeb/
├── backend/
│   ├── src/main/java/com/codeweb/
│   │   ├── controller/       # REST controllers
│   │   ├── service/          # Business logic
│   │   ├── model/            # MongoDB document models
│   │   ├── repository/       # Spring Data repositories
│   │   ├── security/         # JWT + OAuth2 config
│   │   └── scheduler/        # Cron jobs (contest state updates)
│   └── pom.xml
│
└── frontend/
    ├── src/
    │   ├── pages/            # Route-level page components
    │   ├── components/       # Reusable UI components
    │   ├── context/          # Auth context, global state
    │   └── utils/            # API helpers, jsPDF logic
    └── package.json
```

---

## 👤 Author

**Aditya** — [@sick7Aditya](https://github.com/sick7Aditya)

Built as a portfolio project while studying BCA, with a focus on backend development.

