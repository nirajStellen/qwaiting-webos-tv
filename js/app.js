/**
 * Qwaiting Display — LG webOS TV Demo
 * Queue dashboard with mock API, TTS, and remote control.
 */
(function () {
  'use strict';

  var APP_VERSION = '1.1.1';
  var REFRESH_MS = 5000;
  var BACK_EXIT_MS = 2000;
  var KEY_DEBOUNCE_MS = 120;
  var DEMO_MODE = true;

  var state = {
    counters: [],
    activeCounter: 0,
    online: true,
    servedToday: 128,
    loading: true,
    focusables: [],
    focusIndex: 0,
    lastBack: 0,
    lastKey: '',
    lastKeyTime: 0,
    timers: []
  };

  var TICKERS = [
    'Welcome to Qwaiting — Your digital queue display for LG webOS TV',
    'Please have your token ready when called to the counter',
    'Download Qwaiting on Google Play — For Display',
    'Reduce wait times with real-time queue updates'
  ];

  var KEY_ACTIONS = {
    ENTER: { codes: [13], keys: ['Enter', 'NumpadEnter'] },
    BACK: { codes: [8, 27, 461], keys: ['Backspace', 'Escape', 'GoBack', 'BrowserBack'] },
    LEFT: { codes: [37], keys: ['ArrowLeft'] },
    UP: { codes: [38], keys: ['ArrowUp'] },
    RIGHT: { codes: [39], keys: ['ArrowRight'] },
    DOWN: { codes: [40], keys: ['ArrowDown'] }
  };

  function $(id) { return document.getElementById(id); }

  function setText(id, text) {
    var el = $(id);
    if (el) { el.textContent = text; }
  }

  function showScreen(name) {
    var screens = ['loading', 'error', 'dashboard'];
    screens.forEach(function (s) {
      var el = $('screen-' + s);
      if (!el) { return; }
      var show = s === name;
      el.classList.toggle('hidden', !show);
      el.setAttribute('aria-hidden', show ? 'false' : 'true');
    });
  }

  /* ── Demo queue data ───────────────────────────────────── */

  function seedCounters() {
    return [
      { id: 1, label: 'Counter 1', service: 'General Service', current: 'A041', next: 'A042', waiting: ['A043', 'A044', 'A045', 'A046'], avgWait: '12 min' },
      { id: 2, label: 'Counter 2', service: 'Priority Desk', current: 'B018', next: 'B019', waiting: ['B020', 'B021', 'B022'], avgWait: '8 min' },
      { id: 3, label: 'Counter 3', service: 'Payments', current: 'C105', next: 'C106', waiting: ['C107', 'C108', 'C109', 'C110', 'C111'], avgWait: '15 min' }
    ];
  }

  function randomToken(prefix) {
    return prefix + String(Math.floor(Math.random() * 90) + 10).padStart(2, '0');
  }

  function simulateQueueTick() {
    var c = state.counters[state.activeCounter];
    if (!c) { return; }

    c.current = c.next;
    c.next = c.waiting.shift() || randomToken(c.current.charAt(0));
    c.waiting.push(randomToken(c.current.charAt(0)));
    state.servedToday += 1;

    renderDashboard();
    announceToken(c.current, c.label);
  }

  function fetchQueueData() {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (!state.online && Math.random() < 0.15) {
          reject(new Error('Network unavailable'));
          return;
        }

        if (!state.counters.length) {
          state.counters = seedCounters();
        } else if (Math.random() < 0.35) {
          simulateQueueTick();
        }

        resolve({
          branch: 'Demo Branch — Reception',
          counters: state.counters,
          servedToday: state.servedToday,
          ticker: TICKERS[Math.floor(Math.random() * TICKERS.length)]
        });
      }, 600);
    });
  }

  /* ── Render ────────────────────────────────────────────── */

  function renderCounterTabs() {
    var container = $('counter-tabs');
    if (!container) { return; }
    container.innerHTML = '';

    state.counters.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'counter-tab' + (i === state.activeCounter ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('data-index', String(i));
      btn.textContent = c.label;
      btn.addEventListener('click', function () {
        selectCounter(i);
      });
      container.appendChild(btn);
    });
  }

  function renderWaitingList(tokens) {
    var list = $('waiting-list');
    if (!list) { return; }
    list.innerHTML = '';
    tokens.forEach(function (token, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span>' + token + '</span><span class="pos">#' + (i + 1) + '</span>';
      list.appendChild(li);
    });
  }

  function renderDashboard() {
    var c = state.counters[state.activeCounter];
    if (!c) { return; }

    setText('branch-name', 'Demo Branch — Reception');
    setText('current-token', c.current);
    setText('next-token', c.next);
    setText('counter-number', String(c.id));
    setText('service-name', c.service);
    setText('waiting-count', c.waiting.length + ' waiting');
    setText('avg-wait', c.avgWait);
    setText('served-today', String(state.servedToday));
    setText('announce-bar', 'Token ' + c.current + ' — please proceed to ' + c.label);

    renderCounterTabs();
    renderWaitingList(c.waiting);

    var status = $('connection-status');
    if (status) {
      status.textContent = DEMO_MODE ? 'Demo Live' : 'Live';
      status.className = 'status-pill ' + (DEMO_MODE ? 'demo' : 'online');
    }

    var hero = $('current-token');
    if (hero) {
      hero.classList.remove('flash');
      void hero.offsetWidth;
      hero.classList.add('flash');
    }

    updateFocusables();
  }

  function selectCounter(index) {
    if (index < 0 || index >= state.counters.length) { return; }
    state.activeCounter = index;
    renderDashboard();
  }

  /* ── Screens: load / error ─────────────────────────────── */

  function loadData(isFirst) {
    if (isFirst) {
      setText('loading-message', 'Connecting to queue service...');
      showScreen('loading');
    }

    return fetchQueueData()
      .then(function (data) {
        state.counters = data.counters;
        setText('ticker-text', data.ticker);
        state.online = true;
        showScreen('dashboard');
        renderDashboard();
        if (isFirst) {
          var c = state.counters[state.activeCounter];
          announceToken(c.current, c.label, true);
        }
      })
      .catch(function (err) {
        console.error('[Queue]', err.message);
        state.online = false;
        setText('error-message', err.message || 'Unable to reach queue server.');
        var status = $('connection-status');
        if (status) {
          status.textContent = 'Offline';
          status.className = 'status-pill offline';
        }
        showScreen('error');
        updateFocusables();
      });
  }

  function startAutoRefresh() {
    var t = setInterval(function () {
      if ($('screen-dashboard') && !$('screen-dashboard').classList.contains('hidden')) {
        loadData(false);
      }
    }, REFRESH_MS);
    state.timers.push(t);
  }

  /* ── Text-to-Speech ────────────────────────────────────── */

  function announceToken(token, counterLabel, quiet) {
    if (!window.speechSynthesis || !token) { return; }

    var msg = 'Token number ' + token.split('').join(' ') + ', please proceed to ' + counterLabel;
    setText('announce-bar', msg);

    if (quiet) { return; }

    window.speechSynthesis.cancel();
    var utter = new SpeechSynthesisUtterance(msg);
    utter.rate = 0.92;
    utter.pitch = 1;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  }

  /* ── Clock ─────────────────────────────────────────────── */

  function updateClock() {
    setText('datetime', new Date().toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }));
  }

  /* ── Lifecycle ─────────────────────────────────────────── */

  function initLifecycle() {
    document.addEventListener('webOSLaunch', function (e) {
      console.log('[Lifecycle] onLaunch', e.detail || {});
    }, true);

    document.addEventListener('webOSRelaunch', function () {
      console.log('[Lifecycle] onResume');
      loadData(false);
    }, true);

    var hiddenKey = typeof document.hidden !== 'undefined' ? 'hidden' : 'webkitHidden';
    var visEvent = typeof document.hidden !== 'undefined' ? 'visibilitychange' : 'webkitvisibilitychange';

    document.addEventListener(visEvent, function () {
      if (document[hiddenKey]) {
        console.log('[Lifecycle] onPause');
        window.speechSynthesis && window.speechSynthesis.cancel();
      } else {
        console.log('[Lifecycle] onResume');
        loadData(false);
      }
    }, true);

    if (window.PalmSystem && window.PalmSystem.stageReady) {
      window.PalmSystem.stageReady();
    }
  }

  /* ── Remote control ────────────────────────────────────── */

  function resolveKey(event) {
    var code = event.keyCode || event.which || 0;
    var key = event.key || '';
    var name;
    for (name in KEY_ACTIONS) {
      if (KEY_ACTIONS.hasOwnProperty(name)) {
        var d = KEY_ACTIONS[name];
        if (d.codes.indexOf(code) !== -1 || d.keys.indexOf(key) !== -1) {
          return name;
        }
      }
    }
    return null;
  }

  function showKey(name) {
    setText('pressed-key', name);
    var dbg = $('remote-debug');
    if (dbg) { dbg.classList.remove('hidden'); }
  }

  function updateFocusables() {
    state.focusables = [];
    var retry = $('btn-retry');
    if (retry && !$('screen-error').classList.contains('hidden')) {
      state.focusables = [retry];
    } else {
      state.focusables = Array.prototype.slice.call(document.querySelectorAll('.counter-tab'));
    }
    state.focusIndex = Math.min(state.focusIndex, Math.max(0, state.focusables.length - 1));
    state.focusables.forEach(function (el, i) {
      el.classList.toggle('focused', i === state.focusIndex);
      if (i === state.focusIndex) { el.focus(); }
    });
  }

  function moveFocus(dir) {
    if (!state.focusables.length) { return; }
    if (dir === 'left' && state.focusIndex > 0) { state.focusIndex -= 1; }
    if (dir === 'right' && state.focusIndex < state.focusables.length - 1) { state.focusIndex += 1; }
    updateFocusables();
    if (!$('screen-error').classList.contains('hidden')) { return; }
    var tab = state.focusables[state.focusIndex];
    if (tab && tab.classList.contains('counter-tab')) {
      selectCounter(parseInt(tab.getAttribute('data-index'), 10));
    }
  }

  function activateFocus() {
    var el = state.focusables[state.focusIndex];
    if (!el) { return; }
    if (el.id === 'btn-retry') {
      loadData(true);
      return;
    }
    if (el.classList.contains('counter-tab')) {
      selectCounter(parseInt(el.getAttribute('data-index'), 10));
      var c = state.counters[state.activeCounter];
      if (c) { announceToken(c.current, c.label); }
    }
  }

  function handleBack() {
    var now = Date.now();
    if (now - state.lastBack < BACK_EXIT_MS) {
      if (typeof webOS !== 'undefined' && webOS.platformBack) {
        webOS.platformBack();
      } else if (window.webOSSystem && window.webOSSystem.platformBack) {
        window.webOSSystem.platformBack();
      } else if (typeof window.close === 'function') {
        window.close();
      }
      return;
    }
    state.lastBack = now;
  }

  function handleRemote(event) {
    var action = resolveKey(event);
    if (!action) { return; }

    var now = Date.now();
    if (action === state.lastKey && now - state.lastKeyTime < KEY_DEBOUNCE_MS) {
      event.preventDefault();
      return;
    }
    state.lastKey = action;
    state.lastKeyTime = now;

    event.preventDefault();
    event.stopPropagation();
    showKey(action);

    switch (action) {
      case 'ENTER':
        activateFocus();
        break;
      case 'BACK':
        handleBack();
        break;
      case 'LEFT':
        moveFocus('left');
        break;
      case 'RIGHT':
        moveFocus('right');
        break;
      case 'UP':
      case 'DOWN':
        break;
      default:
        break;
    }
  }

  function initRemote() {
    window.addEventListener('keydown', handleRemote, true);
    document.addEventListener('keydown', handleRemote, true);

    var retry = $('btn-retry');
    if (retry) {
      retry.addEventListener('click', function () { loadData(true); });
    }

    $('app').focus();
    updateFocusables();
  }

  /* ── Responsive layout ─────────────────────────────────── */

  function getViewportSize() {
    var vv = window.visualViewport;
    return {
      w: (vv && vv.width) || window.innerWidth,
      h: (vv && vv.height) || window.innerHeight
    };
  }

  function applyViewportSize(width, height) {
    var root = document.documentElement;
    var size = getViewportSize();
    var w = width || size.w;
    var h = height || size.h;

    root.style.setProperty('--screen-w', String(Math.round(w)));
    root.style.setProperty('--screen-h', String(Math.round(h)));
    root.setAttribute('data-orientation', w >= h ? 'landscape' : 'portrait');
    root.setAttribute('data-resolution', w >= 2560 ? '4k' : w >= 1600 ? '1080p' : '720p');
  }

  function initResponsive() {
    applyViewportSize();

    var resizeTimer;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyViewportSize, 80);
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
    }

    if (typeof webOS !== 'undefined' && webOS.deviceInfo) {
      webOS.deviceInfo(function (info) {
        applyViewportSize(info.screenWidth, info.screenHeight);
      });
    }
  }

  /* ── Device info (console) ───────────────────────────────── */

  function logDeviceInfo() {
    if (typeof webOS === 'undefined' || !webOS.deviceInfo) {
      console.log('[Device] Browser preview —', window.innerWidth + 'x' + window.innerHeight);
      return;
    }
    webOS.deviceInfo(function (info) {
      console.log('[Device]', info.modelName, 'webOS', info.version, info.screenWidth + 'x' + info.screenHeight);
    });
  }

  /* ── Bootstrap ─────────────────────────────────────────── */

  function init() {
    console.log('[Qwaiting] Display v' + APP_VERSION + ' (LG webOS TV)');
    setText('app-version', 'v' + APP_VERSION);

    initResponsive();
    initLifecycle();
    initRemote();
    logDeviceInfo();
    updateClock();
    state.timers.push(setInterval(updateClock, 1000));

    loadData(true).then(function () {
      startAutoRefresh();
    });

    window.addEventListener('beforeunload', function () {
      state.timers.forEach(clearInterval);
      window.speechSynthesis && window.speechSynthesis.cancel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
