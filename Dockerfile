FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV DATA_DIR=/data

EXPOSE 3000

CMD ["node", "server.js"]
