/* ==========================================================================
   Notizen – lokale PWA
   Speicher: IndexedDB. Kein Server, kein Login, keine Übertragung nach außen.
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. IndexedDB
   -------------------------------------------------------------------------- */

const DB_NAME = 'notizen';
const DB_VERSION = 2;
const STORES = ['dailies', 'logs', 'tasks', 'notes', 'tags', 'dayTypes', 'dayAssign', 'atts', 'settings'];

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const make = (name, key) => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: key });
      };
      make('dailies', 'id');
      make('logs', 'key');
      make('tasks', 'id');
      make('notes', 'id');
      make('tags', 'id');
      make('dayTypes', 'id');
      make('dayAssign', 'date');
      make('atts', 'id');
      make('settings', 'key');
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
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return dateKey(d);
}

function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const formatLongDate = (d = new Date()) =>
  d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });

function relativeDate(ts) {
  const d = new Date(ts);
  const key = dateKey(d);
  if (key === todayKey()) return t('todayLabel') + ' ' + d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(locale(), sameYear
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

const ICONS = {
  check:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  sun:     '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  today:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 3v3m8-3v3"/><circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none"/></svg>',
  tasks:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m3 6.5 2 2 3.5-3.5M3 16.5l2 2 3.5-3.5M12 7h9M12 17h9"/></svg>',
  notes:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3.5h9.5L19 8v12.5H5z"/><path d="M14 3.5V8h5M8.5 12.5h7M8.5 16h4.5"/></svg>',
  cal:     '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 3v3m8-3v3M7.5 13h2m3 0h2m3 0h.5M7.5 16.5h2m3 0h2"/></svg>',
  more:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/></svg>',
  chevron: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  chevL:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
  plus:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>',
  arrowUp: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  search:  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
  trash:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 12.5h9.4L17.5 7"/></svg>',
  pin:     '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M14.5 2.6a1.3 1.3 0 0 1 1.9 0l5 5a1.3 1.3 0 0 1-.5 2.2l-2.7.8-3.4 3.4.3 3a1.3 1.3 0 0 1-2.2 1.1l-3-3-4.4 4.4a1 1 0 1 1-1.4-1.4l4.4-4.4-3-3A1.3 1.3 0 0 1 6.6 8.6l3-.3L13 4.9l.8-2.7Z"/></svg>',
  x:       '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  image:   '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.5" cy="10" r="1.6"/><path d="m4 17 4.5-4.5 3.5 3.5 3-3L20 17"/></svg>',
  mic:     '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
  stop:    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>',
  folder:  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6.5A2 2 0 0 1 5 4.5h3.8a2 2 0 0 1 1.5.7l1 1.3H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  bulb:    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 18h5M10 21h4M12 3a6 6 0 0 1 3.5 10.9V16h-7v-2.1A6 6 0 0 1 12 3Z"/></svg>',
};

const COLORS = ['--c-blue', '--c-teal', '--c-green', '--c-lime', '--c-orange',
                '--c-red', '--c-pink', '--c-purple', '--c-slate'];

/* --------------------------------------------------------------------------
   3. State
   -------------------------------------------------------------------------- */

const state = {
  dailies: [], logs: new Map(), tasks: [], notes: [], tags: [],
  dayTypes: [], dayAssign: new Map(), atts: [],
  openTasks: new Set(),
  view: 'today',
  noteQuery: '',
  taskFilter: null,          // Ordner-ID oder null
  editing: null,
  calMonth: new Date(),
  calSelected: todayKey(),
  theme: 'light',
};

/* Objekt-URLs für Anhänge, damit sie nicht doppelt erzeugt werden */
const attUrls = new Map();

function attUrl(att) {
  if (!attUrls.has(att.id)) attUrls.set(att.id, URL.createObjectURL(att.blob));
  return attUrls.get(att.id);
}

/* --------------------------------------------------------------------------
   4. Startdaten
   -------------------------------------------------------------------------- */

async function seedIfEmpty() {
  const settings = await dbAll('settings');
  if (settings.find((s) => s.key === 'seeded')) return;

  const dt = [
    { id: uid(), name: t('seedWork'), glyph: '💼', order: 0 },
    { id: uid(), name: t('seedUni'),  glyph: '🎓', order: 1 },
    { id: uid(), name: t('seedFree'), glyph: '🌤️', order: 2 },
  ];
  state.dayTypes = dt;
  for (const x of dt) await dbPut('dayTypes', x);

  const all = dt.map((x) => x.id);
  const dailies = [
    { id: uid(), name: t('seedSport'), glyph: '🏋️', color: '--c-blue',   dayTypes: all, goal: null, unit: '', order: 0 },
    { id: uid(), name: t('seedRead'),  glyph: '📖', color: '--c-purple', dayTypes: all, goal: null, unit: '', order: 1 },
    { id: uid(), name: t('seedSteps'), glyph: '👟', color: '--c-green',  dayTypes: all, goal: 7000, unit: t('unitSteps'), order: 2 },
    { id: uid(), name: t('seedEdit'),  glyph: '🎬', color: '--c-orange', dayTypes: [dt[0].id], goal: null, unit: '', order: 3 },
  ];
  state.dailies = dailies;
  for (const x of dailies) await dbPut('dailies', x);

  await dbPut('settings', { key: 'seeded', value: true });
}

async function loadState() {
  const [dailies, logs, tasks, notes, tags, dayTypes, dayAssign, atts] = await Promise.all(
    ['dailies', 'logs', 'tasks', 'notes', 'tags', 'dayTypes', 'dayAssign', 'atts'].map(dbAll)
  );

  const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
  state.dailies  = dailies.sort(byOrder);
  state.tags     = tags.sort(byOrder);
  state.dayTypes = dayTypes.sort(byOrder);
  state.tasks    = tasks.sort((a, b) => b.createdAt - a.createdAt);
  state.notes    = notes.sort((a, b) => b.updatedAt - a.updatedAt);
  state.atts     = atts;

  state.logs = new Map(logs.map((l) => [l.key, l]));
  state.dayAssign = new Map(dayAssign.map((d) => [d.date, d.dayTypeId]));

  await seedIfEmpty();
}

/* --------------------------------------------------------------------------
   5. Ordner (Tags) und automatische Zuordnung
   -------------------------------------------------------------------------- */

const findTag = (id) => state.tags.find((x) => x.id === id);

async function addTag(name, color, keywords) {
  const tag = {
    id: uid(),
    name: name.trim(),
    color: color || COLORS[state.tags.length % COLORS.length],
    keywords: splitKeywords(keywords),
    order: state.tags.length,
  };
  state.tags.push(tag);
  await dbPut('tags', tag);
  return tag;
}

async function saveTag(tag) { await dbPut('tags', tag); }

async function deleteTag(id) {
  state.tags = state.tags.filter((x) => x.id !== id);
  await dbDelete('tags', id);
  for (const task of state.tasks) {
    if (task.tags?.includes(id)) { task.tags = task.tags.filter((x) => x !== id); await dbPut('tasks', task); }
  }
  for (const note of state.notes) {
    if (note.tags?.includes(id)) { note.tags = note.tags.filter((x) => x !== id); await dbPut('notes', note); }
  }
  if (state.taskFilter === id) state.taskFilter = null;
}

const splitKeywords = (str) =>
  String(str || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

/* Sucht in einem Text nach den Stichwörtern aller Ordner. Reines
   Wortabgleichen, das läuft komplett offline und ohne KI-Dienst. */
function autoTags(text) {
  const hay = ' ' + String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ') + ' ';
  const hits = [];
  for (const tag of state.tags) {
    for (const kw of tag.keywords || []) {
      if (hay.includes(' ' + kw + ' ') || hay.includes(kw)) { hits.push(tag.id); break; }
    }
  }
  return hits;
}

function tagProgress(tagId) {
  const tasks = state.tasks.filter((x) => x.tags?.includes(tagId));
  if (!tasks.length) return { done: 0, total: 0, pct: 0, open: 0 };
  const done = tasks.filter(isTaskComplete).length;
  return { done, total: tasks.length, pct: Math.round((done / tasks.length) * 100), open: tasks.length - done };
}

/* --------------------------------------------------------------------------
   6. Dailies, Tagesarten, Logs
   -------------------------------------------------------------------------- */

const logKey = (dailyId, date) => `${dailyId}|${date}`;
const getLog = (dailyId, date) => state.logs.get(logKey(dailyId, date));

function dayTypeOf(date) {
  const id = state.dayAssign.get(date);
  if (id && state.dayTypes.some((x) => x.id === id)) return id;
  return state.dayTypes[0]?.id ?? null;
}

async function setDayType(date, dayTypeId) {
  state.dayAssign.set(date, dayTypeId);
  await dbPut('dayAssign', { date, dayTypeId });
}

function dailiesFor(date) {
  const dtId = dayTypeOf(date);
  return state.dailies.filter((d) => !d.dayTypes?.length || d.dayTypes.includes(dtId));
}

function dailyDone(daily, date) {
  const log = getLog(daily.id, date);
  if (!log) return false;
  if (daily.goal) return (log.value ?? 0) >= daily.goal;
  return !!log.done;
}

async function toggleDaily(dailyId) {
  const daily = state.dailies.find((d) => d.id === dailyId);
  if (!daily || daily.goal) return;
  const date = todayKey();
  const key = logKey(dailyId, date);
  const done = !(state.logs.get(key)?.done);
  const log = { key, dailyId, date, done, value: null };
  state.logs.set(key, log);
  await dbPut('logs', log);
  renderToday();
}

async function setDailyValue(dailyId, value) {
  const daily = state.dailies.find((d) => d.id === dailyId);
  if (!daily) return;
  const date = todayKey();
  const key = logKey(dailyId, date);
  const v = clamp(Math.round(value) || 0, 0, 10 ** 9);
  const log = { key, dailyId, date, done: daily.goal ? v >= daily.goal : true, value: v };
  state.logs.set(key, log);
  await dbPut('logs', log);
  renderToday();
}

function streakOf(daily) {
  let count = 0;
  for (let i = 0; i < 400; i++) {
    const date = todayKey(-i);
    if (dailyDone(daily, date)) count++;
    else if (i === 0) continue;   // heute noch offen bricht die Serie nicht
    else break;
  }
  return count;
}

async function addDaily(data) {
  const daily = {
    id: uid(),
    name: data.name.trim(),
    glyph: data.glyph.trim() || '✳️',
    color: data.color || COLORS[state.dailies.length % COLORS.length],
    dayTypes: data.dayTypes?.length ? data.dayTypes : state.dayTypes.map((x) => x.id),
    goal: data.goal || null,
    unit: (data.unit || '').trim(),
    order: state.dailies.length,
  };
  state.dailies.push(daily);
  await dbPut('dailies', daily);
}

async function removeDaily(id) {
  state.dailies = state.dailies.filter((d) => d.id !== id);
  await dbDelete('dailies', id);
}

async function addDayType(name, glyph) {
  const dt = { id: uid(), name: name.trim(), glyph: glyph.trim() || '📅', order: state.dayTypes.length };
  state.dayTypes.push(dt);
  await dbPut('dayTypes', dt);
  return dt;
}

async function removeDayType(id) {
  state.dayTypes = state.dayTypes.filter((x) => x.id !== id);
  await dbDelete('dayTypes', id);
  for (const d of state.dailies) {
    if (d.dayTypes?.includes(id)) { d.dayTypes = d.dayTypes.filter((x) => x !== id); await dbPut('dailies', d); }
  }
}

/* --------------------------------------------------------------------------
   7. Aufgaben
   -------------------------------------------------------------------------- */

const findTask = (id) => state.tasks.find((x) => x.id === id);

async function addTask(title) {
  const tags = autoTags(title);
  if (state.taskFilter && !tags.includes(state.taskFilter)) tags.push(state.taskFilter);
  const task = {
    id: uid(), title: title.trim(), done: false, pinned: false,
    tags, subs: [], count: null, goal: null, unit: '',
    createdAt: Date.now(),
  };
  state.tasks.unshift(task);
  await dbPut('tasks', task);
  return { task, autoTag: tags.length ? findTag(tags[0]) : null };
}

async function saveTask(task) { await dbPut('tasks', task); }

async function deleteTask(id) {
  state.tasks = state.tasks.filter((x) => x.id !== id);
  state.openTasks.delete(id);
  await dbDelete('tasks', id);
}

function taskProgress(task) {
  if (task.goal) {
    const c = task.count ?? 0;
    return { done: c, total: task.goal, pct: clamp(Math.round((c / task.goal) * 100), 0, 100), unit: task.unit };
  }
  if (task.subs.length) {
    const done = task.subs.filter((s) => s.done).length;
    return { done, total: task.subs.length, pct: Math.round((done / task.subs.length) * 100), unit: '' };
  }
  return null;
}

function isTaskComplete(task) {
  if (task.goal) return (task.count ?? 0) >= task.goal;
  if (task.subs.length) return task.subs.every((s) => s.done);
  return task.done;
}

async function setTaskComplete(task, complete) {
  if (task.goal) task.count = complete ? task.goal : 0;
  else if (task.subs.length) task.subs.forEach((s) => { s.done = complete; });
  task.done = complete;
  if (complete) task.pinned = false;
  await saveTask(task);
}

const pinnedTasks = () => state.tasks.filter((x) => x.pinned && !isTaskComplete(x)).slice(0, 3);

/* --------------------------------------------------------------------------
   8. Notizen und Anhänge
   -------------------------------------------------------------------------- */

async function createNote(body = '') {
  const note = {
    id: uid(), title: '', body,
    tags: body ? autoTags(body) : [],
    createdAt: Date.now(), updatedAt: Date.now(),
  };
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
  for (const a of state.atts.filter((x) => x.noteId === id)) {
    attUrls.delete(a.id);
    await dbDelete('atts', a.id);
  }
  state.atts = state.atts.filter((x) => x.noteId !== id);
}

function noteTitleOf(note) {
  if (note.title.trim()) return note.title.trim();
  const first = note.body.split('\n').find((l) => l.trim());
  return first ? first.trim().slice(0, 60) : t('untitled');
}

const attsOf = (noteId) => state.atts.filter((a) => a.noteId === noteId);

/* Bilder werden vor dem Ablegen verkleinert – sonst ist der lokale
   Speicher nach ein paar Fotos voll. */
async function compressImage(file, maxSide = 1600, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return new Promise((res) => canvas.toBlob((b) => res(b || file), 'image/jpeg', quality));
}

async function addAttachment(noteId, type, blob, name = '') {
  const att = { id: uid(), noteId, type, blob, name, createdAt: Date.now() };
  state.atts.push(att);
  await dbPut('atts', att);
  return att;
}

async function deleteAttachment(id) {
  const url = attUrls.get(id);
  if (url) { URL.revokeObjectURL(url); attUrls.delete(id); }
  state.atts = state.atts.filter((a) => a.id !== id);
  await dbDelete('atts', id);
}

/* --------------------------------------------------------------------------
   9. Bausteine für die Anzeige
   -------------------------------------------------------------------------- */

function counterHTML(id, kind, value, goal, unit, colorVar) {
  const pct = goal ? clamp(Math.round((value / goal) * 100), 0, 100) : 0;
  return `
    <div class="counter" ${colorVar ? `style="--dc: var(${colorVar})"` : ''}>
      <div class="counter__head">
        <span class="counter__val">${value} / ${goal}</span>
        ${unit ? `<span class="counter__unit">${esc(unit)}</span>` : ''}
      </div>
      <span class="counter__bar"><span class="counter__fill" style="width:${pct}%"></span></span>
      <div class="counter__row">
        <button class="counter__btn" data-cnt="${kind}|${esc(id)}|-1" aria-label="minus">${ICONS.minus}</button>
        <input class="counter__input" type="number" inputmode="numeric"
          data-cntset="${kind}|${esc(id)}" value="${value}" min="0" aria-label="${esc(unit || t('counterGoal'))}">
        <button class="counter__btn" data-cnt="${kind}|${esc(id)}|1" aria-label="plus">${ICONS.plus}</button>
      </div>
    </div>`;
}

function chipsHTML(tagIds) {
  if (!tagIds?.length) return '';
  const items = tagIds.map(findTag).filter(Boolean);
  if (!items.length) return '';
  return '<div class="chips">' + items.map((tag) =>
    `<span class="chip" style="--cc: var(${tag.color})"><span class="chip__dot"></span>${esc(tag.name)}</span>`
  ).join('') + '</div>';
}

function tagPickHTML(kind, id, active) {
  if (!state.tags.length) return '';
  return '<div class="tagpick">' + state.tags.map((tag) => `
    <button class="tagpick__item ${active?.includes(tag.id) ? 'is-on' : ''}"
      style="--cc: var(${tag.color})" data-tagpick="${kind}|${esc(id)}|${esc(tag.id)}">
      <span class="chip__dot" style="--cc: var(${tag.color})"></span>${esc(tag.name)}
    </button>`).join('') + '</div>';
}

function bubbleHTML(tag, active) {
  const p = tagProgress(tag.id);
  return `
    <button class="bubbleitem ${active ? 'is-active' : ''}" data-tagfilter="${esc(tag.id)}">
      <span class="bubble" style="--bc: var(${tag.color}); --p: ${p.pct}">
        <span class="bubble__ring"></span>
        <span class="bubble__ball"></span>
        <span class="bubble__count">${p.total ? `${p.done}/${p.total}` : '–'}</span>
      </span>
      <span class="bubbleitem__name">${esc(tag.name)}</span>
    </button>`;
}

/* --------------------------------------------------------------------------
   10. Heute
   -------------------------------------------------------------------------- */

function renderToday() {
  const date = todayKey();
  const list = dailiesFor(date);
  const done = list.filter((d) => dailyDone(d, date)).length;
  const total = list.length;
  const pct = total ? done / total : 0;
  const circ = 2 * Math.PI * 32;
  const openCount = state.tasks.filter((x) => !isTaskComplete(x)).length;
  const activeDT = dayTypeOf(date);

  let html = `
    <h1 class="largetitle">${t('today')}</h1>
    <p class="subtitle">${esc(formatLongDate())}</p>`;

  /* Tagesart */
  if (state.dayTypes.length > 1) {
    html += '<div class="bubblerow" style="padding-bottom:14px">';
    for (const dt of state.dayTypes) {
      const on = dt.id === activeDT;
      html += `
        <button class="bubbleitem ${on ? 'is-active' : ''}" data-daytype="${esc(dt.id)}">
          <span class="bubble bubble--plain" style="--bc: var(--c-slate); --p: 0">
            <span class="bubble__ball"></span>
            <span class="bubble__count" style="font-size:24px">${esc(dt.glyph)}</span>
          </span>
          <span class="bubbleitem__name">${esc(dt.name)}</span>
        </button>`;
    }
    html += '</div>';
  }

  html += `
    <div class="tile tile--wide progresstile">
      <svg class="ring" viewBox="0 0 78 78" aria-hidden="true">
        <circle class="ring__track" cx="39" cy="39" r="32"/>
        <circle class="ring__bar" cx="39" cy="39" r="32"
          stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${(circ * (1 - pct)).toFixed(1)}"/>
      </svg>
      <div>
        <div class="progresstile__count">${done} / ${total}</div>
        <div class="progresstile__label">${
          total === 0 ? t('noDailies') : done === total ? t('allDone') : t('progressLabel')
        }</div>
      </div>
    </div>

    <div class="sectionhead">
      <h2>${t('dailies')}</h2>
      <button class="sectionhead__action" data-goto="more">${t('edit')}</button>
    </div>`;

  if (!total) {
    html += `<div class="tile tile--wide empty"><h3>${t('noDailies')}</h3><p>${t('noDailiesHint')}</p></div>`;
  } else {
    html += '<div class="tilegrid">';
    for (const d of list) {
      const on = dailyDone(d, date);
      const streak = streakOf(d);
      const streakTxt = streak === 0 ? t('noStreak') : streak === 1 ? t('streakOne') : t('streakMany', { n: streak });
      const style = `--dc: var(${d.color});
        --dc-soft: color-mix(in srgb, var(${d.color}) 8%, transparent);
        --dc-soft2: color-mix(in srgb, var(${d.color}) 17%, transparent);
        --dc-text: color-mix(in srgb, var(${d.color}) 68%, var(--text));`;

      if (d.goal) {
        const val = getLog(d.id, date)?.value ?? 0;
        html += `
          <div class="tile daily ${on ? 'is-done' : ''}" style="${style}">
            <span class="daily__glyph">${esc(d.glyph)}</span>
            <span class="daily__check">${ICONS.check}</span>
            <span>
              <span class="daily__name">${esc(d.name)}</span>
              <span class="daily__streak">${streakTxt}</span>
            </span>
            ${counterHTML(d.id, 'daily', val, d.goal, d.unit, d.color)}
          </div>`;
      } else {
        html += `
          <button class="tile daily ${on ? 'is-done' : ''}" data-daily="${esc(d.id)}"
            style="${style}" aria-pressed="${on}">
            <span class="daily__glyph">${esc(d.glyph)}</span>
            <span class="daily__check">${ICONS.check}</span>
            <span>
              <span class="daily__name">${esc(d.name)}</span>
              <span class="daily__streak">${streakTxt}</span>
            </span>
          </button>`;
      }
    }
    html += '</div>';
  }

  /* Gedanke aufschreiben */
  html += `
    <div class="sectionhead"><h2>${t('thought')}</h2></div>
    <div class="quickadd">
      <input id="quick-input" type="text" placeholder="${t('thoughtPlaceholder')}"
        autocomplete="off" enterkeyhint="done">
      <button class="roundbtn" id="quick-note" aria-label="${t('savedAsNote')}" disabled>${ICONS.arrowUp}</button>
      <button class="roundbtn roundbtn--ghost" id="quick-task" aria-label="${t('savedAsTask')}" disabled>${ICONS.check}</button>
    </div>
    <p class="inputhint">${t('thoughtHint')}</p>`;

  /* Angepinnte Aufgaben */
  const pins = pinnedTasks();
  if (pins.length) {
    html += `<div class="sectionhead"><h2>${t('pinnedTasks')}</h2>
      <button class="sectionhead__action" data-goto="tasks">${t('tasks')}</button></div>`;
    html += pins.map((x) => swipeTaskHTML(x)).join('');
  }

  html += `
    <div class="tilegrid" style="margin-top: 22px;">
      <button class="tile stat" data-goto="tasks">
        <span class="stat__icon">${ICONS.tasks}</span>
        <span><span class="stat__num">${openCount}</span>
        <span class="stat__label" style="display:block">${openCount === 1 ? t('openTaskLabel') : t('openTasksLabel')}</span></span>
      </button>
      <button class="tile stat" data-goto="notes">
        <span class="stat__icon">${ICONS.notes}</span>
        <span><span class="stat__num">${state.notes.length}</span>
        <span class="stat__label" style="display:block">${state.notes.length === 1 ? t('noteLabel') : t('notesLabel')}</span></span>
      </button>
    </div>`;

  $('#view-today').innerHTML = html;
  wireQuickAdd();
}

function wireQuickAdd() {
  const input = $('#quick-input');
  const asNote = $('#quick-note');
  const asTask = $('#quick-task');
  if (!input) return;

  const sync = () => {
    const empty = !input.value.trim();
    asNote.disabled = empty;
    asTask.disabled = empty;
  };

  input.addEventListener('input', sync);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) { e.preventDefault(); asNote.click(); }
  });

  asNote.addEventListener('click', async () => {
    const value = input.value.trim();
    if (!value) return;
    const note = await createNote(value);
    input.value = ''; sync();
    const tag = note.tags.length ? findTag(note.tags[0]) : null;
    toast(tag ? t('autoSorted', { name: tag.name }) : t('savedAsNote'));
    renderToday();
    $('#quick-input')?.focus();
  });

  asTask.addEventListener('click', async () => {
    const value = input.value.trim();
    if (!value) return;
    const { autoTag } = await addTask(value);
    input.value = ''; sync();
    toast(autoTag ? t('autoSorted', { name: autoTag.name }) : t('savedAsTask'));
    renderToday();
    $('#quick-input')?.focus();
  });
}

/* --------------------------------------------------------------------------
   11. Aufgaben-Ansicht
   -------------------------------------------------------------------------- */

function swipeTaskHTML(task) {
  return `<div class="swipewrap">
    <div class="swipewrap__bg">${ICONS.check}</div>
    ${taskHTML(task)}
  </div>`;
}

function taskHTML(task) {
  const progress = taskProgress(task);
  const complete = isTaskComplete(task);
  const open = state.openTasks.has(task.id);

  let meta = '';
  if (progress) {
    meta = `<div class="task__meta">
      <span class="num">${progress.done}/${progress.total}${progress.unit ? ' ' + esc(progress.unit) : ''}</span>
      <span class="bar"><span class="bar__fill" style="width:${progress.pct}%"></span></span>
    </div>`;
  }

  const subs = task.subs.map((s) => `
    <div class="sub ${s.done ? 'is-done' : ''}">
      <button class="check ${s.done ? 'is-on' : ''}" data-sub-toggle="${esc(task.id)}|${esc(s.id)}"
        aria-pressed="${s.done}" aria-label="${t('done')}">${ICONS.check}</button>
      <span class="sub__title">${esc(s.title)}</span>
      <button class="sub__del" data-sub-del="${esc(task.id)}|${esc(s.id)}" aria-label="${t('delete')}">${ICONS.trash}</button>
    </div>`).join('');

  const counter = task.goal
    ? `<div class="task__counter">${counterHTML(task.id, 'task', task.count ?? 0, task.goal, task.unit, null)}</div>`
    : '';

  return `
    <article class="task ${complete ? 'is-done' : ''} ${open ? 'is-open' : ''}" data-task="${esc(task.id)}">
      ${task.pinned && !complete ? `<span class="task__pinmark">${ICONS.pin}</span>` : ''}
      <div class="task__head">
        <button class="check ${complete ? 'is-on' : ''}" data-task-toggle="${esc(task.id)}"
          aria-pressed="${complete}" aria-label="${t('done')}">${ICONS.check}</button>
        <div class="task__body">
          <div class="task__title">${esc(task.title)}</div>
          ${meta}
          ${chipsHTML(task.tags)}
        </div>
        <button class="task__toggle" data-task-open="${esc(task.id)}"
          aria-expanded="${open}" aria-label="${t('addSubtask')}">${ICONS.chevron}</button>
      </div>
      ${counter}
      <div class="task__sub">
        ${subs}
        <div class="subadd">
          <span class="subadd__plus">${ICONS.plus}</span>
          <input type="text" data-sub-input="${esc(task.id)}" placeholder="${t('addSubtask')}"
            autocomplete="off" enterkeyhint="done">
        </div>
      </div>
      ${open ? tagPickHTML('task', task.id, task.tags) : ''}
      ${open ? `<div class="task__foot">
        <button class="textbtn ${task.pinned ? 'textbtn--on' : ''}" data-task-pin="${esc(task.id)}">${task.pinned ? t('unpin') : t('pin')}</button>
        <button class="textbtn" data-task-goal="${esc(task.id)}">${task.goal ? t('removeCounter') : t('addCounter')}</button>
        <button class="textbtn textbtn--danger" data-task-del="${esc(task.id)}">${t('deleteTask')}</button>
      </div>` : ''}
    </article>`;
}

function renderTasks() {
  const filter = state.taskFilter;
  const all = filter ? state.tasks.filter((x) => x.tags?.includes(filter)) : state.tasks;
  const open = all.filter((x) => !isTaskComplete(x));
  const done = all.filter(isTaskComplete);
  const pins = pinnedTasks().filter((x) => !filter || x.tags?.includes(filter));
  const pinIds = new Set(pins.map((x) => x.id));

  let html = `
    <h1 class="largetitle">${t('tasks')}</h1>
    <p class="subtitle">${open.length ? `${open.length} ${t('open').toLowerCase()}` : t('noTasks')}${done.length ? ` · ${done.length} ${t('completed').toLowerCase()}` : ''}</p>`;

  /* Ordner-Bubbles */
  html += '<div class="bubblerow">';
  html += `
    <button class="bubbleitem ${!filter ? 'is-active' : ''}" data-tagfilter="">
      <span class="bubble bubble--plain" style="--bc: var(--c-slate); --p: 0">
        <span class="bubble__ball"></span>
        <span class="bubble__count">${state.tasks.filter((x) => !isTaskComplete(x)).length}</span>
      </span>
      <span class="bubbleitem__name">${t('all')}</span>
    </button>`;
  for (const tag of state.tags) html += bubbleHTML(tag, filter === tag.id);
  html += `
    <button class="bubbleitem" data-goto="more">
      <span class="bubble bubble--plain" style="--bc: var(--c-slate); --p: 0">
        <span class="bubble__ball"></span>
        <span class="bubble__count">${ICONS.plus}</span>
      </span>
      <span class="bubbleitem__name">${t('newFolder')}</span>
    </button>`;
  html += '</div>';

  html += `
    <div class="quickadd">
      <input id="task-input" type="text" placeholder="${t('newTask')}" autocomplete="off" enterkeyhint="done">
      <button class="roundbtn" id="task-add" aria-label="${t('add')}" disabled>${ICONS.arrowUp}</button>
    </div>
    <p class="inputhint">${t('swipeHint')}</p>`;

  if (pins.length) {
    html += `<div class="sectionhead"><h2>${t('pinnedTasks')}</h2></div>`;
    html += pins.map(swipeTaskHTML).join('');
  }

  const rest = open.filter((x) => !pinIds.has(x.id));
  if (rest.length) {
    html += `<div class="sectionhead"><h2>${t('open')}</h2></div>`;
    html += rest.map(swipeTaskHTML).join('');
  } else if (!done.length && !pins.length) {
    html += `<div class="empty" style="margin-top:16px">
      <span class="empty__icon">${ICONS.tasks}</span>
      <h3>${t('noTasks')}</h3><p>${t('noTasksHint')}</p></div>`;
  }

  if (done.length) {
    html += `<div class="sectionhead"><h2>${t('completed')}</h2>
      <button class="sectionhead__action" id="clear-done">${t('cleanUp')}</button></div>`;
    html += done.map((x) => `<div class="swipewrap">${taskHTML(x)}</div>`).join('');
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
    const { autoTag } = await addTask(value);
    if (autoTag) toast(t('autoSorted', { name: autoTag.name }));
    renderTasks();
    const fresh = $('#task-input');
    if (fresh) { fresh.value = ''; fresh.focus(); }
  });

  $('#clear-done')?.addEventListener('click', async () => {
    const done = state.tasks.filter(isTaskComplete);
    if (!done.length) return;
    if (!confirm(t('confirmCleanUp', { n: done.length }))) return;
    for (const x of done) await deleteTask(x.id);
    renderTasks(); renderToday();
    toast(t('deletedDone'));
  });
}

/* --------------------------------------------------------------------------
   12. Wischgeste: nach links = erledigt
   -------------------------------------------------------------------------- */

function initSwipe() {
  let card = null, startX = 0, startY = 0, dx = 0, locked = null, id = null;

  const onDown = (e) => {
    const el = e.target.closest('.task');
    if (!el || e.target.closest('button, input')) return;
    card = el; id = el.dataset.task;
    startX = e.clientX; startY = e.clientY; dx = 0; locked = null;
    card.classList.remove('is-settling');
  };

  const onMove = (e) => {
    if (!card) return;
    const mx = e.clientX - startX;
    const my = e.clientY - startY;
    if (locked === null) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (locked === 'y') { card = null; return; }
    }
    dx = Math.min(0, mx);                               // nur nach links
    card.style.transform = `translateX(${dx}px)`;
  };

  const onUp = async () => {
    if (!card) return;
    const el = card, taskId = id, moved = dx;
    card = null; id = null;
    el.classList.add('is-settling');
    el.style.transform = '';

    if (moved < -90) {
      const task = findTask(taskId);
      if (task) {
        await setTaskComplete(task, !isTaskComplete(task));
        renderTasks(); renderToday();
      }
    }
  };

  document.addEventListener('pointerdown', onDown, { passive: true });
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
}

/* --------------------------------------------------------------------------
   13. Notizen-Ansicht
   -------------------------------------------------------------------------- */

function renderNotes() {
  const q = state.noteQuery.trim().toLowerCase();
  const list = q
    ? state.notes.filter((n) => {
        const tagNames = (n.tags || []).map((id) => findTag(id)?.name || '').join(' ');
        return (n.title + ' ' + n.body + ' ' + tagNames).toLowerCase().includes(q);
      })
    : state.notes;

  let html = `
    <h1 class="largetitle">${t('notes')}</h1>
    <p class="subtitle">${state.notes.length} ${state.notes.length === 1 ? t('noteLabel') : t('notesLabel')}</p>

    <div class="searchbar">
      ${ICONS.search}
      <input id="note-search" type="search" placeholder="${t('searchNotes')}" value="${esc(state.noteQuery)}">
    </div>

    <div class="quickadd" style="margin-bottom:18px">
      <input id="note-new" type="text" placeholder="${t('newNote')}" autocomplete="off" enterkeyhint="done">
      <button class="roundbtn" id="note-add" aria-label="${t('add')}">${ICONS.plus}</button>
    </div>`;

  if (!list.length) {
    html += `<div class="empty">
      <span class="empty__icon">${ICONS.notes}</span>
      <h3>${q ? t('nothingFound') : t('noNotes')}</h3>
      <p>${q ? t('tryOther') : t('noNotesHint')}</p></div>`;
  } else {
    html += '<div class="notegrid">';
    for (const n of list) {
      const rest = n.title.trim() ? n.body : n.body.split('\n').slice(1).join('\n');
      const atts = attsOf(n.id);
      const dots = (n.tags || []).map(findTag).filter(Boolean)
        .map((tag) => `<span class="notecard__dot" style="--cc: var(${tag.color})"></span>`).join('');
      html += `
        <button class="notecard" data-note="${esc(n.id)}">
          <span class="notecard__title">${esc(noteTitleOf(n))}</span>
          <span class="notecard__preview">${esc(rest.trim().slice(0, 200) || t('emptyNote'))}</span>
          <span class="notecard__foot">
            <span class="notecard__date">${esc(relativeDate(n.updatedAt))}</span>
            <span class="notecard__marks">
              ${dots ? `<span class="notecard__dots">${dots}</span>` : ''}
              ${atts.some((a) => a.type === 'image') ? ICONS.image : ''}
              ${atts.some((a) => a.type === 'audio') ? ICONS.mic : ''}
            </span>
          </span>
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
    renderNotes(); renderToday();
    openEditor(note.id);
  };

  btn.addEventListener('click', create);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); create(); } });
}

/* --------------------------------------------------------------------------
   14. Editor
   -------------------------------------------------------------------------- */

let saveTimer = null;
let recorder = null;
let recChunks = [];

function openEditor(noteId) {
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return;

  state.editing = noteId;
  $('#editor-title').value = note.title;
  $('#editor-text').value = note.body;
  $('#editor-status').textContent = relativeDate(note.updatedAt);
  renderEditorExtras();
  $('#sheet').classList.add('is-open');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    const el = (!note.body && !note.title) ? $('#editor-title') : $('#editor-text');
    el.focus();
    if (el === $('#editor-text')) el.setSelectionRange(el.value.length, el.value.length);
  }, 380);
}

function renderEditorExtras() {
  const note = state.notes.find((n) => n.id === state.editing);
  if (!note) return;

  $('#editor-tags').innerHTML = state.tags.map((tag) => `
    <button class="tagpick__item ${note.tags?.includes(tag.id) ? 'is-on' : ''}"
      style="--cc: var(${tag.color})" data-tagpick="note|${esc(note.id)}|${esc(tag.id)}">
      <span class="chip__dot" style="--cc: var(${tag.color})"></span>${esc(tag.name)}
    </button>`).join('');

  const atts = attsOf(note.id);
  $('#editor-atts').innerHTML = atts.map((a) => a.type === 'image'
    ? `<div class="att att--img">
         <img src="${attUrl(a)}" alt="">
         <button class="att__del" data-att-del="${esc(a.id)}" aria-label="${t('delete')}">${ICONS.x}</button>
       </div>`
    : `<div class="att att--audio">
         <audio controls preload="metadata" src="${attUrl(a)}"></audio>
         <button class="att__del" data-att-del="${esc(a.id)}" aria-label="${t('delete')}">${ICONS.x}</button>
       </div>`).join('');
}

function closeEditor() {
  stopRecording(true);
  flushEditor();
  state.editing = null;
  $('#sheet').classList.remove('is-open');
  document.body.style.overflow = '';
  renderNotes(); renderToday();
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
  const schedule = () => {
    clearTimeout(saveTimer);
    $('#editor-status').textContent = t('saving');
    saveTimer = setTimeout(() => {
      flushEditor();
      $('#editor-status').textContent = t('saved');
    }, 500);
  };

  $('#editor-title').addEventListener('input', schedule);
  $('#editor-text').addEventListener('input', schedule);
  $('#editor-close').addEventListener('click', closeEditor);
  $('#editor-done').addEventListener('click', closeEditor);

  $('#editor-delete').addEventListener('click', async () => {
    if (!state.editing || !confirm(t('confirmDeleteNote'))) return;
    const id = state.editing;
    state.editing = null;
    clearTimeout(saveTimer);
    $('#sheet').classList.remove('is-open');
    document.body.style.overflow = '';
    await deleteNote(id);
    renderNotes(); renderToday();
    toast(t('deletedNote'));
  });

  /* Bild anhängen */
  $('#editor-photo').addEventListener('click', () => $('#photo-file').click());
  $('#photo-file').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!state.editing) return;
    for (const f of files) {
      try {
        const blob = f.type.startsWith('image/') ? await compressImage(f) : f;
        await addAttachment(state.editing, 'image', blob, f.name);
      } catch (err) { console.error(err); }
    }
    renderEditorExtras();
  });

  /* Sprachmemo */
  $('#editor-voice').addEventListener('click', () => {
    if (recorder && recorder.state === 'recording') stopRecording();
    else startRecording();
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.editing) closeEditor(); });
  window.addEventListener('beforeunload', flushEditor);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushEditor();
  });

  /* Tastatur: Sheet an die sichtbare Fläche anpassen, damit Fußzeile
     und Schreibmarke über der Tastatur bleiben. */
  if (window.visualViewport) {
    const fit = () => {
      const vv = window.visualViewport;
      $('#sheet').style.height = `${vv.height}px`;
      $('#sheet').style.transform = state.editing ? `translateY(${vv.offsetTop}px)` : '';
    };
    window.visualViewport.addEventListener('resize', fit);
    window.visualViewport.addEventListener('scroll', fit);
  }
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    toast(t('micUnsupported'));
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = ['audio/webm', 'audio/mp4', 'audio/ogg']
      .find((m) => MediaRecorder.isTypeSupported?.(m)) || '';
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recChunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((tr) => tr.stop());
      if (recChunks.length && state.editing) {
        await addAttachment(state.editing, 'audio', new Blob(recChunks, { type: recorder.mimeType }));
        renderEditorExtras();
      }
      recorder = null;
      const b = $('#editor-voice');
      b.classList.remove('is-rec');
      b.innerHTML = `${ICONS.mic}<span>${t('voice')}</span>`;
    };
    recorder.start();
    const b = $('#editor-voice');
    b.classList.add('is-rec');
    b.innerHTML = `${ICONS.stop}<span>${t('recording')}</span>`;
  } catch (err) {
    console.warn(err);
    toast(t('micDenied'));
  }
}

function stopRecording(discard = false) {
  if (!recorder || recorder.state !== 'recording') return;
  if (discard) recChunks = [];
  recorder.stop();
}

/* --------------------------------------------------------------------------
   15. Kalender
   -------------------------------------------------------------------------- */

function dayScore(date) {
  const list = dailiesFor(date);
  if (!list.length) return { done: 0, total: 0, pct: 0 };
  const done = list.filter((d) => dailyDone(d, date)).length;
  return { done, total: list.length, pct: Math.round((done / list.length) * 100) };
}

function renderCalendar() {
  const ref = state.calMonth;
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;                 // Woche beginnt montags
  const today = todayKey();

  const dow = LANG === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  let grid = dow.map((d) => `<div class="calgrid__dow">${d}</div>`).join('');
  for (let i = 0; i < lead; i++) grid += '<div class="calday calday--empty"></div>';

  let fullDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKey(new Date(year, month, day));
    const score = dayScore(key);
    const future = key > today;
    const isFull = score.total > 0 && score.done === score.total && !future;
    if (isFull) fullDays++;
    const dt = state.dayTypes.find((x) => x.id === dayTypeOf(key));
    grid += `
      <button class="calday ${key === today ? 'is-today' : ''} ${isFull ? 'is-full' : ''}
        ${key === state.calSelected ? 'is-sel' : ''} ${future ? 'calday--future' : ''}"
        data-calday="${key}" style="--p:${future ? 0 : score.pct}"
        aria-label="${day}. ${dt ? esc(dt.name) : ''}">
        <span class="calday__ring"></span>
        <span class="calday__n">${day}</span>
      </button>`;
  }

  const monthName = first.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });

  let html = `
    <h1 class="largetitle">${t('calendar')}</h1>
    <p class="subtitle">${t('monthDone', { n: fullDays, t: daysInMonth })}</p>

    <div class="calhead">
      <span class="calhead__month">${esc(monthName)}</span>
      <span class="calnav">
        <button class="iconbtn" data-calnav="-1" aria-label="${t('back')}">${ICONS.chevL}</button>
        <button class="iconbtn" data-calnav="1" aria-label="${t('today')}">${ICONS.chevron}</button>
      </span>
    </div>

    <div class="calgrid">${grid}</div>`;

  /* Detail zum gewählten Tag */
  const sel = state.calSelected;
  const selDate = parseKey(sel);
  const selList = dailiesFor(sel);
  const selDT = state.dayTypes.find((x) => x.id === dayTypeOf(sel));

  html += `<div class="sectionhead"><h2>${esc(selDate.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }))}</h2></div>`;

  if (state.dayTypes.length > 1) {
    html += '<div class="group"><div class="chipsrow" style="padding-top:12px">' +
      state.dayTypes.map((dt) => `
        <button class="togglechip ${dt.id === selDT?.id ? 'is-on' : ''}"
          data-setdaytype="${sel}|${esc(dt.id)}">${esc(dt.glyph)} ${esc(dt.name)}</button>`).join('') +
      '</div></div>';
  }

  if (!selList.length) {
    html += `<div class="empty"><p>${t('noLogs')}</p></div>`;
  } else {
    html += '<div class="group">';
    for (const d of selList) {
      const log = getLog(d.id, sel);
      const on = dailyDone(d, sel);
      const val = log?.value ?? 0;
      html += `
        <div class="dayline">
          <span class="dayline__glyph">${esc(d.glyph)}</span>
          <span class="dayline__body">
            <span class="dayline__name">${esc(d.name)}</span>
            ${d.goal ? `<span class="dayline__val">${val} / ${d.goal}${d.unit ? ' ' + esc(d.unit) : ''}</span>
              <span class="dayline__bar" style="--dc: var(${d.color})">
                <span class="dayline__fill" style="width:${clamp(Math.round((val / d.goal) * 100), 0, 100)}%"></span>
              </span>` : ''}
          </span>
          <span class="dayline__mark ${on ? 'is-on' : 'is-off'}">${on ? ICONS.check : ''}</span>
        </div>`;
    }
    html += '</div>';
  }

  /* Monatsbilanz je Daily */
  html += `<div class="grouplabel">${t('perDaily')}</div><div class="group">`;
  for (const d of state.dailies) {
    let hits = 0, possible = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = dateKey(new Date(year, month, day));
      if (key > today) continue;
      if (!dailiesFor(key).some((x) => x.id === d.id)) continue;
      possible++;
      if (dailyDone(d, key)) hits++;
    }
    const pct = possible ? Math.round((hits / possible) * 100) : 0;
    html += `
      <div class="dayline">
        <span class="dayline__glyph">${esc(d.glyph)}</span>
        <span class="dayline__body">
          <span class="dayline__name">${esc(d.name)}</span>
          <span class="dayline__bar" style="--dc: var(${d.color})">
            <span class="dayline__fill" style="width:${pct}%"></span>
          </span>
        </span>
        <span class="dayline__val">${hits}/${possible}</span>
      </div>`;
  }
  html += '</div>';

  $('#view-calendar').innerHTML = html;
}

/* --------------------------------------------------------------------------
   16. Mehr / Einstellungen
   -------------------------------------------------------------------------- */

const newDaily = { color: COLORS[0], dayTypes: [] };
const newTag = { color: COLORS[0] };

function swatchesHTML(kind, active) {
  return '<div class="swatches">' + COLORS.map((c) => `
    <button class="swatch ${c === active ? 'is-on' : ''}" style="--sc: var(${c})"
      data-swatch="${kind}|${c}" aria-label="${c.replace('--c-', '')}"></button>`).join('') + '</div>';
}

function renderMore() {
  if (!newDaily.dayTypes.length) newDaily.dayTypes = state.dayTypes.map((x) => x.id);

  /* Ordner */
  let tagRows = state.tags.map((tag) => {
    const p = tagProgress(tag.id);
    return `
      <div class="editrow">
        <span class="editrow__ball" style="--cc: var(${tag.color})"></span>
        <span class="editrow__body">
          <span class="editrow__name">${esc(tag.name)}</span>
          <span class="editrow__sub">${t('tasksIn', { n: p.total })} · ${
            tag.keywords?.length ? esc(tag.keywords.join(', ')) : t('keywords').toLowerCase() + ': –'}</span>
        </span>
        <button class="iconbtn" data-tagedit="${esc(tag.id)}" aria-label="${t('edit')}">${ICONS.chevron}</button>
        <button class="iconbtn" data-tagdel="${esc(tag.id)}" aria-label="${t('delete')}">${ICONS.trash}</button>
      </div>`;
  }).join('');

  if (!state.tags.length) {
    tagRows = `<div class="editrow"><span class="editrow__body">
      <span class="editrow__name" style="color:var(--text-3)">${t('noFolders')}</span></span></div>`;
  }

  /* Dailies */
  const dailyRows = state.dailies.map((d) => {
    const types = (d.dayTypes || []).map((id) => state.dayTypes.find((x) => x.id === id)?.glyph || '').join(' ');
    return `
      <div class="editrow">
        <span class="editrow__glyph">${esc(d.glyph)}</span>
        <span class="editrow__body">
          <span class="editrow__name">${esc(d.name)}</span>
          <span class="editrow__sub">${d.goal ? `${t('dailyGoal')}: ${d.goal}${d.unit ? ' ' + esc(d.unit) : ''} · ` : ''}${types}</span>
        </span>
        <button class="iconbtn" data-dailydel="${esc(d.id)}" aria-label="${t('delete')}">${ICONS.trash}</button>
      </div>`;
  }).join('') || `<div class="editrow"><span class="editrow__body">
      <span class="editrow__name" style="color:var(--text-3)">${t('noDailies')}</span></span></div>`;

  /* Tagesarten */
  const dtRows = state.dayTypes.map((dt) => `
    <div class="editrow">
      <span class="editrow__glyph">${esc(dt.glyph)}</span>
      <span class="editrow__body"><span class="editrow__name">${esc(dt.name)}</span></span>
      <button class="iconbtn" data-dtdel="${esc(dt.id)}" aria-label="${t('delete')}">${ICONS.trash}</button>
    </div>`).join('');

  $('#view-more').innerHTML = `
    <h1 class="largetitle">${t('more')}</h1>
    <p class="subtitle">${t('folders')} · ${t('dailies')} · ${t('backup')}</p>

    <div class="grouplabel">${t('folders')}</div>
    <div class="group">
      ${tagRows}
      <div class="formrow">
        <input class="text" id="tag-name" type="text" placeholder="${t('newFolder')}" enterkeyhint="done">
        <button class="formrow__go" id="tag-add">${t('add')}</button>
      </div>
      <div class="formrow" style="border-top:0; padding-top:0">
        <input class="text" id="tag-keywords" type="text" placeholder="${t('keywordsPlaceholder')}">
      </div>
      ${swatchesHTML('tag', newTag.color)}
    </div>
    <p class="groupnote">${t('keywordsHint')}</p>

    <div class="grouplabel">${t('dayTypes')}</div>
    <div class="group">
      ${dtRows}
      <div class="formrow">
        <input class="glyph" id="dt-glyph" type="text" maxlength="2" placeholder="📅">
        <input class="text" id="dt-name" type="text" placeholder="${t('newDayType')}" enterkeyhint="done">
        <button class="formrow__go" id="dt-add">${t('add')}</button>
      </div>
    </div>
    <p class="groupnote">${t('dayTypesHint')}</p>

    <div class="grouplabel">${t('dailies')}</div>
    <div class="group">
      ${dailyRows}
      <div class="formrow">
        <input class="glyph" id="daily-glyph" type="text" maxlength="2" placeholder="✳️">
        <input class="text" id="daily-name" type="text" placeholder="${t('newDaily')}" enterkeyhint="done">
        <button class="formrow__go" id="daily-add">${t('add')}</button>
      </div>
      <div class="formrow" style="border-top:0; padding-top:0">
        <input class="num" id="daily-goal" type="number" inputmode="numeric" placeholder="${t('dailyGoal')}" min="1">
        <input class="unit" id="daily-unit" type="text" placeholder="${t('counterUnitPlaceholder')}">
      </div>
      <div class="chipsrow">
        ${state.dayTypes.map((dt) => `
          <button class="togglechip ${newDaily.dayTypes.includes(dt.id) ? 'is-on' : ''}"
            data-newdailydt="${esc(dt.id)}">${esc(dt.glyph)} ${esc(dt.name)}</button>`).join('')}
      </div>
      ${swatchesHTML('daily', newDaily.color)}
    </div>
    <p class="groupnote">${t('dailyGoalHint')}</p>

    <div class="grouplabel">${t('backup')}</div>
    <div class="group">
      <button class="row row--btn" id="export-btn">
        <span class="row__label">${t('exportData')}</span><span class="row__chev">${ICONS.chevron}</span>
      </button>
      <button class="row row--btn" id="import-btn">
        <span class="row__label">${t('importData')}</span><span class="row__chev">${ICONS.chevron}</span>
      </button>
    </div>
    <p class="groupnote">${t('backupHint')}</p>

    <div class="grouplabel">${t('storage')}</div>
    <div class="group">
      <div class="row"><span class="row__label">${t('persisted')}</span>
        <span class="row__value" id="persist-state">…</span></div>
      <div class="row"><span class="row__label">${t('used')}</span>
        <span class="row__value" id="usage-state">–</span></div>
      <div class="row"><span class="row__label">${t('entries')}</span>
        <span class="row__value">${state.tasks.length} · ${state.notes.length} · ${state.atts.length}</span></div>
    </div>
    <p class="groupnote">${t('storageHint')}</p>

    <div class="group">
      <button class="row row--btn row--danger" id="wipe-btn"><span class="row__label">${t('wipe')}</span></button>
    </div>`;

  wireMore();
  reportStorage();
}

function wireMore() {
  /* Ordner anlegen */
  const addTagNow = async () => {
    const name = $('#tag-name').value.trim();
    if (!name) { $('#tag-name').focus(); return; }
    await addTag(name, newTag.color, $('#tag-keywords').value);
    newTag.color = COLORS[state.tags.length % COLORS.length];
    renderMore(); renderTasks();
    toast(t('added'));
  };
  $('#tag-add').addEventListener('click', addTagNow);
  $('#tag-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTagNow(); } });

  /* Tagesart anlegen */
  const addDT = async () => {
    const name = $('#dt-name').value.trim();
    if (!name) { $('#dt-name').focus(); return; }
    await addDayType(name, $('#dt-glyph').value);
    renderMore(); renderToday(); renderCalendar();
    toast(t('added'));
  };
  $('#dt-add').addEventListener('click', addDT);
  $('#dt-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addDT(); } });

  /* Daily anlegen */
  const addD = async () => {
    const name = $('#daily-name').value.trim();
    if (!name) { $('#daily-name').focus(); return; }
    await addDaily({
      name,
      glyph: $('#daily-glyph').value,
      color: newDaily.color,
      dayTypes: [...newDaily.dayTypes],
      goal: parseInt($('#daily-goal').value, 10) || null,
      unit: $('#daily-unit').value,
    });
    newDaily.color = COLORS[state.dailies.length % COLORS.length];
    renderMore(); renderToday(); renderCalendar();
    toast(t('added'));
  };
  $('#daily-add').addEventListener('click', addD);
  $('#daily-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addD(); } });

  $('#export-btn').addEventListener('click', exportData);
  $('#import-btn').addEventListener('click', () => $('#import-file').click());

  $('#wipe-btn').addEventListener('click', async () => {
    if (!confirm(t('confirmWipe')) || !confirm(t('confirmWipe2'))) return;
    await Promise.all(STORES.map(dbClear));
    Object.assign(state, {
      dailies: [], tasks: [], notes: [], tags: [], dayTypes: [], atts: [],
      logs: new Map(), dayAssign: new Map(), taskFilter: null,
    });
    attUrls.clear();
    renderAll();
    toast(t('wiped'));
  });
}

async function reportStorage() {
  const p = $('#persist-state'); const u = $('#usage-state');
  if (!p) return;
  if (navigator.storage?.persisted) {
    let granted = await navigator.storage.persisted();
    if (!granted && navigator.storage.persist) granted = await navigator.storage.persist();
    p.textContent = granted ? t('yes') : t('notGuaranteed');
  } else {
    p.textContent = t('unsupported');
  }
  if (navigator.storage?.estimate) {
    const { usage } = await navigator.storage.estimate();
    if (usage != null) u.textContent = usage > 1024 * 1024
      ? `${(usage / 1024 / 1024).toFixed(1)} MB` : `${(usage / 1024).toFixed(0)} KB`;
  }
}

/* --------------------------------------------------------------------------
   17. Export und Import
   -------------------------------------------------------------------------- */

const blobToBase64 = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(',')[1]);
  r.onerror = rej;
  r.readAsDataURL(blob);
});

function base64ToBlob(b64, type) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
}

async function exportData() {
  flushEditor();
  const atts = [];
  for (const a of state.atts) {
    atts.push({ id: a.id, noteId: a.noteId, type: a.type, name: a.name,
                createdAt: a.createdAt, mime: a.blob.type, data: await blobToBase64(a.blob) });
  }

  const payload = {
    app: 'notizen', version: 2, exportedAt: new Date().toISOString(),
    dailies: state.dailies,
    logs: [...state.logs.values()],
    tasks: state.tasks,
    notes: state.notes,
    tags: state.tags,
    dayTypes: state.dayTypes,
    dayAssign: [...state.dayAssign.entries()].map(([date, dayTypeId]) => ({ date, dayTypeId })),
    atts,
  };

  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notizen-backup-${todayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast(t('exported'));
}

function initImport() {
  $('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    let data;
    try { data = JSON.parse(await file.text()); }
    catch (err) { toast(t('importFailed')); return; }

    if (data.app !== 'notizen') { toast(t('importInvalid')); return; }
    if (!confirm(t('confirmImport'))) return;

    await Promise.all(STORES.filter((s) => s !== 'settings').map(dbClear));
    attUrls.clear();

    for (const x of data.dailies  || []) await dbPut('dailies', x);
    for (const x of data.logs     || []) await dbPut('logs', x);
    for (const x of data.tasks    || []) await dbPut('tasks', x);
    for (const x of data.notes    || []) await dbPut('notes', x);
    for (const x of data.tags     || []) await dbPut('tags', x);
    for (const x of data.dayTypes || []) await dbPut('dayTypes', x);
    for (const x of data.dayAssign|| []) await dbPut('dayAssign', x);
    for (const a of data.atts     || []) {
      await dbPut('atts', { id: a.id, noteId: a.noteId, type: a.type, name: a.name,
                            createdAt: a.createdAt, blob: base64ToBlob(a.data, a.mime) });
    }

    await loadState();
    renderAll();
    toast(t('imported'));
  });
}

/* --------------------------------------------------------------------------
   18. Theme, Sprache, Toast
   -------------------------------------------------------------------------- */

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('notizen-theme', theme); } catch (e) { /* egal */ }
  const meta = $('#theme-color');
  if (meta) meta.content = theme === 'dark' ? '#0e0e0f' : '#ececeb';
  $$('#theme-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === theme)));
  positionThumb('#theme-seg');
}

function applyStaticTexts() {
  const map = {
    'today': 'today', 'tasks': 'tasks', 'notes': 'notes',
    'calendar': 'calendar', 'more': 'more',
  };
  $$('[data-tab]').forEach((el) => { el.textContent = t(map[el.dataset.tab]); });
  $('#editor-title').placeholder = t('noteTitle');
  $('#editor-text').placeholder = t('writeHere');
  $('#editor-delete').textContent = t('delete');
  $('#editor-close').textContent = t('done');
  $('#editor-done').textContent = t('done');
  $('#editor-photo').innerHTML = `${ICONS.image}<span>${t('photo')}</span>`;
  if (!recorder) $('#editor-voice').innerHTML = `${ICONS.mic}<span>${t('voice')}</span>`;
}

function applyLang(lang) {
  setLang(lang);
  applyStaticTexts();
  $$('#lang-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
  positionThumb('#lang-seg');
  renderAll();
  $('.topbar__title').textContent = t(state.view);
}

/* Der Schieber im Segmented Control folgt der aktiven Schaltfläche. */
function positionThumb(sel) {
  const seg = $(sel);
  if (!seg) return;
  const active = $('button[aria-pressed="true"]', seg);
  const thumb = $('.seg__thumb', seg);
  if (!active || !thumb) return;
  thumb.style.width = `${active.offsetWidth}px`;
  thumb.style.transform = `translateX(${active.offsetLeft - 2}px)`;
}

let toastTimer = null;

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2300);
}

/* --------------------------------------------------------------------------
   19. Navigation
   -------------------------------------------------------------------------- */

const RENDERERS = {
  today: renderToday, tasks: renderTasks, notes: renderNotes,
  calendar: renderCalendar, more: renderMore,
};

function switchView(view) {
  if (!RENDERERS[view]) return;
  state.view = view;
  RENDERERS[view]();
  $$('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${view}`));
  $$('.tabbar button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === view)));
  $('.topbar__title').textContent = t(view);
  window.scrollTo({ top: 0 });
}

function initChrome() {
  $$('#theme-seg button').forEach((b) => b.addEventListener('click', () => applyTheme(b.dataset.theme)));
  $$('#lang-seg button').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));
  $$('.tabbar button').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));

  window.addEventListener('scroll', () => {
    $('.topbar').classList.toggle('is-scrolled', window.scrollY > 22);
  }, { passive: true });

  window.addEventListener('resize', () => {
    positionThumb('#theme-seg'); positionThumb('#lang-seg');
  });
}

/* --------------------------------------------------------------------------
   20. Klicks (Event Delegation)
   -------------------------------------------------------------------------- */

function initDelegation() {
  document.addEventListener('click', async (e) => {
    const hit = (sel) => e.target.closest(sel);
    let el;

    if ((el = hit('[data-goto]'))) { switchView(el.dataset.goto); return; }

    /* Tagesart heute */
    if ((el = hit('[data-daytype]'))) {
      await setDayType(todayKey(), el.dataset.daytype);
      renderToday(); renderCalendar();
      return;
    }

    /* Daily abhaken */
    if ((el = hit('[data-daily]'))) { toggleDaily(el.dataset.daily); return; }

    /* Zähler */
    if ((el = hit('[data-cnt]'))) {
      const [kind, id, step] = el.dataset.cnt.split('|');
      const delta = Number(step);
      if (kind === 'daily') {
        const d = state.dailies.find((x) => x.id === id);
        const cur = getLog(id, todayKey())?.value ?? 0;
        await setDailyValue(id, cur + delta * stepSize(d?.goal));
      } else {
        const task = findTask(id);
        if (task) {
          task.count = clamp((task.count ?? 0) + delta * stepSize(task.goal), 0, 10 ** 9);
          task.done = task.count >= task.goal;
          await saveTask(task);
          renderTasks(); renderToday();
        }
      }
      return;
    }

    /* Ordner filtern */
    if ((el = hit('[data-tagfilter]'))) {
      state.taskFilter = el.dataset.tagfilter || null;
      renderTasks();
      return;
    }

    /* Ordner an Aufgabe/Notiz an- und abwählen */
    if ((el = hit('[data-tagpick]'))) {
      const [kind, id, tagId] = el.dataset.tagpick.split('|');
      const obj = kind === 'task' ? findTask(id) : state.notes.find((n) => n.id === id);
      if (!obj) return;
      obj.tags = obj.tags || [];
      obj.tags = obj.tags.includes(tagId) ? obj.tags.filter((x) => x !== tagId) : [...obj.tags, tagId];
      if (kind === 'task') { await saveTask(obj); renderTasks(); }
      else { await saveNote(obj); renderEditorExtras(); }
      return;
    }

    /* Aufgaben */
    if ((el = hit('[data-task-toggle]'))) {
      const task = findTask(el.dataset.taskToggle);
      if (task) { await setTaskComplete(task, !isTaskComplete(task)); renderTasks(); renderToday(); }
      return;
    }

    if ((el = hit('[data-task-open]'))) {
      const id = el.dataset.taskOpen;
      state.openTasks.has(id) ? state.openTasks.delete(id) : state.openTasks.add(id);
      state.view === 'today' ? renderToday() : renderTasks();
      if (state.openTasks.has(id)) $(`[data-sub-input="${id}"]`)?.focus();
      return;
    }

    if ((el = hit('[data-task-pin]'))) {
      const task = findTask(el.dataset.taskPin);
      if (!task) return;
      if (!task.pinned && pinnedTasks().length >= 3) { toast(t('pinLimit')); return; }
      task.pinned = !task.pinned;
      await saveTask(task);
      renderTasks(); renderToday();
      return;
    }

    if ((el = hit('[data-task-goal]'))) {
      const task = findTask(el.dataset.taskGoal);
      if (!task) return;
      if (task.goal) { task.goal = null; task.count = null; task.unit = ''; }
      else {
        const raw = prompt(`${t('counterGoal')} (${t('counterUnitPlaceholder')})`, '20');
        const goal = parseInt(raw, 10);
        if (!goal || goal < 1) return;
        task.goal = goal;
        task.count = 0;
        task.unit = (prompt(t('counterUnit'), '') || '').trim();
        task.done = false;
      }
      await saveTask(task);
      renderTasks(); renderToday();
      return;
    }

    if ((el = hit('[data-task-del]'))) {
      const task = findTask(el.dataset.taskDel);
      if (task && confirm(t('confirmDeleteTask', { title: task.title }))) {
        await deleteTask(task.id);
        renderTasks(); renderToday();
        toast(t('deletedTask'));
      }
      return;
    }

    if ((el = hit('[data-sub-toggle]'))) {
      const [taskId, subId] = el.dataset.subToggle.split('|');
      const task = findTask(taskId);
      const sub = task?.subs.find((s) => s.id === subId);
      if (!sub) return;
      sub.done = !sub.done;
      task.done = task.subs.every((s) => s.done);
      await saveTask(task);
      state.view === 'today' ? renderToday() : renderTasks();
      return;
    }

    if ((el = hit('[data-sub-del]'))) {
      const [taskId, subId] = el.dataset.subDel.split('|');
      const task = findTask(taskId);
      if (!task) return;
      task.subs = task.subs.filter((s) => s.id !== subId);
      await saveTask(task);
      state.view === 'today' ? renderToday() : renderTasks();
      return;
    }

    /* Notizen */
    if ((el = hit('[data-note]'))) { openEditor(el.dataset.note); return; }

    if ((el = hit('[data-att-del]'))) {
      if (!confirm(t('confirmDeleteAttachment'))) return;
      await deleteAttachment(el.dataset.attDel);
      renderEditorExtras();
      toast(t('attachmentDeleted'));
      return;
    }

    /* Kalender */
    if ((el = hit('[data-calnav]'))) {
      state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + Number(el.dataset.calnav), 1);
      renderCalendar();
      return;
    }

    if ((el = hit('[data-calday]'))) { state.calSelected = el.dataset.calday; renderCalendar(); return; }

    if ((el = hit('[data-setdaytype]'))) {
      const [date, dtId] = el.dataset.setdaytype.split('|');
      await setDayType(date, dtId);
      renderCalendar();
      if (date === todayKey()) renderToday();
      return;
    }

    /* Einstellungen */
    if ((el = hit('[data-swatch]'))) {
      const [kind, color] = el.dataset.swatch.split('|');
      if (kind === 'tag') newTag.color = color; else newDaily.color = color;
      renderMore();
      return;
    }

    if ((el = hit('[data-newdailydt]'))) {
      const id = el.dataset.newdailydt;
      newDaily.dayTypes = newDaily.dayTypes.includes(id)
        ? newDaily.dayTypes.filter((x) => x !== id) : [...newDaily.dayTypes, id];
      renderMore();
      return;
    }

    if ((el = hit('[data-tagedit]'))) {
      const tag = findTag(el.dataset.tagedit);
      if (!tag) return;
      const name = prompt(t('folderName'), tag.name);
      if (name === null) return;
      if (name.trim()) tag.name = name.trim();
      const kw = prompt(t('keywords'), (tag.keywords || []).join(', '));
      if (kw !== null) tag.keywords = splitKeywords(kw);
      await saveTag(tag);
      renderMore(); renderTasks();
      return;
    }

    if ((el = hit('[data-tagdel]'))) {
      const tag = findTag(el.dataset.tagdel);
      if (tag && confirm(t('confirmDeleteFolder', { name: tag.name }))) {
        await deleteTag(tag.id);
        renderMore(); renderTasks(); renderNotes();
        toast(t('deleted'));
      }
      return;
    }

    if ((el = hit('[data-dailydel]'))) {
      const d = state.dailies.find((x) => x.id === el.dataset.dailydel);
      if (d && confirm(t('confirmDeleteDaily', { name: d.name }))) {
        await removeDaily(d.id);
        renderMore(); renderToday(); renderCalendar();
        toast(t('deleted'));
      }
      return;
    }

    if ((el = hit('[data-dtdel]'))) {
      const dt = state.dayTypes.find((x) => x.id === el.dataset.dtdel);
      if (dt && confirm(t('confirmDeleteFolder', { name: dt.name }))) {
        await removeDayType(dt.id);
        renderMore(); renderToday(); renderCalendar();
        toast(t('deleted'));
      }
      return;
    }
  });

  /* Zählerwert direkt eintippen */
  document.addEventListener('change', async (e) => {
    const el = e.target.closest('[data-cntset]');
    if (!el) return;
    const [kind, id] = el.dataset.cntset.split('|');
    const value = clamp(parseInt(el.value, 10) || 0, 0, 10 ** 9);
    if (kind === 'daily') await setDailyValue(id, value);
    else {
      const task = findTask(id);
      if (task) {
        task.count = value;
        task.done = value >= task.goal;
        await saveTask(task);
        renderTasks(); renderToday();
      }
    }
  });

  /* Unterpunkt per Enter */
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
    state.view === 'today' ? renderToday() : renderTasks();
    $(`[data-sub-input="${task.id}"]`)?.focus();
  });
}

/* Große Ziele springen in größeren Schritten – 7000 Schritte
   wären sonst 7000 Klicks. */
function stepSize(goal) {
  if (!goal) return 1;
  if (goal >= 5000) return 500;
  if (goal >= 1000) return 100;
  if (goal >= 100) return 10;
  return 1;
}

/* --------------------------------------------------------------------------
   21. Start
   -------------------------------------------------------------------------- */

function renderAll() {
  renderToday(); renderTasks(); renderNotes(); renderCalendar(); renderMore();
}

async function boot() {
  let savedTheme = 'light', savedLang = null;
  try {
    savedTheme = localStorage.getItem('notizen-theme')
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    savedLang = localStorage.getItem('notizen-lang');
  } catch (e) { /* egal */ }

  setLang(savedLang || ((navigator.language || 'de').startsWith('en') ? 'en' : 'de'));

  initChrome();
  initEditor();
  initImport();
  initDelegation();
  initSwipe();

  applyTheme(savedTheme);
  $$('#lang-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
  applyStaticTexts();

  try { await loadState(); }
  catch (err) { console.error(err); toast('Storage error'); }

  renderAll();
  switchView('today');
  positionThumb('#theme-seg'); positionThumb('#lang-seg');

  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW:', err));
    });
  }
}

boot();
