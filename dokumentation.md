## Excel import Einbau 20.04.2026

Excel-Import ist jetzt einfach eingebaut auf der `students`-Seite.

**Was umgesetzt ist:**

- Neuer Button **`Excel importieren`** in `app/(app)/students/page.tsx`
- Datei-Upload für **`.xlsx`** und **`.xls`**
- Excel wird clientseitig gelesen und in Studenten-Datensätze umgewandelt
- Tabelle wird nach Import direkt mit den importierten Studenten befüllt
- Erfolg-/Fehlermeldungen beim Import
- Abhängigkeit **`xlsx`** in `package.json` ergänzt

Erwartete Excel-Header (mindestens):

- `study_program`
- `semester`

Optional unterstützt:

- `first_name`, `last_name` oder alternativ `name`
- `email` (auch `mail` / `emailadresse`)
- `status` (`aktiv/active/1/true` => Aktiv, sonst Inaktiv)

Wichtiger Hinweis:

- Diese Implementierung ist aktuell **nur im Frontend-State** (wie die bestehende Seite auch).Das heißt: Nach „Neu laden“ oder Seiten-Refresh kommen wieder die Daten vom Backend.

**Wie soll Excel Tabelle ausschauen (columns Namen) damit es sich erfolgreich importiert:**

Pflichtfelder - columns:

- `study_program`
- `semester`

Optionale columns (supported)**:**

- `first_name`
- `last_name`
- `name` (wird verwendet wenn first/last name fehlen)
- `email` ( `mail` oder `emailadresse` wird auch angenohmmen)
- `status`

Wie sind values interpretiert:

- `name`: built von `first_name + last_name`; if empty, falls back to `name`; else `"Unbekannt"`
- `status`: `aktiv`, `active`, `1`, `true`, `yes`, `ja` => **Aktiv**, otherwise **Inaktiv**
- Rows where both `study_program` and `semester` are empty are skipped.