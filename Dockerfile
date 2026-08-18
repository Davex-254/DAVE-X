FROM node:lts

RUN apt-get update && apt-get install -y ffmpeg imagemagick webp && apt-get clean

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

EXPOSE 5000

CMD ["npm", "start"]