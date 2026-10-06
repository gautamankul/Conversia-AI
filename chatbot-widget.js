(function () {
  // Read configuration from the script tag attributes
  const currentScript = document.currentScript;
  const API_URL = currentScript.getAttribute("data-api-url") || "http://localhost:8000/api/chat";
  const SITE_ID = currentScript.getAttribute("data-site-id") || "default_site";
  const BOT_NAME = currentScript.getAttribute("data-bot-name") || "Ask AI";
  const AVATAR_URL = currentScript.getAttribute("data-avatar-url") || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80";

  // Load marked.js dynamically for rich human-readable markdown rendering
  if (!window.marked) {
    const markedScript = document.createElement("script");
    markedScript.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    document.head.appendChild(markedScript);
  }

  // Inject CSS Styles
  const style = document.createElement("style");
  style.textContent = `
    #rag-widget-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    /* Floating Launcher Pill */
    #rag-widget-launcher {
      display: flex;
      align-items: center;
      background: #c000c0;
      padding: 4px;
      border-radius: 9999px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.2);
      cursor: pointer;
      user-select: none;
      transition: transform 0.2s ease;
    }
    #rag-widget-launcher:hover {
      transform: scale(1.02);
    }
    #rag-widget-launcher .avatar-ring {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 6px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #rag-widget-launcher .avatar-ring img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    #rag-widget-launcher .pill-content {
      background: #ffffff;
      height: 48px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      min-width: 180px;
      justify-content: space-between;
    }
    #rag-widget-launcher .pill-text {
      color: #3b5998;
      font-size: 18px;
      font-weight: 500;
    }
    #rag-widget-launcher .pill-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #737373;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin-left: 12px;
    }

    /* Chat Modal Window */
    #rag-chat-modal {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 380px;
      max-width: 90vw;
      height: 520px;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.18);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #eee;
    }
    #rag-chat-modal.open {
      display: flex;
    }

    /* Header */
    #rag-chat-header {
      background: #c000c0;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
    }
    .header-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      overflow: hidden;
      background: #fff;
      border: 2px solid white;
    }
    .header-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    #rag-close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 22px;
      cursor: pointer;
      line-height: 1;
    }

    /* Messages Section */
    #rag-chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #fff;
    }
    .msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
    }
    .msg.bot {
      background: #f1f3f6;
      color: #111827;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .msg.user {
      background: #f0e6f6;
      color: #1a0826;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
      font-weight: 500;
    }

    /* Markdown Styling Inside Bot Messages */
    .msg.bot p {
      margin: 0 0 8px 0;
    }
    .msg.bot p:last-child {
      margin-bottom: 0;
    }
    .msg.bot ul, .msg.bot ol {
      margin: 4px 0 8px 0;
      padding-left: 20px;
    }
    .msg.bot li {
      margin-bottom: 4px;
    }
    .msg.bot strong {
      color: #000;
    }

    /* Input Footer */
    #rag-chat-footer {
      padding: 12px 16px;
      background: #ffffff;
      border-top: 1px solid #f3f4f6;
    }
    .input-wrapper {
      display: flex;
      align-items: center;
      background: #eef2f6;
      border-radius: 16px;
      padding: 6px 12px;
    }
    .input-wrapper input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      padding: 8px 4px;
      font-size: 14px;
      color: #222;
    }
    .send-btn {
      width: 32px;
      height: 32px;
      background: #111827;
      border: none;
      border-radius: 50%;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .widget-disclaimer {
      font-size: 10px;
      color: #888;
      text-align: center;
      margin-top: 6px;
    }
  `;
  document.head.appendChild(style);

  // Build Widget DOM
  const widget = document.createElement("div");
  widget.id = "rag-widget-container";
  widget.innerHTML = `
    <div id="rag-chat-modal">
      <div id="rag-chat-header">
        <div class="header-user">
          <div class="header-avatar">
            <img src="${AVATAR_URL}" alt="avatar" />
          </div>
        </div>
        <button id="rag-close-btn">&times;</button>
      </div>

      <div id="rag-chat-messages">
        <div class="msg bot">Hello! How can I help you today?</div>
      </div>

      <div id="rag-chat-footer">
        <div class="input-wrapper">
          <input type="text" id="rag-input" placeholder="Ask a question..." />
          <button class="send-btn" id="rag-send-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
        <div class="widget-disclaimer">This chat is recorded. By chatting, you agree to terms.</div>
      </div>
    </div>

    <div id="rag-widget-launcher">
      <div class="avatar-ring">
        <img src="${AVATAR_URL}" alt="avatar" />
      </div>
      <div class="pill-content">
        <span class="pill-text">${BOT_NAME}</span>
        <div class="pill-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // Widget Logic
  const launcher = document.getElementById("rag-widget-launcher");
  const modal = document.getElementById("rag-chat-modal");
  const closeBtn = document.getElementById("rag-close-btn");
  const sendBtn = document.getElementById("rag-send-btn");
  const input = document.getElementById("rag-input");
  const messages = document.getElementById("rag-chat-messages");

  launcher.addEventListener("click", () => {
    modal.classList.add("open");
    launcher.style.display = "none";
    input.focus();
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
    launcher.style.display = "flex";
  });

  function renderContent(element, rawText) {
    if (window.marked && typeof window.marked.parse === "function") {
      element.innerHTML = window.marked.parse(rawText);
    } else {
      element.textContent = rawText;
    }
  }

  function appendMessage(text, sender) {
    const el = document.createElement("div");
    el.className = `msg ${sender}`;

    if (sender === "bot") {
      renderContent(el, text);
    } else {
      el.textContent = text;
    }

    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  async function handleSend() {
    const query = input.value.trim();
    if (!query) return;

    appendMessage(query, "user");
    input.value = "";
    sendBtn.disabled = true;

    const botLoading = appendMessage("Thinking...", "bot");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: SITE_ID,
          message: query,
        }),
      });

      const data = await response.json();
      const reply = data.reply || "Sorry, I could not retrieve an answer.";
      renderContent(botLoading, reply);
    } catch (err) {
      botLoading.textContent = "Error connecting to the service. Please try again later.";
    } finally {
      sendBtn.disabled = false;
      messages.scrollTop = messages.scrollHeight;
    }
  }

  sendBtn.addEventListener("click", handleSend);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
})();