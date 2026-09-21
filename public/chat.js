/* Velopipe Assistant behavior layer. Preserves the original widget styling and functions. */
(() => {
  'use strict';

  // Firebase hosts the frontend; the chatbot API is deployed separately on Vercel.
  const API_URL = window.VELOPIPE_API_URL || 'https://chatbot-api-one-mu.vercel.app/api/chat';
  const get = (id) => document.getElementById(id);

  const DOWNLOADS = [
    { label: 'Strategy Map (PDF)', file: 'strategymap.pdf' },
    { label: 'Model Canvas (PDF)', file: 'modelcanvas.pdf' },
    { label: 'AI Blog (PDF)', file: 'hbsai.pdf' },
  ];

  const NAV_LINKS = [
    { label: 'View Electronics Line Cards', target: '#electronics-section' },
    { label: 'View Automotive Innovations', target: '#automotive-section' },
    { label: 'View Aviation Research', target: '#aviation-section' },
    { label: 'View Industrial Software / AI', target: '#infrastructure-section' },
    { label: 'View Green Hydrogen Data', target: '#hydrogen-section' },
  ];

  const INTEGRATIONS = [
    { label: 'OpenAI', url: 'https://openai.com' },
    { label: 'Manus AI', url: 'https://manus.im' },
    { label: 'Zoho', url: 'https://zoho.com' },
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

    let history = [];
    let isStreaming = false;
    const scrollLog = () => { log.scrollTop = log.scrollHeight; };

    function addMessage(text, who = 'bot') {
      const message = document.createElement('div');
      message.className = `ai-msg ${who === 'user' ? 'user' : 'bot'}`;
      const prefix = document.createElement('strong');
      prefix.textContent = who === 'user' ? 'You: ' : 'Guide: ';
      message.append(prefix, document.createTextNode(text));
      log.appendChild(message);
      scrollLog();
      return message;
    }

    function addButton(label, action) {
      const button = document.createElement('button');
      button.className = 'ai-option-btn';
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', action);
      tray.appendChild(button);
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
        const link = document.createElement('a');
        link.href = item.file;
        link.download = item.file;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }));
      if (type === 'redirects') INTEGRATIONS.forEach((item) => addButton(item.label, () => {
        addMessage(`Opening ${item.label}.`);
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }));
    }

    function openWindow() {
      win.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      input.focus();
    }

    function closeWindow() {
      win.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }

    function handleLocalCommand(text) {
      const query = text.toLowerCase();
      if (query.includes('download') || query.includes('resource') || query.includes('tool') || query === 'y') {
        addMessage('Here are your requested download resources.');
        openCategory('downloads');
        return true;
      }
      if (query.includes('jump') || query.includes('information') || query.includes('innovation') || query.includes('section')) {
        addMessage('Type or pick a section from the menu to navigate.');
        return true;
      }
      return false;
    }

    async function streamAssistantReply(text) {
      history.push({ role: 'user', content: text });
      const botMessage = addMessage('');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12), model: model ? model.value : 'gpt-4o-mini' }),
      });
      if (!response.ok) throw new Error(`Chat request failed with status ${response.status}`);
      if (!response.body) throw new Error('The streaming response is unavailable.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        botMessage.replaceChildren();
        const prefix = document.createElement('strong');
        prefix.textContent = 'Guide: ';
        botMessage.append(prefix, document.createTextNode(answer));
        scrollLog();
      }
      answer += decoder.decode();
      if (!answer.trim()) answer = 'I can help you jump to sections, get downloads, or open the listed integrations.';
      botMessage.replaceChildren();
      const prefix = document.createElement('strong');
      prefix.textContent = 'Guide: ';
      botMessage.append(prefix, document.createTextNode(answer));
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
      try {
        await streamAssistantReply(text);
      } catch (error) {
        console.error('Velopipe Assistant error:', error);
        addMessage('The assistant is temporarily unavailable. Please use the menu below.');
      } finally {
        isStreaming = false;
        send.disabled = false;
        input.focus();
      }
    }

    toggle.addEventListener('click', () => (win.classList.contains('open') ? closeWindow() : openWindow()));
    if (close) close.addEventListener('click', closeWindow);
    win.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeWindow(); });
    send.addEventListener('click', submit);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    });

    addMessage('Welcome to the Velopipe Dashboard.');
    renderMainMenu();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
