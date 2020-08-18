const crypto = require("crypto");

function md5(str) {
  var cryptor = crypto.createHash("md5");
  return cryptor.update(str).digest("hex");
}
function sha1(str) {
  let sha1 = crypto.createHash("sha1");
  sha1.update(str);
  return sha1.digest("hex");
}
function aes_decrypt(key, iv, encryptedData) {
  key = new Buffer(key, "utf-8");
  encryptedData = new Buffer(encryptedData, "base64");
  iv = new Buffer(iv, "utf-8");
  try {
    // 解密
    var decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true);
    var decoded = decipher.update(encryptedData, "utf-8", "utf-8");
    decoded += decipher.final("utf-8");
  } catch (err) {
    console.log(err);
  }
  return decoded;
}
function aes_encrypt(key, iv, rawData) {
  // console.log(key);
  // console.log(iv);
  // console.log(rawData);
  key = Buffer.alloc(16, key, "utf-8");
  iv = Buffer.alloc(16, iv, "utf-8");
  let cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
  cipher.setAutoPadding(true);
  let encoded = cipher.update(rawData, "utf-8", "base64");
  encoded += cipher.final("base64");
  return encoded;
}
/*日期格式化*/
Date.prototype.Format = function (format) {
  var date = {
    "M+": this.getMonth() + 1,
    "d+": this.getDate(),
    "h+": this.getHours(),
    "m+": this.getMinutes(),
    "s+": this.getSeconds(),
    "q+": Math.floor((this.getMonth() + 3) / 3),
    "S+": this.getMilliseconds(),
  };
  if (/(y+)/i.test(format)) {
    format = format.replace(
      RegExp.$1,
      (this.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (var k in date) {
    if (new RegExp("(" + k + ")").test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length == 1
          ? date[k]
          : ("00" + date[k]).substr(("" + date[k]).length)
      );
    }
  }
  return format;
};
/**
 * 获取格式化后的日期、时间字符串
 * @param {*} format YYYY-MM-dd
 */
function getDateTime(format) {
  return new Date().Format(format);
}
module.exports.md5 = md5;
module.exports.sha1 = sha1;
module.exports.aes_encrypt = aes_encrypt;
module.exports.aes_decrypt = aes_decrypt;
module.exports.getDateTime = getDateTime;
