const multiparty = require('multiparty')
const ffmpeg = require('fluent-ffmpeg')
const path = require("path")

const resolveUploadFileFromRequest = (request) => {
    const maxSize = 10

    // 初始化 multiparty
    const form = new multiparty.Form({
        encoding: 'utf8',
        maxFilesSize: maxSize * 1024 * 1024,
        autoFiles: true,
        uploadDir: path.resolve(__dirname , '../tmp')
    })

    return new Promise((resolve, reject) => {
        // 从 req 读取文件
        form.parse(request, (err, fields = {}, files = {}) => {
            err ? reject(err) : resolve({ fields, files })
        })
    })
}

/**
 * mp3 转 wav
 * @param {string} srcPath 源文件地址
 * @param {string} newPath 新文件地址
 */
function convertMp3ToWav(srcPath, newPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(srcPath)
            .format('wav')
            .on('error', reject)
            .on('end', function () {
                resolve(newPath)
            })
            .save(newPath)
    })
}



module.exports =  {
    resolveUploadFileFromRequest,
    convertMp3ToWav
}