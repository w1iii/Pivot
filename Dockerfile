FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

USER node

CMD ["npm", "start"]
