# Notizen

Notizen, Aufgaben mit Unterpunkten, Ordner und Daily-Tracking. Statische Seite auf
GitHub Pages, installierbar auf dem Homescreen, offline nutzbar. Alle Daten bleiben
im Browser des Geräts (IndexedDB) – kein Server, kein Login, keine Übertragung.

## Dateien

```
index.html              App-Struktur
style.css               Design-Tokens (Apple System Design), Light/Dark
i18n.js                 Texte Deutsch / Englisch
app.js                  Speicher, Ansichten, Logik
manifest.webmanifest    Name, Icons, Startverhalten
sw.js                   Service Worker (Offline-Cache)
icons/                  App-Icons
```

## Auf GitHub Pages veröffentlichen

1. Repository anlegen, z. B. `notizen`.
2. Den **Inhalt** dieses Ordners ins Repo-Root pushen – `index.html` muss direkt
   im Root liegen, nicht in einem Unterordner.
3. Settings → Pages → Source `Deploy from a branch`, Branch `main`, Ordner `/ (root)`.
4. Nach ein bis zwei Minuten unter `https://<username>.github.io/notizen/` erreichbar.

Alle Pfade sind relativ, die App läuft also auch im Unterordner einer Domain.

**Nach jeder Änderung an HTML/CSS/JS** die Cache-Version in `sw.js` hochzählen:

```js
const CACHE = 'notizen-v6';   // vorher v5
```

Sonst liefert der Service Worker auf installierten Geräten weiter die alte Version.

## Auf dem Homescreen installieren

**iPhone:** In **Safari** öffnen → Teilen → „Zum Home-Bildschirm“. Chrome auf iOS
kann das nicht.
**Android:** Chrome → Menü → „App installieren“.

## Die Ansichten

**Heute** – Tagesart oben wählen, Fortschrittsring über alle Dailies des Tages,
Kacheln zum Abhaken. Darunter das Feld für einen schnellen Gedanken: Enter legt
eine Notiz an, der zweite Knopf eine Aufgabe. Angepinnte Aufgaben erscheinen hier.

**Aufgaben** – Ordner-Bubbles zum Filtern, deren Ring den Fortschritt zeigt.
Aufgabe anlegen, über den Pfeil aufklappen: Unterpunkte, Ordnerzuordnung, Anpinnen
(max. 3), Zähler. **Nach links wischen hakt eine Aufgabe ab.**

**Notizen** – Suche über Text, Titel und Ordnernamen. Editor mit „Löschen“ oben
links, „Fertig“ oben rechts und noch einmal unten rechts über der Tastatur.
Bilder und Sprachmemos lassen sich anhängen.

**Kalender** – Monatsraster, jeder Tag ein Ring mit der Tageserfüllung. Tag antippen
zeigt die einzelnen Dailies mit Werten. Unten die Monatsbilanz pro Daily. Die
Tagesart lässt sich auch nachträglich pro Tag ändern.

**Mehr** – Ordner, Tagesarten, Dailies, Sprache, Export/Import, Speicherstatus.

## Ordner und automatische Zuordnung

Ordner sind gleichzeitig Suchbegriffe. Pro Ordner lassen sich Stichwörter
hinterlegen (`schnitt, export, premiere`). Alles, was du eintippst und eines dieser
Wörter enthält, landet automatisch dort.

Das ist reiner Wortabgleich, keine KI. Ein echtes Sprachmodell bräuchte einen
API-Schlüssel, und der darf nie in ein öffentliches Repository – jeder könnte ihn
auslesen und auf deine Rechnung nutzen. Der Wortabgleich läuft dafür offline und
kostenlos.

## Zähler

Aufgaben und Dailies können einen Zielwert haben: 20 Videos, 7000 Schritte. Der
Balken füllt sich mit dem eingetragenen Wert, erledigt ist es beim Erreichen des
Ziels. Die Plus- und Minusknöpfe passen ihre Schrittweite dem Ziel an – bei 7000
springt es in 500er-Schritten, den genauen Wert kannst du direkt eintippen.

## Sprache

Der Umschalter oben ändert nur die Oberfläche. Eigene Inhalte – Ordnernamen,
Dailies, Tagesarten – bleiben so, wie du sie angelegt hast.

## Bilder und Sprachmemos

Bilder werden vor dem Ablegen auf max. 1600 px verkleinert, sonst ist der lokale
Speicher nach wenigen Fotos voll.

Sprachmemos brauchen Mikrofonzugriff. Auf dem iPhone war das in installierten PWAs
lange gesperrt; je nach iOS-Version kann es haken. Die App zeigt dann eine
Meldung statt still zu scheitern.

## Wo liegen die Daten?

In der IndexedDB des Browsers, auf diesem Gerät. Ein Neustart schadet nichts. Weg
sind sie nur beim Löschen der Browser- bzw. App-Daten.

Beim Start bittet die App über die Persistent-Storage-API darum, dass das
Betriebssystem diese Daten nicht automatisch aufräumt. Status unter „Mehr → Speicher“.

**Backup:** „Mehr → Daten exportieren“ schreibt eine JSON-Datei. Bilder und
Sprachmemos sind enthalten, dadurch wird sie groß. Vor einem Gerätewechsel
exportieren, danach importieren.

Ein Sync zwischen Geräten ist bewusst nicht eingebaut. Dafür bräuchte es ein
Backend (z. B. Supabase); das lässt sich später ergänzen, ohne die Oberfläche
zu ändern.

## Tage im Voraus planen

Im Kalender einen künftigen Tag antippen und darunter die Tagesart wählen.
Geplante Tage bekommen ein kleines Symbol im Raster. So steht vorher fest,
welche Dailies an dem Tag gelten.

## Schritte aus Apple Health

Eine Website kann HealthKit nicht direkt auslesen – iOS erlaubt das
ausschließlich nativen Apps. Über die Kurzbefehle-App geht es trotzdem:

1. Kurzbefehle-App öffnen, neuen Kurzbefehl anlegen
2. Aktion „Gesundheitsdaten abrufen“: Typ **Schritte**, Zeitraum **Heute**,
   Zusammenfassen **Summe**
3. Aktion „URL öffnen“ mit dieser URL, das Ergebnis der vorigen Aktion ans Ende:
   `https://<username>.github.io/<repo>/?steps=`
4. Unter „Automation“ täglich ausführen lassen

Die App liest den Parameter beim Start, schreibt ihn in das erste Daily mit der
Einheit Schritte und entfernt den Parameter wieder aus der Adresse. Die genaue
URL steht auch in der App unter „Mehr → Schritte aus Health“ zum Kopieren.

## Anpassen

Farben und Radien stehen als CSS-Variablen oben in `style.css` (`:root` hell,
`html[data-theme="dark"]` dunkel). Die Palette folgt den Apple System Colors.
Texte in `i18n.js`, immer in beiden Sprachen. Die Startvorschläge für Dailies und
Tagesarten in `app.js` unter `seedIfEmpty`.

Bestehende Dailies und Ordner bearbeitest du unter „Mehr“ durch Antippen der
Zeile: Name, Symbol, Zielwert, Tagesarten und Farbe. Änderungen werden beim
Tippen gespeichert, ein Farb- oder Tagesklick setzt die Felder nicht zurück.
