# Используем базовый образ Node.js для сборки фронтенда
FROM node:20-alpine AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код приложения
COPY . .

# Выполняем сборку проекта
RUN npm run build

# Используем базовый образ Nginx для сервировки статических файлов
FROM nginx:alpine

# Копируем собранные файлы из предыдущей стадии
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем конфигурацию Nginx, если требуется
COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт 80
EXPOSE 80