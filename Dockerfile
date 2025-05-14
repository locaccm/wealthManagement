FROM node:20-alpine

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./

RUN npm install

COPY .gitmodules ./
COPY . .

RUN git submodule update --init --recursive

RUN npx prisma generate --schema=src/prisma/prisma/schema.prisma

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]