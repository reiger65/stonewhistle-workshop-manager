# Database Backup Systeem - Instructies

Dit document bevat instructies voor het configureren en gebruiken van het database backup systeem voor de Stonewhistle Workshop Management applicatie.

## Inhoudsopgave
1. [Overzicht](#overzicht)
2. [Benodigde Bestanden](#benodigde-bestanden)
3. [Google Drive API Setup](#google-drive-api-setup)
4. [Backup Uitvoeren](#backup-uitvoeren)
5. [Automatische Backups](#automatische-backups)
6. [Problemen Oplossen](#problemen-oplossen)

## Overzicht

Het backup systeem bestaat uit drie hoofdcomponenten:
1. **backup-database.js** - Maakt een SQL dump van de PostgreSQL database
2. **backup-to-drive.js** - Upload database backups naar Google Drive
3. **auto-backup.js** - Plant automatische periodieke backups

## Benodigde Bestanden

- **backup-database.js** - Basisscript voor het maken van database backups
- **backup-to-drive.js** - Script voor het uploaden van backups naar Google Drive
- **auto-backup.js** - Script voor automatische periodieke backups
- **service-account-credentials.json** - Google Drive API credentials (moet je zelf maken)

## Google Drive API Setup

Voor het uploaden van backups naar Google Drive moet je de Google Drive API configureren:

1. **Maak een Google Cloud Project**:
   - Ga naar [Google Cloud Console](https://console.cloud.google.com/)
   - Maak een nieuw project of selecteer een bestaand project
   - Noteer de Project ID

2. **Activeer de Google Drive API**:
   - Ga naar "APIs & Services" > "Library"
   - Zoek naar "Google Drive API" en activeer deze

3. **Maak Service Account Credentials**:
   - Ga naar "APIs & Services" > "Credentials"
   - Klik op "Create Credentials" > "Service Account"
   - Vul de benodigde informatie in en klik op "Create"
   - Geef de service account "Editor" toegang
   - Noteer de service account email (iets als `account-name@project-id.iam.gserviceaccount.com`)

4. **Genereer en download de private key**:
   - Klik op de zojuist gemaakte service account
   - Ga naar het tabblad "Keys" en klik op "Add Key" > "Create New Key"
   - Kies JSON formaat en klik op "Create"
   - Het sleutelbestand wordt automatisch gedownload
   - Hernoem dit bestand naar `service-account-credentials.json`

5. **Upload het credentials bestand naar Replit**:
   - Upload het `service-account-credentials.json` bestand naar je Replit project

6. **Maak een folder in Google Drive**:
   - Maak een folder in jouw Google Drive waar de backups opgeslagen zullen worden
   - Deel deze folder met de service account email die je eerder hebt genoteerd
   - Verkrijg de Folder ID uit de URL van de folder (het lange alfanumerieke deel na `folders/` in de URL)
   - Stel de `DRIVE_FOLDER_ID` environment variabele in op deze Folder ID

## Backup Uitvoeren

### Handmatige Database Backup

Om een handmatige database backup uit te voeren zonder Google Drive upload:

```bash
node backup-database.js
```

De backup wordt opgeslagen in de `backups` directory.

### Handmatige Backup naar Google Drive

Om een database backup te maken en naar Google Drive te uploaden:

```bash
node backup-to-drive.js
```

Zorg ervoor dat je het `service-account-credentials.json` bestand en de environment variabele `DRIVE_FOLDER_ID` hebt ingesteld.

## Automatische Backups

Om automatische backups te configureren:

1. **Environment Variabelen Instellen**:
   
   - `DRIVE_FOLDER_ID` - ID van de Google Drive folder waar backups worden opgeslagen
   - `DRIVE_CREDENTIALS_PATH` - (Optioneel) Pad naar het credentials bestand (standaard: `service-account-credentials.json` in de root directory)
   - `BACKUP_SCHEDULE` - (Optioneel) Cron expressie voor de backup planning (standaard: `0 0 3 * * *`, oftewel dagelijks om 3:00 AM)

2. **Start het Automatische Backup Systeem**:

   ```bash
   node auto-backup.js
   ```

3. **Onmiddellijke Backup Uitvoeren (Testen)**:

   ```bash
   node auto-backup.js --now
   ```

### Cron Expressie Voorbeelden

| Expressie | Beschrijving |
|-----------|--------------|
| `0 0 3 * * *` | Elke dag om 3:00 AM (standaard) |
| `0 0 3 * * 0` | Elke zondag om 3:00 AM |
| `0 0 3 1 * *` | Elke 1e dag van de maand om 3:00 AM |
| `0 30 1 * * 1,4` | Elke maandag en donderdag om 1:30 AM |
| `0 0 */6 * * *` | Elke 6 uur (om 0:00, 6:00, 12:00, 18:00) |

## Problemen Oplossen

### Google Drive Upload Problemen

Als je problemen ondervindt met Google Drive uploads:

1. **Controleer de credentials**:
   - Zorg ervoor dat het `service-account-credentials.json` bestand correct is
   - Verificeer dat je de service account hebt geautoriseerd om toegang te hebben tot de Google Drive folder

2. **Controleer de folder machtigingen**:
   - Zorg ervoor dat de folder correct is gedeeld met het service account

3. **Controleer de environment variabelen**:
   - Zorg ervoor dat `DRIVE_FOLDER_ID` correct is ingesteld

### Database Backup Problemen

Als je problemen ondervindt met database backups:

1. **Controleer de database verbinding**:
   - Verifieer dat de PGDATABASE, PGUSER, PGPASSWORD, PGHOST, en PGPORT environment variabelen correct zijn ingesteld

2. **Controleer toegangsrechten**:
   - Zorg ervoor dat de database gebruiker rechten heeft om een backup uit te voeren

Voor verdere hulp, bekijk de logbestanden of neem contact op met de systeembeheerder.