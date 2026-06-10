# TASK TRACKER

## Sprint 2
- [X] Seite fürs Passwort setzen für neue User implementieren
- [X] Student/Unternehmen erstellen Funktionalität ändern - statt sie zur Tabelle hinzuzufügen soll ein invite zum registrieren rausgesendet werden [https://jobdatingbackend.stoplight.io/docs/dualjobdating/a54e0e5192a6d-dual-job-dating](https://jobdatingbackend.stoplight.io/docs/dualjobdating/a54e0e5192a6d-dual-job-dating)
- [X] Excel Import anpassen - statt Studenten direkt in die Tabelle aufzunehmen sollen diese auch eingeladen werden
- [X] Website Re-Design, "FH JOANNEUM" Branding
- [X] Student updaten Funktionalität  mit API verknüpfen
- [X] Student löschen Funktionalität  mit API verknüpfen
- [X] Unternehmensprofil updaten Funktionalität  mit API verknüpfen
- [X] Unternehmens löschen Funktionalität  mit API verknüpfen
- [X] "Studenten" auf "Studierende" ändern

## Sprint 3

### Vorbereitung Dual Job Dating Event 
- [X] Als Administrator sehe ich welche Studierenden welches Unternehmen geliked/disliked hat 
- [X] Als Administrator kann ich das „Matching“ zwischen Studierenden und Partnerunternehmen für ein Job Dating Event anstoßen. --> resend invite
- [X] Als Administrator kann ich die Zuteilung zwischen Studierenden und Partnerunternehmen sehen (Z.B: Zeile: Partnerunternehmen, Spalte: Studierende; evtl. Darstellung umschaltbar)
- [X] Als Administrator kann ich die Zuteilung von Studierenden zu einem ausgewählten Partnerunternehmen sehen 
- [X] Als Administrator kann ich die Zuteilung von Partnerunternehmen zu einer ausgewählten Studierenden sehen 
- [X] Als Administrator kann ich die Zuteilung zwischen Studierenden und Partnerunternehmen editieren (Uhrzeit ändern, Studierende ändern, Unternehmen ändern) Dabei verhindert die Business-Logik „ungültige“ Zuordnungen (gewählte Studierende zu dem gewählten Zeitpunkt bereits bei anderem Unternehmen zugeordnet; gewähltes Unternehmen zu dem gewählten Zeitpunkt bereits anderer Studierenden zugeordnet, etc.) 
- [X] excel muster für Christine
- Vercel deployment task

### Matching Consolidation
- [X] Termine-Seite: altes Raster "ein Meeting pro Studierende/n" durch editierbare Matrix (Zeilen: Unternehmen, Spalten: Zeitslots) ersetzt; jede Zelle ist ein Dropdown mit der/dem zugeteilten Studierenden. Die Matrix scrollt horizontal, die Unternehmensspalte bleibt fixiert.
- [X] "Automatisch zuteilen" ruft jetzt den Backend-Matcher (`POST /meetings/assign`, `dry_run`) auf und füllt die Matrix; der frühere In-Browser-Matching-Algorithmus wurde entfernt.
- [X] "Termin speichern" committet den gesamten Zeitplan über `PUT /api/events/{id}/meetings` (reconcile: entfernt weggefallene, fügt neue Meetings hinzu).
- [X] Slots werden event-eigen angelegt (`POST /api/slots` verlangt `event_id`); die angezeigte Slot-Anzahl eines gespeicherten Events spiegelt die eigenen Slots des Events wider (Fix der vorher immer 0 angezeigten Anzahl).
- [X] `POST /api/meetings/assign` ist jetzt event-bezogen (`event_id` Pflicht); `replace_existing` löscht nur Meetings dieses Events und darf beim echten Commit nicht mit einer slot_ids/student_ids-Teilmenge kombiniert werden.
- [X] Excel-Export eines gespeicherten Events ist jetzt ein Gitter (Unternehmen x Zeitslots) statt einer flachen Liste pro Meeting.
- [X] Speed-Dating-Modell: ein/e Studierende/r kann mehrere Meetings über mehrere Slots haben; Konfliktprüfungen (kein/e Studierende/r doppelt im selben Slot oder doppelt beim selben Unternehmen) und Markierung abgelehnter (Dislike-)Paarungen bleiben erhalten.

### Excel Import Vorlagen

#### Studierende

| Vorname | Nachname   | E-Mail                     | Studiengang                 | Semester |
| ------- | ---------- | -------------------------- | --------------------------- | -------- |
| Max     | Mustermann | max.mustermann@example.com | Mobile Software Development | 1        |

#### Unternehmen

| Firmenname  | E-Mail           |
| ----------- | ---------------- |
| Muster GmbH | office@muster.at |


## Offene Punkte bis 9.6:

- [X] Termine: Bei manueller Zuweisung soll es visuelles Feedback geben ob der Student das Unternehmen geliked/disliked hat (z.B. Hintergrund Farbe)
- [X] Info Button zur Anzeige von Vorschau wie das Excel aussehen soll 
- [] Excel Import für Studenten & Unternehmen anlegen ohne Invite ?
- [X] Als Partnerunternehmen kann ich ERST AM TAG des Dual Job Datings die Zuteilung sehen, welche Studierenden (Vorname, Nachname) wann zum Stand des Unternehmens kommen werden.  
- [X] Admin soll Unternehmensprofile gleich wie das Unternehmen bearbeiten können (Fotos hochladen)
- [X] Wording: "Status: Aktiv/Inaktiv" ändern (z.B. Teilnahme am Jobdating)


### Tests 
- [X] Companies List (Admin)
- [X] Students List (Admin)
- [X] matching between students and companies
- [X] correct creation of events/appointments
- [X] Company Profile Page
- [X] Authentication
- [X] Edge Cases
- [X] Error Handling