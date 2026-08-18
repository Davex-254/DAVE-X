FROM node:lts

RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*   # <-- keeps image smaller

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps   # <-- add this back if you had peer dep issues before

COPY . .

EXPOSE 3000

CMD ["npm", "start"]