FROM node:lts

RUN apt-get update && apt-get install -y ffmpeg imagemagick webp && apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]