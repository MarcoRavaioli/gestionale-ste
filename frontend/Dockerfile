# STAGE 1: Build dell'applicazione Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci 
COPY . .
RUN npm run build -- --configuration production

# STAGE 2: Deploy su Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 1. Svuotiamo i file di default di Nginx (la pagina "Welcome")
RUN rm -rf /usr/share/nginx/html/*
# 2. Copiamo i file prendendoli dalla cartella /browser
COPY --from=builder /app/www/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]