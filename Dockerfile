FROM node:lts

RUN apt-get update && apt-get install -y ffmpeg imagemagick webp && apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 5000

CMD ["npm", "start"]