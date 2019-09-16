# -*- coding: utf-8 -*-
import os
import uuid
import logging
from datetime import datetime as dt
import random
from flask import (
    render_template, jsonify, request, abort
)

# LINE
from linebot import (
    LineBotApi, WebhookHandler
)
from linebot.exceptions import (
    InvalidSignatureError,
)
from linebot.models import (
    FollowEvent
)

from . import app, db
from .models import (
    User, UserRole, PurchaseOrder, PurchaseOrderDetail, Item,
    PurchaseOrderStatus
)
from .line_pay import LinePay
from . import json_util

LINE_PAY_URL = os.getenv('LINE_PAY_URL', None)
LINE_PAY_CHANNEL_ID = os.getenv('LINE_PAY_CHANNEL_ID', None)
LINE_PAY_CHANNEL_SECRET = os.getenv('LINE_PAY_CHANNEL_SECRET', None)
LINE_PAY_CONFIRM_URL = os.getenv('LINE_PAY_CONFIRM_URL', None)
PROXY_URL = os.getenv('QUOTAGUARDSTATIC_URL', None)

pay = LinePay(
    channel_id=LINE_PAY_CHANNEL_ID,
    channel_secret=LINE_PAY_CHANNEL_SECRET,
    line_pay_url=LINE_PAY_URL,
    confirm_url=LINE_PAY_CONFIRM_URL,
    # proxy_url=PROXY_URL
)

# Logger
app.logger.setLevel(logging.DEBUG)


@app.route('/')
def index():
    app.logger.info('handler index called!')
    app.logger.debug('LINEBOT_CHANNEL_ACCESS_TOKEN[%s]', os.getenv('LINEBOT_CHANNEL_ACCESS_TOKEN'))
    app.logger.debug('LINEBOT_CHANNEL_SECRET[%s]', os.getenv('LINEBOT_CHANNEL_SECRET'))
    items = Item.query.all()
    return render_template(
        'index.html',
        title='Hello world',
        items=items
    )


@app.route('/drink_bar', methods=['GET'])
def get_drink_bar():
    app.logger.info('handler get_drink_bar called!')
    # ドリンクバー画面を表示
    return render_template(
        'drink_bar.html',
    )


@app.route('/draw_a_prize', methods=['GET'])
def get_draw_a_prize():
    app.logger.info('handler get_draw_a_prize called!')
    transaction_id = request.args.get('transaction_id')
    app.logger.info('transaction_id: %s', transaction_id)
    return render_template(
        'draw_a_prize.html',
        transaction_id=transaction_id
    )


@app.route('/api/items', methods=['GET'])
def get_items():
    app.logger.info('handler get_items called!')
    # DB から商品情報を取得
    item_list = Item.query.filter(Item.active == True).all()
    app.logger.debug(item_list)
    items = []
    for i in item_list:
        item = {
            'id': i.id,
            'name': i.name,
            'description': i.description,
            'unit_price': i.unit_price,
            'stock': i.stock,
            'image_url': i.image_url
        }
        app.logger.debug(item)
        items.append(item)
    # 販売可能な商品一覧を返す
    app.logger.debug(items)
    return jsonify({
        'items': items
    })


@app.route('/api/purchase_order', methods=['POST'])
def post_purchase_order():
    app.logger.info('handler post_purchase_order called!')
    app.logger.debug('Request json: %s', request.json)
    request_dict = request.json
    user_id = request_dict.get('user_id', None)
    user = User.query.filter(User.id == user_id).first()
    # ユーザーが登録されていなければ新規登録
    if user is None:
        user = add_user(user_id)
    order_items = request_dict.get('order_items', [])
    order_item_list = Item.query.filter(Item.id.in_(order_items))
    app.logger.debug('order_item_list: %s', order_item_list)
    # order !
    order = add_purchase_order(user, order_item_list)
    ordered_item = Item.query.filter(Item.id == order.details[0].item_id).first()
    # return
    return jsonify({
        'order_id': order.id,
        'order_title': order.title,
        'order_amount': order.amount,
        'order_item_slot': ordered_item.slot,
        'ordered_item_image_url': ordered_item.image_url
    })


@app.route('/api/order/<user_id>/<order_id>', methods=['GET'])
def get_order_info(user_id, order_id):
    app.logger.info('handler get_order_info called!')
    app.logger.debug('user_id: %s', user_id)
    app.logger.debug('order_id: %s', order_id)
    # query order
    order = PurchaseOrder.query.filter(PurchaseOrder.id == order_id).first()
    # return
    return jsonify({
        'order': {
            'id': order.id,
            'title': order.title,
            'amount': order.amount
        }
    })


@app.route('/api/transaction_order/<user_id>/<transaction_id>', methods=['GET'])
def get_order_info_by_transaction(user_id, transaction_id):
    app.logger.info('handler get_order_info_by_transaction called!')
    app.logger.debug('user_id: %s', user_id)
    app.logger.debug('transaction_id: %s', transaction_id)
    # query order
    order = PurchaseOrder.query.filter(PurchaseOrder.transaction_id == transaction_id).first()
    ordered_item = Item.query.filter(Item.id == order.details[0].item_id).first()
    # return
    return jsonify({
        'order': {
            'id': order.id,
            'title': order.title,
            'amount': order.amount,
            'item_slot': ordered_item.slot,
            'item_image_url': ordered_item.image_url,
            'can_draw_a_prize': order.can_draw_a_prize()
        }
    })


@app.route('/api/draw_a_prize/<transaction_id>', methods=['GET'])
def get_draw_a_prize_api(transaction_id):
    app.logger.info('handler get_draw_a_prize_api called!')
    app.logger.debug('transaction_id: %s', transaction_id)
    order = PurchaseOrder.query.filter(PurchaseOrder.transaction_id == transaction_id).first()
    app.logger.info('order: %s', order)
    # 抽選結果
    draw_result = False
    # 抽選実施
    if order is not None and order.can_draw_a_prize() is True:
        random_list = list(range(0, 100))
        random.shuffle(random_list)
        draw_number = random_list[0]
        app.logger.debug('draw_number: %s', draw_number)
        if draw_number > 33:
            draw_result = True
        # update transaction info
        order.win_a_prize = draw_result
        order.prized_timestamp = int(dt.now().timestamp())
        db.session.commit()
    else:
        # すでに抽選済みや決済途中の場合は抽選結果を書き込まない
        pass
    # return result
    return jsonify({
        'transaction_id': transaction_id,
        'draw_a_prize_result': draw_result
    })


def add_user(user_id):
    """
    ユーザー情報を追加する
    :param user_id:
    :type user_id: str
    :return:
    """
    app.logger.info('add_user called!')
    user = User(user_id, 'MakersBazaarOsakaUser', UserRole.CONSUMER)
    user.created_timestamp = int(dt.now().timestamp())
    db.session.add(user)
    db.session.commit()
    return user


def add_purchase_order(user, order_items):
    """
    注文情報を生成する
    :param user:
    :type user: User
    :param order_items:
    :type order_items: list
    :return: purchase order
    :rtype: PurchaseOrder
    """
    app.logger.info('add_purchase_order called!')
    # 一意な注文IDを生成する
    order_id = uuid.uuid4().hex
    timestamp = int(dt.now().timestamp())
    details = []
    amount = 0
    # 注文情報を生成
    for item in order_items:
        detail = PurchaseOrderDetail()
        detail.id = order_id + '-' + item.id
        detail.unit_price = item.unit_price
        detail.quantity = 1
        detail.amount = item.unit_price * detail.quantity
        detail.item = item
        detail.created_timestamp = timestamp
        db.session.add(detail)
        details.append(detail)
        amount = amount + detail.amount
    # 注文情報をDBに登録する
    order_title = details[0].item.name
    if len(details) > 1:
        order_title = '{} 他'.format(order_title)
    order = PurchaseOrder(order_id, order_title, amount)
    order.user_id = user.id
    order.details.extend(details)
    db.session.add(order)
    db.session.commit()
    return order


"""
===================================
LINE Pay メソッド
===================================
"""


@app.route("/pay/reserve", methods=['POST'])
def handle_pay_reserve():
    app.logger.info('handler handle_pay_reserve called!')
    app.logger.debug('Request json: %s', request.json)
    request_dict = request.json
    user_id = request_dict.get('user_id', None)
    order_id = request_dict.get('order_id', None)
    # 注文情報とユーザー情報をデータベースから取得する
    order = PurchaseOrder.query.filter(PurchaseOrder.id == order_id).first()
    app.logger.debug('PurchaseOrder: %s', order)
    user = User.query.filter(User.id == user_id).first()
    app.logger.debug('User: %s', user)
    ordered_item = Item.query.filter(Item.id == order.details[0].item_id).first()
    app.logger.debug('Ordered Item: %s', ordered_item)
    # LINE Pay の決済予約API を実行してtransactionId を取得する
    response = pay.reserve_payment(order, product_image_url=ordered_item.image_url)
    app.logger.debug('Response: %s', json_util.dump_json_with_pretty_format(response))
    app.logger.debug('returnCode: %s', response["returnCode"])
    app.logger.debug('returnMessage: %s', response["returnMessage"])
    transaction_id = response["info"]["transactionId"]
    app.logger.debug('transaction_id: %s', transaction_id)
    # 取得したtransactionId を注文情報に設定してデータベースを更新する
    order.user_id = user.id
    order.transaction_id = transaction_id
    db.session.commit()
    db.session.close()
    payment_url = response["info"]["paymentUrl"]["web"]
    # LINE Pay の決済実行URL をフロントに返す
    return jsonify({
        'payment_url': payment_url
    })


@app.route("/pay/confirm", methods=['GET'])
def handle_pay_confirm():
    app.logger.info('handler handle_pay_confirm called!')
    # 決済承認完了後、LINE Pay 側から実行される
    transaction_id = request.args.get('transactionId')
    order = PurchaseOrder.query.filter_by(transaction_id=transaction_id).one_or_none()
    if order is None:
        raise Exception("Error: transaction_id not found.")
    # LINE Pay の決済実行API を実行
    response = pay.confirm_payments(order)
    app.logger.debug('returnCode: %s', response["returnCode"])
    app.logger.debug('returnMessage: %s', response["returnMessage"])
    # 注文情報の決済ステータスを完了にする
    order.status = PurchaseOrderStatus.PAYMENT_COMPLETED.value
    db.session.commit()
    db.session.close()
    # ドリンクバー画面を表示
    return render_template(
        'drink_bar.html',
        message='Payment successfully completed.',
        transaction_id=transaction_id
    )


"""
===================================
LINE BOT Webhook handler メソッド
===================================
"""


# LINE bot settings
line_bot_api = LineBotApi(os.getenv('LINEBOT_CHANNEL_ACCESS_TOKEN', ''))
handler = WebhookHandler(os.getenv('LINEBOT_CHANNEL_SECRET', ''))


@app.route("/linebot/webhook", methods=['POST'])
def linebot_webhook_handler():
    """
    LINE からのWebhook を受け付けるメソッド

    :return:
    """
    app.logger.info('method linebot_webhook_handler called!!')
    # get X-Line-Signature header value
    signature = request.headers['X-Line-Signature']
    # get request body as text
    body = request.get_data(as_text=True)
    app.logger.info('Request body: %s', body)
    # handle webhook body
    try:
        handler.handle(body, signature)
    except InvalidSignatureError as e:
        app.logger.error('InvalidSignatureError occurred!: %s', e)
        abort(400)
    except Exception as e:
        app.logger.error('Error at line bot webhook: %s', e)
        abort(400)
    return 'OK'


'''
=======================
<LINE BOT>
Follow イベント処理
=======================
'''


@handler.add(FollowEvent)
def follow_event_handler(event):
    """
    フォローイベント（おともだち追加）受信時
    """
    app.logger.info('handler FollowEvent called!! event:%s', event)
    app.logger.info('UserID: %s', event.source.user_id)
    app.logger.info('User type: %s', event.source.type)
    # Add user
    user_id = event.source.user_id
    user = User(user_id, 'dummy', UserRole.CONSUMER)
    db.session.add(user)
    db.session.commit()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True, debug=True)
    app.logger('LINEBOT_CHANNEL_ACCESS_TOKEN[%s]', os.getenv('LINEBOT_CHANNEL_ACCESS_TOKEN'))
    app.logger('LINEBOT_CHANNEL_SECRET[%s', os.getenv('LINEBOT_CHANNEL_SECRET'))
