/* Velopipe Assistant behavior layer. Keeps the existing widget markup and guarantees usable controls. */
(() => {
  'use strict';

  const API_URL = window.VELOPIPE_API_URL || 'https://chatbot-api-one-mu.vercel.app/api/chat';
  const get = (id) => document.getElementById(id);
  const DOWNLOADS = [
    { label: 'Strategy Map (PDF)', file: 'strategymap.pdf', terms: ['strategy map', 'strategy'] },
    { label: 'Model Canvas (PDF)', file: 'modelcanvas.pdf', terms: ['model canvas', 'canvas'] },
    { label: 'AI Blog (PDF)', file: 'hbsai.pdf', terms: ['ai blog', 'blog'] },
  ];
  const SECTIONS = [
    { label: 'View Electronics Line Cards', target: '#electronics-section', terms: ['electronics', 'line card'] },
    { label: 'View Automotive Innovations', target: '#automotive-section', terms: ['automotive', 'car'] },
    { label: 'View Aviation Research', target: '#aviation-section', terms: ['aviation', 'aircraft'] },
    { label: 'View Industrial Software / AI', target: '#infrastructure-section', terms: ['industrial software', 'infrastructure'] },
    { label: 'View Green Hydrogen Data', target: '#hydrogen-section', terms: ['hydrogen'] },
  ];
  const INTEGRATIONS = [
    { label: 'OpenAI', url: 'https://openai.com', terms: ['openai'] },
    { label: 'Manus AI', url: 'https://manus.im', terms: ['manus'] },
    { label: 'Zoho', url: 'https://zoho.com', terms: ['zoho'] },
  ];

  function start() {
    const toggle = get('ai-toggle-trigger');
    const win = get('ai-chat-window');
    const log = get('ai-chat-log');
    const tray = get('ai-options-tray');
    const input = get('ai-chat-input');
    const send = get('ai-send-btn');
    const model = get('v-model-toggle');
    const close = win && win.querySelector('.ai-close');
    if (!toggle || !win || !log || !tray || !input || !send || win.dataset.velopipeBound) return;
    win.dataset.velopipeBound = '1';

    const repairStyle = document.createElement('style');
    repairStyle.textContent = `
      #ai-chat-window.open #ai-input-row { display:flex !important; visibility:visible !important; opacity:1 !important; }
      #ai-chat-window.open #ai-chat-input { display:block !important; visibility:visible !important; opacity:1 !important; min-width:0 !important; }
      #ai-chat-window.open #ai-send-btn { display:inline-flex !important; visibility:visible !important; opacity:1 !important; align-items:center !important; justify-content:center !important; min-width:58px !important; min-height:34px !important; }
      #ai-toggle-trigger .ai-toggle-icon { display:block !important; visibility:visible !important; opacity:1 !important; }
      .ai-message-actions { display:flex !important; flex-wrap:wrap !important; gap:6px !important; margin-top:8px !important; }
    `;
    document.head.appendChild(repairStyle);

    toggle.style.background = '#b8b8b8';
    toggle.style.color = '#1b1b1b';
    toggle.style.borderColor = '#777';
    const oldIcon = toggle.querySelector('.ai-toggle-icon');
    if (oldIcon) oldIcon.remove();
    toggle.insertAdjacentHTML('afterbegin', `<svg class="ai-toggle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="11" cy="11" r="6.25" stroke="currentColor" stroke-width="1.7"/><path d="M15.5 15.5 20 20M8.2 8.8c1.5-1.5 4.1-1.5 5.6 0" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/><path d="M7.4 18.2c1.8 1.25 4.1 1.45 6.1.6" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" opacity=".75"/></svg>`);

    let history = [];
    let isStreaming = false;
    const scrollLog = () => { log.scrollTop = log.scrollHeight; };

    function addButton(parent, label, action) {
      const button = document.createElement('button');
      button.className = 'ai-option-btn';
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', action);
      parent.appendChild(button);
    }

    function download(item) {
      const link = document.createElement('a');
      link.href = item.file;
      link.download = item.file;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    function addActionLinks(container, prompt = '', answer = '') {
      const text = `${prompt} ${answer}`.toLowerCase();
      const actions = [];
      if (/(download|resource|tool|pdf)/.test(text)) {
        DOWNLOADS.forEach((item) => {
          if (item.terms.some((term) => text.includes(term)) || /download|resource|tool|pdf/.test(text)) {
            actions.push([`Download ${item.label}`, () => download(item)]);
          }
        });
      }
      SECTIONS.forEach((item) => {
        if (item.terms.some((term) => text.includes(term))) actions.push([item.label, () => {
          const target = document.querySelector(item.target);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else addMessage('That section is not available on this page.');
        }]);
      });
      INTEGRATIONS.forEach((item) => {
        if (item.terms.some((term) => text.includes(term))) actions.push([`Open ${item.label}`, () => window.open(item.url, '_blank', 'noopener,noreferrer')]);
      });
      if (/(tailor|custom solution|enterprise)/.test(text)) actions.push(['Email enterprise solutions', () => { window.location.href = 'mailto:enterprise1@vishnucr9.org'; }]);
      const unique = [...new Map(actions.map(([label, action]) => [label, action])).entries()];
      if (!unique.length) return;
      const links = document.createElement('div');
      links.className = 'ai-message-actions';
      unique.forEach(([label, action]) => addButton(links, label, action));
      container.appendChild(links);
    }

    function addMessage(text, who = 'bot', prompt = '') {
      const message = document.createElement('div');
      message.className = `ai-msg ${who === 'user' ? 'user' : 'bot'}`;
      const prefix = document.createElement('strong');
      prefix.textContent = who === 'user' ? 'You: ' : 'Guide: ';
      message.append(prefix, document.createTextNode(text));
      if (who === 'bot') addActionLinks(message, prompt, text);
      log.appendChild(message);
      scrollLog();
      return message;
    }

    function menu() {
      tray.replaceChildren();
      addButton(tray, 'Jump to Section', () => category('sections'));
      addButton(tray, 'Downloads', () => category('downloads'));
      addButton(tray, 'External Integrations', () => category('integrations'));
      addButton(tray, 'Tailor-made Solutions', () => addMessage('For tailor-made solutions email enterprise1@vishnucr9.org.'));
    }

    function category(type) {
      tray.replaceChildren();
      addButton(tray, '← Back', menu);
      if (type === 'sections') SECTIONS.forEach((item) => addButton(tray, item.label, () => {
        const target = document.querySelector(item.target);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
      if (type === 'downloads') DOWNLOADS.forEach((item) => addButton(tray, item.label, () => download(item)));
      if (type === 'integrations') INTEGRATIONS.forEach((item) => addButton(tray, item.label, () => window.open(item.url, '_blank', 'noopener,noreferrer')));
    }

    function localCommand(text) {
      const query = text.toLowerCase();
      if (query.includes('download') || query.includes('resource') || query.includes('pdf') || query === 'y') {
        addMessage('Here are your requested download resources.', 'bot', text);
        category('downloads');
        return true;
      }
      if (query.includes('jump') || query.includes('section') || query.includes('navigate')) {
        addMessage('Choose a section below to jump there.', 'bot', text);
        category('sections');
        return true;
      }
      return false;
    }

    async function reply(text) {
      history.push({ role: 'user', content: text });
      const bubble = addMessage('', 'bot', text);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12), model: model?.value || 'qwen/qwen3.8-27b-chat' }),
      });
      if (!response.ok || !response.body) throw new Error(`Chat request failed: ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        bubble.replaceChildren();
        const prefix = document.createElement('strong');
        prefix.textContent = 'Guide: ';
        bubble.append(prefix, document.createTextNode(answer));
        scrollLog();
      }
      answer += decoder.decode();
      if (!answer.trim()) answer = 'I can help you jump to sections, get downloads, or open the listed integrations.';
      bubble.replaceChildren();
      const prefix = document.createElement('strong');
      prefix.textContent = 'Guide: ';
      bubble.append(prefix, document.createTextNode(answer));
      addActionLinks(bubble, text, answer);
      history.push({ role: 'assistant', content: answer });
    }

    async function submit() {
      const text = input.value.trim();
      if (!text || isStreaming) return;
      input.value = '';
      addMessage(text, 'user');
      if (localCommand(text)) return input.focus();
      isStreaming = true;
      send.disabled = true;
      try { await reply(text); }
      catch (error) { console.error('Velopipe Assistant error:', error); addMessage('The assistant is temporarily unavailable. Please use the menu below.'); }
      finally { isStreaming = false; send.disabled = false; input.focus(); }
    }

    const openWindow = () => { win.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); input.focus(); };
    const closeWindow = () => { win.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => win.classList.contains('open') ? closeWindow() : openWindow());
    if (close) close.addEventListener('click', closeWindow);
    send.addEventListener('click', submit);
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } });
    addMessage('Welcome to the Velopipe Dashboard.');
    menu();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
