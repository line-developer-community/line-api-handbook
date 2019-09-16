const app = new Vue({
    el: '#app',
    template: '#drink_bar',
    delimiters: ['[[', ']]'], // Flaskのdelimiterとの重複を回避
    data: {
        line_user_id: 'dummy-user',
        liff_initialized: false,
        api_loading: false,
        api_result: null,
        items: null,
        order_items: [],
        order: {
            id: null,
            title: null,
            amount: null,
            ordered_item_image_url: null,
            slot: 0
        },
        transaction_id: null,
        flow_status: 'INITIAL',
        line_profile: null,
        line_things: {
            USER_SERVICE_UUID: '88c551fc-4151-4680-a5dd-dee101e10fe3',
            WRITE_CHARACTERISTIC_UUID: 'E9062E71-9E62-4BC6-B0D3-35CDCD9B027B',
            NOTIFY_CHARACTERISTIC_UUID: '62FBD229-6EDD-4D1A-B554-5C4E1BB29169',
            PSDI_SERVICE_UUID: 'e625601e-9e55-4597-a598-76018a0d293d',
            PSDI_CHARACTERISTIC_UUID: '26E2B12B-85F0-4F3F-9FDD-91D114270E6E',
            ble_available: false,     // Bluetoothプラグインが利用できるかどうか
            is_connected_to_device: false,      // BLE デバイスと接続したかどうか
            device_order_done: false,         // BLE デバイスへの処理命令が完了したか
            connected_device: null,
        },
        ledCharacteristic: null,
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
                console.log('Payment transaction Done!!')
                // 決済完了していれば、決済された注文情報を取得
                this.getOrderByTransactionId(this.transaction_id)
                // DrinkDispenser デバイスに接続する
                this.flow_status = 'PAID'
                this.api_loading = false
                await this.initializeLineThingsApp()
            } else {
                console.log('No payment transaction. Show item list.')
                await this.getItems();
            }
        },
        getItems: async function() {
            console.log('function getItems called!')
            this.api_loading = true
            const api_url = '/api/items'
            // 商品情報取得API 実行
            const response = await axios.get(api_url).catch(error => {
                console.error('API getItems failed...')
                console.error(error)
                this.api_result = null
                this.api_loading = false
            })
            console.log('API response: ', response)
            // API 実行結果をVue.js の表示用変数へ
            this.api_result = response.data
            this.items = this.api_result.items
            this.api_loading = false
        },
        orderItem: async function(item_id) {
            console.log('function orderItem called!')
            // 注文登録
            this.api_loading = true
            let order_item_ids = [item_id]
            // Order!
            const params = {
                user_id: this.line_user_id,
                order_items: order_item_ids
            }
            const url = '/api/purchase_order'
            // 注文情報登録API 実行
            const response = await axios.post(url, params).catch(function (err) {
                this.api_loading = false
                console.error('API POST PurchaseOrder failed', err)
                this.flow_status = 'INITIAL'
                throw err
            })
            console.log('Response: ', response)
            // API 実行結果をVue.js の表示用変数へ
            this.api_result = response.data
            this.order.id = this.api_result.order_id
            this.order.title = this.api_result.order_title
            this.order.amount = this.api_result.order_amount
            this.order.slot = this.api_result.order_item_slot
            this.order.ordered_item_image_url = this.api_result.ordered_item_image_url
            this.flow_status = 'ORDERED'
            this.api_loading = false
        },
        payReserve: async function() {
            console.log('function pay_reserve called!')
            // 決済予約
            this.api_loading = true
            const params = {
                user_id: this.line_user_id,
                order_id: this.order.id
            }
            const url = '/pay/reserve'
            // 決済予約API の実行
            console.log('Payment URL:', url)
            const response = await axios.post(url, params).catch(function (err) {
                this.api_loading = false
                console.error('API POST PayReserve failed', err)
                this.flow_status = 'INITIAL'
                throw err
            })
            console.log('Response: ', response)
            this.api_result = response.data
            const payment_url = this.api_result.payment_url
            this.flow_status = 'PAYING'
            // LINE Pay の決済画面へ移動
            window.location.href = payment_url
            this.api_loading = false
        },
        getOrderByTransactionId: async function(tx_id) {
            console.log('function getOrderByTransactionId called!')
            // Item 取得
            this.api_loading = true
            const api_url = `/api/transaction_order/${this.line_user_id}/${tx_id}`
            const response = await axios.get(api_url).catch(error => {
                console.error('API getOrderByTransactionId failed...')
                console.error(error)
                this.api_result = null
                this.api_loading = false
            })
            console.log('API response: ', response)
            const order_result = response.data.order
            this.order.id = order_result.id
            this.order.title = order_result.title
            this.order.amount = order_result.amount
            this.order.slot = order_result.item_slot
            this.order.ordered_item_image_url = order_result.item_image_url
            this.api_loading = false
        },
        closeLiffWindow: function() {
            console.log("Closing LIFF page")
            if (this.liff_initialized === true) {
                const draw_prize_liff_url = `line://app/1597172191-m5AOnlLv?transaction_id=${this.transaction_id}`
                console.log(draw_prize_liff_url)
                const flex_message = {
                    "type": "bubble",
                    "hero": {
                        "type": "image",
                        "url": "https://my-qiita-images.s3-ap-northeast-1.amazonaws.com/line_things_drink_bar/fukubiki_ki.png",
                        "size": "full",
                        "aspectRatio": "1:1.1",
                        "aspectMode": "cover"
                    },
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [
                            {
                                "type": "text",
                                "text": "抽選してみよう！",
                                "weight": "bold",
                                "size": "xl"
                            }
                        ]
                    },
                    "footer": {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [
                            {
                                "type": "button",
                                "style": "primary",
                                "height": "sm",
                                "action": {
                                    "type": "uri",
                                    "label": "抽選する",
                                    "uri": draw_prize_liff_url
                                }
                            },
                            {
                                "type": "spacer",
                                "size": "sm"
                            }
                        ],
                        "flex": 0
                    }
                }
                liff.sendMessages([
                    {
                        "type": 'flex',
                        "altText": "抽選してみよう！",
                        "contents": flex_message
                    }
                ]).then(() => {
                    console.log('message sent');
                    setTimeout(() => (liff.closeWindow()), 500)
                }).catch((err) => {
                    console.log('Message send error: ', err);
                });
            }
        },
        /*
        * ---------------------------------
        * LINE Things methods
        * ---------------------------------
        */
        initializeLineThingsApp: async function() {
            console.log('function initializeLineThingsApp called!')
            console.log('LIFF[bluetooth] initialized!')
            liff.initPlugins(['bluetooth']).then(() => {
                this.liffCheckAvailablityAndDo(() => this.liffRequestDevice());
            }).catch(error => {
                // uiStatusError(makeErrorMsg(error), false);
                console.error(error)
            });
        },
        liffCheckAvailablityAndDo(callbackIfAvailable) {
            console.log('f_unction liffCheckAvailablityAndDo called!')
            // Check Bluetooth availability
            liff.bluetooth.getAvailability().then(isAvailable => {
                if (isAvailable) {
                    // uiToggleDeviceConnected(false);
                    this.line_things.ble_available = true
                    callbackIfAvailable();
                } else {
                    console.warn("Bluetooth not available");
                    setTimeout(() => this.liffCheckAvailablityAndDo(callbackIfAvailable), 10000);
                }
            }).catch(error => {
                console.error(error)
                throw error;
            });
        },
        liffRequestDevice() {
            console.log('function liffRequestDevice called!')
            liff.bluetooth.requestDevice().then(device => {
                this.liffConnectToDevice(device);
            }).catch(error => {
                console.error(error)
                throw error;
            });
        },
        liffConnectToDevice(device) {
            console.log('function liffConnectToDevice called!')
            device.gatt.connect().then(() => {
                this.line_things.connected_device = device

                // Show status connected
                // uiToggleDeviceConnected(true);
                this.line_things.is_connected_to_device = true

                // Get service
                device.gatt.getPrimaryService(this.line_things.USER_SERVICE_UUID).then(service => {
                    this.liffGetUserService(service);
                }).catch(error => {
                    console.error(error)
                    throw error;
                });
                device.gatt.getPrimaryService(this.line_things.PSDI_SERVICE_UUID).then(service => {
                    this.liffGetPSDIService(service);
                }).catch(error => {
                    console.error(error)
                    throw error;
                });

                // Device disconnect callback
                const disconnectCallback = () => {
                    // disconnected
                    this.line_things.connected_device = null;
                    this.line_things.is_connected_to_device = false;
                    // Remove disconnect callback
                    device.removeEventListener('gattserverdisconnected', disconnectCallback);
                    // Try to reconnect
                    this.initializeLineThingsApp();
                };
                device.addEventListener('gattserverdisconnected', disconnectCallback);
            }).catch(error => {
                console.error(error)
                throw error;
            });
        },
        liffGetUserService(service) {
            console.log('function liffGetUserService called!')
            // Button pressed state
            service.getCharacteristic(this.line_things.NOTIFY_CHARACTERISTIC_UUID).then(characteristic => {
                this.liffGetButtonStateCharacteristic(characteristic);
            }).catch(error => {
                console.error(error)
                throw error;
            });
            // Toggle LED
            service.getCharacteristic(this.line_things.WRITE_CHARACTERISTIC_UUID).then(characteristic => {
                this.ledCharacteristic = characteristic;
                // Switch off by default
                this.liffToggleDeviceLedState(false);
            }).catch(error => {
                console.error(error)
                throw error;
            });
        },
        liffGetPSDIService(service) {
            console.log('function liffGetPSDIService called!')
            // Get PSDI value
            service.getCharacteristic(this.line_things.PSDI_CHARACTERISTIC_UUID).then(characteristic => {
                return characteristic.readValue();
            }).then(value => {
                // Byte array to hex string
                this.line_things.psdi = new Uint8Array(value.buffer)
                    .reduce((output, byte) => output + ("0" + byte.toString(16)).slice(-2), "");
            }).catch(error => {
                console.error(error)
                throw error;
            });
        },
        liffGetButtonStateCharacteristic(characteristic) {
            console.log('function liffGetButtonStateCharacteristic called!')
            // Add notification hook for button state
            // (Get notified when button state changes)
            characteristic.startNotifications().then(() => {
                characteristic.addEventListener('characteristicvaluechanged', e => {
                    const val = (new Uint8Array(e.target.value.buffer))[0];
                    console.log('Characteristic Value changed:', val)
                });
            }).catch(error => {
                console.error(error)
                throw error;
            });
        },
        liffToggleDeviceLedState(state) {
            console.log('function liffToggleDeviceLedState called!')
            // on: 0x01
            // off: 0x00
            const command = new Uint8Array([this.order.slot])
            this.ledCharacteristic.writeValue(command).then(() => {
                // disconnect device
                console.log('Done write command to device')
                setTimeout(() => (this.line_things.device_order_done = true), 3000)
                // this.closeLiffWindow()
            }).catch(error => {
                console.error(error)
                throw error;
            });
        }
    },
    computed: {

    },
    mounted: function() {
        this.api_loading = true
        liff.init(
            () => this.initializedLiff(),
            error => {
                console.error(error)
                this.api_loading = false
            }
        )
    }
});