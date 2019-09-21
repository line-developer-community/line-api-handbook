//モジュールを読み込み
const axios = require("axios");
const uuidv4 = require('uuid/v4');
const random = require('crypto');
const qs = require('qs');
const jsonwebtoken = require('jsonwebtoken');
//環境変数を取得
const channelId = process.env.channelId;
const channelSecret = process.env.channelSecret;
const redirectUri = process.env.redirectUri;
const frontUri = process.env.frontUri;

//Lambda関数が呼び出された時に呼び出される関数
exports.handler = async (event, context, callback) => {
    //パスを取得
    const path = event.path;
    //レスポンスを定義
    let res;
    //パスによって条件分岐
    switch (path) {
        case '/authorize':
            //authorizeFuncを呼び出し
            res = authorizeFunc();
            break;
        case '/callback':
            //callbackFuncを呼び出し
            res = await callbackFunc(event);
            break;
    }

    //レスポンスを返す
    callback(null, res);
};

const authorizeFunc = () => {
    //レスポンスのインスタンスを生成
    const response = new Response();
    //CSRF防止用の文字列を生成
    const state = random.randomBytes(16).toString('hex');
    //リプレイアタックを防止するための文字列を生成
    const nonce = uuidv4();

    //認可リクエストを送信するためのレスポンスを生成
    response.statusCode = 302;
    response.headers.Location = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=openid%20email%20profile&nonce=${nonce}`;
    response.multiValueHeaders = { "Set-Cookie": [`state=${state};HttpOnly`, `nonce=${nonce};HttpOnly`] };
    response.body = JSON.stringify({ "status": "succeed" });

    return response;
};

const callbackFunc = async (event) => {
    //レスポンスのインスタンスを生成
    const response = new Response();
    //パラメータを取得
    const params = event.queryStringParameters;

    //パラメータに"error"という項目が含まれていた場合
    if (params.error) {
        //エラーを出力
        console.log(`error: ${params.error}`);
        //エラーページにリダイレクトさせるレスポンスを生成
        response.statusCode = 302;
        response.headers.Location = `${frontUri}/error/error.html`;
        response.body = JSON.stringify({ status: "error" });
        return response;
    }

    //パラメータから認可コードを取得
    const code = params.code;
    //パラメータからstate（認可リクエスト時に送信したCSRF防止用の文字列）を取得
    const callbackState = params.state;
    //リクエストヘッダからCookieを取得
    const cookie = event.headers.cookie.split("; ");
    //Cookieからstateを取得
    const cookieState = cookie[0].slice(6);
    //リクエストパラメータから取得したstateとCookieから取得したstateが同じものか確認する
    //違うものだった場合はCSRF攻撃を受けている可能性があるため、エラーページへリダイレクトして再ログインを要求する
    if (callbackState !== cookieState) {
        //stateを出力
        console.log(`callbackState: ${callbackState}, cookieState: ${cookieState}`);
        response.statusCode = 302;
        response.headers.Location = `${frontUri}/error/error.html`;
        response.body = JSON.stringify({ status: "error" });
        return response;
    }
    //レスポンスボディを定義
    let resBody;
    let email;

    try {
        //アクセストークン発行のapiを叩く
        const res = await axios.post("https://api.line.me/oauth2/v2.1/token", qs.stringify({
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": `${redirectUri}`,
            "client_id": channelId,
            "client_secret": channelSecret
        }));
        resBody = res.data;
        //IDトークンをデコードする
        const idToken = jsonwebtoken.verify(resBody.id_token, channelSecret);
        //メールアドレスを取得
        email = idToken.email;
        //IDトークンに含まれているnonceとCookieから取得したnonceが同じものか確認する
        //違う場合はリプレイアタックを受けている可能性があるため、エラーページへリダイレクトして再ログインを要求する
        if (idToken.nonce !== cookie[1].slice(6)) {
            console.log(`idToken.nonce: ${idToken.nonce}, cookie.nonce: ${cookie.nonce}`);
            response.statusCode = 302;
            response.headers.Location = `${frontUri}/error/error.html`;
            response.body = JSON.stringify({ status: "error" });
            return response;
        }
    }
    //リクエストでエラーが発生した場合
    catch (error) {
        //エラーを出力後、エラーページへリダイレクト
        console.log(`requestError: ${error.response}`);
        response.statusCode = 302;
        response.headers.Location = `${frontUri}/error/error.html`;
        response.body = JSON.stringify({ status: "error" });
        return response;
    }

    //レスポンスボディからアクセストークンを取り出す
    const accessToken = resBody.access_token;

    //アクセストークンを使ってプロフィール取得のapiを叩く
    try {
        const res = await axios.post("https://api.line.me/v2/profile", {}, { "headers": { "Authorization": `Bearer ${accessToken}` } });
        resBody = res.data;
    }
    //エラーの場合
    catch (error) {
        //エラーを出力
        console.log(error.response);
    }
    //プロフィール表示ページへリダイレクトさせるためのレスポンスを生成
    response.statusCode = 302;
    response.headers.Location = `${frontUri}/profile/profile.html?userId=${resBody.userId}&displayName=${encodeURIComponent(resBody.displayName)}&pictureUrl=${resBody.pictureUrl}&statusMessage=${encodeURIComponent(resBody.statusMessage)}&email=${email}`;
    //Cookieに保存していたstateとnonceはもういらないので削除する
    response.multiValueHeaders = { "Set-Cookie": [`state=;HttpOnly`, `nonce=;HttpOnly`] };
    response.body = JSON.stringify({ status: "succeed" });
    return response;
};

//レスポンスのクラスを生成
class Response {
    constructor() {
        this.statusCode = "";
        this.headers = {};
        this.multiValueHeaders = {};
        this.body = {};
    }
}
