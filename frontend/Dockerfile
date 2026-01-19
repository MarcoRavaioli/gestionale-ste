# Stage 1: Build Angular
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Compila per la produzione
RUN npm run build -- --configuration=production

# Stage 2: Serve con Nginx
FROM nginx:alpine
# --- MODIFICA CRUCIALE QUI SOTTO ---
# Copiamo dalla cartella "browser" che è dentro "www"
COPY --from=build /app/www/browser /usr/share/nginx/html

# Copiamo la configurazione Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
