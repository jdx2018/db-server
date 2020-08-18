const dbClient = require("./db/db.mysql");
const login = require("./login/login");
const sign = require("./sign/sign");
const token = require("./token/token");
const sms = require("./sms/sms.service");
const email = require("./email/email.service");
const logger = require("./log").logger;
const server = require("http").createServer({});
const options = require("./config/socket");
const port = require("./config/server").port;
const io = require("socket.io")(server, options);

var connectionPool = {};
const channel = {
  login_pda: {
    needsign: true,
    needtoken: false,
    request: "api/pda/login/request",
    response: "api/pda/login/response",
    execute: async (body) => {
      return await login.login_pda(body.userId);
    },
  },
  login_pc: {
    needsign: true,
    needtoken: false,
    request: "api/pc/login/request",
    response: "api/pc/login/response",
    execute: async (body) => {
      return await login.login_pc(body.tenantId, body.userId, body.pwd);
    },
  },
  login_sso: {
    needsign: true,
    needtoken: false,
    request: "api/sso/login/request",
    response: "api/sso/login/response",
    execute: async (body) => {
      return await login.login_sso(body.code, body.url);
    },
  },
  getConnection: {
    needsign: true,
    needtoken: true,
    request: "db/getConnection/request",
    response: "db/getConnection/response",
    execute: async (req) => {
      if (connectionPool[req.id]) {
        dbClient.release(connectionPool[req.id]);
      }
      let con = await dbClient.getConnection();
      connectionPool[req.id] = con;
      return { code: 1, message: "success" };
    },
  },
  beginTrans: {
    needsign: true,
    needtoken: true,
    request: "db/beginTrans/request",
    response: "db/beginTrans/response",
    execute: async (req) => {
      await dbClient.beginTrans(connectionPool[req.id]);
      return { code: 1, message: "success" };
    },
  },
  commitTrans: {
    needsign: true,
    needtoken: true,
    request: "db/commitTrans/request",
    response: "db/commitTrans/response",
    execute: async (req) => {
      await dbClient.commitTrans(connectionPool[req.id]);
      return { code: 1, message: "success" };
    },
  },
  rollbackTrans: {
    needsign: true,
    needtoken: true,
    request: "db/rollbackTrans/request",
    response: "db/rollbackTrans/response",
    execute: async (req) => {
      await dbClient.rollbackTrans(connectionPool[req.id]);
      return { code: 1, message: "success" };
    },
  },
  executeObjkWithCon: {
    needsign: true,
    needtoken: true,
    request: "db/executeObjWithCon/request",
    response: "db/executeObjWithCon/response",
    execute: async (req) => {
      let res = await dbClient.executeObjWithCon(
        connectionPool[req.id],
        req.operate,
        req.tableName,
        req.query,
        req.fields,
        req.dataContent,
        req.pageNum,
        req.pageSize
      );
      return { code: 1, message: "success.", data: res.results };
    },
  },
  executeSqlWithCon: {
    needsign: true,
    needtoken: true,
    request: "db/executeSqlWithCon/request",
    response: "db/executeSqlWithCon/response",
    execute: async (req) => {
      let res = await dbClient.executeSqlWithCon(
        connectionPool[req.id],
        req.sql,
        req.params
      );
      return { code: 1, message: "success", data: res.results };
    },
  },
  sms_send: {
    needsign: true,
    needtoken: true,
    request: "sms/send/request",
    response: "sms/send/response",
    execute: async (req) => {
      return await sms.sms_send_cmbc(req.mobile, req.content);
    },
  },
  email_send: {
    needsign: true,
    needtoken: true,
    request: "email/send/request",
    response: "email/send/response",
    execute: async (req) => {
      return await email.email_send_cmbc(
        req.toAddr,
        req.ccAddress,
        req.title,
        req.content
      );
    },
  },
};
io.on("connect", (socket) => {
  console.log("socket connect success." + socket.id);
  Object.keys(channel).forEach((key) => {
    let channelObj = channel[key];
    socket.on(channelObj.request, async (req) => {
      // console.log(channelObj.request);
      logger.debug(channelObj.request);
      logger.debug(req);
      req = JSON.parse(req);
      try {
        if (!req || !req.signature) {
          throw { code: -1, message: "请求参数不能为空" };
        }
        let res = null;
        if (channelObj.needsign) {
          res = await sign.verifySignature(req.body, req.signature);
          if (res.code != 1) {
            throw res;
          }
        }
        if (channelObj.needtoken) {
          res = await token.verifyToken(
            req.sn ? req.sn : req.userId,
            req.access_token
          );
          if (res.code != 1) {
            throw res;
          }
        }
        req.body.socket = socket;
        res = await channelObj.execute(req.body);
        // console.log("return result.");
        // console.log(res);
        logger.debug(channelObj.response);
        logger.debug(res);
        socket.emit(channelObj.response, JSON.stringify(res));
      } catch (err) {
        console.log("error return.");
        console.log(err.message);
        console.log(channelObj.response);
        logger.log(channelObj.response);
        logger.log(err);
        socket.emit(
          channelObj.response,
          JSON.stringify({
            code: err.code ? err.code : -1,
            message: err.message,
          })
        );
      }
    });
  });
  socket.on("disconnect", () => {
    console.log("release con " + socket.id);

    dbClient.release(connectionPool[socket.id]);
  });
});
server.listen(port, () => {
  console.log("socket server is listening " + port);
});
