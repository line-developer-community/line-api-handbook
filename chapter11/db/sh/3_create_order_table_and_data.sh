#!/bin/bash
psql -U $POSTGRES_USER -d $POSTGRES_DB << "EOSQL"
CREATE TABLE purchase_order (
    id varchar(100) PRIMARY KEY,
    user_id varchar(100) references bot_user(id),
    title varchar(100) NOT NULL,
    amount integer NOT NULL,
    currency varchar(10) NOT NULL DEFAULT 'JPY',
    status varchar(20) NOT NULL,
    transaction_id varchar(100) UNIQUE,
    ordered_timestamp bigint NOT NULL DEFAULT 0,
    paid_timestamp bigint NOT NULL DEFAULT 0,
    created_timestamp bigint NOT NULL DEFAULT 0,
    updated_timestamp bigint NOT NULL DEFAULT extract(epoch from now())
);
insert into purchase_order
    (id, user_id, title, amount, status, ordered_timestamp, created_timestamp)
    values
    ('order-111111', 'dummy-user', 'test test order', 2000, 'ORDERED', 1558925437, 1558925437);
EOSQL
