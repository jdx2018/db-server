/**
 * 日志工具
 */
const log4js = require("log4js");
const logger = log4js.getLogger();
log4js.configure({
  appenders: {
    everything: {
      type: "dateFile",
      filename: "./Log/logs.log",
    },
  },
  categories: {
    default: {
      appenders: ["everything"],
      level: "debug",
    },
  },
});
module.exports.logger = logger;
