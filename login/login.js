/**
 * 登录逻辑实现，包含sso统一认证登录 pc用户名密码登录 pda sn验证登录三种登录的实现
 */
const https = require("http");
const url = require("url");
const sm3 = require("../sm3");
const token = require("../token/token");
const dbClient = require("../db/db.mysql");
const sso_config_product = {
  granyType: "authorization_code",
  clientId: "P73",
  clientSecret: "AnhpriV2YZC6zoK1",
  authorizeUrl: "http://40.45.13.36:14100/SOAM/oauth/authorize",
  userInfoUrl: "http://40.45.13.36:14100/SOAM/user/getuserinfo",
  logOutUrl: "http://197.3.179.112:9000/SOAM/oauth/logout",
};

const sso_config_dev = {
  granyType: "authorization_code",
  clientId: "P73",
  clientSecret: "AnhpriV2YZC6zoK1",
  authorizeUrl: "http://197.3.179.112:9000/SOAM/oauth/authorize",
  userInfoUrl: "http://197.3.179.112:9000/SOAM/user/getuserinfo",
  logOutUrl: "http://197.3.179.112:9000/SOAM/oauth/logout",
};
const sso_config = sso_config_product;

async function login_sso(code, url_redirect) {
  if (!code) {
    throw new Error("code不能为空.");
  }
  // console.log(code);
  let user = await getUserInfo(code, url_redirect);
  let temp_user = {
    tenantId: "cmbc",
    orgId: "cmbc001",
    userId: user.USERSN, //员工号
    userName: user.CMBCOANAME, //cmbc 用户账号
    fullName: user.SN,
    telNo: user.TELEPHONENUMBER,
    mobile: user.MOBILE,
    email: user.MAIL,
    password: "1234567",
    createPerson: "system",
  };
  let res_user = await dbClient.Query("tenant_user", {
    userId: temp_user.userId,
  });
  if (res_user.results.length < 1) {
    await dbClient.Insert("tenant_user", temp_user);
  }
  let res_token = await token.createToken(user.USERSN);
  if (res_token.code != 1) {
    return res_token;
  }
  return {
    code: 1,
    message: "success.",
    data: { access_token: res_token.data, user: temp_user },
  };
}
/**
 * 用户验证登录
 * @param {*} userId
 * @param {*} pwd
 */
async function login_pc(tenantId, userId, pwd) {
  try {
    let res = await dbClient.Query("tenant_user", {
      tenantId: tenantId,
      userId: userId,
    });
    if (res.results.length < 1) {
      throw new Error("用户不存在.");
    }
    let user = res.results[0];
    if (user.password != pwd) {
      throw new Error("用户不存在或密码错误.");
    }
    let res_token = await token.createToken(userId);
    if (res_token.code == 1) {
      return {
        code: 1,
        message: "success.",
        data: { access_token: res_token.data, user: user },
      };
    }
    return res_token;
  } catch (err) {
    return { code: -102, message: err.message };
  }
}
/**
 * pda验证登录 验证sn存在即可
 * @param {*} sn
 */
async function login_pda(sn) {
  try {
    // console.log("execute query.login_pda");
    let res_device = await dbClient.Query("base_pda", { sn: sn });
    // console.log(res_device);
    if (res_device.results.length < 1) {
      return { code: -102, message: "该设备没有注册信息." };
    }
    let res_token = await token.createToken(sn);
    if (res_token.code == 1) {
      return {
        code: 1,
        message: "success.",
        data: { access_token: res_token.data },
      };
    }
    return res_token;
  } catch (err) {
    return { code: -103, message: err.message };
  }
}
async function getUserInfo(code, redirect_url) {
  let client_secret = caculate(sso_config.clientSecret);
  let url_token =
    sso_config.tokenUrl +
    "?grant_type=authorization_code&code=" +
    code +
    "&redirect_uri=" +
    redirect_url +
    "&client_secret=" +
    client_secret +
    "&client_id=" +
    sso_config.clientId;
  // console.log(url_token);
  let options = url.parse(url_token);
  options = Object.assign(options, {
    method: "POST",
  });
  let res_token = await https_request(options, null);

  res_token = JSON.parse(res_token.toString());
  // console.log(res_token);
  let access_token = res_token.access_token;
  if (!access_token) {
    throw new Error(res_token.error_description);
  }
  let url_user = sso_config.userInfoUrl + "?access_token=" + access_token;
  // console.log(url_user);
  let res_user = await https_get(url_user);
  res_user = JSON.parse(res_user.toString());
  // console.log(res_user);
  if (res_user.ERRORCODE != "0000") {
    throw new Error(res_user.ERRORMSG);
  }
  return res_user;
}

function https_request(options, post_data) {
  return new Promise((resolve, reject) => {
    let req = https.request(options, (res) => {
      let resData = [];
      res.on("data", (chunk) => {
        resData.push(chunk);
      });
      res.on("end", () => {
        const data = Buffer.concat(resData);
        resolve(data);
      });
    });
    req.on("error", (err) => {
      reject(err);
    });
    if (post_data) {
      req.write(post_data); // 写入post请求的请求主体。
    }
    req.end();
  });
}
function https_get(url) {
  return new Promise((resolve, reject) => {
    let req = https.get(url, (res) => {
      let resData = [];
      res.on("data", (chunk) => {
        resData.push(chunk);
      });
      res.on("end", () => {
        const data = Buffer.concat(resData);
        resolve(data);
      });
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.end();
  });
}
function caculate(pwd) {
  // console.log(pwd);
  let secret = sm3(pwd).toUpperCase();
  // console.log(secret);
  let res = secret
    .replace("A", "Q")
    .replace("B", "P")
    .replace("C", "S")
    .replace("D", "K")
    .replace("E", "Z")
    .replace("F", "N");
  return res;
}

module.exports.login_sso = login_sso;
module.exports.login_pc = login_pc;
module.exports.login_pda = login_pda;
