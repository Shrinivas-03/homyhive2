// public/chatbot/chatbot.js
// Floating widget — uses dataset.apiPath (set by server partial)
(() => {
  const root = document.getElementById("homyChatRoot");
  if (!root) return;
  const API = root.dataset.apiPath || "/api/chat";
  // Build DOM
  const minimized = document.createElement("div");
  minimized.className = "hc-minimized";
  minimized.innerHTML = `<button id="hcOpenBtn" class="hc-toggle" aria-label="Open chat">H</button>`;
  const widget = document.createElement("div");
  widget.className = "hc-widget hidden";
  widget.innerHTML = `
    <div class="hc-header">
      <div style="display:flex;flex-direction:column">
        <div class="hc-title">HomyBot</div>
        <div class="hc-small">AI assistant — powered by RAG</div>
      </div>
      <div style="margin-left:auto">
        <button id="hcOpenFull" title="Open full chat" style="border:none;background:transparent;cursor:pointer;font-size:16px;color:#6b7280">↗</button>
        <button id="hcClose" title="Close" style="border:none;background:transparent;cursor:pointer;font-size:18px;color:#6b7280">✕</button>
      </div>
    </div>
    <div id="hcBody" class="hc-body" role="log" aria-live="polite"></div>
    <div class="hc-input">
      <textarea id="hcInput" placeholder="Ask about listing, verification, payouts..." aria-label="Message"></textarea>
      <button id="hcSend" class="hc-send">Send</button>
    </div>
  `;
  root.appendChild(minimized);
  root.appendChild(widget);

  const btnOpen = document.getElementById("hcOpenBtn");
  const btnClose = document.getElementById("hcClose");
  const btnSend = document.getElementById("hcSend");
  const btnFull = document.getElementById("hcOpenFull");
  const hcBody = document.getElementById("hcBody");
  const hcInput = document.getElementById("hcInput");

  // session storage key
  const HISTORY_KEY = "homy_chat_history_v1";
  let history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");

  function renderHistory() {
    hcBody.innerHTML = "";
    for (const m of history) appendMessage(m.role, m.text, false, m.meta);
    hcBody.scrollTop = hcBody.scrollHeight;
  }

  function appendMessage(role, text, save = true, meta = null) {
    const container = document.createElement("div");
    container.className = "hc-msg " + (role === "user" ? "user" : "bot");
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    // Basic markdown to HTML
    let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    bubble.innerHTML = html;
    container.appendChild(bubble);
    if (meta && meta.source_used) {
      const s = document.createElement("div");
      s.className = "hc-source";
      s.textContent = `Source: ${meta.source_used}`;
      container.appendChild(s);
    }
    hcBody.appendChild(container);
    hcBody.scrollTop = hcBody.scrollHeight;
    if (save) {
      history.push({ role, text, meta, t: Date.now() });
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-60)));
    }
  }

  function openWidget() {
    minimized.classList.add("hidden");
    widget.classList.remove("hidden");
    hcInput.focus();
    renderHistory();
  }
  function closeWidget() {
    widget.classList.add("hidden");
    minimized.classList.remove("hidden");
  }

  btnOpen.addEventListener("click", openWidget);
  btnClose.addEventListener("click", closeWidget);
  btnFull.addEventListener("click", () => {
    // open full chat page
    const current = encodeURIComponent(JSON.stringify(history.slice(-50)));
    // open in new tab — server-side /chat will mount full page
    window.open("/chat", "_blank");
  });

  async function sendMessage(text) {
    if (!text || !text.trim()) return;
    appendMessage("user", text);
    hcInput.value = "";
    hcInput.disabled = true;
    btnSend.disabled = true;

    // optimistic bot placeholder
    const place = document.createElement("div");
    place.className = "hc-msg bot";
    place.innerHTML = `<div class="bubble hc-loading">Thinking…</div>`;
    hcBody.appendChild(place);
    hcBody.scrollTop = hcBody.scrollHeight;

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, k: 3, temperature: 0.0 }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "Error");
        place.querySelector(".bubble").innerHTML = `Error: ${t}`;
      } else {
        const j = await res.json();
        const reply = (j && (j.reply || j.answer || j.text)) || "No response";

        // Basic markdown to HTML
        const html = reply.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        place.querySelector(".bubble").innerHTML = html;

        // show source if available
        if (j && j.source_used) {
          const s = document.createElement("div");
          s.className = "hc-source";
          s.textContent = `Source: ${j.source_used}`;
          place.appendChild(s);
        }
        // save in history
        history.push({
          role: "bot",
          text: reply,
          meta: { source_used: j.source_used || null },
          t: Date.now(),
        });
        sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-60)));
      }
    } catch (err) {
      console.error("Chat error", err);
      place.querySelector(".bubble").innerHTML = "Network error. Try again.";
    } finally {
      hcInput.disabled = false;
      btnSend.disabled = false;
      hcBody.scrollTop = hcBody.scrollHeight;
    }
  }

  btnSend.addEventListener("click", () => sendMessage(hcInput.value));
  hcInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(hcInput.value);
    }
  });

  // initial: render any history but remain minimized
  // renderHistory();
})();
