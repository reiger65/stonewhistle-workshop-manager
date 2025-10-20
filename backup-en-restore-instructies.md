# Backup en Restore Instructies voor Stonewhistle Workshop Manager

Dit document beschrijft hoe u database backups kunt maken en terugzetten.

## Backups maken

### Methode 1: Via de interface

De eenvoudigste manier om een backup te maken is via de knop in de rechterbovenhoek van de applicatie:

1. Klik op het database icoontje (🗄️) rechts bovenin het scherm, naast de online/offline indicator
2. Kies "Nieuwe backup maken" in het dropdown menu
3. Wacht tot de backup is voltooid (er verschijnt een bevestigingsmelding)
4. De backup wordt opgeslagen in de map `backups/` met de naam `stonewhistle-db-backup-[DATUM-TIJD].sql`

### Google Drive Backup

U kunt ook backups maken en opslaan in Google Drive:

1. Klik op het database icoontje (🗄️) rechts bovenin het scherm
2. Kies "Backup naar Google Drive" in het dropdown menu
3. Wacht tot de backup is gemaakt en naar Google Drive is geüpload
4. Een bevestiging verschijnt wanneer dit voltooid is

### Methode 2: Via de terminal

U kunt ook handmatig een backup maken met de volgende opdracht:

```bash
node backup-database.js
```

Dit maakt een backup aan in de map `backups/`.

### Methode 3: Automatische backups

De applicatie maakt ook automatisch dagelijkse backups met het script `auto-backup.js`.
Om dit script te starten (indien nog niet automatisch actief):

```bash
node auto-backup.js
```

Om een directe backup te maken én tegelijk automatische backups te starten:

```bash
node auto-backup.js --now
```

## Een backup terugzetten

### Lokale backup herstellen

U kunt op twee manieren een lokale backup terugzetten:

#### Methode 1: Via de interface (aanbevolen)

1. Klik op het database icoontje (🗄️) rechts bovenin het scherm
2. In het dropdown menu, klik op één van de beschikbare backups in de "Lokale Backups" sectie
3. Bevestig dat u de backup wilt terugzetten
4. Wacht tot het herstelproces voltooid is; de applicatie zal automatisch herstarten

#### Methode 2: Via de terminal

1. Stop de applicatie (sluit de workflow in Replit of de server in andere omgevingen)
2. Kijk welke backup u wilt terugzetten met `ls -la backups/`
3. Voer het restore script uit:

```bash
node restore-database.js backups/stonewhistle-db-backup-DATUMTIJD.sql [--restart]
```

De optionele `--restart` parameter zorgt ervoor dat de applicatie automatisch herstart na het terugzetten van de database.

Bijvoorbeeld:

```bash
node restore-database.js backups/stonewhistle-db-backup-2025-04-28T06-36-08-295Z.sql --restart
```

4. Wacht tot het herstelproces is voltooid
5. Als u de `--restart` parameter niet heeft gebruikt, start dan de applicatie handmatig opnieuw

### Google Drive backup herstellen

1. Klik op het database icoontje (🗄️) rechts bovenin het scherm
2. In het dropdown menu, klik op één van de beschikbare backups in de "Drive Backups Lijst" sectie
3. Bevestig dat u de backup wilt terugzetten
4. De backup wordt eerst gedownload van Google Drive en daarna teruggezet
5. Wacht tot het herstelproces voltooid is; de applicatie zal automatisch herstarten

## Backup locaties

- Lokale backups worden opgeslagen in de map `backups/`
- Als Google Drive integratie is ingesteld, worden backups ook naar Google Drive geüpload

## Google Drive integratie instellen

Om de Google Drive integratie in te stellen, heeft u een Google Service Account nodig:

1. Ga naar de [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een nieuw project aan (of gebruik een bestaand)
3. Schakel de Google Drive API in voor het project
4. Maak een Service Account aan
5. Download het JSON-bestand met de Service Account gegevens
6. Plaats dit JSON-bestand in de hoofdmap van de applicatie en noem het `service-account-credentials.json`

Nadat u deze stappen heeft voltooid, zal de toepassing automatisch de Google Drive integratie gebruiken voor backups.

## Backup schema

- Dagelijkse automatische backups worden gemaakt om 3:00 AM
- De laatste 30 backups worden bewaard in Google Drive (indien geconfigureerd)
- Lokale backups worden niet automatisch opgeschoond

## Voordelen van Google Drive backups

- Off-site opslag: uw backups zijn veilig, zelfs als er iets gebeurt met de server
- Eenvoudige toegang: u kunt uw backups bekijken en downloaden via Google Drive
- Automatische opschoning: alleen de meest recente backups worden bewaard, wat ruimte bespaart
- Extra beveiliging: backups worden opgeslagen in uw eigen Google-account

## Belangrijke bestanden

- `backup-database.js`: Script voor het maken van handmatige backups
- `restore-database.js`: Script voor het terugzetten van backups
- `auto-backup.js`: Script voor het inplannen van automatische backups
- `backup-to-drive.js`: Script voor het uploaden van backups naar Google Drive
- `laatste-backup.txt`: Logbestand met informatie over de laatste backup
- `laatste-restore.txt`: Logbestand met informatie over de laatste restore