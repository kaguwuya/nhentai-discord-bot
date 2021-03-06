FROM node:14.15.0-alpine3.11 as build

WORKDIR /app

RUN apk --no-cache add --virtual .build-deps build-base ca-certificates autoconf automake g++ libtool python3

COPY package.json .
RUN yarn install

COPY tsconfig.json .
COPY src/ src/
RUN yarn build

FROM node:14.15.0-alpine3.11 as run
WORKDIR /app
COPY --from=build /app/package.json .
COPY --from=build /app/build/ build/
RUN yarn install --prod
CMD yarn start
