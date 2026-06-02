# Sprint 1

## Dashboard-Navigation

Das Dashboard dient als zentrale Einstiegseite für Administratoren. Von dort aus können die Bereiche Studierende, Unternehmen, Präferenzen und Veranstaltungen direkt aufgerufen werden.

## Übersicht über Studierende

Es wurde eine Verwaltungsansicht implementiert, in der Administratoren alle angelegten Studierenden einsehen können. Die Ansicht zeigt die wichtigsten Informationen wie Name, Studiengang und Semester und dient als zentrale Verwaltungskomponente für die FH-Administration.

## Übersicht über Unternehmen

Zusätzlich wurde eine Verwaltungsansicht für Partnerunternehmen umgesetzt. Administratoren erhalten einen Überblick über alle angelegten Unternehmen inklusive Statusinformationen und können von dort aus weitere Verwaltungsaktionen durchführen.

Statusverwaltung für Unternehmen:
Es wurde eine Statusanzeige für Unternehmen integriert, sodass Administratoren jederzeit erkennen können, welche Unternehmen aktuell aktiv oder inaktiv sind. Darüber hinaus wurde die Möglichkeit geschaffen, Unternehmen als aktiv oder inaktiv zu markieren. Unternehmen können dadurch von zukünftigen Veranstaltungen ausgeschlossen werden, ohne dass die eigentlichen Unternehmensdaten verloren gehen.



# Sprint 2

## Einladung von Studierenden und Unternehmen

Im Rahmen dieses Sprints wurde der vorgesehene Einladungsprozess für Studierende und Unternehmen vollständig in das Web-Portal integriert. Administratoren können neue Studierende sowie Unternehmensvertreter direkt über die Benutzeroberfläche einladen. Nach Eingabe der erforderlichen Informationen wird eine Einladung an die angegebene E-Mail-Adresse versendet. Die eigentliche Registrierung erfolgt anschließend über den vom Backend bereitgestellten Registrierungsprozess.

Zusätzlich wurde die bestehende Excel-Import-Funktion erweitert. Administratoren können mehrere Studierende oder Unternehmen gleichzeitig über vorbereitete Excel-Dateien importieren. Die hochgeladenen Datensätze werden verarbeitet und für jede gültige Zeile automatisch der entsprechende Einladungsprozess gestartet. Dadurch wird die Verwaltung größerer Teilnehmerzahlen erheblich vereinfacht.

## Verwaltung von Studierenden

Die bestehende Studierendenverwaltung wurde vollständig mit den verfügbaren Backend-APIs verknüpft. Änderungen an Stammdaten werden nicht mehr ausschließlich lokal durchgeführt, sondern direkt über die entsprechenden Schnittstellen gespeichert.

Darüber hinaus wurde die Möglichkeit geschaffen, Studierende über die Benutzeroberfläche zu bearbeiten und zu löschen. Alle Änderungen werden unmittelbar mit dem Backend synchronisiert, wodurch stets aktuelle Daten angezeigt werden.

## Verwaltung von Unternehmen

Auch die Unternehmensverwaltung wurde an die vorhandenen Backend-Schnittstellen angebunden. Unternehmensprofile können direkt im Web-Portal bearbeitet und aktualisiert werden. Änderungen an Unternehmensdaten werden über die bereitgestellten APIs gespeichert und stehen anschließend allen Benutzern zur Verfügung.

Unternehmensprofile können sowohl durch Administratoren als auch durch die Unternehmen selbst gepflegt werden. Nach erfolgreicher Einladung können Unternehmen ihre Profilinformationen eigenständig vervollständigen und aktualisieren.

ür Unternehmensprofile wurde die Möglichkeit geschaffen, Firmenlogos sowie zusätzliche Unternehmensbilder hochzuladen und zu verwalten. Die hochgeladenen Medien werden innerhalb des Unternehmensprofils dargestellt und können von Unternehmensvertretern für die Präsentation ihres Unternehmens genutzt werden.

Zusätzlich wurde die Löschfunktion für Unternehmen vollständig integriert und mit den entsprechenden Backend-Endpunkten verbunden.
(Die Löschfunktion für Unternehmen wurde vorübergehend aus der Benutzeroberfläche entfernt und im Code deaktiviert. Derzeit werden Unternehmen stattdessen über ihren Status als aktiv bzw. inaktiv verwaltet. Eine endgültige Lösung für das Löschen von Unternehmen wird nach weiterer Abstimmung mit dem Backend-Team umgesetzt.)

## Benutzeroberfläche und Design

Im Zuge des Sprints wurde das Erscheinungsbild des Web-Portals überarbeitet und an das Corporate Design der FH JOANNEUM angepasst. Dabei wurden Farben, Logos und verschiedene Layout-Komponenten vereinheitlicht, um eine konsistente Benutzererfahrung zu gewährleisten.

Zusätzlich wurde die Bezeichnung „Studenten“ im gesamten System durch die korrekte Bezeichnung „Studierende“ ersetzt.


# Sprint 3

## Übersicht der Präferenzen

Für Administratoren wurde eine eigene Ansicht implementiert, in der die von Studierenden abgegebenen Präferenzen eingesehen werden können. Dadurch ist ersichtlich, welche Unternehmen von den einzelnen Studierenden positiv oder negativ bewertet wurden.

Zur besseren Erreichbarkeit wurde zusätzlich ein eigener Navigationspunkt „Präferenzen“ im Dashboard ergänzt.

## Erstellung und Konfiguration von Job-Dating-Terminen

Für die Vorbereitung eines Job-Dating-Events wurde eine neue Verwaltungsoberfläche umgesetzt. Administratoren können Veranstaltungen mit Titel, Datum, Studiengang und Semester anlegen.

Zusätzlich können verschiedene Parameter für die Terminplanung definiert werden, darunter die Anzahl der Gesprächsslots, die Dauer eines einzelnen Gesprächs sowie die Position und Länge von Pausen.

Auf Grundlage dieser Angaben werden die benötigten Zeitslots automatisch erzeugt und dem Administrator bereits vor dem Speichern angezeigt.

## Automatische Zuteilung von Studierenden und Unternehmen

Zur Unterstützung der Veranstaltungsplanung wurde eine Matching-Funktion implementiert, welche Studierende automatisch Unternehmen zuordnet.

Die Zuordnungen werden in einer übersichtlichen Tabelle dargestellt und können vom Administrator überprüft werden. Zusätzlich wird angezeigt, wie viele Studierende erfolgreich zugeteilt wurden und ob Teilnehmer ohne Zuweisung verbleiben.

Die finale Business-Logik für Matching, Slot-Verwaltung und Konfliktprüfung wird backendseitig umgesetzt und befindet sich aktuell noch in Abstimmung mit dem Backend-Team.

## Manuelle Bearbeitung von Zuteilungen

Die erzeugten Zuteilungen können nachträglich durch Administratoren angepasst werden. Dabei können sowohl Unternehmen als auch Zeitslots manuell geändert werden.

Die Benutzeroberfläche wurde bereits für diese Funktion vorbereitet. 
Zusätzlich wurden erste Frontend-Validierungen implementiert. Die vollständige Business-Logik und finale Konfliktprüfung werden zukünftig durch die Backend-Implementierung ergänzt

## Excel-Export

Für die weitere Verarbeitung außerhalb des Systems wurde ein Excel-Export für Veranstaltungen implementiert.

Der Export enthält alle erzeugten Zuordnungen zwischen Studierenden, Unternehmen und Zeitslots. Zusätzlich werden definierte Pausen berücksichtigt und als eigene Einträge im Export dargestellt. Dadurch kann der erzeugte Zeitplan direkt für organisatorische Zwecke verwendet oder an externe Personen weitergegeben werden.

## Excel-Vorlagen

Zur Vereinfachung des Imports wurden Dokumentationen und Vorlagen für den Aufbau der Excel-Dateien erstellt.

Für Studierende werden die Felder Vorname, Nachname, E-Mail, Studiengang und Semester erwartet.

Für Unternehmen werden die Felder Firmenname und E-Mail-Adresse erwartet.

Dadurch können Administratoren Importdateien korrekt vorbereiten und Fehler beim Einlesen vermeiden.

## Erinnerungsfunktion (Resend Invite)

Zusätzlich zur erstmaligen Einladung wurde eine Erinnerungsfunktion integriert. Administratoren können bereits eingeladene Studierende oder Unternehmen erneut zur Registrierung auffordern. Hierfür wird der vorhandene Backend-Endpunkt zur erneuten Zustellung einer Einladung verwendet.

## Authentifizierung und Rollenverwaltung

Für den Zugriff auf das Web-Portal wurde eine Authentifizierung auf Basis von Supabase integriert. Benutzer müssen sich mit ihren Zugangsdaten anmelden, bevor auf geschützte Bereiche des Systems zugegriffen werden kann.

Zusätzlich wurde eine rollenbasierte Zugriffskontrolle umgesetzt. Nach erfolgreicher Anmeldung wird geprüft, welche Rolle dem Benutzer zugeordnet ist. Abhängig von dieser Rolle werden unterschiedliche Bereiche des Systems freigeschaltet.

Administratoren erhalten Zugriff auf die Verwaltungsfunktionen des Portals, darunter die Verwaltung von Studierenden, Unternehmen, Präferenzen und Job-Dating-Terminen.

Unternehmensvertreter werden nach der Anmeldung auf ihren eigenen Unternehmensbereich weitergeleitet. Dort können sie ihr Unternehmensprofil verwalten, Unternehmensdaten bearbeiten, Logos und Bilder hochladen sowie ihren Aktivstatus für zukünftige Veranstaltungen festlegen.

Zur Kommunikation mit dem Backend wurde die Authentifizierung über Supabase-Tokens integriert. Geschützte API-Aufrufe verwenden den aktuell angemeldeten Benutzer und dessen Berechtigungen, wodurch sichergestellt wird, dass nur autorisierte Benutzer auf die jeweiligen Funktionen zugreifen können.


## Sprachliche und visuelle Überarbeitung

Das habt ihr mehrfach angepasst.

Im Zuge der Weiterentwicklung wurden verschiedene Oberflächenbereiche hinsichtlich Benutzerfreundlichkeit und Übersichtlichkeit überarbeitet. Dazu gehören die Anpassung von Bezeichnungen, die Verbesserung der Tabellenansichten, die Hervorhebung wichtiger Statusinformationen sowie die Optimierung von Formularen und Dialogfenstern.