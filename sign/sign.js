/**
 * 签名验证，对于client请求过来的数据，客户端统一对body的json string做签名。
 * 服务端采用统一的逻辑进行签名然后比对是否一致，不一致则不允许数据交互
 */
const utility = require("../utility");
const { key, iv, salt } = require("../config/sign_params");

function verifySignature(rawData, signature) {
  try {
    // console.log(rawData);
    // console.log(JSON.stringify(rawData));
    let encryptData = utility.aes_encrypt(key, iv, JSON.stringify(rawData));
    // console.log(encryptData);
    let str = encryptData + salt + utility.getDateTime("YYYY-MM-dd");
    // console.log(str);
    let sign_temp = utility.md5(str);
    // console.log("server:" + sign_temp + " client:" + signature);
    if (sign_temp != signature) {
      throw new Error("签名数据无效，验证不通过." + "signature:" + sign_temp);
    }
    return { code: 1, message: "success" };
  } catch (err) {
    return { code: -611, message: "签名验证错误:" + err.message };
  }
}
module.exports.verifySignature = verifySignature;
