/**
 * ajax 服务路由集合
 */
var RPCClient = require('@alicloud/pop-core').RPCClient;
const fs = require("fs");
const path = require("path");
const shortid = require('shortid')

const request = require('request');
const util = require('../utils/util')
const router = require('koa-router')({
    prefix: '/weapp'
})

let token_id;

// 语音识别
router.post('/recognize', async (ctx) => {
    const { files}  = await util.resolveUploadFileFromRequest(ctx.req);
    const imageFile =  files.file[0];
    const srcPath = imageFile.path
    const newVoiceKey = `voice-${Date.now()}-${shortid.generate()}.wav`
    const newVoicePath = path.resolve(__dirname , `../tmp/ali-${newVoiceKey}`)
    await util.convertMp3ToWav(srcPath, newVoicePath)

    // 获取accessToken
    const data = await fs.readFileSync(path.resolve(__dirname + '/accesstoken.json'));
    console.log(data.toString());   // getToken();
    const Token = JSON.parse(data.toString());
    // 如果过期时间超过当前时间，表示现在已过期，重新获取token
    if (Token.ExpireTime > Math.round(new Date() / 1000)) {
        const token = await getToken();
        token_id = token.Id;
    } else {
        token_id = Token.Id;
    }
    // 调用阿里云一句话识别接口;
    var appkey = '您的appkey ';
    var token = token_id;
    var url = 'http://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/asr';
    var audioFile = newVoicePath;
    var format = 'pcm';
    var sampleRate = '16000';
    var enablePunctuationPrediction = true;
    var enableInverseTextNormalization = true;
    var enableVoiceDetection = false;
    /**
     * 设置RESTful 请求参数
     */
    var requestUrl = url;
    requestUrl = requestUrl + '?appkey=' + appkey;
    requestUrl = requestUrl + '&format=' + format;
    requestUrl = requestUrl + '&sample_rate=' + sampleRate;
    if (enablePunctuationPrediction) {
        requestUrl = requestUrl + '&enable_punctuation_prediction=' + 'true';
    }
    if (enableInverseTextNormalization) {
        requestUrl = requestUrl + '&enable_inverse_text_normalization=' + 'true';
    }
    if (enableVoiceDetection) {
        requestUrl = requestUrl + '&enable_voice_detection=' + 'true';
    }
    const text =   await  process(requestUrl, token, audioFile);
    // 数据返回
    ctx.body = {code:0,message:"recognized succeed!", data:text};
})


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

function process(requestUrl, token, audioFile) {
    return new Promise((resolve,reject)=>{
    /**
     * 读取音频文件
    */
    var audioContent = null;
    try {
        audioContent = fs.readFileSync(audioFile);
    } catch (error) {
        if (error.code == 'ENOENT') {
            console.log('The audio file is not exist!');
        }
        return;
    }
    /**
     * 设置HTTP    请求头部
    */
    var httpHeaders = {
        'X-NLS-Token': token,
        'Content-type': 'application/octet-stream',
        'Content-Length': audioContent.length
    };
    var options = {
        url: requestUrl,
        method: 'POST',
        headers: httpHeaders,
        body: audioContent
    };
    request(options, (error, response, body) => {
        if (error != null) {
            console.log(error);
            reject(error)
        }
        else {
            console.log('The audio file recognized result:');
            console.log(body);
            if (response.statusCode == 200) {
                body = JSON.parse(body);
                if (body.status == 20000000) {
                    console.log('result: ' + body.result);
                    resolve(body.result);
                    console.log('The audio file recognized succeed!');
                } else {
                    reject(body);
                    console.log('The audio file recognized failed!');
                }
            } else {
                reject(body);
                console.log('The audio file recognized failed, http code: ' + response.statusCode);
            }
        }
    });
})
}



module.exports = router
