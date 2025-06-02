FROM --platform=linux/amd64 node:17.8

WORKDIR /offerwallv2/api

ENV APP_PORT=5000 \
    ENV=dev \
    AWS_REGION=ap-southeast-2

COPY . .

EXPOSE 5000

RUN npm install

ENTRYPOINT node /offerwallv2/api/index.js
# CMD ["node", "/isnofferwall/api/index.js"]