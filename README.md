This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

The Web-Portal can be accessed here: [https://dualjobdating.vercel.app/](https://dualjobdating.vercel.app/).

## Tasks tracking

- [X] Seite fürs Passwort setzen für neue User implementieren
- [X] Student/Unternehmen erstellen Funktionalität ändern - statt sie zur Tabelle hinzuzufügen soll ein invite zum registrieren rausgesendet werden [https://jobdatingbackend.stoplight.io/docs/dualjobdating/a54e0e5192a6d-dual-job-dating](https://jobdatingbackend.stoplight.io/docs/dualjobdating/a54e0e5192a6d-dual-job-dating)
- [X] Excel Import anpassen - statt Studenten direkt in die Tabelle aufzunehmen sollen diese auch eingeladen werden
- [X] Website Re-Design, "FH JOANNEUM" Branding
- [X] Student updaten Funktionalität  mit API verknüpfen
- [X] Student löschen Funktionalität  mit API verknüpfen
- [X] Unternehmensprofil updaten Funktionalität  mit API verknüpfen
- [X] Unternehmens löschen Funktionalität  mit API verknüpfen
- [X] "Studenten" auf "Studierende" ändern

## Getting Started

First run installation
```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Technische Umsetzung

### Invite-basierter Workflow
Studierende und Unternehmen werden nicht direkt erstellt, sondern über ein Invite-System angelegt.

- Beim Hinzufügen wird ein API-Call ausgeführt (`/invite`)
- Der Benutzer erhält eine Einladung zur Registrierung
- Erst nach Abschluss der Registrierung wird der Datensatz vollständig angelegt

Dies entspricht der Backend-API-Spezifikation:
https://jobdatingbackend.stoplight.io/docs/dualjobdating/


### Excel Import

Für Studierende und Unternehmen wurde ein Excel-Import implementiert.

#### Funktionsweise:
- Upload einer `.xlsx` oder `.xls` Datei
- Verarbeitung im Frontend mit der Bibliothek `xlsx`
- Erste Zeile wird als Header interpretiert
- Daten werden validiert und anschließend einzeln als Invite versendet

#### Unterstützte Spalten:

**Studierende:**
- firstname / lastname oder name
- email
- studyprogram
- semester

**Unternehmen:**
- companyname / name
- email

#### Verhalten:
- Ungültige Zeilen werden übersprungen
- Erfolgreiche und fehlgeschlagene Einladungen werden angezeigt
- Nach erfolgreichem Import wird die Liste neu geladen


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

[Current vercel deplyoment](https://dualjobdating.vercel.app).