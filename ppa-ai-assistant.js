/**
 * PipingPro AI Assistant — Chat Widget
 * 
 * Usage: Add to any calculator page:
 *   <script src="/js/ppa-ai-assistant.js"></script>
 *   <script>
 *     PipingProAssistant.init({ 
 *       activeTab: 'Wall Thickness',   // current calculator tab name
 *       tier: 'professional'           // from Memberstack: 'free', 'student', 'professional'
 *     });
 *   </script>
 */

const PipingProAssistant = (() => {
  let config = { activeTab: '', tier: 'free' };
  let messages = [];
  let isOpen = false;
  let isLoading = false;

  // --- Inject Styles ---
  function injectStyles() {
    if (document.getElementById('ppa-assistant-styles')) return;
    const style = document.createElement('style');
    style.id = 'ppa-assistant-styles';
    style.textContent = `
      /* --- PipingPro AI Assistant Widget --- */
      #ppa-assistant-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #1a5276;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(26, 82, 118, 0.4);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      #ppa-assistant-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 24px rgba(26, 82, 118, 0.5);
      }
      #ppa-assistant-btn svg {
        width: 26px;
        height: 26px;
        fill: white;
      }

      #ppa-assistant-panel {
        position: fixed;
        bottom: 92px;
        right: 24px;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 520px;
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
        z-index: 9999;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #ppa-assistant-panel.open { display: flex; }

      /* Header */
      .ppa-chat-header {
        background: #1a5276;
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }
      .ppa-chat-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .ppa-chat-header-dot {
        width: 10px;
        height: 10px;
        background: #2ecc71;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .ppa-chat-header h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }
      .ppa-chat-header small {
        display: block;
        font-size: 11px;
        opacity: 0.8;
        margin-top: 2px;
      }
      .ppa-chat-close {
        background: none;
        border: none;
        color: white;
        font-size: 22px;
        cursor: pointer;
        padding: 4px 8px;
        opacity: 0.8;
        transition: opacity 0.15s;
      }
      .ppa-chat-close:hover { opacity: 1; }

      /* Messages area */
      .ppa-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8f9fa;
      }
      .ppa-chat-messages::-webkit-scrollbar { width: 4px; }
      .ppa-chat-messages::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }

      .ppa-msg {
        max-width: 88%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 13.5px;
        line-height: 1.55;
        word-wrap: break-word;
        white-space: pre-wrap;
      }
      .ppa-msg-user {
        align-self: flex-end;
        background: #1a5276;
        color: white;
        border-bottom-right-radius: 4px;
      }
      .ppa-msg-assistant {
        align-self: flex-start;
        background: white;
        color: #2d3748;
        border: 1px solid #e2e8f0;
        border-bottom-left-radius: 4px;
      }
      .ppa-msg-system {
        align-self: center;
        background: #fff3cd;
        color: #856404;
        font-size: 12.5px;
        text-align: center;
        border-radius: 8px;
        padding: 8px 14px;
      }

      /* Loading dots */
      .ppa-loading {
        align-self: flex-start;
        display: flex;
        gap: 5px;
        padding: 14px 18px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        border-bottom-left-radius: 4px;
      }
      .ppa-loading-dot {
        width: 7px;
        height: 7px;
        background: #a0aec0;
        border-radius: 50%;
        animation: ppaBounce 1.2s infinite ease-in-out;
      }
      .ppa-loading-dot:nth-child(2) { animation-delay: 0.15s; }
      .ppa-loading-dot:nth-child(3) { animation-delay: 0.3s; }
      @keyframes ppaBounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
      }

      /* Input area */
      .ppa-chat-input-area {
        padding: 12px 16px;
        border-top: 1px solid #e2e8f0;
        background: white;
        display: flex;
        gap: 8px;
        align-items: flex-end;
        flex-shrink: 0;
      }
      .ppa-chat-input {
        flex: 1;
        resize: none;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 13.5px;
        font-family: inherit;
        line-height: 1.4;
        max-height: 100px;
        outline: none;
        transition: border-color 0.15s;
      }
      .ppa-chat-input:focus { border-color: #1a5276; }
      .ppa-chat-input::placeholder { color: #a0aec0; }

      .ppa-chat-send {
        background: #1a5276;
        border: none;
        border-radius: 10px;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s;
      }
      .ppa-chat-send:hover { background: #1e6a9c; }
      .ppa-chat-send:disabled { background: #a0aec0; cursor: not-allowed; }
      .ppa-chat-send svg { width: 18px; height: 18px; fill: white; }

      /* Upgrade overlay */
      .ppa-upgrade-overlay {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
        text-align: center;
        background: #f8f9fa;
      }
      .ppa-upgrade-overlay h4 {
        margin: 0 0 8px;
        font-size: 16px;
        color: #1a5276;
      }
      .ppa-upgrade-overlay p {
        margin: 0 0 20px;
        font-size: 13.5px;
        color: #4a5568;
        line-height: 1.5;
      }
      .ppa-upgrade-btn {
        background: #1a5276;
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }
      .ppa-upgrade-btn:hover { background: #1e6a9c; }

      /* Mobile adjustments */
      @media (max-width: 480px) {
        #ppa-assistant-panel {
          bottom: 0;
          right: 0;
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
          border-radius: 0;
        }
        #ppa-assistant-btn {
          bottom: 16px;
          right: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // --- Build DOM ---
  function buildWidget() {
    // Floating button
    const btn = document.createElement('button');
    btn.id = 'ppa-assistant-btn';
    btn.setAttribute('aria-label', 'Open AI Assistant');
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7z"/></svg>`;
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);

    // Chat panel
    const panel = document.createElement('div');
    panel.id = 'ppa-assistant-panel';

    const tabLabel = config.activeTab || 'Pipeline Mechanical Design';

    panel.innerHTML = `
      <div class="ppa-chat-header">
        <div class="ppa-chat-header-left">
          <div class="ppa-chat-header-dot"></div>
          <div>
            <h3>PipingPro AI Assistant</h3>
            <small>${tabLabel}</small>
          </div>
        </div>
        <button class="ppa-chat-close" aria-label="Close">&times;</button>
      </div>
      ${config.tier === 'professional' || config.tier === 'admin'
        ? `<div class="ppa-chat-messages" id="ppa-messages"></div>
           <div class="ppa-chat-input-area">
             <textarea class="ppa-chat-input" id="ppa-input" rows="1" placeholder="Ask about your pipeline design..."></textarea>
             <button class="ppa-chat-send" id="ppa-send" aria-label="Send">
               <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
             </button>
           </div>`
        : `<div class="ppa-upgrade-overlay">
             <h4>AI Assistant</h4>
             <p>Get expert guidance on pipeline mechanical design calculations, code interpretation, and input selection.</p>
             <p>Available for <strong>Professional</strong> subscribers.</p>
             <button class="ppa-upgrade-btn" onclick="window.location.href='/pricing'">Upgrade to Professional</button>
           </div>`
      }
    `;
    document.body.appendChild(panel);

    // Event listeners
    panel.querySelector('.ppa-chat-close').addEventListener('click', togglePanel);

    if (config.tier === 'professional' || config.tier === 'admin') {
      const input = document.getElementById('ppa-input');
      const sendBtn = document.getElementById('ppa-send');

      sendBtn.addEventListener('click', sendMessage);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      // Auto-resize textarea
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
      });

      // Welcome message
      addMessage('assistant', `Welcome to PipingPro AI Assistant. I can help you with the ${tabLabel} calculator — from selecting inputs and interpreting results to understanding code requirements.\n\nWhat would you like to know?`);
    }
  }

  // --- Toggle panel ---
  function togglePanel() {
    const panel = document.getElementById('ppa-assistant-panel');
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    if (isOpen) {
      const input = document.getElementById('ppa-input');
      if (input) setTimeout(() => input.focus(), 100);
    }
  }

  // --- Add message to chat ---
  function addMessage(role, text) {
    const container = document.getElementById('ppa-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `ppa-msg ppa-msg-${role}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    if (role !== 'system') {
      messages.push({ role, content: text });
    }
  }

  // --- Show/hide loading indicator ---
  function setLoading(show) {
    isLoading = show;
    const container = document.getElementById('ppa-messages');
    const sendBtn = document.getElementById('ppa-send');
    if (!container) return;

    const existing = container.querySelector('.ppa-loading');
    if (show && !existing) {
      const loader = document.createElement('div');
      loader.className = 'ppa-loading';
      loader.innerHTML = '<div class="ppa-loading-dot"></div><div class="ppa-loading-dot"></div><div class="ppa-loading-dot"></div>';
      container.appendChild(loader);
      container.scrollTop = container.scrollHeight;
    } else if (!show && existing) {
      existing.remove();
    }
    if (sendBtn) sendBtn.disabled = show;
  }

  // --- Send message ---
  async function sendMessage() {
    if (isLoading) return;
    const input = document.getElementById('ppa-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    addMessage('user', text);
    setLoading(true);

    try {
      // Get Memberstack token
      let msToken = '';
      if (window.$memberstackDom) {
        try {
          const member = await window.$memberstackDom.getCurrentMember();
          if (member && member.data) {
            var pc = member.data.planConnections || [];
            var planIds = pc.map(function(p){ return p.planId; });
            msToken = JSON.stringify({ id: member.data.id, planIds: planIds });
          }
        } catch(e) { console.log('Memberstack token error:', e); }
      }

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          memberstackToken: msToken,
          activeTab: config.activeTab,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'upgrade_required') {
          addMessage('system', data.message);
        } else if (data.error === 'auth_required') {
          addMessage('system', 'Please log in to use the AI Assistant.');
        } else {
          addMessage('system', data.error || 'Something went wrong. Please try again.');
        }
      } else {
        addMessage('assistant', data.response);
      }
    } catch (err) {
      console.error('PipingPro Assistant error:', err);
      addMessage('system', 'Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }

  // --- Public API ---
  return {
    init(options = {}) {
      config = { ...config, ...options };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          injectStyles();
          buildWidget();
        });
      } else {
        injectStyles();
        buildWidget();
      }
    },

    // Allow external code to update the active tab
    setActiveTab(tabName) {
      config.activeTab = tabName;
      const label = document.querySelector('.ppa-chat-header small');
      if (label) label.textContent = tabName;
    },

    // Programmatically open the assistant
    open() {
      if (!isOpen) togglePanel();
    },

    // Programmatically close the assistant
    close() {
      if (isOpen) togglePanel();
    },
  };
})();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PipingProAssistant;
}
