var RPCClient = require('@alicloud/pop-core').RPCClient;
const fs = require("fs");
const path = require("path");

const getAccessToken = async function () {
    // 获取accessToken
    let token_id;
    const data = await fs.readFileSync(path.resolve(__dirname, './accesstoken.json'));
    const Token = JSON.parse(data.toString());
    // 如果过期时间超过当前时间，表示现在已过期，重新获取token
    if (Token.ExpireTime > Math.round(new Date() / 1000)) {
        const token = await getToken();
        token_id = token.Id;
    } else {
        token_id = Token.Id;
    }

    return token_id
}

function getToken() {
    return new Promise((resolve, reject) => {
        var client = new RPCClient({
            accessKeyId: '您的accessKeyId',
            accessKeySecret: '您的accessKeySecret',
            endpoint: 'http://nls-meta.cn-shanghai.aliyuncs.com',
            apiVersion: '2019-02-28'
        });
        // => returns Promise
        // => request(Action, params, options)
        try {
            client.request('CreateToken').then((result) => {
                console.log(result.Token);
                fs.writeFileSync(path.resolve(__dirname + '/accesstoken.json'), JSON.stringify(result.Token), { encoding: "utf-8" });
                resolve(result.Token);
            });
        } catch (err) {
            reject(err);
        }

    })
}
module.exports = {
    getAccessToken
}
