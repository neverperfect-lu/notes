/* ==========================================================================
   Notizen – lokale PWA
   Speicher: IndexedDB (bleibt nach Neustart erhalten). Kein Server, kein Login.
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. IndexedDB
   -------------------------------------------------------------------------- */

const DB_NAME = 'notizen';
const DB_VERSION = 1;
const STORES = ['dailies', 'logs', 'tasks', 'notes', 'settings'];

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('dailies'))  db.createObjectStore('dailies',  { keyPath: 'id' });
      if (!db.objectStoreNames.contains('logs'))     db.createObjectStore('logs',     { keyPath: 'key' });
      if (!db.objectStoreNames.contains('tasks'))    db.createObjectStore('tasks',    { keyPath: 'id' });
      if (!db.objectStoreNames.contains('notes'))    db.createObjectStore('notes',    { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function dbPut(store, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).put(value);
    t.oncomplete = resolve;
    t.onerror = () => reject(t.error);
  });
}

async function dbDelete(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).delete(key);
    t.oncomplete = resolve;
    t.onerror = () => reject(t.error);
  });
}

async function dbAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbClear(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).clear();
    t.oncomplete = resolve;
    t.onerror = () => reject(t.error);
  });
}

/* --------------------------------------------------------------------------
   2. Hilfsfunktionen
   -------------------------------------------------------------------------- */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function todayKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatLongDate(date = new Date()) {
  return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function relativeDate(ts) {
  const d = new Date(ts);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (key === todayKey())   return 'Heute ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (key === todayKey(-1)) return 'Gestern';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('de-DE', sameYear
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

const ICONS = {
  check:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  sun:      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:     '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  today:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 3v3m8-3v3"/><circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none"/></svg>',
  tasks:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m3 6.5 2 2 3.5-3.5M3 16.5l2 2 3.5-3.5M12 7h9M12 17h9"/></svg>',
  notes:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3.5h9.5L19 8v12.5H5z"/><path d="M14 3.5V8h5M8.5 12.5h7M8.5 16h4.5"/></svg>',
  more:     '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8.2v.01M12 11.5v4.3"/></svg>',
  chevron:  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  plus:     '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  arrowUp:  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  search:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
  trash:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 12.5h9.4L17.5 7"/></svg>',
  flame:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-1.6.7-3 1.5-4 0 2 1 3 2 3s1.5-1 1.5-2.5c0-2-1-4-1-5.5Z"/></svg>',
};

const DAILY_COLORS = ['--c-blue', '--c-green', '--c-orange', '--c-purple', '--c-pink', '--c-red'];

/* --------------------------------------------------------------------------
   3. State
   -------------------------------------------------------------------------- */

const state = {
  dailies: [],
  logs: new Set(),      // "dailyId|YYYY-MM-DD"
  tasks: [],
  notes: [],
  openTasks: new Set(), // aufgeklappte Aufgaben (nur UI)
  view: 'today',
  noteQuery: '',
  editing: null,
};

const SEED_DAILIES = [
  { name: 'Sport',        glyph: '🏋️' },
  { name: 'Lesen',        glyph: '📖' },
  { name: 'Kein Zucker',  glyph: '🥗' },
  { name: 'Editing',      glyph: '🎬' },
];

async function loadState() {
  const [dailies, logs, tasks, notes, settings] = await Promise.all(
    ['dailies', 'logs', 'tasks', 'notes', 'settings'].map(dbAll)
  );

  state.dailies = dailies.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  state.logs = new Set(logs.filter((l) => l.done).map((l) => l.key));
  state.tasks = tasks.sort((a, b) => b.createdAt - a.createdAt);
  state.notes = notes.sort((a, b) => b.updatedAt - a.updatedAt);

  const seeded = settings.find((s) => s.key === 'seeded');
  if (!seeded && state.dailies.length === 0) {
    state.dailies = SEED_DAILIES.map((d, i) => ({
      id: uid(), name: d.name, glyph: d.glyph, color: DAILY_COLORS[i % DAILY_COLORS.length], order: i,
    }));
    await Promise.all(state.dailies.map((d) => dbPut('dailies', d)));
    await dbPut('settings', { key: 'seeded', value: true });
  }
}

/* --------------------------------------------------------------------------
   4. Theme
   -------------------------------------------------------------------------- */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('notizen-theme', theme); } catch (e) { /* egal */ }
  const meta = $('#theme-color');
  if (meta) meta.content = theme === 'dark' ? '#191919' : '#ffffff';
  $$('.themetoggle button').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.theme === theme));
  });
}

function initTheme() {
  $$('.themetoggle button').forEach((btn) => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
  applyTheme(document.documentElement.dataset.theme || 'light');
}

/* --------------------------------------------------------------------------
   5. Toast
   -------------------------------------------------------------------------- */

let toastTimer = null;

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2200);
}

/* --------------------------------------------------------------------------
   6. Dailies
   -------------------------------------------------------------------------- */

const logKey = (dailyId, date) => `${dailyId}|${date}`;

function isDone(dailyId, date = todayKey()) {
  return state.logs.has(logKey(dailyId, date));
}

function streakOf(dailyId) {
  let count = 0;
  for (let i = 0; i < 400; i++) {
    if (isDone(dailyId, todayKey(-i))) count++;
    else if (i === 0) continue; // heute noch offen bricht die Serie nicht
    else break;
  }
  return count;
}

async function toggleDaily(dailyId) {
  const key = logKey(dailyId, todayKey());
  const nowDone = !state.logs.has(key);
  if (nowDone) state.logs.add(key); else state.logs.delete(key);
  await dbPut('logs', { key, dailyId, date: todayKey(), done: nowDone });
  renderToday();
}

async function addDaily(name, glyph) {
  const daily = {
    id: uid(),
    name: name.trim(),
    glyph: glyph.trim() || '✳️',
    color: DAILY_COLORS[state.dailies.length % DAILY_COLORS.length],
    order: state.dailies.length,
  };
  state.dailies.push(daily);
  await dbPut('dailies', daily);
  renderToday();
  renderMore();
}

async function removeDaily(id) {
  state.dailies = state.dailies.filter((d) => d.id !== id);
  await dbDelete('dailies', id);
  renderToday();
  renderMore();
}

/* --------------------------------------------------------------------------
   7. Aufgaben
   -------------------------------------------------------------------------- */

async function addTask(title) {
  const task = { id: uid(), title: title.trim(), done: false, subs: [], createdAt: Date.now() };
  state.tasks.unshift(task);
  await dbPut('tasks', task);
  renderTasks();
  renderToday();
  return task;
}

async function saveTask(task) {
  await dbPut('tasks', task);
  renderTasks();
  renderToday();
}

async function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  state.openTasks.delete(id);
  await dbDelete('tasks', id);
  renderTasks();
  renderToday();
}

const findTask = (id) => state.tasks.find((t) => t.id === id);

function taskProgress(task) {
  if (!task.subs.length) return null;
  const done = task.subs.filter((s) => s.done).length;
  return { done, total: task.subs.length, pct: Math.round((done / task.subs.length) * 100) };
}

function isTaskComplete(task) {
  if (task.subs.length) return task.subs.every((s) => s.done);
  return task.done;
}

/* --------------------------------------------------------------------------
   8. Notizen
   -------------------------------------------------------------------------- */

async function createNote(body = '') {
  const note = { id: uid(), title: '', body, createdAt: Date.now(), updatedAt: Date.now() };
  state.notes.unshift(note);
  await dbPut('notes', note);
  return note;
}

async function saveNote(note) {
  note.updatedAt = Date.now();
  await dbPut('notes', note);
  state.notes.sort((a, b) => b.updatedAt - a.updatedAt);
}

async function deleteNote(id) {
  state.notes = state.notes.filter((n) => n.id !== id);
  await dbDelete('notes', id);
  renderNotes();
  renderToday();
}

function noteTitleOf(note) {
  if (note.title.trim()) return note.title.trim();
  const first = note.body.split('\n').find((l) => l.trim());
  return first ? first.trim().slice(0, 60) : 'Ohne Titel';
}

/* --------------------------------------------------------------------------
   9. Render – Heute
   -------------------------------------------------------------------------- */

function renderToday() {
  const done = state.dailies.filter((d) => isDone(d.id)).length;
  const total = state.dailies.length;
  const pct = total ? done / total : 0;

  const circumference = 2 * Math.PI * 32;
  const openTasks = state.tasks.filter((t) => !isTaskComplete(t)).length;

  let html = `
    <h1 class="largetitle">Heute</h1>
    <p class="subtitle">${esc(formatLongDate())}</p>

    <div class="tile tile--wide progresstile">
      <svg class="ring" viewBox="0 0 76 76" aria-hidden="true">
        <circle class="ring__track" cx="38" cy="38" r="32"/>
        <circle class="ring__bar" cx="38" cy="38" r="32"
          stroke-dasharray="${circumference.toFixed(1)}"
          stroke-dashoffset="${(circumference * (1 - pct)).toFixed(1)}"/>
      </svg>
      <div class="progresstile__body">
        <div class="progresstile__count">${done} / ${total}</div>
        <div class="progresstile__label">${
          total === 0 ? 'Noch keine Dailies angelegt'
          : done === total ? 'Alles erledigt für heute'
          : 'Dailies erledigt'
        }</div>
      </div>
    </div>

    <div class="sectionhead">
      <h2>Dailies</h2>
      <button class="sectionhead__action" data-goto="more">Bearbeiten</button>
    </div>
  `;

  if (total === 0) {
    html += `
      <div class="tile tile--wide empty">
        <h3>Keine Dailies</h3>
        <p>Lege unter „Mehr“ an, was du täglich tracken willst.</p>
      </div>`;
  } else {
    html += '<div class="tilegrid">';
    for (const d of state.dailies) {
      const on = isDone(d.id);
      const streak = streakOf(d.id);
      html += `
        <button class="tile daily ${on ? 'is-done' : ''}" data-daily="${esc(d.id)}"
          style="--dc: var(${d.color}); --dc-soft: color-mix(in srgb, var(${d.color}) 9%, var(--bg-tile)); --dc-soft2: color-mix(in srgb, var(${d.color}) 18%, var(--bg-tile)); --dc-text: color-mix(in srgb, var(${d.color}) 70%, var(--text));"
          aria-pressed="${on}">
          <span class="daily__glyph">${esc(d.glyph)}</span>
          <span class="daily__check">${ICONS.check}</span>
          <span>
            <span class="daily__name">${esc(d.name)}</span>
            <span class="daily__streak">${streak === 0 ? 'Noch keine Serie' : streak === 1 ? '1 Tag in Serie' : `${streak} Tage in Serie`}</span>
          </span>
        </button>`;
    }
    html += '</div>';
  }

  html += `
    <div class="sectionhead"><h2>Schnell notieren</h2></div>
    <div class="quickadd">
      <input id="quick-input" type="text" placeholder="Was liegt an?"
        autocomplete="off" enterkeyhint="done">
      <button class="pillbtn pillbtn--primary" id="quick-task" disabled>Aufgabe</button>
      <button class="pillbtn" id="quick-note" disabled>Notiz</button>
    </div>

    <div class="tilegrid" style="margin-top: 22px;">
      <button class="tile stat" data-goto="tasks">
        <span class="stat__icon">${ICONS.tasks}</span>
        <span>
          <span class="stat__num">${openTasks}</span>
          <span class="stat__label" style="display:block">${openTasks === 1 ? 'offene Aufgabe' : 'offene Aufgaben'}</span>
        </span>
      </button>
      <button class="tile stat" data-goto="notes">
        <span class="stat__icon">${ICONS.notes}</span>
        <span>
          <span class="stat__num">${state.notes.length}</span>
          <span class="stat__label" style="display:block">${state.notes.length === 1 ? 'Notiz' : 'Notizen'}</span>
        </span>
      </button>
    </div>
  `;

  $('#view-today').innerHTML = html;
  wireQuickAdd();
}

function wireQuickAdd() {
  const input = $('#quick-input');
  const asTask = $('#quick-task');
  const asNote = $('#quick-note');
  if (!input) return;

  const sync = () => {
    const empty = !input.value.trim();
    asTask.disabled = empty;
    asNote.disabled = empty;
  };

  input.addEventListener('input', sync);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      e.preventDefault();
      asTask.click();
    }
  });

  asTask.addEventListener('click', async () => {
    const value = input.value.trim();
    if (!value) return;
    await addTask(value);
    input.value = '';
    sync();
    toast('Als Aufgabe gespeichert');
    $('#quick-input')?.focus();
  });

  asNote.addEventListener('click', async () => {
    const value = input.value.trim();
    if (!value) return;
    const note = await createNote(value);
    input.value = '';
    sync();
    renderNotes();
    renderToday();
    openEditor(note.id);
  });
}

/* --------------------------------------------------------------------------
   10. Render – Aufgaben
   -------------------------------------------------------------------------- */

function taskHTML(task) {
  const progress = taskProgress(task);
  const complete = isTaskComplete(task);
  const open = state.openTasks.has(task.id);

  let meta = '';
  if (progress) {
    meta = `
      <div class="task__meta">
        <span>${progress.done}/${progress.total}</span>
        <span class="bar"><span class="bar__fill" style="width:${progress.pct}%"></span></span>
      </div>`;
  }

  let subs = '';
  for (const s of task.subs) {
    subs += `
      <div class="sub ${s.done ? 'is-done' : ''}">
        <button class="check ${s.done ? 'is-on' : ''}" data-sub-toggle="${esc(task.id)}|${esc(s.id)}"
          aria-label="Unterpunkt abhaken" aria-pressed="${s.done}">${ICONS.check}</button>
        <span class="sub__title">${esc(s.title)}</span>
        <button class="sub__del" data-sub-del="${esc(task.id)}|${esc(s.id)}" aria-label="Unterpunkt löschen">${ICONS.trash}</button>
      </div>`;
  }

  return `
    <article class="task ${complete ? 'is-done' : ''} ${open ? 'is-open' : ''}" data-task="${esc(task.id)}">
      <div class="task__head">
        <button class="check ${complete ? 'is-on' : ''}" data-task-toggle="${esc(task.id)}"
          aria-label="Aufgabe abhaken" aria-pressed="${complete}">${ICONS.check}</button>
        <div class="task__body">
          <div class="task__title">${esc(task.title)}</div>
          ${meta}
        </div>
        <button class="task__toggle" data-task-open="${esc(task.id)}"
          aria-label="Unterpunkte anzeigen" aria-expanded="${open}">${ICONS.chevron}</button>
      </div>
      <div class="task__sub">
        ${subs}
        <div class="subadd">
          <span class="subadd__plus">${ICONS.plus}</span>
          <input type="text" data-sub-input="${esc(task.id)}" placeholder="Unterpunkt hinzufügen"
            autocomplete="off" enterkeyhint="done">
        </div>
      </div>
      <div class="task__foot">
        <button class="textbtn textbtn--danger" data-task-del="${esc(task.id)}">Aufgabe löschen</button>
      </div>
    </article>`;
}

function renderTasks() {
  const open = state.tasks.filter((t) => !isTaskComplete(t));
  const done = state.tasks.filter((t) => isTaskComplete(t));

  let html = `
    <h1 class="largetitle">Aufgaben</h1>
    <p class="subtitle">${open.length === 0 ? 'Nichts offen' : `${open.length} offen`}${done.length ? ` · ${done.length} erledigt` : ''}</p>

    <div class="quickadd">
      <input id="task-input" type="text" placeholder="Neue Aufgabe…" autocomplete="off" enterkeyhint="done">
      <button class="quickadd__go" id="task-add" aria-label="Aufgabe hinzufügen" disabled>${ICONS.arrowUp}</button>
    </div>
  `;

  if (open.length) {
    html += '<div class="sectionhead"><h2>Offen</h2></div>';
    html += open.map(taskHTML).join('');
  } else if (!done.length) {
    html += `
      <div class="empty" style="margin-top:20px">
        <span class="empty__icon">${ICONS.tasks}</span>
        <h3>Noch keine Aufgaben</h3>
        <p>Tippe oben etwas ein. Unterpunkte kannst du danach<br>über den Pfeil rechts hinzufügen.</p>
      </div>`;
  }

  if (done.length) {
    html += '<div class="sectionhead"><h2>Erledigt</h2><button class="sectionhead__action" id="clear-done">Aufräumen</button></div>';
    html += done.map(taskHTML).join('');
  }

  $('#view-tasks').innerHTML = html;
  wireTaskInput();
}

function wireTaskInput() {
  const input = $('#task-input');
  const btn = $('#task-add');
  if (!input) return;

  const sync = () => { btn.disabled = !input.value.trim(); };
  input.addEventListener('input', sync);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) { e.preventDefault(); btn.click(); }
  });
  btn.addEventListener('click', async () => {
    const value = input.value.trim();
    if (!value) return;
    await addTask(value);
    const fresh = $('#task-input');
    if (fresh) { fresh.value = ''; fresh.focus(); }
  });

  $('#clear-done')?.addEventListener('click', async () => {
    const done = state.tasks.filter(isTaskComplete);
    if (!done.length) return;
    if (!confirm(`${done.length} erledigte ${done.length === 1 ? 'Aufgabe' : 'Aufgaben'} löschen?`)) return;
    for (const t of done) {
      state.tasks = state.tasks.filter((x) => x.id !== t.id);
      await dbDelete('tasks', t.id);
    }
    renderTasks();
    renderToday();
    toast('Erledigte Aufgaben gelöscht');
  });
}

/* --------------------------------------------------------------------------
   11. Render – Notizen
   -------------------------------------------------------------------------- */

function renderNotes() {
  const query = state.noteQuery.trim().toLowerCase();
  const list = query
    ? state.notes.filter((n) => (n.title + ' ' + n.body).toLowerCase().includes(query))
    : state.notes;

  let html = `
    <h1 class="largetitle">Notizen</h1>
    <p class="subtitle">${state.notes.length === 0 ? 'Noch leer' : `${state.notes.length} ${state.notes.length === 1 ? 'Notiz' : 'Notizen'}`}</p>

    <div class="searchbar">
      ${ICONS.search}
      <input id="note-search" type="search" placeholder="Notizen durchsuchen" value="${esc(state.noteQuery)}">
    </div>

    <div class="quickadd" style="margin-bottom:20px">
      <input id="note-new" type="text" placeholder="Neue Notiz beginnen…" autocomplete="off" enterkeyhint="done">
      <button class="quickadd__go" id="note-add" aria-label="Notiz anlegen">${ICONS.plus}</button>
    </div>
  `;

  if (!list.length) {
    html += `
      <div class="empty">
        <span class="empty__icon">${ICONS.notes}</span>
        <h3>${query ? 'Nichts gefunden' : 'Noch keine Notizen'}</h3>
        <p>${query ? 'Versuch einen anderen Suchbegriff.' : 'Tippe oben los – die Notiz öffnet sich sofort im Editor.'}</p>
      </div>`;
  } else {
    html += '<div class="notegrid">';
    for (const n of list) {
      // Steht der Titel separat, zeigt die Vorschau den ganzen Text –
      // sonst die Zeilen nach der ersten, die als Titel dient.
      const rest = n.title.trim() ? n.body : n.body.split('\n').slice(1).join('\n');
      const preview = rest.trim() || 'Leere Notiz';
      html += `
        <button class="notecard" data-note="${esc(n.id)}">
          <span class="notecard__title">${esc(noteTitleOf(n))}</span>
          <span class="notecard__preview">${esc(preview.slice(0, 220))}</span>
          <span class="notecard__date">${esc(relativeDate(n.updatedAt))}</span>
        </button>`;
    }
    html += '</div>';
  }

  $('#view-notes').innerHTML = html;
  wireNotesInputs();
}

function wireNotesInputs() {
  const search = $('#note-search');
  if (search) {
    search.addEventListener('input', () => {
      state.noteQuery = search.value;
      const pos = search.selectionStart;
      renderNotes();
      const again = $('#note-search');
      if (again) { again.focus(); again.setSelectionRange(pos, pos); }
    });
  }

  const input = $('#note-new');
  const btn = $('#note-add');
  if (!input) return;

  const create = async () => {
    const note = await createNote(input.value.trim());
    input.value = '';
    renderNotes();
    renderToday();
    openEditor(note.id);
  };

  btn.addEventListener('click', create);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); create(); }
  });
}

/* --------------------------------------------------------------------------
   12. Editor-Sheet
   -------------------------------------------------------------------------- */

let saveTimer = null;

function openEditor(noteId) {
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return;

  state.editing = noteId;
  $('#editor-title').value = note.title;
  $('#editor-text').value = note.body;
  $('#editor-status').textContent = relativeDate(note.updatedAt);
  $('#sheet').classList.add('is-open');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    if (!note.body && !note.title) $('#editor-title').focus();
    else $('#editor-text').focus();
  }, 380);
}

function closeEditor() {
  flushEditor();
  state.editing = null;
  $('#sheet').classList.remove('is-open');
  document.body.style.overflow = '';
  renderNotes();
  renderToday();
}

function flushEditor() {
  clearTimeout(saveTimer);
  if (!state.editing) return;
  const note = state.notes.find((n) => n.id === state.editing);
  if (!note) return;
  note.title = $('#editor-title').value;
  note.body = $('#editor-text').value;
  saveNote(note);
}

function initEditor() {
  const scheduleSave = () => {
    clearTimeout(saveTimer);
    $('#editor-status').textContent = 'Speichert…';
    saveTimer = setTimeout(() => {
      flushEditor();
      $('#editor-status').textContent = 'Gespeichert';
    }, 500);
  };

  $('#editor-title').addEventListener('input', scheduleSave);
  $('#editor-text').addEventListener('input', scheduleSave);
  $('#editor-close').addEventListener('click', closeEditor);

  $('#editor-delete').addEventListener('click', async () => {
    if (!state.editing) return;
    if (!confirm('Diese Notiz löschen?')) return;
    const id = state.editing;
    state.editing = null;
    clearTimeout(saveTimer);
    $('#sheet').classList.remove('is-open');
    document.body.style.overflow = '';
    await deleteNote(id);
    toast('Notiz gelöscht');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.editing) closeEditor();
  });

  window.addEventListener('beforeunload', flushEditor);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushEditor();
  });
}

/* --------------------------------------------------------------------------
   13. Render – Mehr / Einstellungen
   -------------------------------------------------------------------------- */

function renderMore() {
  let dailyRows = state.dailies.map((d) => `
    <div class="dailyrow">
      <span class="dailyrow__glyph">${esc(d.glyph)}</span>
      <span class="dailyrow__name">${esc(d.name)}</span>
      <button class="iconbtn" data-daily-del="${esc(d.id)}" aria-label="Daily löschen">${ICONS.trash}</button>
    </div>`).join('');

  if (!state.dailies.length) {
    dailyRows = '<div class="dailyrow"><span class="dailyrow__name" style="color:var(--text-3)">Noch keine Dailies</span></div>';
  }

  $('#view-more').innerHTML = `
    <h1 class="largetitle">Mehr</h1>
    <p class="subtitle">Dailies, Speicher und Sicherung</p>

    <div class="grouplabel">Dailies</div>
    <div class="group">
      ${dailyRows}
      <div class="newdaily">
        <input class="glyph" id="new-daily-glyph" type="text" maxlength="2" placeholder="✳️" aria-label="Emoji">
        <input class="name" id="new-daily-name" type="text" placeholder="Neues Daily" aria-label="Name" enterkeyhint="done">
        <button class="newdaily__go" id="new-daily-add">Hinzufügen</button>
      </div>
    </div>

    <div class="grouplabel">Sicherung</div>
    <div class="group">
      <button class="row row--btn" id="export-btn">
        <span class="row__label">Daten exportieren</span>
        <span class="row__chev">${ICONS.chevron}</span>
      </button>
      <button class="row row--btn" id="import-btn">
        <span class="row__label">Daten importieren</span>
        <span class="row__chev">${ICONS.chevron}</span>
      </button>
    </div>
    <p class="groupnote">Der Export legt eine JSON-Datei auf deinem Gerät ab. Sichere sie ab und zu in iCloud oder Google Drive – das ist dein Backup, falls du das Handy wechselst.</p>

    <div class="grouplabel">Speicher</div>
    <div class="group">
      <div class="row">
        <span class="row__label">Dauerhaft gespeichert</span>
        <span class="row__value" id="persist-state">wird geprüft…</span>
      </div>
      <div class="row">
        <span class="row__label">Belegt</span>
        <span class="row__value" id="usage-state">–</span>
      </div>
      <div class="row">
        <span class="row__label">Einträge</span>
        <span class="row__value">${state.tasks.length} Aufgaben · ${state.notes.length} Notizen · ${state.dailies.length} Dailies</span>
      </div>
    </div>
    <p class="groupnote">Die Daten liegen ausschließlich in diesem Browser, auf diesem Gerät. Ein Neustart schadet ihnen nicht. Löschst du die Browserdaten, sind sie weg.</p>

    <div class="group">
      <button class="row row--btn row--danger" id="wipe-btn">
        <span class="row__label">Alle Daten löschen</span>
      </button>
    </div>
  `;

  wireMore();
  reportStorage();
}

function wireMore() {
  const nameInput = $('#new-daily-name');
  const glyphInput = $('#new-daily-glyph');

  const add = () => {
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    addDaily(name, glyphInput.value);
    toast('Daily hinzugefügt');
  };

  $('#new-daily-add').addEventListener('click', add);
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  });

  $('#export-btn').addEventListener('click', exportData);
  $('#import-btn').addEventListener('click', () => $('#import-file').click());

  $('#wipe-btn').addEventListener('click', async () => {
    if (!confirm('Wirklich alles löschen? Aufgaben, Notizen und alle Daily-Einträge werden entfernt.')) return;
    if (!confirm('Das kann nicht rückgängig gemacht werden. Sicher?')) return;
    await Promise.all(STORES.map(dbClear));
    state.dailies = []; state.tasks = []; state.notes = []; state.logs = new Set();
    renderAll();
    toast('Alles gelöscht');
  });
}

async function reportStorage() {
  const persistEl = $('#persist-state');
  const usageEl = $('#usage-state');
  if (!persistEl) return;

  if (navigator.storage?.persisted) {
    let granted = await navigator.storage.persisted();
    if (!granted && navigator.storage.persist) granted = await navigator.storage.persist();
    persistEl.textContent = granted ? 'Ja' : 'Nicht garantiert';
  } else {
    persistEl.textContent = 'Nicht unterstützt';
  }

  if (navigator.storage?.estimate) {
    const { usage } = await navigator.storage.estimate();
    usageEl.textContent = usage != null ? `${(usage / 1024).toFixed(0)} KB` : '–';
  }
}

/* --------------------------------------------------------------------------
   14. Export / Import
   -------------------------------------------------------------------------- */

async function exportData() {
  flushEditor();
  const logs = await dbAll('logs');
  const payload = {
    app: 'notizen',
    version: 1,
    exportedAt: new Date().toISOString(),
    dailies: state.dailies,
    logs,
    tasks: state.tasks,
    notes: state.notes,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notizen-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Backup exportiert');
}

function initImport() {
  $('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    let data;
    try {
      data = JSON.parse(await file.text());
    } catch (err) {
      toast('Datei konnte nicht gelesen werden');
      return;
    }

    if (data.app !== 'notizen' || !Array.isArray(data.tasks)) {
      toast('Kein gültiges Notizen-Backup');
      return;
    }

    if (!confirm('Backup einlesen? Vorhandene Daten werden ersetzt.')) return;

    await Promise.all(STORES.filter((s) => s !== 'settings').map(dbClear));
    for (const d of data.dailies || []) await dbPut('dailies', d);
    for (const l of data.logs || [])    await dbPut('logs', l);
    for (const t of data.tasks || [])   await dbPut('tasks', t);
    for (const n of data.notes || [])   await dbPut('notes', n);

    await loadState();
    renderAll();
    toast('Backup eingelesen');
  });
}

/* --------------------------------------------------------------------------
   15. Navigation
   -------------------------------------------------------------------------- */

const VIEW_TITLES = { today: 'Heute', tasks: 'Aufgaben', notes: 'Notizen', more: 'Mehr' };

const RENDERERS = { today: renderToday, tasks: renderTasks, notes: renderNotes, more: renderMore };

function switchView(view) {
  if (!VIEW_TITLES[view]) return;
  state.view = view;
  RENDERERS[view]();
  $$('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${view}`));
  $$('.tabbar button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === view)));
  $('.topbar__title').textContent = VIEW_TITLES[view];
  window.scrollTo({ top: 0 });
}

function initNav() {
  $$('.tabbar button').forEach((b) => {
    b.addEventListener('click', () => switchView(b.dataset.view));
  });

  window.addEventListener('scroll', () => {
    $('.topbar').classList.toggle('is-scrolled', window.scrollY > 22);
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   16. Globale Klicks (Event Delegation)
   -------------------------------------------------------------------------- */

function initDelegation() {
  document.addEventListener('click', async (e) => {
    const el = (sel) => e.target.closest(sel);

    const goto = el('[data-goto]');
    if (goto) { switchView(goto.dataset.goto); return; }

    const daily = el('[data-daily]');
    if (daily) { toggleDaily(daily.dataset.daily); return; }

    const dailyDel = el('[data-daily-del]');
    if (dailyDel) {
      const d = state.dailies.find((x) => x.id === dailyDel.dataset.dailyDel);
      if (d && confirm(`„${d.name}“ löschen? Die bisherigen Einträge bleiben im Backup erhalten.`)) {
        await removeDaily(d.id);
        toast('Daily gelöscht');
      }
      return;
    }

    const taskToggle = el('[data-task-toggle]');
    if (taskToggle) {
      const task = findTask(taskToggle.dataset.taskToggle);
      if (!task) return;
      if (task.subs.length) {
        const allDone = task.subs.every((s) => s.done);
        task.subs.forEach((s) => { s.done = !allDone; });
        task.done = !allDone;
      } else {
        task.done = !task.done;
      }
      await saveTask(task);
      return;
    }

    const taskOpen = el('[data-task-open]');
    if (taskOpen) {
      const id = taskOpen.dataset.taskOpen;
      if (state.openTasks.has(id)) state.openTasks.delete(id);
      else state.openTasks.add(id);
      renderTasks();
      if (state.openTasks.has(id)) $(`[data-sub-input="${id}"]`)?.focus();
      return;
    }

    const taskDel = el('[data-task-del]');
    if (taskDel) {
      const task = findTask(taskDel.dataset.taskDel);
      if (task && confirm(`„${task.title}“ löschen?`)) {
        await deleteTask(task.id);
        toast('Aufgabe gelöscht');
      }
      return;
    }

    const subToggle = el('[data-sub-toggle]');
    if (subToggle) {
      const [taskId, subId] = subToggle.dataset.subToggle.split('|');
      const task = findTask(taskId);
      const sub = task?.subs.find((s) => s.id === subId);
      if (!sub) return;
      sub.done = !sub.done;
      task.done = task.subs.every((s) => s.done);
      await saveTask(task);
      return;
    }

    const subDel = el('[data-sub-del]');
    if (subDel) {
      const [taskId, subId] = subDel.dataset.subDel.split('|');
      const task = findTask(taskId);
      if (!task) return;
      task.subs = task.subs.filter((s) => s.id !== subId);
      await saveTask(task);
      return;
    }

    const note = el('[data-note]');
    if (note) { openEditor(note.dataset.note); return; }
  });

  // Unterpunkt per Enter anlegen
  document.addEventListener('keydown', async (e) => {
    const input = e.target.closest('[data-sub-input]');
    if (!input || e.key !== 'Enter') return;
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    const task = findTask(input.dataset.subInput);
    if (!task) return;
    task.subs.push({ id: uid(), title: value, done: false });
    task.done = false;
    state.openTasks.add(task.id);
    await saveTask(task);
    $(`[data-sub-input="${task.id}"]`)?.focus();
  });
}

/* --------------------------------------------------------------------------
   17. Start
   -------------------------------------------------------------------------- */

function renderAll() {
  renderToday();
  renderTasks();
  renderNotes();
  renderMore();
}

async function boot() {
  initTheme();
  initNav();
  initEditor();
  initImport();
  initDelegation();

  try {
    await loadState();
  } catch (err) {
    console.error(err);
    toast('Speicher nicht verfügbar');
  }

  renderAll();
  switchView('today');

  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW:', err));
    });
  }
}

boot();
