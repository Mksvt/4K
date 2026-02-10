# Build frontend and serve it via nginx, also reverse-proxy API.

FROM node:20-alpine AS frontend-build
WORKDIR /src

COPY apigateway+frontend/frontend/package.json apigateway+frontend/frontend/package-lock.json* ./
RUN npm ci || npm install

COPY apigateway+frontend/frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /src/dist /usr/share/nginx/html

RUN mkdir -p /var/www/certbot

EXPOSE 80 443
