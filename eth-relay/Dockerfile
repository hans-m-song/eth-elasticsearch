FROM node:stretch-slim

WORKDIR /app

COPY *.json ./
RUN npm run install
RUN npm run compile

ENTRYPOINT [ "node", "dist" ]
