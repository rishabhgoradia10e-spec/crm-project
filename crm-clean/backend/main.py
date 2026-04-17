from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
from datetime import datetime
from agent import run_agent

app = FastAPI(title="HCP CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect("crm.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hcp_name TEXT NOT NULL,
        interaction_type TEXT DEFAULT 'Meeting',
        date TEXT, time TEXT, attendees TEXT,
        topics_discussed TEXT, materials_shared TEXT,
        samples_distributed TEXT, sentiment TEXT DEFAULT 'Neutral',
        outcomes TEXT, follow_up_actions TEXT, ai_suggestions TEXT,
        created_at TEXT, updated_at TEXT
    )""")
    conn.commit()
    conn.close()

init_db()

class InteractionCreate(BaseModel):
    hcp_name: str
    interaction_type: Optional[str] = "Meeting"
    date: Optional[str] = None
    time: Optional[str] = None
    attendees: Optional[str] = ""
    topics_discussed: Optional[str] = ""
    materials_shared: Optional[str] = ""
    samples_distributed: Optional[str] = ""
    sentiment: Optional[str] = "Neutral"
    outcomes: Optional[str] = ""
    follow_up_actions: Optional[str] = ""
    ai_suggestions: Optional[str] = ""

class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []

@app.get("/")
def root():
    return {"status": "running", "message": "HCP CRM API is live!"}

@app.get("/interactions")
def get_all():
    conn = get_db()
    rows = conn.execute("SELECT * FROM interactions ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/interactions/{iid}")
def get_one(iid: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM interactions WHERE id=?", (iid,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Not found")
    return dict(row)

@app.post("/interactions")
def create(data: InteractionCreate):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db()
    cur = conn.execute("""INSERT INTO interactions
        (hcp_name,interaction_type,date,time,attendees,topics_discussed,
         materials_shared,samples_distributed,sentiment,outcomes,
         follow_up_actions,ai_suggestions,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (data.hcp_name, data.interaction_type, data.date, data.time,
         data.attendees, data.topics_discussed, data.materials_shared,
         data.samples_distributed, data.sentiment, data.outcomes,
         data.follow_up_actions, data.ai_suggestions, now, now))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id, "message": "Saved!"}

@app.put("/interactions/{iid}")
def update(iid: int, data: InteractionUpdate):
    conn = get_db()
    if not conn.execute("SELECT id FROM interactions WHERE id=?", (iid,)).fetchone():
        conn.close()
        raise HTTPException(404, "Not found")
    updates = {k: v for k, v in data.dict().items() if v is not None}
    updates["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    clause = ", ".join(f"{k}=?" for k in updates)
    conn.execute(f"UPDATE interactions SET {clause} WHERE id=?", [*updates.values(), iid])
    conn.commit()
    conn.close()
    return {"message": "Updated!"}

@app.delete("/interactions/{iid}")
def delete(iid: int):
    conn = get_db()
    conn.execute("DELETE FROM interactions WHERE id=?", (iid,))
    conn.commit()
    conn.close()
    return {"message": "Deleted!"}

@app.post("/chat")
async def chat(data: ChatMessage):
    try:
        result = await run_agent(data.message, data.conversation_history)
        return result
    except Exception as e:
        raise HTTPException(500, str(e))
