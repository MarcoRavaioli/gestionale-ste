# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa tutte le dipendenze (incluse devDependencies per la build)
RUN npm ci

# Copia tutto il codice e compila
COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine

WORKDIR /app

# Copia package.json per installare solo moduli di produzione
COPY package*.json ./

# Installa SOLO dipendenze di produzione
RUN npm ci --omit=dev

# Copia la build dal primo stage
COPY --from=builder /app/dist ./dist

# Espone la porta
EXPOSE 3000

# Comando di avvio finale
CMD ["npm", "run", "start:prod"]
