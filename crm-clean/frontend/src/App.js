import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setInteractions, setSelected } from './store';

const API = 'http://127.0.0.1:8000';

/* ─── tiny style helpers ─────────────────────────────── */
const S = {
  sentimentColor: s => s === 'Positive' ? '#10B981' : s === 'Negative' ? '#EF4444' : '#94A3B8',
  sentimentBg:   s => s === 'Positive' ? '#D1FAE5' : s === 'Negative' ? '#FEE2E2' : '#F1F5F9',
};

/* ─── reusable input style ───────────────────────────── */
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #E2E8F0', fontFamily: 'Inter', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};

/* ══════════════════════════════════════════════════════
   FORM TAB
══════════════════════════════════════════════════════ */
function FormTab({ onRefresh }) {
  const empty = {
    hcp_name: '', interaction_type: 'Meeting',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    attendees: '', topics_discussed: '', materials_shared: '',
    samples_distributed: '', sentiment: 'Neutral', outcomes: '', follow_up_actions: '',
  };
  const [form, setForm]   = useState(empty);
  const [mode, setMode]   = useState('log');   // 'log' | 'edit'
  const [editId, setEditId] = useState('');
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState(null);    // {type:'ok'|'err', text}
  const [aiSug, setAiSug] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchForEdit = async () => {
    if (!editId) return alert('Enter an interaction ID first');
    try {
      const r = await axios.get(`${API}/interactions/${editId}`);
      setForm({ ...empty, ...r.data });
      setMsg(null); setAiSug('');
    } catch { alert(`Interaction ID ${editId} not found`); }
  };

  const submit = async () => {
    if (!form.hcp_name.trim()) return alert('HCP Name is required!');
    setBusy(true); setMsg(null);
    try {
      if (mode === 'edit' && editId) {
        await axios.put(`${API}/interactions/${editId}`, form);
        setMsg({ type: 'ok', text: `✅ Interaction #${editId} updated!` });
      } else {
        const r = await axios.post(`${API}/interactions`, form);
        setMsg({ type: 'ok', text: `✅ Logged! Interaction ID: ${r.data.id}` });
        setForm(empty);
      }
      onRefresh();
    } catch (e) {
      setMsg({ type: 'err', text: '❌ Error: ' + (e.response?.data?.detail || e.message) });
    }
    setBusy(false);
  };

  const getAISuggestions = async () => {
    if (!form.topics_discussed) return alert('Fill Topics Discussed first');
    setBusy(true);
    try {
      const r = await axios.post(`${API}/chat`, {
        message: `Suggest follow-up actions for ${form.hcp_name || 'HCP'} based on: ${form.topics_discussed}`,
        conversation_history: [],
      });
      setAiSug(r.data.response);
    } catch { alert('Backend not reachable'); }
    setBusy(false);
  };

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['log', 'edit'].map(m => (
          <button key={m} onClick={() => { setMode(m); setMsg(null); setAiSug(''); }}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'Inter', fontWeight: 600, fontSize: 13,
              background: mode === m ? '#2563EB' : '#F1F5F9',
              color: mode === m ? '#fff' : '#334155' }}>
            {m === 'log' ? '📝 Log New Interaction' : '✏️ Edit Existing'}
          </button>
        ))}
      </div>

      {/* Edit ID fetch */}
      {mode === 'edit' && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 8 }}>INTERACTION ID TO EDIT</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="e.g. 3" value={editId} onChange={e => setEditId(e.target.value)} />
            <button onClick={fetchForEdit} style={{ padding: '9px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer' }}>
              Fetch
            </button>
          </div>
        </div>
      )}

      {/* Main form */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>🏥 HCP Interaction Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>HCP NAME *</label>
            <input style={inputStyle} placeholder="Dr. Sharma / Dr. Patel..." value={form.hcp_name} onChange={e => set('hcp_name', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>INTERACTION TYPE</label>
            <select style={inputStyle} value={form.interaction_type} onChange={e => set('interaction_type', e.target.value)}>
              {['Meeting', 'Call', 'Email', 'Conference', 'Workshop'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>DATE</label>
            <input type="date" style={inputStyle} value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>TIME</label>
            <input type="time" style={inputStyle} value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>ATTENDEES</label>
          <input style={inputStyle} placeholder="Other people present..." value={form.attendees} onChange={e => set('attendees', e.target.value)} />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>TOPICS DISCUSSED</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Key discussion points..."
            value={form.topics_discussed} onChange={e => set('topics_discussed', e.target.value)} />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>💊 Materials & Samples</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>MATERIALS SHARED</label>
            <input style={inputStyle} placeholder="Brochures, PDFs..." value={form.materials_shared} onChange={e => set('materials_shared', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>SAMPLES DISTRIBUTED</label>
            <input style={inputStyle} placeholder="Product samples..." value={form.samples_distributed} onChange={e => set('samples_distributed', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>📊 Outcomes & Follow-up</h3>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 8 }}>HCP SENTIMENT</label>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Positive', 'Neutral', 'Negative'].map(s => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="radio" name="sentiment" checked={form.sentiment === s} onChange={() => set('sentiment', s)} />
                <span style={{ background: S.sentimentBg(s), color: S.sentimentColor(s), padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                  {s === 'Positive' ? '😊' : s === 'Negative' ? '😞' : '😐'} {s}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>OUTCOMES</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="What was agreed/achieved..."
            value={form.outcomes} onChange={e => set('outcomes', e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>FOLLOW-UP ACTIONS</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="Next steps..."
            value={form.follow_up_actions} onChange={e => set('follow_up_actions', e.target.value)} />
        </div>

        {aiSug && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 14, marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', marginBottom: 6 }}>🤖 AI SUGGESTED FOLLOW-UPS</div>
            <div style={{ fontSize: 13, color: '#1E40AF', whiteSpace: 'pre-wrap' }}>{aiSug}</div>
          </div>
        )}

        {msg && (
          <div style={{ background: msg.type === 'ok' ? '#D1FAE5' : '#FEE2E2', borderRadius: 8, padding: 12, marginTop: 14, fontSize: 14, color: msg.type === 'ok' ? '#065F46' : '#991B1B' }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={submit} disabled={busy}
            style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Inter', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            {busy ? '⏳ Processing...' : mode === 'edit' ? '✏️ Update Interaction' : '📝 Log Interaction'}
          </button>
          <button onClick={getAISuggestions} disabled={busy}
            style={{ padding: '10px 24px', background: '#F1F5F9', color: '#334155', border: 'none', borderRadius: 8, fontFamily: 'Inter', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            🤖 AI Suggest Follow-ups
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CHAT TAB
══════════════════════════════════════════════════════ */
function ChatTab({ onRefresh }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '👋 Hi! I\'m your AI CRM assistant.\n\nTry saying:\n• "Met Dr. Patel today, discussed OncoBoost efficacy, gave 2 samples, he was positive"\n• "Show history for Dr. Sharma"\n• "Edit interaction 1, change sentiment to Positive"\n• "Suggest follow-ups for Dr. Mehta"\n\nWhat would you like to do?'
  }]);
  const [input, setInput] = useState('');
  const [busy, setBusy]   = useState(false);
  const history = useRef([]);
  const bottom  = useRef(null);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: text }]);
    setBusy(true);
    try {
      const r = await axios.post(
        `${API}/chat`,
        { message: text, conversation_history: history.current },
        { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
      );
      const reply = r.data?.response || r.data?.message || JSON.stringify(r.data);
      history.current = [...history.current,
        { role: 'user', content: text },
        { role: 'assistant', content: reply }
      ];
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
      onRefresh();
    } catch (e) {
      const status  = e?.response?.status;
      const detail  = e?.response?.data?.detail || e?.response?.data || e?.message || 'unknown';
      console.error('Chat error:', e);
      setMessages(m => [...m, { role: 'assistant', content:
        `❌ Error${status ? ' ' + status : ''}: ${JSON.stringify(detail)}\n\n` +
        `Debug steps:\n` +
        `1. Open http://127.0.0.1:8000 in browser → must show {"status":"running"}\n` +
        `2. If blank → backend crashed, check terminal for Python error\n` +
        `3. Try: http://127.0.0.1:8000/docs to test /chat directly`
      }]);
    }
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth: '80%', padding: '12px 16px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: m.role === 'user' ? '#2563EB' : '#fff',
            color: m.role === 'user' ? '#fff' : '#1E293B',
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            border: m.role !== 'user' ? '1px solid #E2E8F0' : 'none',
          }}>{m.content}</div>
        ))}
        {busy && (
          <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: '#F1F5F9', borderRadius: '16px 16px 16px 4px', fontSize: 14, color: '#64748B' }}>
            🤖 AI is thinking...
          </div>
        )}
        <div ref={bottom} />
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '14px 20px', background: '#fff', borderTop: '1px solid #E2E8F0' }}>
        <input style={{ ...inputStyle, flex: 1 }}
          placeholder='Describe a meeting or ask anything... Press Enter to send'
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} disabled={busy}
          style={{ padding: '9px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer' }}>
          {busy ? '⏳' : '➤ Send'}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════ */
function Sidebar({ interactions, selected, onSelect }) {
  return (
    <div style={{ width: 270, background: '#fff', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.5px' }}>
        INTERACTIONS ({interactions.length})
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {interactions.length === 0 && (
          <div style={{ padding: 20, color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>
            No interactions yet.<br />Log one to get started!
          </div>
        )}
        {interactions.map(i => (
          <div key={i.id} onClick={() => onSelect(i)}
            style={{ padding: '12px 18px', cursor: 'pointer', borderLeft: selected?.id === i.id ? '3px solid #2563EB' : '3px solid transparent',
              background: selected?.id === i.id ? '#EFF6FF' : 'transparent', transition: 'all 0.15s' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>👨‍⚕️ {i.hcp_name}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>#{i.id} · {i.interaction_type} · {i.date}</div>
            <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 12, marginTop: 6, display: 'inline-block',
              background: S.sentimentBg(i.sentiment), color: S.sentimentColor(i.sentiment) }}>
              {i.sentiment}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DETAIL PANEL
══════════════════════════════════════════════════════ */
function Detail({ item }) {
  if (!item) return (
    <div style={{ textAlign: 'center', color: '#94A3B8', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
      <div>Click an interaction from the sidebar to view details</div>
    </div>
  );
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>👨‍⚕️ {item.hcp_name}</h2>
        <span style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, background: S.sentimentBg(item.sentiment), color: S.sentimentColor(item.sentiment), fontWeight: 600 }}>
          {item.sentiment}
        </span>
      </div>
      {[['ID', item.id], ['Type', item.interaction_type], ['Date', item.date], ['Time', item.time],
        ['Attendees', item.attendees], ['Topics', item.topics_discussed], ['Materials', item.materials_shared],
        ['Samples', item.samples_distributed], ['Outcomes', item.outcomes], ['Follow-up', item.follow_up_actions]
      ].filter(([, v]) => v).map(([k, v]) => (
        <div key={k} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>{k.toUpperCase()}</div>
          <div style={{ fontSize: 14 }}>{v}</div>
        </div>
      ))}
      {item.ai_suggestions && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 14, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', marginBottom: 6 }}>🤖 AI SUGGESTIONS</div>
          <div style={{ fontSize: 13, color: '#1E40AF', whiteSpace: 'pre-wrap' }}>{item.ai_suggestions}</div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   APP ROOT
══════════════════════════════════════════════════════ */
export default function App() {
  const dispatch      = useDispatch();
  const interactions  = useSelector(s => s.interactions.list);
  const selected      = useSelector(s => s.interactions.selected);
  const [tab, setTab] = useState('form');

  const refresh = async () => {
    try {
      const r = await axios.get(`${API}/interactions`);
      dispatch(setInteractions(r.data));
    } catch {}
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F8FAFC', minHeight: '100vh', color: '#1E293B' }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Header */}
      <header style={{ background: '#2563EB', color: '#fff', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(37,99,235,.4)' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>🏥 HCP CRM</span>
          <span style={{ opacity: 0.75, fontSize: 13, marginLeft: 10 }}>AIVOA.AI — AI-First CRM</span>
        </div>
        <span style={{ fontSize: 12, opacity: 0.8 }}>LangGraph + Groq (gemma2-9b-it)</span>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        <Sidebar interactions={interactions} selected={selected} onSelect={i => { dispatch(setSelected(i)); setTab('detail'); }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', padding: '0 20px' }}>
            {[['form','📝 Log Interaction (Form)'], ['chat','🤖 AI Chat'], ['detail','📋 View Details']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ padding: '15px 18px', border: 'none', background: 'none', fontFamily: 'Inter', fontSize: 14,
                  fontWeight: tab === id ? 600 : 400, color: tab === id ? '#2563EB' : '#64748B', cursor: 'pointer',
                  borderBottom: tab === id ? '2px solid #2563EB' : '2px solid transparent', transition: 'all 0.15s' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: tab === 'chat' ? 'hidden' : 'auto', padding: tab === 'chat' ? 0 : 24, display: tab === 'chat' ? 'flex' : 'block', flexDirection: 'column' }}>
            {tab === 'form'   && <FormTab onRefresh={refresh} />}
            {tab === 'chat'   && <ChatTab onRefresh={refresh} />}
            {tab === 'detail' && <Detail item={selected} />}
          </div>
        </div>
      </div>
    </div>
  );
}
