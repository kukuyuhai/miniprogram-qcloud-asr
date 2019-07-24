/**
 * ajax 服务路由集合
 */


const router = require('koa-router')({
    prefix: '/weapp'
})
const controllers = require('../controllers')

// 获取语音文件
router.post('/getVoiceMessage', controllers.voice)

// 语音识别
router.post('/recognize', controllers.recognize)

router.post('/voice', controllers.qcloud)


module.exports = router
