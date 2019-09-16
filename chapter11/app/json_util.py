#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
JSON を扱う際に利用するユーティリティ関数
"""

import json
from decimal import Decimal

# log
import logging

logger = logging.getLogger()


def dump_json(json_data):
    """
    JSONデータを文字列に変換する

    :param dict json_data: JSONデータ
    :return: JSON文字列
    :rtype: str
    """
    logger.info('json_util dump_json method called!')
    return json.dumps(
        json_data,
        ensure_ascii=False,
        default=_decimal_parser_for_json_dump
    )


def dump_json_with_pretty_format(json_data):
    """
    JSONデータを文字列に変換する。読みやすい形式の文字列にする。
    :param json_data: JSONデータ
    :return: JSON文字列
    :rtype: str
    """
    logger.info('json_util dump_json_with_pretty_format method called!')
    return json.dumps(
        json_data,
        indent=4,
        separators=(',', ': '),
        default=_decimal_parser_for_json_dump
    )


def _decimal_parser_for_json_dump(obj):
    """
    JSONデータを文字列に変換する際、Decimalをフロートに変換してから文字列に変換する
    :param obj:
    :return:
    """
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def dict_to_binary(json_data):
    json_str = dump_json(json_data)
    binary = ' '.join(format(ord(letter), 'b') for letter in json_str)
    return binary


def binary_to_dict(the_binary):
    jsn = ''.join(chr(int(x, 2)) for x in the_binary.split())
    d = json.loads(jsn)
    return d
