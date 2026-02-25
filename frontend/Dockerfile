# STAGE 1: Build dell'applicazione Angular
FROM node:20-alpine AS builder
WORKDIR /app
# Copiamo solo i package per sfruttare la cache di Docker
COPY package*.json ./
# npm ci è più sicuro e pulito di npm install per le pipeline CI/CD
RUN npm ci 
# Copiamo tutto il resto
COPY . .
# Compiliamo il progetto per la produzione
RUN npm run build -- --configuration production

# STAGE 2: Deploy su Nginx
FROM nginx:alpine
# Copiamo la configurazione personalizzata
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiamo i file compilati dallo stage precedente.
# NOTA: L'application builder di Angular 17+ di default mette i file in una sottocartella /browser. 
# Verifica se nel tuo caso i file finiscono in /app/www o /app/www/browser e adegua il path qui sotto se necessario.
COPY --from=builder /app/www /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]