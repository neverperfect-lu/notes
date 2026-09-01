# Notizen

Notizen, Aufgaben mit Unterpunkten und Daily-Tracking. Läuft als statische Seite auf
GitHub Pages, installierbar auf dem Homescreen, funktioniert offline. Alle Daten
bleiben im Browser des Geräts (IndexedDB) – kein Server, kein Login, kein Tracking.

## Dateien

```
index.html              App-Struktur
style.css               Design-Tokens, Light/Dark, Layout
app.js                  Speicher, Views, Logik
manifest.webmanifest    Name, Icons, Startverhalten
sw.js                   Service Worker (Offline-Cache)
icons/                  App-Icons
```

## Auf GitHub Pages veröffentlichen

1. Neues Repository anlegen, z. B. `notizen`.
2. Den **Inhalt** dieses Ordners ins Repo-Root pushen (nicht den Ordner selbst –
   `index.html` muss direkt im Root liegen).
3. Repo → Settings → Pages → Source: `Deploy from a branch`, Branch: `main`, Folder: `/ (root)`.
4. Nach ein bis zwei Minuten ist die App unter
   `https://<username>.github.io/notizen/` erreichbar.

Alle Pfade sind relativ (`./style.css` usw.), die App läuft also auch im
Unterordner einer Domain – ohne Anpassung.

HTTPS ist Pflicht für Service Worker. GitHub Pages liefert das automatisch.

## Auf dem Homescreen installieren

**iPhone (Safari):** Seite öffnen → Teilen-Symbol → „Zum Home-Bildschirm“.
Danach startet die App ohne Browser-Leiste. Wichtig: Das muss in **Safari**
passieren, Chrome auf iOS kann das nicht.

**Android (Chrome):** Seite öffnen → Menü → „App installieren“ bzw.
„Zum Startbildschirm hinzufügen“.

## Wo liegen die Daten?

In der IndexedDB des Browsers, auf dem jeweiligen Gerät. Ein Neustart des
Handys ändert daran nichts. Weg sind sie nur, wenn du die Browser- bzw.
App-Daten löschst.

Beim ersten Start fragt die App über die Persistent-Storage-API an, dass das
Betriebssystem diese Daten nicht automatisch aufräumt. Den Status siehst du
unter „Mehr → Speicher“.

**Backup:** „Mehr → Daten exportieren“ legt eine JSON-Datei ab. Vor einem
Gerätewechsel exportieren, danach über „Daten importieren“ wieder einlesen.

Ein Sync zwischen mehreren Geräten ist bewusst nicht eingebaut. Dafür bräuchte
es ein Backend (z. B. Supabase); das lässt sich später ergänzen, ohne die
Oberfläche zu ändern.

## Nach Änderungen an HTML/CSS/JS

Im `sw.js` die Cache-Version hochzählen:

```js
const CACHE = 'notizen-v2';   // vorher v1
```

Sonst liefert der Service Worker auf installierten Geräten weiter die alte Version.

## Bedienung

- **Heute** – Fortschrittsring über alle Dailies, antippbare Daily-Kacheln mit
  Serienzähler, Schnellerfassung für Aufgabe oder Notiz.
- **Aufgaben** – Aufgabe eintippen, über den Pfeil rechts aufklappen und
  Unterpunkte anlegen. Der Fortschrittsbalken zählt die Unterpunkte. Das Häkchen
  auf Aufgabenebene schaltet alle Unterpunkte gleichzeitig.
- **Notizen** – Titel und Freitext, Suche über alles, Autosave beim Tippen.
- **Mehr** – Dailies verwalten, Export/Import, Speicherstatus.

## Anpassen

Farben und Radien stehen als CSS-Variablen ganz oben in `style.css`
(`:root` für hell, `html[data-theme="dark"]` für dunkel). Die Startvorschläge für
Dailies stehen in `app.js` unter `SEED_DAILIES`.
