
const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')
const serve = require('koa-static');
const path = require("path")
const router = require('./routes')

app.use(bodyParser());


app
    .use(router.routes())
    .use(router.allowedMethods());

/**静态资源（服务端） */
app.use(serve(
    path.join(__dirname, './static')
))






app.listen(3000, () => console.log('Example app listening on port 3000!'))