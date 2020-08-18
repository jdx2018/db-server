/**
 * token生成和验证
 */
const jwt = require("jsonwebtoken");
const utility = require("../utility");
const expireTime = 24 * 60 * 60; //秒
const signKey = "supoin@iot-future";
/**
 * 内存缓存 token数据
 */
let cache = {
  tokenCache: {},
};
/**
 * 错误消息列表
 */
const error = {
  signError: { code: -20, message: "token签发失败" },
  tokenEmpty: { code: -21, message: "token不能为空" },
  tokenNotExists: { code: -22, message: "token不存在或已过期，请重新登录." },
  tokenVerifyError: { code: -23, message: "token验证失败" },
  toeknUserNotMatch: { code: -24, message: "token与用户不匹配" },
};
/**
 * 获取当前系统时间 转换为秒
 */
function getCurrentTime() {
  return Math.floor(Date.now() / 1000);
}
/**
 * 签发token
 * @param {*} userId
 * @param {*} callback
 */
async function createToken(userId) {
  let result = {};
  try {
    let jwtSign = async function signToken() {
      return new Promise((resolve, reject) => {
        jwt.sign(
          { userId: userId, exp: getCurrentTime() + expireTime },
          signKey,
          (err, token) => {
            if (err) {
              reject(err);
            } else {
              resolve({ err: err, token: token });
            }
          }
        );
      });
    };
    let res = await jwtSign();

    let tokenItem = {
      userId: userId,
      tokenId: utility.md5(res.token),
      token: res.token,
      time: getCurrentTime(),
    };
    cache.tokenCache[userId] = tokenItem;
    cache.tokenCache[tokenItem.tokenId] = tokenItem;
    result = { code: 1, message: "生成token成功", data: tokenItem.tokenId };
  } catch (err) {
    {
      result = {
        code: error.signError.code,
        message: error.signError.message + err.message,
      };
    }
  }
  return result;
}
/**
 * 验证token
 * @param {*} userId
 * @param {*} tokenId
 * @param {*} callback
 */
async function verifyToken(userId, tokenId) {
  // console.log(userId + "," + tokenId);
  let result = {};
  if (!tokenId) {
    return error.tokenEmpty;
  } else if (!cache.tokenCache[tokenId] || !cache.tokenCache[userId]) {
    return error.tokenNotExists;
  }
  let tokenItem = cache.tokenCache[userId];
  try {
    let jwtVerify = async function jwtVerfiyToken() {
      return new Promise((resolve, reject) => {
        jwt.verify(tokenItem.token, signKey, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        });
      });
    };
    let res = await jwtVerify();

    if (res.userId == userId) {
      tokenItem.time = getCurrentTime();
      cache.tokenCache[userId] = tokenItem;
      result = { code: 1, message: "数据认证通过", data: tokenId };
    } else {
      return error.toeknUserNotMatch;
    }
  } catch (err) {
    console.log(err);
    if (
      err.name == "TokenExpiredError" &&
      getCurrentTime() - tokenItem.time < expireTime
    ) {
      result = await createToken(userId);
    } else {
      result = {
        code: error.tokenVerifyError.code,
        message: error.tokenVerifyError.message + err.name,
      };
    }
  }
  return result;
}
module.exports.createToken = createToken;
module.exports.verifyToken = verifyToken;
