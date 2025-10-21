# Guide: Nulstil Sliplane Docker Instance

Dit lokale projekt er nu nulstillet. Her er hvordan du nulstiller din Sliplane deployment:

## Option 1: Via Sliplane Dashboard (Anbefalet)

### Trin 1: Log ind på Sliplane
1. Gå til https://sliplane.io
2. Log ind med din konto

### Trin 2: Find dit projekt
1. Find dit "message-agent" eller lignende projekt i listen
2. Klik på projektet

### Trin 3: Stop og slet deployment
1. Gå til "Deployments" eller "Services" tab
2. Find din kørende container
3. Klik på "Stop" eller "Delete"
4. Bekræft sletningen

### Trin 4: Slet databasen (hvis relevant)
1. Gå til "Databases" tab
2. Find din database (hvis du har en)
3. Klik "Delete" og bekræft

### Trin 5: Fjern miljøvariabler
1. Gå til "Environment Variables" eller "Settings"
2. Slet alle miljøvariabler eller reset til default

### Trin 6: Slet hele projektet (valgfrit)
Hvis du vil starte helt forfra:
1. Gå tilbage til projekt listen
2. Find dit projekt
3. Klik på settings eller options (⋮)
4. Vælg "Delete Project"
5. Bekræft sletningen

---

## Option 2: Via Sliplane CLI

Hvis du har Sliplane CLI installeret:

```bash
# Login
sliplane login

# List projekter
sliplane projects list

# Slet deployment
sliplane deployments delete <deployment-id>

# Slet database
sliplane databases delete <database-id>

# Slet hele projektet
sliplane projects delete <project-id>
```

---

## Option 3: Docker direkte (hvis du har SSH adgang)

Hvis du har SSH adgang til din Sliplane server:

```bash
# SSH til serveren
ssh user@your-sliplane-server

# Stop alle containers
docker stop $(docker ps -aq)

# Fjern alle containers
docker rm $(docker ps -aq)

# Fjern alle images
docker rmi $(docker images -q)

# Fjern alle volumes (FORSIGTIG - sletter data!)
docker volume rm $(docker volume ls -q)

# Clean up alt
docker system prune -a --volumes
```

---

## Verificer nulstilling

Efter nulstilling, tjek at alt er væk:

1. Ingen deployments kører
2. Ingen databases findes
3. Ingen miljøvariabler sat
4. Ingen volumes med data

---

## Næste skridt

Nu hvor både lokalt projekt og Sliplane er nulstillet:

1. **Byg dit nye projekt lokalt** først
2. **Test det grundigt** 
3. **Deploy så til Sliplane** når du er klar

---

## Hjælp og support

- Sliplane dokumentation: https://docs.sliplane.io
- Sliplane support: support@sliplane.io
- Discord community: https://discord.gg/sliplane (tjek deres website for link)

---

_Guide oprettet: $(date)_

