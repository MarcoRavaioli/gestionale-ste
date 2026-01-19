# Stage 1: Build Angular
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Compila per la produzione
RUN npm run build -- --configuration=production

# Stage 2: Serve con Nginx
FROM nginx:alpine
# Copia i file compilati dalla fase precedente dentro Nginx
COPY --from=build /app/www /usr/share/nginx/html
# Configurazione custom per gestire il routing di Angular (vedi sotto)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 