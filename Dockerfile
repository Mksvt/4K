FROM node:20-alpine

WORKDIR /app

# Install deps first for better layer caching
COPY apigateway+frontend/backend/package.json apigateway+frontend/backend/package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy backend source
COPY apigateway+frontend/backend/ ./

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
