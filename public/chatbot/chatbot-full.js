// public/chatbot/chatbot-full.js
// Full-screen chat UI — progressive, with sources panel & quick-actions
(() => {
  const root = document.getElementById('fullChatRoot');
  if (!root) return;
  const API = root.dataset.apiPath || '/api/chat';

  // Root HTML
  root.innerHTML = `
    <div class="hc-widget" style="width:100%;box-shadow:none;border-radius:8px;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #f3f4f6;background:#fff;">
        <div style="display:flex;gap:12px;align-items:center">
          <div style="width:48px;height:48px;border-radius:10px;background:linear-gradient(90deg,#ff7a7a,#fe424d);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700">H</div>
          <div>
            <div style="font-weight:700">HomyBot</div>
            <div class="hc-small">Get help with hosts, listings & verification</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="searchKb" placeholder="Search previous answers" style="padding:8px;border-radius:8px;border:1px solid #eee">
          <button id="clearChat" style="padding:8px;border-radius:8px;border:1px solid #eee;background:#fff">Clear</button>
        </div>
      </div>

      <div style="display:flex;gap:12px">
        <div style="flex:1;display:flex;flex-direction:column">
          <div id="fullBody" class="hc-body" style="height:560px"></div>
          <div style="padding:12px;border-top:1px solid #f3f4f6;background:#fff;display:flex;gap:8px">
            <textarea id="fullInput" placeholder="Ask HomyBot about listing, verification, payouts..." style="flex:1;padding:10px;border-radius:8px;border:1px solid #eee;min-height:56px"></textarea>
            <div style="display:flex;flex-direction:column;gap:8px">
              <button id="fullSend" style="padding:12px 16px;border-radius:8px;background:linear-gradient(90deg,#ff7a7a,#fe424d);color:#fff;border:none;cursor:pointer">Send</button>
              <button id="btnSources" style="padding:8px;border-radius:8px;border:1px solid #eee;background:#fff;cursor:pointer">Toggle sources</button>
            </div>
          </div>
        </div>

        <div style="width:320px;display:flex;flex-direction:column;gap:12px">
          <div id="sourcesPanel" style="background:#fff;border-radius:10px;padding:12px;box-shadow:0 10px 30px rgba(2,6,23,0.06);overflow:auto;max-height:420px;display:none">
            <h4 style="margin:0 0 8px">Sources</h4>
            <div id="sourcesList" class="small hc-small"></div>
          </div>

          <div style="background:#fff;border-radius:10px;padding:12px;box-shadow:0 10px 30px rgba(2,6,23,0.06)">
            <h4 style="margin:0 0 8px">Tips</h4>
            <ul class="small" style="margin:0;padding-left:18px;color:#6b7280">
              <li>Ask for verification status: "Is my ID verified?"</li>
              <li>Upload ID & ask: "What docs are missing?"</li>
              <li>Try quick actions on the right side of the page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  const fullBody = document.getElementById('fullBody');
  const fullInput = document.getElementById('fullInput');
  const fullSend = document.getElementById('fullSend');
  const clearBtn = document.getElementById('clearChat');
  const sourcesPanel = document.getElementById('sourcesPanel');
  const sourcesList = document.getElementById('sourcesList');
  const btnSources = document.getElementById('btnSources');

  // history (session)
  const KEY = 'homy_full_history_v1';
  let history = JSON.parse(sessionStorage.getItem(KEY) || '[]');

  function renderHistory() {
    fullBody.innerHTML = '';
    for (const m of history) {
      const wrapper = document.createElement('div');
      wrapper.className = 'hc-msg ' + (m.role === 'user' ? 'user' : 'bot');
      wrapper.style.marginBottom = '12px';
      const b = document.createElement('div');
      b.className = 'bubble';
      b.textContent = m.text;
      wrapper.appendChild(b);
      if (m.meta && m.meta.retrieved && Array.isArray(m.meta.retrieved)) {
        const v = document.createElement('div'); v.className = 'hc-source';
        v.textContent = `Retrieved ${m.meta.retrieved.length} docs`;
        wrapper.appendChild(v);
      }
      fullBody.appendChild(wrapper);
    }
    fullBody.scrollTop = fullBody.scrollHeight;
  }

  function saveHistory() { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-200))); }

  async function sendFullMessage(text) {
    if (!text || !text.trim()) return;
    history.push({ role: 'user', text, t: Date.now() });
    saveHistory(); renderHistory();
    fullInput.value = '';
    // optimistic placeholder
    const place = { role: 'bot', text: 'Thinking…', meta: null };
    history.push(place); saveHistory(); renderHistory();

    try {
      const res = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, k: 5, temperature: 0.0 })
      });
      if (!res.ok) {
        const t = await res.text().catch(()=> 'Error');
        history[history.length - 1] = { role: 'bot', text: 'Error: ' + t, meta: null, t: Date.now() };
      } else {
        const j = await res.json();
        const reply = j && (j.reply || j.answer || '') || 'No response';
        history[history.length - 1] = { role: 'bot', text: reply, meta: { source_used: j.source_used || null, retrieved: j.retrieved || [] }, t: Date.now() };
        // populate sources panel
        if (j && j.retrieved && Array.isArray(j.retrieved)) {
          sourcesList.innerHTML = '';
          j.retrieved.forEach((r, idx) => {
            const el = document.createElement('div');
            el.style.padding = '8px 6px'; el.style.borderBottom = '1px solid #f3f4f6';
            el.innerHTML = `<strong>Doc ${idx+1}</strong><div class="small" style="color:#6b7280">${r.title || r.id || r.source || 'snippet'}</div><div style="margin-top:6px">${(r.snippet || r.text || '').slice(0,300)}</div>`;
            sourcesList.appendChild(el);
          });
        }
      }
    } catch (err) {
      console.error(err);
      history[history.length - 1] = { role: 'bot', text: 'Network error', meta: null, t: Date.now() };
    } finally {
      saveHistory(); renderHistory();
    }
  }

  // events & quick actions
  root.addEventListener('quickAction', (e) => {
    const d = e.detail;
    if (d === 'show-verification') {
      sendFullMessage('Show my verification status');
    } else if (d === 'open-listing') {
      sendFullMessage('Open my listing details');
    } else if (d === 'upload-id') {
      sendFullMessage('How can I upload my ID?');
    }
  });

  btnSources.addEventListener('click', () => {
    sourcesPanel.style.display = sourcesPanel.style.display === 'none' ? 'block' : 'none';
  });

  fullSend.addEventListener('click', () => sendFullMessage(fullInput.value));
  fullInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFullMessage(fullInput.value); } });

  clearBtn.addEventListener('click', () => { history = []; saveHistory(); renderHistory(); sourcesList.innerHTML = ''; });

  // initial render
  renderHistory();
})();
