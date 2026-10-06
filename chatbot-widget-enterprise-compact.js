(function () {

  // ============================================================
  // CONFIGURATION
  // ============================================================

  const currentScript = document.currentScript;

  const API_URL =
    currentScript.getAttribute("data-api-url") ||
    "http://localhost:8000/api/chat";

  const SITE_ID =
    currentScript.getAttribute("data-site-id") ||
    "default_site";

  const BOT_NAME =
    currentScript.getAttribute("data-bot-name") ||
    "Ask AI";

  const AVATAR_URL =
    currentScript.getAttribute("data-avatar-url") ||
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80";


  // ============================================================
  // LOAD MARKED.JS FOR HUMAN-READABLE MARKDOWN
  // ============================================================

  function loadMarkdownRenderer() {

    return new Promise((resolve) => {

      // Already loaded
      if (
        window.marked &&
        typeof window.marked.parse === "function"
      ) {
        resolve();
        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        console.warn(
          "Markdown renderer could not be loaded."
        );

        resolve();
      };

      document.head.appendChild(script);

    });

  }


  // ============================================================
  // CSS
  // ============================================================

  const style =
    document.createElement("style");

  style.textContent = `

    /* ==========================================================
       MAIN CONTAINER
       ========================================================== */

    #rag-widget-container {

      position: fixed;

      bottom: 16px;
      right: 16px;

      z-index: 999999;

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;

    }


    /* ==========================================================
       FLOATING LAUNCHER
       ========================================================== */

    #rag-widget-launcher {

      display: flex;

      align-items: center;

      background: #c000c0;

      padding: 3px;

      border-radius: 999px;

      box-shadow:
        0 4px 18px rgba(0, 0, 0, 0.16);

      cursor: pointer;

      user-select: none;

      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

    }


    #rag-widget-launcher:hover {

      transform: scale(1.02);

      box-shadow:
        0 6px 22px rgba(0, 0, 0, 0.20);

    }


    /* ==========================================================
       LAUNCHER AVATAR
       ========================================================== */

    #rag-widget-launcher .avatar-ring {

      width: 40px;
      height: 40px;

      border-radius: 50%;

      overflow: hidden;

      margin-right: 4px;

      background: #ffffff;

      display: flex;

      align-items: center;

      justify-content: center;

      flex-shrink: 0;

    }


    #rag-widget-launcher .avatar-ring img {

      width: 100%;
      height: 100%;

      object-fit: cover;

    }


    /* ==========================================================
       LAUNCHER TEXT
       ========================================================== */

    #rag-widget-launcher .pill-content {

      background: #ffffff;

      height: 40px;

      border-radius: 999px;

      display: flex;

      align-items: center;

      padding: 0 11px;

      min-width: 140px;

      justify-content: space-between;

    }


    #rag-widget-launcher .pill-text {

      color: #3b5998;

      font-size: 14px;

      font-weight: 600;

      white-space: nowrap;

    }


    /* ==========================================================
       LAUNCHER BUTTON
       ========================================================== */

    #rag-widget-launcher .pill-btn {

      width: 28px;
      height: 28px;

      border-radius: 50%;

      background: #737373;

      display: flex;

      align-items: center;

      justify-content: center;

      color: #ffffff;

      margin-left: 7px;

      flex-shrink: 0;

    }


    /* ==========================================================
       CHAT WINDOW
       ========================================================== */

    #rag-chat-modal {

      position: absolute;

      bottom: 52px;

      right: 0;

      width: 340px;

      max-width:
        calc(100vw - 24px);

      height: 440px;

      background: #ffffff;

      border-radius: 14px;

      box-shadow:
        0 12px 35px rgba(0, 0, 0, 0.16);

      display: none;

      flex-direction: column;

      overflow: hidden;

      border: 1px solid #e5e7eb;

    }


    #rag-chat-modal.open {

      display: flex;

    }


    /* ==========================================================
       CHAT HEADER
       ========================================================== */

    #rag-chat-header {

      background: #c000c0;

      padding: 11px 13px;

      display: flex;

      align-items: center;

      justify-content: space-between;

      color: #ffffff;

      flex-shrink: 0;

    }


    .header-user {

      display: flex;

      align-items: center;

      gap: 9px;

      min-width: 0;

    }


    .header-avatar {

      width: 36px;
      height: 36px;

      border-radius: 50%;

      overflow: hidden;

      background: #ffffff;

      border: 2px solid #ffffff;

      flex-shrink: 0;

    }


    .header-avatar img {

      width: 100%;
      height: 100%;

      object-fit: cover;

    }


    .header-info {

      display: flex;

      flex-direction: column;

      min-width: 0;

    }


    .header-name {

      font-size: 14px;

      font-weight: 600;

      white-space: nowrap;

      overflow: hidden;

      text-overflow: ellipsis;

    }


    .header-status {

      font-size: 10px;

      opacity: 0.85;

      margin-top: 1px;

    }


    /* ==========================================================
       CLOSE BUTTON
       ========================================================== */

    #rag-close-btn {

      background: transparent;

      border: none;

      color: #ffffff;

      font-size: 20px;

      cursor: pointer;

      line-height: 1;

      width: 28px;

      height: 28px;

      border-radius: 50%;

      display: flex;

      align-items: center;

      justify-content: center;

      transition:
        background 0.2s ease;

    }


    #rag-close-btn:hover {

      background:
        rgba(255,255,255,0.15);

    }


    /* ==========================================================
       MESSAGE AREA
       ========================================================== */

    #rag-chat-messages {

      flex: 1;

      padding: 11px 13px;

      overflow-y: auto;

      display: flex;

      flex-direction: column;

      gap: 8px;

      background: #ffffff;

      scroll-behavior: smooth;

    }


    /* ==========================================================
       SCROLLBAR
       ========================================================== */

    #rag-chat-messages::-webkit-scrollbar {

      width: 5px;

    }


    #rag-chat-messages::-webkit-scrollbar-track {

      background: transparent;

    }


    #rag-chat-messages::-webkit-scrollbar-thumb {

      background: #d1d5db;

      border-radius: 10px;

    }


    /* ==========================================================
       MESSAGE
       ========================================================== */

    .msg {

      max-width: 85%;

      padding: 8px 11px;

      border-radius: 12px;

      font-size: 13px;

      line-height: 1.5;

      word-break: break-word;

    }


    /* ==========================================================
       BOT MESSAGE
       ========================================================== */

    .msg.bot {

      background: #f1f3f6;

      color: #111827;

      align-self: flex-start;

      border-bottom-left-radius: 4px;

    }


    /* ==========================================================
       USER MESSAGE
       ========================================================== */

    .msg.user {

      background: #f0e6f6;

      color: #1a0826;

      align-self: flex-end;

      border-bottom-right-radius: 4px;

      font-weight: 500;

    }


    /* ==========================================================
       HUMAN-READABLE MARKDOWN
       ========================================================== */

    .msg.bot p {

      margin: 0 0 8px 0;

    }


    .msg.bot p:last-child {

      margin-bottom: 0;

    }


    .msg.bot strong {

      font-weight: 700;

      color: #111827;

    }


    .msg.bot em {

      font-style: italic;

    }


    .msg.bot h1,
    .msg.bot h2,
    .msg.bot h3 {

      margin: 8px 0 6px;

      line-height: 1.3;

      color: #111827;

    }


    .msg.bot h1 {

      font-size: 18px;

    }


    .msg.bot h2 {

      font-size: 16px;

    }


    .msg.bot h3 {

      font-size: 15px;

    }


    .msg.bot ul,
    .msg.bot ol {

      margin: 6px 0 8px;

      padding-left: 20px;

    }


    .msg.bot li {

      margin-bottom: 4px;

    }


    .msg.bot blockquote {

      margin: 8px 0;

      padding-left: 10px;

      border-left: 3px solid #c000c0;

      color: #4b5563;

    }


    .msg.bot a {

      color: #5b21b6;

      text-decoration: underline;

    }


    .msg.bot code {

      background: #e5e7eb;

      color: #111827;

      padding: 2px 5px;

      border-radius: 4px;

      font-size: 12px;

    }


    .msg.bot pre {

      background: #111827;

      color: #ffffff;

      padding: 10px;

      border-radius: 8px;

      overflow-x: auto;

      margin: 8px 0;

      font-size: 12px;

    }


    .msg.bot pre code {

      background: transparent;

      color: inherit;

      padding: 0;

    }


    /* ==========================================================
       INPUT FOOTER
       ========================================================== */

    #rag-chat-footer {

      padding: 9px 12px;

      background: #ffffff;

      border-top: 1px solid #f3f4f6;

      flex-shrink: 0;

    }


    .input-wrapper {

      display: flex;

      align-items: center;

      background: #eef2f6;

      border-radius: 14px;

      padding: 4px 9px;

    }


    .input-wrapper input {

      flex: 1;

      min-width: 0;

      border: none;

      outline: none;

      background: transparent;

      padding: 6px 4px;

      font-size: 13px;

      color: #222222;

    }


    .input-wrapper input::placeholder {

      color: #9ca3af;

    }


    /* ==========================================================
       SEND BUTTON
       ========================================================== */

    .send-btn {

      width: 28px;

      height: 28px;

      background: #111827;

      border: none;

      border-radius: 50%;

      color: #ffffff;

      display: flex;

      align-items: center;

      justify-content: center;

      cursor: pointer;

      transition:
        opacity 0.2s ease,
        transform 0.2s ease;

      flex-shrink: 0;

    }


    .send-btn:hover {

      transform: scale(1.05);

    }


    .send-btn:disabled {

      opacity: 0.4;

      cursor: not-allowed;

      transform: none;

    }


    /* ==========================================================
       DISCLAIMER
       ========================================================== */

    .widget-disclaimer {

      font-size: 9px;

      color: #888888;

      text-align: center;

      margin-top: 5px;

    }


    /* ==========================================================
       MOBILE
       ========================================================== */

    @media (max-width: 600px) {

      #rag-widget-container {

        bottom: 12px;

        right: 12px;

        left: 12px;

      }


      #rag-widget-launcher {

        width: fit-content;

        margin-left: auto;

      }


      #rag-chat-modal {

        right: 0;

        bottom: 50px;

        width:
          calc(100vw - 24px);

        max-width:
          calc(100vw - 24px);

        height:
          min(440px, 68vh);

        border-radius: 14px;

      }


      #rag-widget-launcher .pill-content {

        min-width: 130px;

        height: 40px;

      }


      #rag-widget-launcher .pill-text {

        font-size: 13px;

      }

    }


    /* ==========================================================
       VERY SMALL SCREENS
       ========================================================== */

    @media (max-width: 380px) {

      #rag-widget-launcher .pill-content {

        min-width: 115px;

      }


      #rag-widget-launcher .pill-text {

        font-size: 12px;

      }


      #rag-chat-modal {

        height: 65vh;

      }

    }

  `;

  document.head.appendChild(style);


  // ============================================================
  // CREATE WIDGET
  // ============================================================

  const widget =
    document.createElement("div");

  widget.id =
    "rag-widget-container";


  widget.innerHTML = `

    <!-- CHAT WINDOW -->

    <div id="rag-chat-modal">

      <!-- HEADER -->

      <div id="rag-chat-header">

        <div class="header-user">

          <div class="header-avatar">

            <img
              src="${AVATAR_URL}"
              alt="AI Assistant"
            />

          </div>


          <div class="header-info">

            <div class="header-name">
              ${escapeHtml(BOT_NAME)}
            </div>

            <div class="header-status">
              ● Online
            </div>

          </div>

        </div>


        <button
          id="rag-close-btn"
          aria-label="Close chat"
          type="button"
        >
          &times;
        </button>

      </div>


      <!-- MESSAGES -->

      <div id="rag-chat-messages">

        <div class="msg bot">

          <p>
            Hello! 👋 How can I help you today?
          </p>

        </div>

      </div>


      <!-- FOOTER -->

      <div id="rag-chat-footer">

        <div class="input-wrapper">

          <input
            type="text"
            id="rag-input"
            placeholder="Ask a question..."
            autocomplete="off"
            aria-label="Message"
          />


          <button
            class="send-btn"
            id="rag-send-btn"
            type="button"
            aria-label="Send message"
          >

            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >

              <line
                x1="12"
                y1="19"
                x2="12"
                y2="5"
              ></line>

              <polyline
                points="5 12 12 5 19 12"
              ></polyline>

            </svg>

          </button>

        </div>


        <div class="widget-disclaimer">

          This chat is recorded. By chatting,
          you agree to terms.

        </div>

      </div>

    </div>


    <!-- LAUNCHER -->

    <div
      id="rag-widget-launcher"
      role="button"
      tabindex="0"
      aria-label="Open chat"
    >

      <div class="avatar-ring">

        <img
          src="${AVATAR_URL}"
          alt="AI Assistant"
        />

      </div>


      <div class="pill-content">

        <span class="pill-text">
          ${escapeHtml(BOT_NAME)}
        </span>


        <div class="pill-btn">

          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >

            <line
              x1="12"
              y1="19"
              x2="12"
              y2="5"
            ></line>

            <polyline
              points="5 12 12 5 19 12"
            ></polyline>

          </svg>

        </div>

      </div>

    </div>

  `;


  document.body.appendChild(widget);


  // ============================================================
  // ELEMENTS
  // ============================================================

  const launcher =
    document.getElementById(
      "rag-widget-launcher"
    );

  const modal =
    document.getElementById(
      "rag-chat-modal"
    );

  const closeBtn =
    document.getElementById(
      "rag-close-btn"
    );

  const sendBtn =
    document.getElementById(
      "rag-send-btn"
    );

  const input =
    document.getElementById(
      "rag-input"
    );

  const messages =
    document.getElementById(
      "rag-chat-messages"
    );


  // ============================================================
  // ESCAPE HTML
  // Used for configuration text such as bot name.
  // ============================================================

  function escapeHtml(value) {

    const div =
      document.createElement("div");

    div.textContent =
      value || "";

    return div.innerHTML;

  }


  // ============================================================
  // OPEN CHAT
  // ============================================================

  function openChat() {

    modal.classList.add("open");

    launcher.style.display =
      "none";

    setTimeout(() => {

      input.focus();

    }, 50);

  }


  // ============================================================
  // CLOSE CHAT
  // ============================================================

  function closeChat() {

    modal.classList.remove("open");

    launcher.style.display =
      "flex";

  }


  launcher.addEventListener(
    "click",
    openChat
  );


  launcher.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openChat();

      }

    }
  );


  closeBtn.addEventListener(
    "click",
    closeChat
  );


  // ============================================================
  // RENDER BOT RESPONSE
  // ============================================================

  function renderBotMessage(
    element,
    text
  ) {

    const content =
      text || "";


    /*
     * If marked.js is available,
     * convert Markdown into readable HTML.
     */

    if (
      window.marked &&
      typeof window.marked.parse ===
        "function"
    ) {

      element.innerHTML =
        window.marked.parse(
          content
        );

      return;

    }


    /*
     * Fallback:
     * Display normal text safely.
     */

    element.textContent =
      content;

  }


  // ============================================================
  // ADD MESSAGE
  // ============================================================

  function appendMessage(
    text,
    sender
  ) {

    const element =
      document.createElement("div");


    element.className =
      `msg ${sender}`;


    if (sender === "bot") {

      renderBotMessage(
        element,
        text
      );

    } else {

      // User messages must remain plain text.
      element.textContent =
        text;

    }


    messages.appendChild(
      element
    );


    messages.scrollTop =
      messages.scrollHeight;


    return element;

  }


  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function handleSend() {

    const query =
      input.value.trim();


    // Don't send empty messages.

    if (!query) {

      return;

    }


    // Display user's message.

    appendMessage(
      query,
      "user"
    );


    // Clear input.

    input.value = "";


    // Disable button.

    sendBtn.disabled = true;


    // Show loading state.

    const botLoading =
      appendMessage(
        "Thinking...",
        "bot"
      );


    try {

      // ========================================================
      // API REQUEST
      // ========================================================

      const response =
        await fetch(
          API_URL,
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify({

                site_id:
                  SITE_ID,

                message:
                  query

              })

          }
        );


      // HTTP error

      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }


      // Parse JSON

      const data =
        await response.json();


      // ========================================================
      // GET REPLY
      // ========================================================

      const reply =
        data.reply ||
        "Sorry, I could not retrieve an answer.";


      // ========================================================
      // RENDER HUMAN-READABLE RESPONSE
      // ========================================================

      renderBotMessage(
        botLoading,
        reply
      );

    }

    catch (error) {

      console.error(
        "Chatbot API error:",
        error
      );


      renderBotMessage(
        botLoading,
        "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
      );

    }

    finally {

      sendBtn.disabled =
        false;


      messages.scrollTop =
        messages.scrollHeight;


      input.focus();

    }

  }


  // ============================================================
  // SEND BUTTON
  // ============================================================

  sendBtn.addEventListener(
    "click",
    handleSend
  );


  // ============================================================
  // ENTER TO SEND
  // ============================================================

  input.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        handleSend();

      }

    }
  );


  // ============================================================
  // START MARKDOWN LOADER
  // ============================================================

  loadMarkdownRenderer();


})();