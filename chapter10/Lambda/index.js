const Util = require('./util.js');

exports.handler = async (event) => {
    const response = {
        statusCode: 200,
        body: {"result":"completed!"},
    };

    const body = JSON.parse(event.body);
    const thingsData = body.events[0].things.result;

    if (thingsData.bleNotificationPayload) {
        // LINE Thingsから飛んでくるデータを取得
        const blePayload = thingsData.bleNotificationPayload;
        var buffer1 = Buffer.from(blePayload, 'base64');
        var m5Data = buffer1.toString('ascii');  //Base64をデコード

        const sendMessage = `認証コードは「${m5Data}」です。`;

        // Amazon Connect送信
        await Util.callMessageAction(sendMessage);

    }
    return response;
};