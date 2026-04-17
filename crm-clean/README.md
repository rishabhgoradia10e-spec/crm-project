# 🏥 HCP CRM — AIVOA.AI Assignment
## ✅ Complete Setup Guide for Windows

---

## 📁 CORRECT FOLDER STRUCTURE
After extracting the ZIP, it must look EXACTLY like this:

```
crm-app/                        ← ROOT FOLDER
├── backend/
│   ├── main.py
│   ├── agent.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── index.html          ← MUST EXIST
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── store/
│   │       └── index.js
│   └── package.json
└── README.md
```

---

## ⚠️ BEFORE YOU START — READ THIS

| ❌ WRONG | ✅ RIGHT |
|---------|---------|
| Open ZIP in VS Code directly | Extract ZIP first, THEN open folder |
| Run commands in `C:\Users\Rishabh` | Always cd into the correct folder first |
| Think `localhost:8000` is the website | 8000 = Backend API only. 3000 = Your website |
| Run npm in wrong folder | Run npm only inside the `frontend` folder |

---

## 🐍 STEP 1 — Setup Backend (Terminal 1)

Open a new terminal and run these commands ONE BY ONE:

```bash
# Go into backend folder
cd Downloads/crm-app/backend

# Install ALL required packages
pip install fastapi uvicorn langchain langchain-groq langchain-core langgraph httpx pydantic

# Start the backend server
python -m uvicorn main:app --reload --port 8000
```

✅ You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

🌐 Visit http://localhost:8000 → You'll see `{"status":"running"}` — that is CORRECT, that's the API.

---

## ⚛️ STEP 2 — Setup Frontend (Terminal 2 — NEW terminal)

Open a SECOND terminal (don't close the first one!) and run:

```bash
# Go into frontend folder
cd Downloads/crm-app/frontend

# Install ALL packages (axios, react-redux, etc. — all included in package.json)
npm install

# Start the React app
npm start
```

✅ Browser will auto-open at http://localhost:3000 — THIS is your actual website!

---

## 🌐 WHAT RUNS WHERE

| URL | What it is | Should show |
|-----|-----------|-------------|
| http://localhost:8000 | Backend API | JSON like `{"status":"running"}` |
| http://localhost:8000/docs | API documentation | Swagger UI |
| http://localhost:3000 | Your React website | The full CRM app |

---

## ❌ ERROR FIXES

### "uvicorn not found" or "ModuleNotFoundError"
```bash
pip install fastapi uvicorn langchain langchain-groq langchain-core langgraph httpx
```

### "react-redux not found" or "axios not found"
```bash
# Make sure you are inside frontend folder first!
cd Downloads/crm-app/frontend
npm install
```

### "Could not import main" or "No such file"
```bash
# You are in wrong folder. Do this:
cd Downloads/crm-app/backend
python -m uvicorn main:app --reload --port 8000
```

### "Port 8000 already in use"
```bash
# Use a different port
python -m uvicorn main:app --reload --port 8001
# Then change API = 'http://localhost:8001' in frontend/src/App.js
```

### Blank white page on localhost:3000
- Press F12 → Console tab → Read the red error
- Usually means backend is not running → Start backend first

### CORS error in browser console
- Backend already has CORS enabled. Make sure backend IS running on port 8000.

---

## 🤖 5 LANGGRAPH TOOLS (For your video explanation)

| # | Tool Name | What it does |
|---|-----------|-------------|
| 1 | `log_interaction` | Saves meeting to DB. Uses LLM to summarize topics and generate AI follow-up suggestions |
| 2 | `edit_interaction` | Updates an existing record by ID. Changes any field |
| 3 | `search_hcp_history` | Finds past meetings with a doctor. Returns AI summary of the history |
| 4 | `suggest_followup_actions` | Recommends next steps for a sales rep based on HCP history |
| 5 | `analyze_interaction_text` | Parses free-form text ("Met Dr. Sharma today...") into structured CRM fields |

---

## 🎬 HOW TO DEMO THE 5 TOOLS IN YOUR VIDEO

In the Chat tab, type these one by one:

**Tool 5 + Tool 1 (analyze then log):**
> "Met Dr. Patel today at 3pm, discussed OncoBoost efficacy and Phase III results, gave 2 samples, he was very positive and interested"

**Tool 3 (search history):**
> "Show me interaction history for Dr. Patel"

**Tool 4 (suggest follow-up):**
> "Suggest follow-up actions for Dr. Patel"

**Tool 2 (edit):**
> "Edit interaction 1, change sentiment to Positive and add outcome: agreed to prescribe"

---

## 👤 Author
Rishabh — Full Stack Developer AI Applications
Assignment for AIVOA.AI
