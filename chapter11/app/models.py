import enum
from datetime import datetime as dt
from . import db

from sqlalchemy import (
    Column, String, Text, Boolean, BigInteger, Integer,
    ForeignKey
)
from sqlalchemy.orm import relationship


class UserRole(str, enum.Enum):
    # 買い手
    CONSUMER = 'CONSUMER'
    # 店側
    STORE_ADMIN = 'STORE_ADMIN'


# モデル
class User(db.Model):
    __tablename__ = 'bot_user'
    id = Column(String(100), primary_key=True)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    active = Column(Boolean, default=True)
    created_timestamp = Column(BigInteger, default=0, nullable=False)
    updated_timestamp = Column(BigInteger, default=int(dt.now().timestamp()), nullable=False)

    orders = relationship('PurchaseOrder', backref='bot_user')

    def __init__(self, user_id, name, role):
        """
        コンストラクタ
        :param user_id:
        :type user_id: str
        :param name:
        :type name: str
        :param role:
        :type role: UserRole
        """
        self.id = user_id
        self.name = name
        self.role = role.value
        self.created_timestamp = int(dt.now().timestamp())

    def __repr__(self):
        return '<User %r>' % self.id

    def is_consumer_user(self):
        """
        買い手ユーザーかどうかを判別する
        :return:
        :rtype: bool
        """
        result = False
        if UserRole.CONSUMER.value == self.role:
            result = True
        return result

    def is_store_admin_user(self):
        """
        店舗側ユーザーかどうかを判別する
        :return:
        :rtype: bool
        """
        result = False
        if UserRole.STORE_ADMIN.value == self.role:
            result = True
        return result


class Item(db.Model):
    __tablename__ = 'item'
    id = Column(String(100), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    unit_price = Column(Integer, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    image_url = Column(String(200), nullable=False)
    active = Column(Boolean, default=True)
    sales_period_timestamp_from = Column(BigInteger, default=0, nullable=False)
    sales_period_timestamp_to = Column(BigInteger, default=0, nullable=False)
    created_timestamp = Column(BigInteger, default=0, nullable=False)
    updated_timestamp = Column(BigInteger, default=int(dt.now().timestamp()), nullable=False)

    def __init__(self, item_id, name, unit_price, description=None, stock=0):
        """
        コンストラクタ
        :param item_id:
        :type item_id: str
        :param name:
        :type name: str
        :param unit_price:
        :type unit_price: int
        :param description:
        :type description: str
        :param stock:
        :type stock: int
        """
        self.id = item_id
        self.name = name
        self.unit_price = unit_price
        self.description = description
        self.stock = stock
        self.created_timestamp = int(dt.now().timestamp())

    def is_in_stock(self):
        """
        在庫があるかどうかを確認する
        :return:
        :rtype: bool
        """
        result = False
        if self.stock > 0:
            result = True
        return result

    def __repr__(self):
        return '<Item %r>' % self.id


class PurchaseOrderStatus(str, enum.Enum):
    # 注文受け付け
    ORDERED = 'ORDERED'
    # 決済待ち
    WAIT_FOR_PAYMENT_DONE = 'WAIT_FOR_PAYMENT_DONE'
    # 決済済み
    PAYMENT_COMPLETED = 'PAYMENT_COMPLETED'
    # 決済エラー
    PAYMENT_ERROR = 'PAYMENT_ERROR'


class PurchaseOrder(db.Model):
    __tablename__ = 'purchase_order'
    id = Column(String(100), primary_key=True)
    user_id = Column('user_id', ForeignKey('bot_user.id'), nullable=False)
    title = Column(String(100), nullable=False)
    amount = Column(Integer, nullable=False)
    currency = Column(String(10), nullable=False, default='JPY')
    status = Column(String(20), nullable=False, default='ORDERED')
    transaction_id = Column(String(100), unique=True)
    ordered_timestamp = Column(BigInteger, default=0, nullable=False)
    paid_timestamp = Column(BigInteger, default=0, nullable=False)
    created_timestamp = Column(BigInteger, default=0, nullable=False)
    updated_timestamp = Column(BigInteger, default=int(dt.now().timestamp()), nullable=False)

    user = relationship('User', backref='purchase_order')
    details = relationship('PurchaseOrderDetail', backref='purchase_order')

    def __init__(self, order_id, title, amount):
        """
        コンストラクタ
        :param order_id:
        :type order_id: str
        :param title:
        :type title: str
        :param amount:
        :type amount: int
        """
        self.id = order_id
        self.title = title
        self.amount = amount
        self.ordered_timestamp = int(dt.now().timestamp())
        self.created_timestamp = int(dt.now().timestamp())

    def __repr__(self):
        return '<PurchaseOrder %r>' % self.id


class PurchaseOrderDetail(db.Model):
    __tablename__ = 'purchase_order_detail'
    id = Column(String(100), primary_key=True)
    purchase_order_id = Column('purchase_order_id', ForeignKey('purchase_order.id'), nullable=False)
    item_id = Column('item_id', ForeignKey('item.id'), nullable=False)
    unit_price = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    amount = Column(Integer, nullable=False)
    created_timestamp = Column(BigInteger, default=0, nullable=False)
    updated_timestamp = Column(BigInteger, default=int(dt.now().timestamp()), nullable=False)

    # order = relationship('Order', backref='purchase_order_detail')
    item = relationship('Item', backref='purchase_order_detail')

    def __repr__(self):
        return '<PurchaseOrder %r>' % self.id
