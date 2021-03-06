# db-socket-server

[![npm version](https://img.shields.io/npm/v/db-socket-server.svg?style=flat-square)](https://www.npmjs.org/package/db-socket-server)

A server sides for access db, Based on socket.io.

## Features

- Provide any data to client based on WebSocket
- A middlewale liked between clients(browser or more) and server
- Lightweight and friendly to use 😁

## Installing

Using npm:

```bash
$ npm install db-socket-server
```

Using yarn:

```bash
$ yarn add db-socket-server
```

## How to use

```js
```

node index.js

```
// Before to use it, You need consummate some config info in config folder
├── db.js
├── server.js
├── sign_params.js
└── socket.js
```

```js
// db.js
{
  host: "", // required
  user: "", // required
  password: "", // required
  port: "", // required
  database: "", // required
}
```

```js
// sign_params.js this three params must match the client's params which used for login
{
  key: "", // required
  iv: "", // required
  salt: "", // required
}
```

## License

[MIT](LICENSE)
