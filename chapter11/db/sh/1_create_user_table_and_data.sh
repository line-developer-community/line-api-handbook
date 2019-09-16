#!/bin/bash
psql -U $POSTGRES_USER -d $POSTGRES_DB << "EOSQL"
CREATE TABLE bot_user (
    id varchar(100) PRIMARY KEY,
    name varchar(100) NOT NULL,
    role varchar(50) NOT NULL,
    active boolean DEFAULT true,
    created_timestamp bigint NOT NULL DEFAULT 0,
    updated_timestamp bigint NOT NULL DEFAULT extract(epoch from now())
);
insert into bot_user
    (id, name, role, created_timestamp)
    values
    ('dummy-user', 'ダミー太郎', 'CONSUMER', 1558925437);
insert into bot_user
    (id, name, role, created_timestamp)
    values
    ('U75978290626671d79abf0af401aa4006', 'S.K', 'CONSUMER', 1558925437);

EOSQL
