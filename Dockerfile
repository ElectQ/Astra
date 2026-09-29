FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css main.js constellation.css constellation.js favicon.svg /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:3000/health || exit 1
