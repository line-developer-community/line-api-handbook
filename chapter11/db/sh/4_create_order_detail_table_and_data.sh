#!/bin/bash
psql -U $POSTGRES_USER -d $POSTGRES_DB << "EOSQL"
CREATE TABLE purchase_order_detail (
    id varchar(100) PRIMARY KEY,
    purchase_order_id varchar(100) NOT NULL references purchase_order(id),
    item_id varchar(100) NOT NULL references item(id),
    unit_price integer NOT NULL,
    quantity integer NOT NULL,
    amount integer NOT NULL,
    created_timestamp bigint NOT NULL DEFAULT 0,
    updated_timestamp bigint NOT NULL DEFAULT extract(epoch from now())
);
insert into purchase_order_detail
    (id, purchase_order_id, item_id, unit_price, quantity, amount, created_timestamp)
    values
    ('detail-111111', 'order-111111', 'item-0001', 1000, 2, 2000, 1558925437);
EOSQL
