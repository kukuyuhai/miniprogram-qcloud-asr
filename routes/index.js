/**
 * ajax 服务路由集合
 */
var RPCClient = require('@alicloud/pop-core').RPCClient;
const fs = require("fs");
const path = require("path");
const shortid = require('shortid')

const router = require('koa-router')({
    prefix: '/weapp'
})
const controllers = require('../controllers')

// 获取语音文件
router.get('/getVoiceMessage', controllers.voice)

// 语音识别
router.post('/recognize', controllers.recognize)

router.post('/voice', controllers.qcloud)


module.exports = router
