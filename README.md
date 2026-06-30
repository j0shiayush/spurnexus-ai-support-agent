# 🌟 SpurNexus AI Support Agent

> An enterprise-grade, omnichannel AI customer support widget built with React, Node.js, and Google Gemini. Features local session persistence, graceful caching fallback, and a beautiful glassmorphism UI.

<img width="1920" height="924" alt="image" src="https://github.com/user-attachments/assets/a96c330f-8d0b-44ce-b46a-c973c4a49543" />


## 📑 Table of Contents
- [Project Overview](#-project-overview)
- [Architecture & Design Decisions](#-architecture--design-decisions)
- [LLM Integration Notes](#-llm-integration-notes)
- [Getting Started (Local Setup)](#-getting-started-local-setup)
- [Trade-offs & "If I Had More Time..."](#-trade-offs--if-i-had-more-time)

---

## 🚀 Project Overview

SpurNexus is an end-to-end full-stack AI support agent designed to handle customer inquiries regarding shipping, returns, and store policies. The project demonstrates strict adherence to system prompts, robust error handling, database persistence, and advanced frontend interactivity.

<img width="1920" height="924" alt="image" src="https://github.com/user-attachments/assets/5ac0c682-8ccb-4f49-a1c5-b66d4b9dfe85" />

<img width="1919" height="924" alt="image" src="https://github.com/user-attachments/assets/57216d49-6c9a-4f08-b195-c35d003a7816" />




### Key Features
- **Physics-Based UI:** Fluid slide-up animations using Framer Motion and an interactive side-panel scratchpad for pinning important AI responses.
- **Session Persistence:** Chat history is saved to a SQLite database and automatically hydrated on the frontend using browser `localStorage` to survive page reloads.
- **Graceful Degradation:** The backend leverages Upstash Redis for high-speed caching but seamlessly falls back to the database if the socket connection drops.
- **Idiot-Proofing:** Implements strict character limits (max 2000 chars) and disables inputs during loading states to protect the LLM context window.

---

## 🏗 Architecture & Design Decisions

The application follows a strict separation of concerns, divided into distinct architectural layers:

1. **Routing Layer (`chatRoutes.ts`):** Defines HTTP endpoints and prepares the system for omnichannel inputs.
2. **Controller Layer (`chatController.ts`):** Handles input validation, session management, and orchestrates database interactions.
3. **Service Layer (`llmService.ts`, `redisService.ts`):** Encapsulates external integrations, making it trivial to swap AI providers or caching mechanisms without touching business logic.
4. **Data Layer (`db.ts`):** Utilizes Prisma ORM with SQLite for robust, type-safe data persistence.

### Notable Engineering Decisions
* **Global Network Override:** Implemented a global Axios interceptor to bypass native Node.js `fetch` bugs and strict local Windows DNS/SSL blocks.
* **Omnichannel Webhook Readiness:** Designed a decoupled LLM service layer and included a prepared `/webhook/whatsapp` route to demonstrate how the core logic can scale beyond a web widget.

<img width="1920" height="934" alt="image" src="https://github.com/user-attachments/assets/75eec350-cee6-4e8d-9960-3c4406471b8f" />


---

## 🧠 LLM Integration Notes

* **Provider & Model:** Powered by Google Generative AI using the **Gemini 3.5 Flash** model. 
* **Prompt Engineering:** The LLM is strictly constrained via a detailed System Instruction prompt. It acts as "Aria," a support agent with a specific set of ground-truth rules (e.g., $4.99 shipping under $50, 30-day returns). It is explicitly instructed to decline off-topic requests and avoid hallucinating data.
* **Formatting:** The AI returns structured Markdown, which is natively parsed and rendered on the frontend using `react-markdown`.

---

## 💻 Getting Started (Local Setup)

Follow these steps to run the project locally.

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) and Git installed. 

### 2. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/spurnexus-ai-agent.git](https://github.com/YOUR_USERNAME/spurnexus-ai-agent.git)
cd spurnexus-ai-agent
```

### 3. Install Dependencies
```bash
# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 4. Configure Environment Variables
Navigate to the `backend` directory and create a `.env` file with:
```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
REDIS_URL="rediss://default:your_password@your_url.upstash.io:32000"
DATABASE_URL="file:./dev.db"
```

### 5. Setup the Database
Push the Prisma schema to generate the local SQLite database:
```bash
npx prisma db push
```

### 6. Run the Application
**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` in your browser to start chatting!

---

## ⚖️ Trade-offs & "If I Had More Time..."

1. **Vector Database / RAG Integration:** Currently, policies are hardcoded into the system prompt. I would integrate Pinecone to retrieve policies dynamically.
2. **Full Authentication:** Implement JWT-based authentication so users can pull real order history.
3. **WebSockets:** Transition from REST POST to WebSockets to stream the AI's response token-by-token.
4. **End-to-End Testing:** Add automated tests using Jest and Playwright to guarantee stability.
