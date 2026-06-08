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
- [] Companies List (Admin)
- [] Students List (Admin)
- [] matching between students and companies
- [] correct creation of events/appointments
- [] Company Profile Page
- [] Excel Import
- [] Authentication
- [] Edge Cases
- [] Error Handling