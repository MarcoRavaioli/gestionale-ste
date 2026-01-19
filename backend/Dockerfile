FROM node:20-alpine

WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il codice
COPY . .

# Compila il codice TypeScript in JavaScript
RUN npm run build

# Espone la porta 3000
EXPOSE 3000

# Comando di avvio
CMD ["npm", "run", "start:prod"]
