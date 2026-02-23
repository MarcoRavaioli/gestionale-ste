FROM nginx:alpine

# Copiamo la cartella www/browser (che manderai dal Mac)
COPY www/browser /usr/share/nginx/html

# Copiamo la configurazione custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
