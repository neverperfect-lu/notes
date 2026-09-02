/* Sprachdatei. Neue Texte immer in beiden Sprachen ergänzen. */

const I18N = {
  de: {
    /* Navigation */
    today: 'Heute', tasks: 'Aufgaben', notes: 'Notizen', calendar: 'Kalender', more: 'Mehr',

    /* Allgemein */
    done: 'Fertig', delete: 'Löschen', add: 'Hinzufügen', cancel: 'Abbrechen',
    edit: 'Bearbeiten', save: 'Sichern', all: 'Alle', back: 'Zurück', close: 'Schließen',

    /* Heute */
    dayType: 'Tagesart', progressLabel: 'Dailies erledigt', allDone: 'Alles erledigt für heute',
    noDailies: 'Keine Dailies', noDailiesHint: 'Lege unter „Mehr“ an, was du täglich tracken willst.',
    dailies: 'Dailies', noStreak: 'Noch keine Serie', streakOne: '1 Tag in Serie', streakMany: '{n} Tage in Serie',
    thought: 'Gedanke', thoughtPlaceholder: 'Gedanke aufschreiben…',
    thoughtHint: 'Enter speichert als Notiz. Für eine Aufgabe rechts tippen.',
    savedAsNote: 'Als Notiz gespeichert', savedAsTask: 'Als Aufgabe gespeichert',
    pinnedTasks: 'Angepinnt', openTasksLabel: 'offene Aufgaben', openTaskLabel: 'offene Aufgabe',
    noteLabel: 'Notiz', notesLabel: 'Notizen',

    /* Aufgaben */
    newTask: 'Neue Aufgabe…', open: 'Offen', completed: 'Erledigt', cleanUp: 'Aufräumen',
    noTasks: 'Noch keine Aufgaben',
    noTasksHint: 'Tippe oben etwas ein. Unterpunkte und Zähler kommen danach dazu.',
    addSubtask: 'Unterpunkt hinzufügen', deleteTask: 'Aufgabe löschen',
    pin: 'Anpinnen', unpin: 'Lösen', pinLimit: 'Maximal 3 Aufgaben anpinnen',
    addCounter: 'Zähler', removeCounter: 'Zähler entfernen',
    counterGoal: 'Ziel', counterUnit: 'Einheit', counterUnitPlaceholder: 'z. B. Videos',
    swipeHint: 'Nach links wischen hakt eine Aufgabe ab.',
    deletedTask: 'Aufgabe gelöscht', deletedDone: 'Erledigte Aufgaben gelöscht',
    confirmDeleteTask: '„{title}“ löschen?', confirmCleanUp: '{n} erledigte Aufgaben löschen?',

    /* Ordner */
    folders: 'Ordner', newFolder: 'Neuer Ordner', folderName: 'Name', folderColor: 'Farbe',
    noFolders: 'Noch keine Ordner',
    noFoldersHint: 'Ordner bündeln Aufgaben und Notizen. Der Kreis füllt sich mit dem Fortschritt.',
    keywords: 'Stichwörter', keywordsPlaceholder: 'schnitt, export, premiere',
    keywordsHint: 'Kommagetrennt. Alles, was du eintippst und eines dieser Wörter enthält, landet automatisch in diesem Ordner.',
    deleteFolder: 'Ordner löschen',
    confirmDeleteFolder: '„{name}“ löschen? Aufgaben und Notizen bleiben erhalten.',
    inFolder: 'in diesem Ordner', tasksIn: '{n} Aufgaben', notesIn: '{n} Notizen',
    autoSorted: 'Automatisch einsortiert: {name}',

    /* Notizen */
    searchNotes: 'Notizen und Ordner durchsuchen', newNote: 'Neue Notiz beginnen…',
    noNotes: 'Noch keine Notizen', noNotesHint: 'Tippe oben los – die Notiz öffnet sich sofort.',
    nothingFound: 'Nichts gefunden', tryOther: 'Versuch einen anderen Suchbegriff.',
    untitled: 'Ohne Titel', emptyNote: 'Leere Notiz', noteTitle: 'Titel', writeHere: 'Schreib los…',
    confirmDeleteNote: 'Diese Notiz löschen?', deletedNote: 'Notiz gelöscht',
    saving: 'Speichert…', saved: 'Gespeichert',
    photo: 'Bild', voice: 'Sprachmemo', recording: 'Nimmt auf…', stopRec: 'Stopp',
    micDenied: 'Kein Mikrofonzugriff. In den Browser-Einstellungen erlauben.',
    micUnsupported: 'Aufnahme wird von diesem Browser nicht unterstützt.',
    attachmentDeleted: 'Anhang gelöscht', confirmDeleteAttachment: 'Anhang löschen?',

    /* Kalender */
    monthDone: '{n} von {t} Tagen', selectDay: 'Tag antippen für Details',
    noLogs: 'Für diesen Tag ist nichts eingetragen.', perDaily: 'Pro Daily in diesem Monat',
    todayLabel: 'Heute',

    /* Mehr */
    appearance: 'Erscheinungsbild', light: 'Hell', dark: 'Dunkel',
    language: 'Sprache', german: 'Deutsch', english: 'English',
    dayTypes: 'Tagesarten',
    dayTypesHint: 'Jede Tagesart zeigt ihre eigenen Dailies. Die Tagesart wählst du oben auf „Heute“.',
    newDayType: 'Neue Tagesart', showOn: 'Zeigen an',
    newDaily: 'Neues Daily', deleteDaily: 'Daily löschen',
    confirmDeleteDaily: '„{name}“ löschen? Die Einträge bleiben im Backup erhalten.',
    dailyGoal: 'Zielwert', dailyGoalHint: 'Leer lassen für einfaches Abhaken.',
    backup: 'Sicherung', exportData: 'Daten exportieren', importData: 'Daten importieren',
    backupHint: 'Der Export legt eine JSON-Datei auf deinem Gerät ab. Bilder und Sprachmemos sind enthalten, die Datei wird dadurch groß.',
    storage: 'Speicher', persisted: 'Dauerhaft gespeichert', used: 'Belegt', entries: 'Einträge',
    yes: 'Ja', notGuaranteed: 'Nicht garantiert', unsupported: 'Nicht unterstützt',
    storageHint: 'Die Daten liegen ausschließlich in diesem Browser, auf diesem Gerät. Ein Neustart schadet ihnen nicht. Löschst du die Browserdaten, sind sie weg.',
    wipe: 'Alle Daten löschen',
    confirmWipe: 'Wirklich alles löschen? Aufgaben, Notizen, Ordner und alle Einträge werden entfernt.',
    confirmWipe2: 'Das kann nicht rückgängig gemacht werden. Sicher?',
    wiped: 'Alles gelöscht', exported: 'Backup exportiert', imported: 'Backup eingelesen',
    importFailed: 'Datei konnte nicht gelesen werden', importInvalid: 'Kein gültiges Backup',
    confirmImport: 'Backup einlesen? Vorhandene Daten werden ersetzt.',
    added: 'Hinzugefügt', deleted: 'Gelöscht',

    /* Standardwerte */
    seedStudy: 'Uni-Tag', seedWork: 'Arbeitstag', seedOff: 'Freier Tag',
    seedSteps: 'Schritte', seedPushups: 'Liegestütze', seedStretch: 'Dehnen',
    unitSteps: 'Schritte', unitReps: 'Wdh.',

    /* Planung */
    planAhead: 'Tage im Voraus planen',
    planAheadHint: 'Tippe einen künftigen Tag an und wähle darunter die Tagesart. So steht schon vorher fest, welche Dailies an dem Tag gelten.',
    planned: 'Tagesart gesetzt',

    /* Health */
    health: 'Schritte aus Health',
    healthHint: 'Apple Health lässt sich von einer Website nicht direkt auslesen – das erlaubt iOS nur nativen Apps. Über die Kurzbefehle-App geht es trotzdem: Sie liest die Schritte und ruft die App mit dem Wert auf.',
    healthShow: 'Anleitung anzeigen',
    healthStep1: 'Kurzbefehle-App öffnen, neuen Kurzbefehl anlegen.',
    healthStep2: 'Aktion „Gesundheitsdaten abrufen“ hinzufügen, Typ Schritte, Zeitraum Heute, Zusammenfassen Summe.',
    healthStep3: 'Aktion „URL öffnen“ hinzufügen und diese URL eintragen, mit dem Ergebnis der vorigen Aktion am Ende:',
    healthStep4: 'Unter Automation täglich ausführen lassen – die App trägt den Wert dann selbst ein.',
    healthImported: '{n} Schritte übernommen',
    copied: 'Kopiert', copyUrl: 'URL kopieren',

    /* Bearbeiten */
    editDaily: 'Daily bearbeiten', editFolder: 'Ordner bearbeiten',
    nameLabel: 'Name', glyphLabel: 'Symbol', colorLabel: 'Farbe',
    changesSaved: 'Gespeichert',
  },

  en: {
    today: 'Today', tasks: 'Tasks', notes: 'Notes', calendar: 'Calendar', more: 'More',

    done: 'Done', delete: 'Delete', add: 'Add', cancel: 'Cancel',
    edit: 'Edit', save: 'Save', all: 'All', back: 'Back', close: 'Close',

    dayType: 'Day type', progressLabel: 'dailies done', allDone: 'All done for today',
    noDailies: 'No dailies', noDailiesHint: 'Add what you want to track daily under “More”.',
    dailies: 'Dailies', noStreak: 'No streak yet', streakOne: '1 day streak', streakMany: '{n} day streak',
    thought: 'Thought', thoughtPlaceholder: 'Write down a thought…',
    thoughtHint: 'Enter saves it as a note. Tap the right button for a task.',
    savedAsNote: 'Saved as note', savedAsTask: 'Saved as task',
    pinnedTasks: 'Pinned', openTasksLabel: 'open tasks', openTaskLabel: 'open task',
    noteLabel: 'note', notesLabel: 'notes',

    newTask: 'New task…', open: 'Open', completed: 'Completed', cleanUp: 'Clean up',
    noTasks: 'No tasks yet',
    noTasksHint: 'Type something above. Subtasks and counters come after.',
    addSubtask: 'Add subtask', deleteTask: 'Delete task',
    pin: 'Pin', unpin: 'Unpin', pinLimit: 'You can pin up to 3 tasks',
    addCounter: 'Counter', removeCounter: 'Remove counter',
    counterGoal: 'Goal', counterUnit: 'Unit', counterUnitPlaceholder: 'e.g. videos',
    swipeHint: 'Swipe left to complete a task.',
    deletedTask: 'Task deleted', deletedDone: 'Completed tasks deleted',
    confirmDeleteTask: 'Delete “{title}”?', confirmCleanUp: 'Delete {n} completed tasks?',

    folders: 'Folders', newFolder: 'New folder', folderName: 'Name', folderColor: 'Colour',
    noFolders: 'No folders yet',
    noFoldersHint: 'Folders group tasks and notes. The circle fills with your progress.',
    keywords: 'Keywords', keywordsPlaceholder: 'edit, export, premiere',
    keywordsHint: 'Comma separated. Anything you type containing one of these words lands in this folder automatically.',
    deleteFolder: 'Delete folder',
    confirmDeleteFolder: 'Delete “{name}”? Tasks and notes are kept.',
    inFolder: 'in this folder', tasksIn: '{n} tasks', notesIn: '{n} notes',
    autoSorted: 'Sorted into {name}',

    searchNotes: 'Search notes and folders', newNote: 'Start a new note…',
    noNotes: 'No notes yet', noNotesHint: 'Start typing above – the note opens right away.',
    nothingFound: 'Nothing found', tryOther: 'Try a different search term.',
    untitled: 'Untitled', emptyNote: 'Empty note', noteTitle: 'Title', writeHere: 'Start writing…',
    confirmDeleteNote: 'Delete this note?', deletedNote: 'Note deleted',
    saving: 'Saving…', saved: 'Saved',
    photo: 'Photo', voice: 'Voice memo', recording: 'Recording…', stopRec: 'Stop',
    micDenied: 'No microphone access. Allow it in your browser settings.',
    micUnsupported: 'Recording is not supported by this browser.',
    attachmentDeleted: 'Attachment deleted', confirmDeleteAttachment: 'Delete attachment?',

    monthDone: '{n} of {t} days', selectDay: 'Tap a day for details',
    noLogs: 'Nothing logged for this day.', perDaily: 'Per daily this month',
    todayLabel: 'Today',

    appearance: 'Appearance', light: 'Light', dark: 'Dark',
    language: 'Language', german: 'Deutsch', english: 'English',
    dayTypes: 'Day types',
    dayTypesHint: 'Each day type shows its own dailies. Pick the type at the top of “Today”.',
    newDayType: 'New day type', showOn: 'Show on',
    newDaily: 'New daily', deleteDaily: 'Delete daily',
    confirmDeleteDaily: 'Delete “{name}”? Past entries stay in your backup.',
    dailyGoal: 'Target value', dailyGoalHint: 'Leave empty for a simple checkbox.',
    backup: 'Backup', exportData: 'Export data', importData: 'Import data',
    backupHint: 'Export writes a JSON file to your device. Photos and voice memos are included, which makes the file large.',
    storage: 'Storage', persisted: 'Stored persistently', used: 'Used', entries: 'Entries',
    yes: 'Yes', notGuaranteed: 'Not guaranteed', unsupported: 'Not supported',
    storageHint: 'Data lives only in this browser, on this device. Restarting is fine. Clearing browser data deletes it.',
    wipe: 'Delete all data',
    confirmWipe: 'Delete everything? Tasks, notes, folders and all entries will be removed.',
    confirmWipe2: 'This cannot be undone. Are you sure?',
    wiped: 'Everything deleted', exported: 'Backup exported', imported: 'Backup restored',
    importFailed: 'Could not read the file', importInvalid: 'Not a valid backup',
    confirmImport: 'Restore backup? Existing data will be replaced.',
    added: 'Added', deleted: 'Deleted',

    seedStudy: 'Study day', seedWork: 'Work day', seedOff: 'Day off',
    seedSteps: 'Steps', seedPushups: 'Push-ups', seedStretch: 'Stretching',
    unitSteps: 'steps', unitReps: 'reps',

    planAhead: 'Plan days ahead',
    planAheadHint: 'Tap a future day and pick its day type below. That way you know in advance which dailies apply.',
    planned: 'Day type set',

    health: 'Steps from Health',
    healthHint: 'A website cannot read Apple Health directly – iOS only allows that for native apps. The Shortcuts app can do it: it reads your steps and opens this app with the value.',
    healthShow: 'Show instructions',
    healthStep1: 'Open the Shortcuts app and create a new shortcut.',
    healthStep2: 'Add the action “Find Health Samples”, type Steps, period Today, aggregate Sum.',
    healthStep3: 'Add the action “Open URL” and enter this URL with the previous result at the end:',
    healthStep4: 'Run it daily via Automation – the app then fills in the value by itself.',
    healthImported: '{n} steps imported',
    copied: 'Copied', copyUrl: 'Copy URL',

    editDaily: 'Edit daily', editFolder: 'Edit folder',
    nameLabel: 'Name', glyphLabel: 'Symbol', colorLabel: 'Colour',
    changesSaved: 'Saved',
  },
};

let LANG = 'de';

function setLang(lang) {
  LANG = I18N[lang] ? lang : 'de';
  document.documentElement.lang = LANG;
  try { localStorage.setItem('notizen-lang', LANG); } catch (e) { /* egal */ }
}

function t(key, vars) {
  let str = I18N[LANG][key] ?? I18N.de[key] ?? key;
  if (vars) for (const k in vars) str = str.replaceAll(`{${k}}`, vars[k]);
  return str;
}

const locale = () => (LANG === 'en' ? 'en-GB' : 'de-DE');
