#!/bin/bash
psql -U $POSTGRES_USER -d $POSTGRES_DB << "EOSQL"
CREATE TABLE item (
    id varchar(100) PRIMARY KEY,
    name varchar(100),
    description text,
    unit_price integer NOT NULL,
    stock integer NOT NULL DEFAULT 0,
    image_url varchar(200),
    active boolean DEFAULT true,
    sales_period_timestamp_from bigint NOT NULL DEFAULT 0,
    sales_period_timestamp_to bigint NOT NULL DEFAULT 0,
    created_timestamp bigint NOT NULL DEFAULT 0,
    updated_timestamp bigint NOT NULL DEFAULT extract(epoch from now())
);
insert into item (id, name, description, unit_price, stock, image_url, created_timestamp) values ('item-0001', 'コーラ', 'スキッと爽やかなコーラ', 1000, 10, 'https://4.bp.blogspot.com/-Mv0_RUDAK2M/V9ppyNuaczI/AAAAAAAA9yE/l2_CPuRoWOk60Sh9BAoaPqDi0y1YT2R_wCLcB/s800/petbottle_cola.png', 1558925437);
insert into item (id, name, description, unit_price, stock, image_url, created_timestamp) values ('item-0002', 'オレンジジュース', 'みんな大好きオレンジジュース', 800, 10, 'https://my-qiita-images.s3-ap-northeast-1.amazonaws.com/line_things_drink_bar/orange_juice.jpg', 1558925437);
insert into item (id, name, description, unit_price, stock, image_url, created_timestamp) values ('item-0003', '麦茶 ', 'ごくごく飲める麦茶', 900, 10, 'https://my-qiita-images.s3-ap-northeast-1.amazonaws.com/line_things_drink_bar/mugicha.jpg', 1558925437);
EOSQL
