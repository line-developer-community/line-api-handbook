<template>
  <v-app id="inspire">
    <v-container>
      <v-layout
        text-xs-center
        wrap
      >
        <v-flex mb-4>
          <h1 class="display-2 font-weight-bold mb-3">
            認証画面
          </h1>
        </v-flex>

        <v-flex xs12>
          <v-form>
            <v-container>
              <v-layout row wrap>
                <v-text-field
                  v-model="code"
                  @keyup.enter="say"
                  @keypress="setCanSubmit"
                  outline
                  label="認証コードを入力してください"
                ></v-text-field>
              </v-layout>
            </v-container>
          </v-form>  
        </v-flex>

        <v-flex xs12>
          {{this.bleStatus}}
        </v-flex>
      </v-layout>
    </v-container>
  </v-app>
</template>

<script>
  export default {
    data () {
      return {
        USER_SERVICE_UUID: '＜あなたのサービスUUID＞',
        LED_CHARACTERISTIC_UUID: 'E9062E71-9E62-4BC6-B0D3-35CDCD9B027B', /* トライアルは固定値 */
        bleConnect: false,
        canSubmit: false,
        bleStatus: '',
        state: false,
        characteristic: '',
        code: '',
        user: {
          image: '',
          userId: ''
        }        
      }
    },
    methods: {
      setCanSubmit () {
        this.canSubmit = true
      },
      say () {
        this.sendData()
      },
      sendData () {
        this.bleStatus = `送信:${this.code}`

        let ch_array = this.code.split("");
        for(let i = 0; i < 16; i = i + 1){
          ch_array[i] = (new TextEncoder('ascii')).encode(ch_array[i]);
        }

        this.characteristic.writeValue(new Uint8Array(ch_array)
        ).catch(error => {
          this.bleStatus = error.message
        })
      },
      // BLEが接続できる状態になるまでリトライ
      liffCheckAvailablityAndDo: async function (callbackIfAvailable) {
        try {
          const isAvailable = await liff.bluetooth.getAvailability();
          if (isAvailable) {
            callbackIfAvailable()
          } else {
            // リトライ
            this.bleStatus = `Bluetoothをオンにしてください。`
            setTimeout(() => this.liffCheckAvailablityAndDo(callbackIfAvailable), 10000)
          }
        } catch (error) {
          alert('Bluetoothをオンにしてください。')
        }
      },
      // サービスとキャラクタリスティックにアクセス
      liffRequestDevice: async function () {
        const device = await liff.bluetooth.requestDevice()
        await device.gatt.connect()
        const service = await device.gatt.getPrimaryService(this.USER_SERVICE_UUID)
        service.getCharacteristic(this.LED_CHARACTERISTIC_UUID).then(characteristic => {
          this.characteristic = characteristic
          this.bleConnect = true
          this.bleStatus = `デバイスに接続しました！`
        }).catch(error => {
          this.bleConnect = true
          this.bleStatus = `デバイス接続に失敗=${error.message}`
        })
      },
      initializeLiff: async function(){
        await liff.initPlugins(['bluetooth']);
        this.liffCheckAvailablityAndDo(() => this.liffRequestDevice())

        // プロフゲット
        const profile = await liff.getProfile()
        this.user.image = profile.pictureUrl
        this.user.userId = profile.userId
      }
    },
    mounted: function () {
      liff.init(
          () => this.initializeLiff()
      )
    }
  }
</script>