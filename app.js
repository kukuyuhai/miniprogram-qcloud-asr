const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')

const readChunk = require('read-chunk')
const fileType = require('file-type')
const shortid = require('shortid')
const fs = require('fs')
const path = require("path")
var request = require('request');
var config = require('./config')
const CryptoJS = require('crypto-js');
const resolveUploadFileFromRequest = require('./utils/util')

app.use(bodyParser());

const router = require('./routes')

app
    .use(router.routes())
    .use(router.allowedMethods());

router.post('/voice', async ctx => {
    const { files, fields } = await resolveUploadFileFromRequest(ctx.req)
    const imageFile = files.file[0];
    // console.log(imageFile);
    // 只能上传 mp3 文件
    const buffer = readChunk.sync(imageFile.path, 0, 262)
    let resultType = fileType(buffer)

    // 如果无法获取文件的 MIME TYPE 就取 headers 里面的 content-type
    if (resultType === null && imageFile.headers && imageFile.headers['content-type']) {
        const tmpPathArr = imageFile.path ? imageFile.path.split('.') : []
        const extName = tmpPathArr.length > 0 ? tmpPathArr[tmpPathArr.length - 1] : ''
        resultType = {
            mime: imageFile.headers['content-type'],
            ext: extName
        }
    }

    if (!resultType || !['audio/mpeg', 'audio/mp3'].includes(resultType.mime)) {
        throw new Error('上传的文件格式不是 mp3')
    }

    const srcPath = imageFile.path
    /**
     * 语音识别只支持如下编码格式的音频：
     * pcm、adpcm、feature、speex、amr、silk、wav
     * 所以必须把 mp3 格式的上传文件转换为 wav
     * 这里使用 ffmpeg 对音频进行转换
     */
    const newVoiceKey = `voice-${Date.now()}-${shortid.generate()}.wav`
    const newVoicePath = path.resolve(__dirname + `/tmp/${newVoiceKey}`)
    // const voiceId = genRandomString(16)
    const voiceId = fields.voice_id[0];
    await convertMp3ToWav(srcPath, newVoicePath)
    const projectid = 0;
    const nonce = randomNum(10000, 999999999);
    const appid = config.appid;	//是	Int	用户在腾讯云注册账号的 AppId，可以进入 API 密钥管理页面 获取。
    const secretid = config.secretid	//是	String	用户在腾讯云注册账号 AppId 对应的 SecretId，可以进入 API 密钥管理页面 获取。
    const sub_service_type = 1;//	否	Int	子服务类型。1：实时流式识别。
    const engine_model_type = config.engine_model_type//	否	String	引擎类型引擎模型类型。8k_0:8k 通用，16k_0:16k 通用，16k_en:16k英文。
    const result_text_format = config.result_text_format	//否	Int	识别结果文本编码方式。0：UTF-8；1：GB2312；2：GBK；3：BIG5
    const res_type = config.res_type//否	Int	结果返回方式。 0：同步返回；1：尾包返回。
    const voice_format = config.voice_format	//否	Int	语音编码方式，可选，默认值为 4。1：wav(pcm)；4：speex(sp)；6：silk；8：mp3(仅16k_0模型支持)。
    const needvad = config.needvad;//	否	Int	0：不需要 vad，1：需要 vad。
    // 如果//一段音频包含了很多句话，就可以对语音进行分段。这种对语音进行分段的技术叫 VAD（Voice Activity Detection）。
    const source = 0;	//是	Int	设置为 0。
    const timestamp = Math.round(new Date() / 1000);//是	Int	当前 UNIX 时间戳，可记录发起 API 请求的时间。如果与当前时间相差过大，会引起签名过期错误。可以取值为当前请求的系统时间戳即可。
    const expired = Math.round(new Date() / 1000) + 24 * 60 * 60;//是	Int	签名的有效期，是一个符合 UNIX Epoch 时间戳规范的数值，单位为秒；Expired 必须大于 Timestamp 且 Expired - Timestamp 小于90天。
    const timeout = 2000	//是	Int	设置超时时间，单位为毫秒。
    const secretKey = config.secretKey;

    const chunk = fs.readFileSync(newVoicePath)


    // const taskList = []
    // let leftBufferSize = 0
    let seq = parseInt(fields.seq[0])
    let end = parseInt(fields.isLastFrame[0])
    console.log("seq" + seq, "end" + end);

    // while (leftBufferSize < voiceBuffer.length) {
    //     const newBufferSize = leftBufferSize + 9 * 1024
    //     const chunk = voiceBuffer.slice(leftBufferSize, newBufferSize > voiceBuffer.length ? voiceBuffer.length : newBufferSize)

    //     if (newBufferSize > voiceBuffer.length) {
    //         end = 1;
    //     }

    const server_url = `http://asr.cloud.tencent.com/asr/v1/${appid}?projectid=${projectid}&sub_service_type=${sub_service_type}&engine_model_type=16k_0&result_text_format=${result_text_format}&res_type=${res_type}&voice_format=${voice_format}&secretid=${secretid}&timestamp=${timestamp}&expired=${expired}&needvad=${needvad}&nonce=${nonce}&seq=${seq}&end=${end}&source=${source}&voice_id=${voiceId}&timeout=${timeout}`

    const signParam = `${appid}?end=${end}&engine_model_type=16k_0&expired=${expired}&needvad=${needvad}&nonce=${nonce}&projectid=${projectid}&res_type=${res_type}&result_text_format=${result_text_format}&secretid=${secretid}&seq=${seq}&source=0&sub_service_type=${sub_service_type}&timeout=${timeout}&timestamp=${timestamp}&voice_format=${voice_format}&voice_id=${voiceId}`
    // 创建签名
    const autho = createSign(signParam, "POST", "asr.cloud.tencent.com", "/asr/v1/", secretKey);

    const headers = {
        Host: 'asr.cloud.tencent.com',
        Authorization: autho,
        'Content-Type': 'application/octet-stream',
        'Content-Length': chunk.Length
    }

    // taskList.push(
    // )

    //     leftBufferSize = newBufferSize
    //     seq++
    // }

    try {
        // const data = await Promise.all(taskList)
        const result = await recognize(server_url, chunk, headers)
        // // console.log(result);
        ctx.body = { code: 0, message: "success", data: result };

    } catch (e) {
        console.log(e)
        throw e
    }
})




function recognize(server_url, chunk, headers) {
    return new Promise((resolve, reject) => {
        // 签名密钥
        let options = {
            url: server_url,
            headers: headers,
            body: chunk
        }

        request.post(options, function (err, response, body) {
            console.log(body)
            if (err) {
                reject(err);
                return;
            }
            if (response.statusCode == 200) {
                const json = JSON.parse(body);
                resolve({ data: json });
            }
        });
    })
}


function createSign(params, method, host, prefix, secretKey) {
    const str = method + host + prefix + params;
    const sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(str, secretKey));
    return sign;
}


//生成从minNum到maxNum的随机数
function randomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return (parseInt(Math.random() * minNum + 1, 10));
            break;
        case 2:
            return (parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10));
            break;
        default:
            return "0";
            break;
    }
}



function genRandomString(len) {
    let text = ''
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for (let i = 0; i < len; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return text
}




app.listen(3000, () => console.log('Example app listening on port 3000!'))