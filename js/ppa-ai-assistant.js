/**
 * PipingPro AI Assistant — Chat Widget v1.2
 * Brand-matched + Markdown rendering + Multi-calculator routing
 */

const PipingProAssistant = (() => {
  let config = { activeTab: '', tier: 'free' };
  let messages = [];
  let isOpen = false;
  let isLoading = false;

  // --- Multi-calculator support ---
  function getCalculatorId() {
    return window.PPA_AI_CALCULATOR || 'pipeline-mech';
  }
  function resolveActiveTab() {
    if (typeof window.PPA_AI_TAB_DETECTOR === 'function') return window.PPA_AI_TAB_DETECTOR();
    return config.activeTab || 'Calculator';
  }
  var CALC_NAMES = {
    'pipeline-mech': 'Pipeline Mechanical Design',
    'wall-thickness': 'Pipe Wall Thickness'
  };

  // --- Simple Markdown to HTML ---
  function md(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // headers
      .replace(/^### (.+)$/gm, '<strong style="display:block;margin:10px 0 4px;font-size:13px;color:#8b3a1a;">$1</strong>')
      .replace(/^## (.+)$/gm, '<strong style="display:block;margin:10px 0 4px;font-size:14px;color:#1a1510;">$1</strong>')
      // bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // tables
      .replace(/\|[-\s|]+\|/g, '')
      .replace(/^\|(.+)\|$/gm, function(match, inner) {
        var cells = inner.split('|').map(function(c){ return c.trim(); });
        return '<div style="display:flex;gap:8px;padding:2px 0;font-family:var(--mono,monospace);font-size:12px;">' +
          cells.map(function(c){ return '<span style="min-width:60px;">'+c+'</span>'; }).join('') + '</div>';
      })
      // horizontal rules
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #c8b89a;margin:8px 0;">')
      // line breaks
      .replace(/\n/g, '<br>');
  }

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
        background: #1a1510;
        border: 2px solid #b8860b;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(26, 21, 16, 0.5);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      #ppa-assistant-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 24px rgba(184, 134, 11, 0.4);
      }
      #ppa-assistant-btn svg {
        width: 26px;
        height: 26px;
        fill: #d4a017;
      }

      #ppa-assistant-panel {
        position: fixed;
        bottom: 92px;
        right: 24px;
        width: 400px;
        max-width: calc(100vw - 32px);
        height: 540px;
        max-height: calc(100vh - 120px);
        background: #faf6ef;
        border-radius: 12px;
        border: 2px solid #b8860b;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
        z-index: 9999;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: 'DM Sans', system-ui, sans-serif;
      }
      #ppa-assistant-panel.open { display: flex; }

      /* Header */
      .ppa-chat-header {
        background: #1a1510;
        border-bottom: 2px solid #b8860b;
        color: #FFFDF7;
        padding: 14px 18px;
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
        width: 9px;
        height: 9px;
        background: #2ecc71;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .ppa-chat-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #d4a017;
        letter-spacing: 0.01em;
        font-family: 'DM Serif Display', Georgia, serif;
      }
      .ppa-chat-header small {
        display: block;
        font-size: 10px;
        color: #6b5d49;
        margin-top: 2px;
        font-family: 'IBM Plex Mono', monospace;
      }
      .ppa-chat-close {
        background: none;
        border: none;
        color: #6b5d49;
        font-size: 22px;
        cursor: pointer;
        padding: 4px 8px;
        transition: color 0.15s;
      }
      .ppa-chat-close:hover { color: #d4a017; }

      /* Messages area */
      .ppa-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #f3ede2;
      }
      .ppa-chat-messages::-webkit-scrollbar { width: 4px; }
      .ppa-chat-messages::-webkit-scrollbar-thumb { background: #c8b89a; border-radius: 4px; }

      .ppa-msg {
        max-width: 90%;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 13px;
        line-height: 1.6;
        word-wrap: break-word;
      }
      .ppa-msg-user {
        align-self: flex-end;
        background: #1a1510;
        color: #FFFDF7;
        border-bottom-right-radius: 3px;
      }
      .ppa-msg-assistant {
        align-self: flex-start;
        background: #faf6ef;
        color: #1a1510;
        border: 1px solid #c8b89a;
        border-bottom-left-radius: 3px;
      }
      .ppa-msg-assistant pre {
        background: #1a1510;
        color: #d4a017;
        padding: 8px 10px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 11px;
        margin: 6px 0;
        font-family: 'IBM Plex Mono', monospace;
      }
      .ppa-msg-assistant code {
        background: #e8dfd0;
        padding: 1px 5px;
        border-radius: 3px;
        font-size: 12px;
        font-family: 'IBM Plex Mono', monospace;
      }
      .ppa-msg-assistant pre code {
        background: none;
        padding: 0;
      }
      .ppa-msg-assistant strong {
        color: #8b3a1a;
      }
      .ppa-msg-system {
        align-self: center;
        background: #f5e9c8;
        color: #856404;
        font-size: 12px;
        text-align: center;
        border-radius: 6px;
        padding: 8px 14px;
        border: 1px solid #b8860b;
      }

      /* Loading dots */
      .ppa-loading {
        align-self: flex-start;
        display: flex;
        gap: 5px;
        padding: 14px 18px;
        background: #faf6ef;
        border: 1px solid #c8b89a;
        border-radius: 10px;
        border-bottom-left-radius: 3px;
      }
      .ppa-loading-dot {
        width: 7px;
        height: 7px;
        background: #b8860b;
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
        padding: 10px 14px;
        border-top: 1px solid #c8b89a;
        background: #faf6ef;
        display: flex;
        gap: 8px;
        align-items: flex-end;
        flex-shrink: 0;
      }
      .ppa-chat-input {
        flex: 1;
        resize: none;
        border: 1px solid #c8b89a;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 13px;
        font-family: 'DM Sans', system-ui, sans-serif;
        line-height: 1.4;
        max-height: 100px;
        outline: none;
        background: #fff;
        color: #1a1510;
        transition: border-color 0.15s;
      }
      .ppa-chat-input:focus { border-color: #8b3a1a; }
      .ppa-chat-input::placeholder { color: #6b5d49; }

      .ppa-chat-send {
        background: #8b3a1a;
        border: none;
        border-radius: 8px;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s;
      }
      .ppa-chat-send:hover { background: #b04e22; }
      .ppa-chat-send:disabled { background: #c8b89a; cursor: not-allowed; }
      .ppa-chat-send svg { width: 18px; height: 18px; fill: #FFFDF7; }

      /* Upgrade overlay */
      .ppa-upgrade-overlay {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
        text-align: center;
        background: #f3ede2;
      }
      .ppa-upgrade-overlay h4 {
        margin: 0 0 8px;
        font-size: 16px;
        color: #8b3a1a;
        font-family: 'DM Serif Display', Georgia, serif;
      }
      .ppa-upgrade-overlay p {
        margin: 0 0 16px;
        font-size: 13px;
        color: #4a3f30;
        line-height: 1.5;
      }
      .ppa-upgrade-btn {
        background: #8b3a1a;
        color: #FFFDF7;
        border: none;
        padding: 10px 24px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }
      .ppa-upgrade-btn:hover { background: #b04e22; }

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
    const btn = document.createElement('button');
    btn.id = 'ppa-assistant-btn';
    btn.setAttribute('aria-label', 'Open AI Assistant');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7z"/></svg>';
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.id = 'ppa-assistant-panel';
    var calcId = getCalculatorId();
    var calcName = CALC_NAMES[calcId] || 'Calculator';
    const tabLabel = resolveActiveTab();

    panel.innerHTML =
      '<div class="ppa-chat-header">' +
        '<div class="ppa-chat-header-left">' +
          '<div class="ppa-chat-header-dot"></div>' +
          '<div>' +
            '<h3>PipingPro AI Assistant</h3>' +
            '<small id="ppa-header-context">' + tabLabel + '</small>' +
          '</div>' +
        '</div>' +
        '<button class="ppa-chat-close" aria-label="Close">&times;</button>' +
      '</div>' +
      (config.tier === 'professional' || config.tier === 'admin'
        ? '<div class="ppa-chat-messages" id="ppa-messages"></div>' +
          '<div class="ppa-chat-input-area">' +
            '<textarea class="ppa-chat-input" id="ppa-input" rows="1" placeholder="Ask about your pipeline design..."></textarea>' +
            '<button class="ppa-chat-send" id="ppa-send" aria-label="Send">' +
              '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
            '</button>' +
          '</div>'
        : '<div class="ppa-upgrade-overlay">' +
            '<h4>AI Assistant</h4>' +
            '<p>Get expert guidance on ' + calcName.toLowerCase() + ' calculations, code interpretation, and input selection.</p>' +
            '<p>Available for <strong>Professional</strong> subscribers.</p>' +
            '<button class="ppa-upgrade-btn" onclick="window.location.href=\'/pricing\'">Upgrade to Professional</button>' +
          '</div>'
      );

    document.body.appendChild(panel);
    panel.querySelector('.ppa-chat-close').addEventListener('click', togglePanel);

    if (config.tier === 'professional' || config.tier === 'admin') {
      const input = document.getElementById('ppa-input');
      const sendBtn = document.getElementById('ppa-send');
      sendBtn.addEventListener('click', sendMessage);
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
      input.addEventListener('input', function() {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
      });
      addMessage('assistant', 'Welcome to PipingPro AI Assistant. I can help you with the ' + calcName + ' calculator \u2014 from selecting inputs and interpreting results to understanding code requirements.\n\nWhat would you like to know?');
    }
  }

  function togglePanel() {
    const panel = document.getElementById('ppa-assistant-panel');
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    if (isOpen) {
      var ctxLabel = document.getElementById('ppa-header-context');
      if (ctxLabel) ctxLabel.textContent = resolveActiveTab();
      const input = document.getElementById('ppa-input');
      if (input) setTimeout(function(){ input.focus(); }, 100);
    }
  }

  function addMessage(role, text) {
    const container = document.getElementById('ppa-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'ppa-msg ppa-msg-' + role;

    if (role === 'assistant') {
      div.innerHTML = md(text);
    } else {
      div.textContent = text;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    if (role !== 'system') {
      messages.push({ role: role, content: text });
    }
  }

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
          messages: messages.map(function(m){ return { role: m.role, content: m.content }; }),
          memberstackToken: msToken,
          activeTab: resolveActiveTab(),
          calculator: getCalculatorId(),
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

  return {
    init: function(options) {
      config = Object.assign(config, options || {});
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { injectStyles(); buildWidget(); });
      } else {
        injectStyles(); buildWidget();
      }
    },
    setActiveTab: function(tabName) {
      config.activeTab = tabName;
      var label = document.getElementById('ppa-header-context');
      if (label) label.textContent = tabName;
    },
    open: function() { if (!isOpen) togglePanel(); },
    close: function() { if (isOpen) togglePanel(); }
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = PipingProAssistant; }
