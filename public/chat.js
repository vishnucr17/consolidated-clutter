/* Velopipe Assistant behavior layer. It intentionally does not add CSS. */
(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const get = (id) => byId(id);
  const fallbackConfig = {
    apiUrl: '/api/chat',
    assistantName: 'Velopipe Assistant',
    downloads: [
      { label: 'Strategy Map (PDF)', file: 'strategymap.pdf' },
      { label: 'Model Canvas (PDF)', file: 'modelcanvas.pdf' },
      { label: 'AI Blog (PDF)', file: 'hbsai.pdf' },
    ],
    navigation: [
      { label: 'View Electronics Line Cards', target: '#electronics-section' },
      { label: 'View Automotive Innovations', target: '#automotive-section' },
      { label: 'View Aviation Research', target: '#aviation-section' },
      { label: 'View Industrial Software / AI', target: '#infrastructure-section' },
      { label: 'View Green Hydrogen Data', target: '#hydrogen-section' },
    ],
  };

  async function loadConfig() {
    try {
      const response = await fetch('/chat-config.json', { cache: 'no-store' });
      return { ...fallbackConfig, ...(await response.json()) };
    } catch (_) { return fallbackConfig; }
  }

  function start(config) {
    const toggle = get('ai-toggle-trigger');
    const win = get('ai-chat-window');
    const close = win && win.querySelector('.ai-close');
    const log = get('ai-chat-log');
    const tray = get('ai-options-tray');
    const input = get('ai-chat-input');
    const send = get('ai-send-btn');
    if (!toggle || !win || !log || !tray || !input || !send || win.dataset.velopipeBound) return;
    win.dataset.velopipeBound = '1';

    const add = (text, who = 'bot') => {
      const message = document.createElement('div');
      message.className = `ai-msg ${who === 'user' ? 'user' : 'bot'}`;
      const prefix = document.createElement('strong');
      prefix.textContent = who === 'user' ? 'You: ' : 'Guide: ';
      message.append(prefix, document.createTextNode(text));
      log.appendChild(message);
      log.scrollTop = log.scrollHeight;
      return message;
    };
    const menu = () => {
      tray.replaceChildren();
      [
        ['Jump to Section', () => category('sections')],
        ['Downloads', () => category('downloads')],
        ['External Integrations', () => category('redirects')],
        ['Tailor-made Solutions', () => add('For tailor-made solutions email enterprise1@vishnucr9.org.', 'bot')],
      ].forEach(([label, action]) => {
        const button = document.createElement('button');
        button.className = 'ai-option-btn'; button.type = 'button'; button.textContent = label;
        button.addEventListener('click', action); tray.appendChild(button);
      });
    };
    const category = (type) => {
      tray.replaceChildren();
      const back = document.createElement('button');
      back.className = 'ai-option-btn'; back.type = 'button'; back.textContent = '← Back';
      back.addEventListener('click', menu); tray.appendChild(back);
      if (type === 'sections') config.navigation.forEach((item) => {
        const button = document.createElement('button'); button.className = 'ai-option-btn'; button.type = 'button'; button.textContent = item.label;
        button.addEventListener('click', () => { const target = document.querySelector(item.target); if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' }); else add('Anchor not found on this page.'); }); tray.appendChild(button);
      });
      if (type === 'downloads') config.downloads.forEach((item) => {
        const button = document.createElement('button'); button.className = 'ai-option-btn'; button.type = 'button'; button.textContent = item.label;
        button.addEventListener('click', () => { const link = document.createElement('a'); link.href = item.file; link.download = item.file; link.click(); }); tray.appendChild(button);
      });
      if (type === 'redirects') [['OpenAI', 'https://openai.com'], ['Manus AI', 'https://manus.im'], ['Zoho', 'https://zoho.com']].forEach(([label, url]) => {
        const button = document.createElement('button'); button.className = 'ai-option-btn'; button.type = 'button'; button.textContent = label;
        button.addEventListener('click', () => window.open(url, '_blank', 'noopener,noreferrer')); tray.appendChild(button);
      });
    };
    const open = () => { win.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); input.focus(); };
    const shut = () => { win.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); };
    const submit = () => {
      const text = input.value.trim(); if (!text) return; input.value = ''; add(text, 'user');
      const query = text.toLowerCase();
      if (query.includes('download') || query.includes('resource') || query.includes('tool') || query === 'y') { add('Here are your requested download resources.'); category('downloads'); }
      else if (query.includes('jump') || query.includes('information') || query.includes('innovation') || query.includes('section')) add('Type or pick a section from the menu to navigate.');
      else add('I can help you jump to sections, get downloads, or redirect to external websites. Select a menu item below or rephrase your query.');
    };

    toggle.replaceWith(toggle.cloneNode(true));
    const freshToggle = get('ai-toggle-trigger');
    freshToggle.addEventListener('click', () => win.classList.contains('open') ? shut() : open());
    if (close) close.addEventListener('click', shut);
    send.addEventListener('click', submit); input.addEventListener('keydown', (event) => { if (event.key === 'Enter') submit(); });
    add(`Welcome to the ${config.assistantName}`); menu();
  }

  document.addEventListener('DOMContentLoaded', () => loadConfig().then(start));
})();
