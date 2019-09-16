// const api_url_prefix = 'localhost:5000/api'
const app = new Vue({
    el: '#app',
    template: '#drink_bar',
    delimiters: ['[[', ']]'], // Flaskのdelimiterとの重複を回避
    data: {
        line_user_id: 'dummy-user',
        line_profile: null,
        liff_initialized: false,
        api_loading: false,
        api_result: null,
        transaction_id: null,
        draw_a_prize_result: false,
        liff_version: null,
        app_version: '0.1'
    },
    methods: {
        initVConsole: async function() {
            window.vConsole = new window.VConsole({
                defaultPlugins: ['system', 'network', 'element', 'storage'],
                maxLogNumber: 1000,
                onReady: function () {
                    console.log('vConsole is ready.')
                    console.log('transaction_id: ', this.transaction_id)
                },
                onClearLog: function () {
                    console.log('on clearLog')
                }
            })
        },
        initializedLiff: async function() {
            console.log('function initializedLiff called!')
            this.liff_initialized = true
            this.initVConsole()
            this.liff_version = liff._revision
            // ユーザーのプロフィールを取得し、結果からUserID を取得する
            this.line_profile = await liff.getProfile()
            this.line_user_id = this.line_profile.userId
            // 決済完了しているかどうかを確認する
            this.transaction_id = transaction_id
            console.log('transaction_id: ', transaction_id)
            console.log('this.transaction_id: ', this.transaction_id)
            if (this.transaction_id) {
                // トランザクションIDがあれば抽選を行う
                await this.drawPrize(this.transaction_id)
            } else {
                // トランザクションIDがなければ抽選せずに終了
                console.log('No payment transaction. Finalize draw prize process...')
            }
            this.api_loading = false
        },
        drawPrize: async function(tx_id) {
            console.log(`draw_a_prize called! transaction_id: ${tx_id}`)
            // API実行
            const api_url = `/api/draw_a_prize/${tx_id}`
            const response = await axios.get(api_url).catch(error => {
                console.error('API drawPrize failed...')
                console.error(error)
                this.api_result = null
                this.api_loading = false
            })
            console.log('API response: ', response)
            this.draw_a_prize_result = response.data.draw_a_prize_result
        },
        closeLiffWindow: function() {
            console.log("Closing LIFF page")
            if (this.liff_initialized === true) {
                let message = '残念でした。また挑戦してね！'
                let message_image_url = 'https://my-qiita-images.s3-ap-northeast-1.amazonaws.com/line_things_drink_bar/fukubiki_hazure.png'
                let aspect_ratio = "1:1"
                if (this.draw_a_prize_result === true) {
                    message = '当選おめでとうございます！'
                    message_image_url = 'https://my-qiita-images.s3-ap-northeast-1.amazonaws.com/line_things_drink_bar/fukubiki_atari.png'
                    aspect_ratio = "1:1"
                }
                liff.sendMessages([
                    {
                        "type": 'flex',
                        "altText": message,
                        "contents": {
                            "type": "bubble",
                            "hero": {
                                "type": "image",
                                "url": message_image_url,
                                "size": "full",
                                "aspectRatio": aspect_ratio,
                                "aspectMode": "cover"
                            },
                            "body": {
                                "type": "box",
                                "layout": "vertical",
                                "contents": [
                                    {
                                        "type": "text",
                                        "align": "center",
                                        "wrap": true,
                                        "text": message,
                                        "weight": "bold",
                                        "size": "xl"
                                    }
                                ]
                            }
                        }
                    }
                ]).then(() => {
                    console.log('message sent');
                    setTimeout(() => (liff.closeWindow()), 500)
                }).catch((err) => {
                    console.log('Message send error: ', err);
                });
            }
        },
    },
    computed: {

    },
    mounted: function() {
        this.api_loading = true
        // LIFF 初期化
        liff.init(
            () => this.initializedLiff(),
            error => {
                console.error(error)
                this.api_loading = false
            }
        )
    }
});