FROM node:lts AS dependencies
WORKDIR /app
COPY package.json /app/package.json
RUN npm install


FROM dependencies AS keep-a-changelog-merge
COPY index.js /app
COPY utils.js /app

ENTRYPOINT ["node", "index.js"]