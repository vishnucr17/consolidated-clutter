/* Velopipe Assistant behavior layer. Preserves the widget layout while adding controlled links and streaming polish. */
(() => {
  'use strict';

  const API_URL = window.VELOPIPE_API_URL || 'https://chatbot-api-one-mu.vercel.app/api/chat';
  const get = (id) => document.getElementById(id);
  const DOWNLOADS = [
    { label: 'Strategy Map (PDF)', file: 'strategymap.pdf' },
    { label: 'Model Canvas (PDF)', file: 'modelcanvas.pdf' },
    { label: 'AI Blog (PDF)', file: 'hbsai.pdf' },
  ];
  const NAV_LINKS = [
    { label: 'View Electronics Line Cards', target: '#electronics-section', terms: ['electronics', 'line card'] },
    { label: 'View Automotive Innovations', target: '#automotive-section', terms: ['automotive', 'car'] },
    { label: 'View Aviation Research', target: '#aviation-section', terms: ['aviation', 'aircraft'] },
    { label: 'View Industrial Software / AI', target: '#infrastructure-section', terms: ['industrial software', 'infrastructure', 'ai'] },
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

    // Qwen-inspired orbital mark; the light-grey toggle surface matches the old bot theme.
    toggle.style.background = '#b8b8b8';
    toggle.style.color = '#1b1b1b';
    toggle.style.borderColor = '#777777';
    const oldIcon = toggle.querySelector('.ai-toggle-icon');
    if (oldIcon) oldIcon.remove();
    toggle.insertAdjacentHTML('afterbegin', `<svg class="ai-toggle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="11" cy="11" r="6.25" stroke="currentColor" stroke-width="1.7"/><path d="M15.5 15.5 20 20M8.2 8.8c1.5-1.5 4.1-1.5 5.6 0" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/><path d="M7.4 18.2c1.8 1.25 4.1 1.45 6.1.6" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" opacity=".75"/></svg>`);

    let history = [];
    let isStreaming = false;
    const scrollLog = () => { log.scrollTop = log.scrollHeight; };

    function addButton(label, action) {
      const button = document.createElement('button');
      button.className = 'ai-option-btn';
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', action);
      tray.appendChild(button);
      return button;
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
      if (/(download|resource|tool|pdf|strategy map|model canvas|ai blog)/.test(text)) {
        DOWNLOADS.forEach((item) => actions.push({ label: `Download ${item.label}`, action: () => download(item) }));
      }
      NAV_LINKS.forEach((item) => {
        if (item.terms.some((term) => text.includes(term))) {
          actions.push({ label: item.label, action: () => {
            const target = document.querySelector(item.target);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else addMessage('That section is not available on this page.');
          }});
        }
      });
      INTEGRATIONS.forEach((item) => {
        if (item.terms.some((term) => text.includes(term))) {
          actions.push({ label: `Open ${item.label}`, action: () => window.open(item.url, '_blank', 'noopener,noreferrer') });
        }
      });
      if (text.includes('tailor') || text.includes('custom solution') || text.includes('enterprise')) {
        actions.push({ label: 'Email enterprise solutions', action: () => { window.location.href = 'mailto:enterprise1@vishnucr9.org'; } });
      }
      const unique = [...new Map(actions.map((item) => [item.label, item])).values()];
      if (!unique.length) return;
      const links = document.createElement('div');
      links.className = 'ai-message-actions';
      links.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;';
      unique.forEach(({ label, action }) => {
        const button = document.createElement('button');
        button.className = 'ai-option-btn';
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', action);
        links.appendChild(button);
      });
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

    function renderMainMenu() {
      tray.replaceChildren();
      addButton('Jump to Section', () => openCategory('sections'));
      addButton('Downloads', () => openCategory('downloads'));
      addButton('External Integrations', () => openCategory('redirects'));
      addButton('Tailor-made Solutions', () => addMessage('For tailor-made solutions email enterprise1@vishnucr9.org.'));
    }

    function openCategory(type) {
      tray.replaceChildren();
      addButton('← Back', renderMainMenu);
      if (type === 'sections') NAV_LINKS.forEach((item) => addButton(item.label, () => {
        const target = document.querySelector(item.target);
        if (!target) return addMessage('Anchor not found on this page.');
        addMessage(`Scrolling to ${item.label}.`);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
      if (type === 'downloads') DOWNLOADS.forEach((item) => addButton(item.label, () => {
        addMessage(`Starting download: ${item.file}.`);
        download(item);
      }));
      if (type === 'redirects') INTEGRATIONS.forEach((item) => addButton(item.label, () => {
        addMessage(`Opening ${item.label}.`);
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }));
    }

    const openWindow = () => { win.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); input.focus(); };
    const closeWindow = () => { win.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); };

    function handleLocalCommand(text) {
      const query = text.toLowerCase();
      if (query.includes('download') || query.includes('resource') || query.includes('tool') || query === 'y') {
        addMessage('Here are your requested download resources.', 'bot', text);
        openCategory('downloads');
        return true;
      }
      if (query.includes('jump') || query.includes('information') || query.includes('innovation') || query.includes('section')) {
        addMessage('Type or pick a section from the menu to navigate.', 'bot', text);
        return true;
      }
      return false;
    }

    async function streamReply(text) {
      history.push({ role: 'user', content: text });
      const bubble = addMessage('', 'bot', text);
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-12), model: model?.value || 'qwen/qwen3.8-27b-chat' }) });
      if (!response.ok || !response.body) throw new Error(`Chat request failed: ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        bubble.replaceChildren();
        const prefix = document.createElement('strong'); prefix.textContent = 'Guide: ';
        bubble.append(prefix, document.createTextNode(answer));
        scrollLog();
      }
      answer += decoder.decode();
      if (!answer.trim()) answer = 'I can help you jump to sections, get downloads, or open the listed integrations.';
      bubble.replaceChildren();
      const prefix = document.createElement('strong'); prefix.textContent = 'Guide: ';
      bubble.append(prefix, document.createTextNode(answer));
      addActionLinks(bubble, text, answer);
      history.push({ role: 'assistant', content: answer });
    }

    async function submit() {
      const text = input.value.trim();
      if (!text || isStreaming) return;
      input.value = '';
      addMessage(text, 'user');
      if (handleLocalCommand(text)) return input.focus();
      isStreaming = true;
      send.disabled = true;
      try { await streamReply(text); }
      catch (error) { console.error('Velopipe Assistant error:', error); addMessage('The assistant is temporarily unavailable. Please use the menu below.'); }
      finally { isStreaming = false; send.disabled = false; input.focus(); }
    }

    toggle.addEventListener('click', () => (win.classList.contains('open') ? closeWindow() : openWindow()));
    if (close) close.addEventListener('click', closeWindow);
    win.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeWindow(); });
    send.addEventListener('click', submit);
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } });
    addMessage('Welcome to the Velopipe Dashboard.');
    renderMainMenu();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
