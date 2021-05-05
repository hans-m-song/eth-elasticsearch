FROM node:stretch-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run compile

ENTRYPOINT [ "node", "dist/index" ]
