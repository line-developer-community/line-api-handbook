from .models import *
from . import json_util
import requests

import logging

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

LINE_PAY_BOT_LOGO_URL = 'https://my-qiita-images.s3-ap-northeast-1.amazonaws.com/line_things_drink_bar/logo.png'


class LinePay:
    """See https://pay.line.me/file/guidebook/technicallinking/LINE_Pay_Integration_Guide_for_Merchant-v1.1.2-JP.pdf"""

    def __init__(
            self,
            channel_id,
            channel_secret,
            line_pay_url,
            confirm_url,
            confirm_url_type='CLIENT',
            check_confirm_url_browser=False,
            cancel_url=None,
            proxy_url=None
    ):
        """
        コンストラクタ
        :param channel_id: Channel ID
        :type channel_id: str
        :param channel_secret: Channel Secret Key
        :type channel_secret: str
        :param line_pay_url: LINE Pay URL
        :type line_pay_url: str
        :param confirm_url: LINE Pay で決済承認（決済方法選択、パスワード認証）後に遷移する加盟店 URL
        :type confirm_url: str
        :param confirm_url_type: LINE Pay で支払い手段を選択し、パスワードを確認後に移動する URL のタイプ
        :type confirm_url_type: str
        :param check_confirm_url_browser: confirmUrl 遷移時の browser チェック可否
        :type check_confirm_url_browser: str
        :param cancel_url: 決済キャンセル Page の URL
        :type cancel_url: str
        :param proxy_url: 固定IPでLINE Pay API へアクセスする際のプロキシURL
        :type proxy_url: str
        """
        logger.info('Method %s.__init__ called!!', self.__class__.__name__)
        self.__headers = {
            'Content-Type': 'application/json',
            'X-LINE-ChannelId': channel_id,
            'X-LINE-ChannelSecret': channel_secret,
        }
        logger.info('Headers: %s', self.__headers)
        if proxy_url is None:
            self.__proxies = {}
        else:
            self.__proxies = {
                "http": proxy_url,
                "https": proxy_url
            }
        logger.info('Proxies: %s', self.__proxies)

        self.__line_pay_url = line_pay_url
        self.__confirm_url = confirm_url
        self.__confirm_url_type = confirm_url_type
        self.__check_confirm_url_browser = check_confirm_url_browser
        self.__cancel_url = cancel_url

    def reserve_payment(
            self,
            purchase_order,
            product_image_url=LINE_PAY_BOT_LOGO_URL,
            mid=None,
            one_time_key=None,
            delivery_place_phone=None,
            pay_type='NORMAL',
            lang_cd=None,
            capture=True,
            extras_add_friends=None,
            gmextras_branch_name=None):
        """
        決済 Reserve API の実行
        LINE Pay 決済を行う前に、加盟店の状態が正常であるかを判断し、決済のための情報を予約します。
        決済予約が成功したら、決済完了/払い戻しするまで使用する「取引番号」が発行されます。
        :param purchase_order: PurchaseOrder object
        :type purchase_order: PurchaseOrder
        :param product_image_url: 商品画像の URL
        :type product_image_url: str
        :param mid: 決済を行う LINE 会員 mid（特別なサービスのみ。通常は指定しない）
        :type mid: str
        :param one_time_key: LINE Pay app で提供する QR/BarCode から取得し、LINE Pay会員 mid にかわり会員を特定する情報となる。
        :type one_time_key: str
        :param delivery_place_phone: 受取人の連絡先 (for Risk Management)
        :type delivery_place_phone: str
        :param pay_type: 決済タイプ NORMAL: 一般決済(デフォルト) PREAPPROVED: 継続決済
        :type pay_type: str
        :param lang_cd: 決済待ち画面(paymentUrl)言語コード
        :type lang_cd: str
        :param capture: 売上処理
        :type capture: bool
        :param extras_add_friends: 友達リストを追加
        :param extras_add_friends: list
        :param gmextras_branch_name: 決済を要求した店舗名(100 文字まで表示）
        :type gmextras_branch_name: str
        :return:
        """
        logger.info('Method %s.reserve_payment called!!', self.__class__.__name__)
        # LINE Pay の決済予約処理を実行
        line_pay_url = self.__line_pay_url
        line_pay_endpoint = f'{line_pay_url}/v2/payments/request'
        order_id = purchase_order.id
        body = {
            'productName': purchase_order.title,
            'amount': purchase_order.amount,
            'currency': purchase_order.currency,
            'confirmUrl': self.__confirm_url,
            'confirmUrlType': self.__confirm_url_type,
            'checkConfirmUrlBrowser': self.__check_confirm_url_browser,
            'orderId': order_id,
            'payType': pay_type,
            'capture': capture,
        }
        if product_image_url is not None:
            body['productImageUrl'] = product_image_url
        if mid is not None:
            body['mid'] = mid
        if one_time_key is not None:
            body['oneTimeKey'] = one_time_key
        if self.__cancel_url is not None:
            body['cancelUrl'] = self.__cancel_url
        if delivery_place_phone is not None:
            body['deliveryPlacePhone'] = delivery_place_phone
        if lang_cd is not None:
            body['langCd'] = lang_cd
        if extras_add_friends is not None:
            body['extras.addFriends'] = extras_add_friends
        if gmextras_branch_name is not None:
            body['gmextras.branchName'] = gmextras_branch_name
        # API 実行
        response = requests.post(
            line_pay_endpoint,
            json_util.dump_json(body).encode('utf-8'),
            headers=self.__headers,
            proxies=self.__proxies
        )
        return response.json()

    def confirm_payments(self, purchase_order):
        """
        決済 Confirm API の実行
        加盟店が決済を最終的に完了させるための API です。加盟店で決済 confirm API を呼び出すことによって、実際の決済が完了します。
        決済 reserve 時に“capture”パラメータが“false”の場合、confirm API 実行時はオーソリ状態になるため、「capture API」
        実行時に決済完了となります。
        :param purchase_order: PurchaseOrder object
        :type purchase_order: PurchaseOrder
        :return:
        """
        logger.info('Method %s.confirm_payments called!!', self.__class__.__name__)
        # LINE Pay の決済実行処理を実行
        line_pay_url = self.__line_pay_url
        line_pay_endpoint = f'{line_pay_url}/v2/payments/{purchase_order.transaction_id}/confirm'
        body = {
            'amount': purchase_order.amount,
            'currency': purchase_order.currency,
        }
        # 決済実行API を実行
        response = requests.post(
            line_pay_endpoint,
            json_util.dump_json(body).encode('utf-8'),
            headers=self.__headers,
            proxies=self.__proxies
        )
        return response.json()
