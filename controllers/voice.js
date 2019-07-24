
var rp = require('request-promise');
var host = "http://192.168.1.166:8099/MobileDisplay/AnswerQuestions.aspx?";
var cheerio = require('cheerio');
var qs = require("qs");

module.exports = async ctx => {
    const { method, body } = ctx.request;
    const { QuestionId } = body.options;
    console.log(qs.stringify(body.options))
    const options = {
        uri: host + qs.stringify(body.options),
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    try {
        const $ = await rp(options);
        // 解析浏览器携带参数
        // console.log($.html())
        const type = $(`#qtype_${QuestionId}`).attr('value');
        if (type === "SR") {
            // 题型为单选题

            // 获取进度条
            const bar_atyle = $("div[class='bar']").attr("style");
            const progress = bar_atyle.split(":")[1].trim().split("%")[0];
            console.log(progress)
            // 获取标题信息
            const Title = $("h3[class='question-desc']").text();
            console.log(Title)

            // 获取所有选项信息
            let op_arr = [];
            const arr = $("li").toArray();
            for (var i = 0; i < arr.length; i++) {
                console.log(i)
                const id = `${QuestionId}_chk_${i + 1}`;
                // let label_val = .find(`label[for=${id}]`).text()
                const option = {
                    "No": i + 1,
                    "Id": id,
                    "Name": $(`#${id}`).attr("name"),
                    "Text": $(`label[for=${id}]`).text(),
                    "Mark": slectMark(i),
                    "Value": $(`#${id}`).attr("value")
                }
                op_arr.push(option);
            }


            TextToSpeech(op_arr);
        }

        ctx.body = {
            code: 200,
            message: "GET VOICE SUCCESS",
            data: []
        }

    } catch (err) {

    }
}



function TextToSpeech(text) {
    console.log(text)
    let textArr = [];
    text.map(item => {
        textArr.push(item.Mark + (item.Text).trim());
    })
    let joinText =  textArr.join("");
    console.log(joinText)
}

function slectMark(i) {
    var Mark = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    return Mark[i]
}
