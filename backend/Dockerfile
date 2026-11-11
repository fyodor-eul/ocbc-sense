FROM node:22-alpine

WORKDIR /app

# install dependencies first (cached unless package files change)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# then copy the code and data
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
