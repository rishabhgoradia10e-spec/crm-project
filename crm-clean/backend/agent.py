import traceback
import json
import sqlite3
import operator
import os
from datetime import datetime
from typing import TypedDict, Annotated
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

# Load .env if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv optional

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")

llm = ChatGroq(api_key=GROQ_API_KEY, model="llama3-8b-8192", temperature=0.3)

def get_db():
    conn = sqlite3.connect("crm.db")
    conn.row_factory = sqlite3.Row
    return conn

# ══════════════════════════════════════════════
# TOOL 1 — Log Interaction
# ══════════════════════════════════════════════
@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str = "Meeting",
    date: str = "",
    time: str = "",
    attendees: str = "",
    topics_discussed: str = "",
    materials_shared: str = "",
    samples_distributed: str = "",
    sentiment: str = "Neutral",
    outcomes: str = "",
    follow_up_actions: str = ""
) -> str:
    """Save a new HCP interaction to the database. Use when user wants to log/record a meeting with a doctor."""
    try:
        # LLM summarizes topics
        if topics_discussed:
            r = llm.invoke([HumanMessage(content=f"Summarize in 2 sentences for a pharma CRM: {topics_discussed}")])
            topics_discussed = r.content.strip()

        # LLM generates follow-up suggestions
        r2 = llm.invoke([HumanMessage(content=f"Give 3 specific pharma sales follow-up actions for: HCP={hcp_name}, Topics={topics_discussed}, Sentiment={sentiment}. Bullet list only.")])
        ai_suggestions = r2.content.strip()

        now = datetime.now()
        conn = get_db()
        cur = conn.execute("""
            INSERT INTO interactions
            (hcp_name,interaction_type,date,time,attendees,topics_discussed,
             materials_shared,samples_distributed,sentiment,outcomes,
             follow_up_actions,ai_suggestions,created_at,updated_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (hcp_name, interaction_type,
              date or now.strftime("%Y-%m-%d"),
              time or now.strftime("%H:%M"),
              attendees, topics_discussed, materials_shared,
              samples_distributed, sentiment, outcomes,
              follow_up_actions, ai_suggestions,
              now.strftime("%Y-%m-%d %H:%M:%S"),
              now.strftime("%Y-%m-%d %H:%M:%S")))
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        return json.dumps({"success": True, "id": new_id,
                           "message": f"Interaction with {hcp_name} saved! ID: {new_id}",
                           "ai_suggestions": ai_suggestions})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ══════════════════════════════════════════════
# TOOL 2 — Edit Interaction
# ══════════════════════════════════════════════
@tool
def edit_interaction(
    interaction_id: int,
    hcp_name: str = "",
    interaction_type: str = "",
    topics_discussed: str = "",
    sentiment: str = "",
    outcomes: str = "",
    follow_up_actions: str = "",
    materials_shared: str = "",
    samples_distributed: str = ""
) -> str:
    """Edit/update an existing HCP interaction by its ID. Use when user wants to modify a saved record."""
    try:
        conn = get_db()
        row = conn.execute("SELECT * FROM interactions WHERE id=?", (interaction_id,)).fetchone()
        if not row:
            conn.close()
            return json.dumps({"success": False, "error": f"ID {interaction_id} not found"})

        updates = {k: v for k, v in {
            "hcp_name": hcp_name, "interaction_type": interaction_type,
            "topics_discussed": topics_discussed, "sentiment": sentiment,
            "outcomes": outcomes, "follow_up_actions": follow_up_actions,
            "materials_shared": materials_shared, "samples_distributed": samples_distributed
        }.items() if v}
        updates["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        clause = ", ".join(f"{k}=?" for k in updates)
        conn.execute(f"UPDATE interactions SET {clause} WHERE id=?", [*updates.values(), interaction_id])
        conn.commit()
        conn.close()
        return json.dumps({"success": True, "message": f"Interaction {interaction_id} updated!", "fields": list(updates.keys())})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ══════════════════════════════════════════════
# TOOL 3 — Search HCP History
# ══════════════════════════════════════════════
@tool
def search_hcp_history(hcp_name: str) -> str:
    """Search past interaction history for a specific HCP/doctor. Use when user asks about previous meetings."""
    try:
        conn = get_db()
        rows = conn.execute(
            "SELECT * FROM interactions WHERE hcp_name LIKE ? ORDER BY created_at DESC LIMIT 5",
            (f"%{hcp_name}%",)).fetchall()
        conn.close()
        if not rows:
            return json.dumps({"success": True, "message": f"No history found for {hcp_name}", "interactions": []})
        data = [dict(r) for r in rows]
        summary = llm.invoke([HumanMessage(content=f"Summarize interaction history for {hcp_name}: {json.dumps(data)}. 3 sentences: frequency, topics, sentiment trend.")])
        return json.dumps({"success": True, "count": len(data), "interactions": data, "summary": summary.content.strip()})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ══════════════════════════════════════════════
# TOOL 4 — Suggest Follow-up Actions
# ══════════════════════════════════════════════
@tool
def suggest_followup_actions(hcp_name: str, context: str = "") -> str:
    """Suggest AI-powered follow-up actions for an HCP. Use when user asks for recommendations or next steps."""
    try:
        conn = get_db()
        rows = conn.execute(
            "SELECT * FROM interactions WHERE hcp_name LIKE ? ORDER BY created_at DESC LIMIT 3",
            (f"%{hcp_name}%",)).fetchall()
        conn.close()
        history = [dict(r) for r in rows] if rows else []
        prompt = f"""Pharma sales AI. Suggest 4 follow-up actions for rep visiting {hcp_name}.
History: {json.dumps(history) if history else 'None yet'}
Context: {context}
Numbered list, specific and actionable."""
        r = llm.invoke([HumanMessage(content=prompt)])
        return json.dumps({"success": True, "hcp": hcp_name, "suggestions": r.content.strip()})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ══════════════════════════════════════════════
# TOOL 5 — Analyze & Extract from Text
# ══════════════════════════════════════════════
@tool
def analyze_interaction_text(text: str) -> str:
    """Extract structured CRM data from free-form text. Use FIRST when user types a natural language description of a meeting."""
    try:
        prompt = f"""Extract CRM fields from this text as JSON only, no explanation:
Text: "{text}"
Return exactly this JSON:
{{"hcp_name":"","interaction_type":"Meeting","date":"","time":"","topics_discussed":"","materials_shared":"","samples_distributed":"","sentiment":"Neutral","outcomes":"","follow_up_actions":"","attendees":""}}
Sentiment must be Positive/Neutral/Negative. Date as YYYY-MM-DD."""
        r = llm.invoke([HumanMessage(content=prompt)])
        content = r.content.strip().replace("```json", "").replace("```", "").strip()
        extracted = json.loads(content)
        return json.dumps({"success": True, "extracted": extracted})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ══════════════════════════════════════════════
# LangGraph Setup
# ══════════════════════════════════════════════
tools = [log_interaction, edit_interaction, search_hcp_history, suggest_followup_actions, analyze_interaction_text]
llm_with_tools = llm.bind_tools(tools)

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]

SYSTEM = """You are an AI assistant for a pharma CRM. Help reps log and manage HCP (doctor) interactions.
Tools available:
1. analyze_interaction_text — parse free text into structured fields
2. log_interaction — save a new meeting to database  
3. edit_interaction — update existing record by ID
4. search_hcp_history — find past meetings with a doctor
5. suggest_followup_actions — recommend next steps

When user describes a meeting in text: FIRST analyze_interaction_text, THEN log_interaction.
Be brief and professional."""

def agent_node(state):
    msgs = [SystemMessage(content=SYSTEM)] + state["messages"]
    return {"messages": [llm_with_tools.invoke(msgs)]}

def should_continue(state):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END

graph = StateGraph(AgentState)
graph.add_node("agent", agent_node)
graph.add_node("tools", ToolNode(tools))
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")
app_graph = graph.compile()

async def run_agent(message: str, history: list = []):
    try:
        msgs = []
        for m in history:
            msgs.append(HumanMessage(content=m["content"]) if m["role"] == "user" else AIMessage(content=m["content"]))
        msgs.append(HumanMessage(content=message))

        result = app_graph.invoke({"messages": msgs})
        final = result["messages"]

        last_ai = next((m for m in reversed(final) if isinstance(m, AIMessage) and not getattr(m, "tool_calls", None)), None)
        tool_results = []

        for m in final:
            if hasattr(m, "content") and isinstance(m.content, str):
                try:
                    p = json.loads(m.content)
                    if isinstance(p, dict) and "success" in p:
                        tool_results.append(p)
                except:
                    pass

        return {"response": last_ai.content if last_ai else "Done!", "tool_results": tool_results}

    except Exception as e:
      print("AGENT ERROR:")
    traceback.print_exc()
    raise e