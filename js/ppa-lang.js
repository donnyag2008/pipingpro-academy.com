// /js/ppa-lang.js
// PipingPro Academy — Language Detection & Translation Module
// Detects user location via /api/geo, provides UI translations,
// and exposes language state for AI agent integration.

(function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────────
  let _lang = 'en';           // current language: 'en' | 'id'
  let _country = 'XX';        // ISO country code from Cloudflare
  let _ready = false;
  let _readyCallbacks = [];

  // ─── UI Translation Strings ──────────────────────────────────
  // Add keys as needed — these cover common PPA UI elements.
  // Engineering terms (ASME, NPS, CAESAR II, etc.) stay in English.
  
  const STRINGS = {
    // Navigation & Layout
    'nav.home':             { en: 'Home',                    id: 'Beranda' },
    'nav.calculators':      { en: 'Calculators',             id: 'Kalkulator' },
    'nav.courses':          { en: 'Courses',                 id: 'Kursus' },
    'nav.about':            { en: 'About',                   id: 'Tentang' },
    'nav.login':            { en: 'Log In',                  id: 'Masuk' },
    'nav.signup':           { en: 'Sign Up',                 id: 'Daftar' },
    'nav.pricing':          { en: 'Pricing',                 id: 'Harga' },

    // Homepage
    'home.eyebrow':         { en: 'Piping & Pipeline Engineering AI Assistant',
                              id: 'Asisten AI Engineering Piping & Pipeline' },
    'home.headline':        { en: 'What Do You Want to<br><em>Learn or Calculate</em> Today?',
                              id: 'Apa yang Ingin Anda<br><em>Pelajari atau Hitung</em> Hari Ini?' },
    'home.subheadline':     { en: 'Ask any piping engineering question — I\'ll calculate with ASME code databases or explain the concept. Or both.',
                              id: 'Tanyakan pertanyaan engineering piping apa saja — saya akan menghitung dengan database kode ASME atau menjelaskan konsepnya. Atau keduanya.' },
    'home.calculate':       { en: '⚙ Calculate',             id: '⚙ Hitung' },
    'home.learn':           { en: '📖 Learn',                id: '📖 Pelajari' },
    'home.newchat':         { en: 'New Question',             id: 'Pertanyaan Baru' },
    'home.cta.trial':       { en: 'Start Free Trial',        id: 'Mulai Uji Coba Gratis' },
    'home.cta.explore':     { en: 'Explore Calculators',     id: 'Jelajahi Kalkulator' },
    // AI Chat Interface
    'chat.placeholder':     { en: 'What do you want to learn or calculate today?',
                          id: 'Apa yang ingin Anda pelajari atau hitung hari ini?' },
    'chat.thinking':        { en: 'Thinking...',             id: 'Sedang berpikir...' },
    'chat.error':           { en: 'Something went wrong. Please try again.',
                              id: 'Terjadi kesalahan. Silakan coba lagi.' },
    'chat.welcome':         { en: 'Hello! I\'m your AI Chief Engineer. Ask me anything about piping and pipeline engineering.',
                              id: 'Halo! Saya AI Chief Engineer Anda. Tanya saya apa saja tentang piping dan pipeline engineering.' },

    // Tiers & Pricing
    'tier.free':            { en: 'Free',                    id: 'Gratis' },
    'tier.student':         { en: 'Student',                 id: 'Pelajar' },
    'tier.professional':    { en: 'Professional',            id: 'Profesional' },
    'tier.upgrade':         { en: 'Upgrade to unlock full results',
                              id: 'Upgrade untuk membuka hasil lengkap' },

    // Courses
    'courses.title':        { en: 'Refresher Piping Courses',id: 'Kursus Penyegaran Piping' },
    'courses.enroll':       { en: 'Enroll Now',              id: 'Daftar Sekarang' },
    'courses.certificate':  { en: 'Certificate of Completion',id: 'Sertifikat Penyelesaian' },

    // Common Actions
    'action.calculate':     { en: 'Calculate',               id: 'Hitung' },
    'action.reset':         { en: 'Reset',                   id: 'Reset' },
    'action.download':      { en: 'Download Report',         id: 'Unduh Laporan' },
    'action.print':         { en: 'Print',                   id: 'Cetak' },
    'action.copy':          { en: 'Copy',                    id: 'Salin' },
    'action.close':         { en: 'Close',                   id: 'Tutup' },
    'action.back':          { en: 'Back',                    id: 'Kembali' },
    'action.next':          { en: 'Next',                    id: 'Selanjutnya' },

    // Language Toggle
    'lang.switch':          { en: '🇮🇩 Bahasa Indonesia',    id: '🇬🇧 English' },
    'lang.auto':            { en: 'Language auto-detected',  id: 'Bahasa terdeteksi otomatis' },

    // Footer
    'footer.terms':         { en: 'Terms of Use',            id: 'Syarat Penggunaan' },
    'footer.privacy':       { en: 'Privacy Policy',          id: 'Kebijakan Privasi' },
    'footer.contact':       { en: 'Contact',                 id: 'Kontak' },
    'footer.copyright':     { en: '© 2026 PipingPro Academy, a trading name of Zephrum Konsultan Limited',
                              id: '© 2026 PipingPro Academy, nama dagang dari Zephrum Konsultan Limited' },
  };

  // ─── Core Functions ──────────────────────────────────────────

  /**
   * Get translated string by key.
   * Falls back to English if key or language missing.
   * @param {string} key - dot-notation key from STRINGS
   * @param {string} [fallback] - optional fallback if key not found
   * @returns {}
   */
  function t(key, fallback) {
    const entry = STRINGS[key];
    if (!entry) return fallback || key;
    return entry[_lang] || entry['en'] || fallback || key;
  }

  /**
   * Get current language code.
   * @returns {'en'|'id'}
   */
  function getLang() {
    return _lang;
  }

  /**
   * Get current country code.
   * @returns {string} ISO 3166-1 alpha-2
   */
  function getCountry() {
    return _country;
  }

  /**
   * Check if current language is Bahasa Indonesia.
   * @returns {boolean}
   */
  function isBahasa() {
    return _lang === 'id';
  }

  /**
   * Toggle language between 'en' and 'id'.
   * Saves preference to localStorage and updates UI.
   */
  function toggleLang() {
    _lang = _lang === 'en' ? 'id' : 'en';
    try { localStorage.setItem('ppa-lang', _lang); } catch (e) { /* private browsing */ }
    _applyTranslations();
    // Dispatch event so other scripts can react
    window.dispatchEvent(new CustomEvent('ppa-lang-change', { detail: { lang: _lang, country: _country } }));
  }

  /**
   * Set language explicitly.
   * @param {'en'|'id'} lang
   */
  function setLang(lang) {
    if (lang !== 'en' && lang !== 'id') return;
    _lang = lang;
    try { localStorage.setItem('ppa-lang', _lang); } catch (e) {}
    _applyTranslations();
    window.dispatchEvent(new CustomEvent('ppa-lang-change', { detail: { lang: _lang, country: _country } }));
  }

  /**
   * Register a callback for when language detection is ready.
   * If already ready, fires immediately.
   * @param {function} cb - receives { lang, country }
   */
  function onReady(cb) {
    if (_ready) {
      cb({ lang: _lang, country: _country });
    } else {
      _readyCallbacks.push(cb);
    }
  }

  /**
   * Returns the language instruction string to inject into AI system prompts.
   * Use this in your /api/assistant and /api/claude functions.
   * @returns {string}
   */
  function getAgentLanguageInstruction() {
    if (_lang === 'id') {
      return 'The user is accessing from Indonesia or has selected Bahasa Indonesia. ' +
             'Respond in Bahasa Indonesia. Keep all engineering terms, code references ' +
             '(ASME, API, B31.3, CAESAR II, NPS, DN, etc.), units, and numerical values ' +
             'in English/standard form. Only translate the explanatory text and guidance.';
    }
    return ''; // English needs no special instruction
  }

  // ─── DOM Translation ─────────────────────────────────────────

  /**
   * Apply translations to all elements with data-i18n attribute.
   * Usage in HTML: <span data-i18n="nav.home">Home</span>
   * Also handles: data-i18n-placeholder, data-i18n-title
   */
  function _applyTranslations() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    // Placeholders (inputs, textareas)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });

    // Title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      el.title = t(key);
    });

    // Update html lang attribute
    document.documentElement.lang = _lang === 'id' ? 'id' : 'en';

    // Update language toggle button text
    document.querySelectorAll('[data-i18n="lang.switch"]').forEach(function (el) {
      el.textContent = t('lang.switch');
    });
  }

  // ─── Initialization ──────────────────────────────────────────

  async function _init() {
    // 1. Check localStorage for saved preference (user previously toggled)
    var saved = null;
    try { saved = localStorage.getItem('ppa-lang'); } catch (e) {}

    if (saved === 'en' || saved === 'id') {
      _lang = saved;
      _ready = true;
      _applyTranslations();
      _fireReady();
      // Still fetch country for geo-pricing and analytics, but don't override language
      _fetchGeo(false);
      return;
    }

    // 2. No saved preference — detect from Cloudflare
    await _fetchGeo(true);
  }

  async function _fetchGeo(applyLang) {
    try {
      var resp = await fetch('/api/geo');
      if (!resp.ok) throw new Error('geo fetch failed');
      var data = await resp.json();
      _country = data.country || 'XX';
      if (applyLang) {
        _lang = data.lang || 'en';
      }
    } catch (e) {
      // Fallback: English, unknown country
      _country = 'XX';
      if (applyLang) _lang = 'en';
    }

    _ready = true;
    _applyTranslations();
    _fireReady();
  }

  function _fireReady() {
    var detail = { lang: _lang, country: _country };
    _readyCallbacks.forEach(function (cb) { cb(detail); });
    _readyCallbacks = [];
    window.dispatchEvent(new CustomEvent('ppa-lang-ready', { detail: detail }));
  }

  // ─── Public API ──────────────────────────────────────────────

  window.ppaLang = {
    t: t,
    getLang: getLang,
    getCountry: getCountry,
    isBahasa: isBahasa,
    toggleLang: toggleLang,
    setLang: setLang,
    onReady: onReady,
    getAgentLanguageInstruction: getAgentLanguageInstruction,
    STRINGS: STRINGS,  // exposed so pages can add their own keys
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }
})();
