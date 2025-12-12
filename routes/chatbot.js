// routes/chatbot.js — simple proxy to your FastAPI RAG backend
const express = require("express");
const fetch = global.fetch || require("node-fetch");
const router = express.Router();

// Configure upstream FastAPI details via env (default local)
const FASTAPI_BASE = process.env.FASTAPI_BASE || "http://127.0.0.1:8000";
const FASTAPI_QUERY_ROUTE = process.env.FASTAPI_QUERY_ROUTE || "/query";

// POST /api/chat
// Accepts { message, k, temperature } and forwards to FastAPI /query
router.post("/api/chat", express.json(), async (req, res) => {
  try {
    const { message, k, temperature } = req.body || {};
    if (!message || !message.toString().trim()) {
      return res.status(400).json({ success: false, error: "message is required" });
    }

    const payload = { query: message };
    if (Number.isInteger(k)) payload.k = k;
    if (typeof temperature === "number") payload.temperature = temperature;

    const upstream = await fetch(FASTAPI_BASE + FASTAPI_QUERY_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!upstream.ok) {
      const txt = await upstream.text().catch(() => "");
      console.error("FastAPI /query error:", upstream.status, txt);
      return res.status(502).json({ success: false, error: "upstream error", details: txt });
    }

    const json = await upstream.json().catch(async () => {
      const text = await upstream.text();
      return { answer: text };
    });

    const reply = json.answer || json.reply || json.text || (typeof json === "string" ? json : null);
    return res.json({
      success: true,
      reply,
      source_used: json.source_used || null,
      retrieved: json.retrieved || null
    });
  } catch (err) {
    console.error("chat proxy error", err);
    return res.status(500).json({ success: false, error: "server error" });
  }
});

module.exports = router;
