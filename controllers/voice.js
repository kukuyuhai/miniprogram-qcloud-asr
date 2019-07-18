
var rp = require('request-promise');
var host = "http://localhost:3000";

module.exports = async ctx => {
    const { method , query} = ctx.request;
    console.log(method)
    if(method == "GET"){
       ctx.body = {
        code:200,
        message:"GET VOICE SUCCESS",
        data:{
            path: host + '/nls-sample-16k.wav'
        }
       }
    }
}