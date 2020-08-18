/*!
 * 发送短信服务
 */

/**
 *
 * @param {string} mobile 手机号码
 * @param {string} content 短信正文
 */
async function sms_send_cmbc(mobile, content) {
  return { code: 1, message: "success" };
}
module.exports.sms_send_cmbc = sms_send_cmbc;
