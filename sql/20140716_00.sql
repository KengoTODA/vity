

CREATE TABLE account_tbl (
    id       UUID NOT NULL PRIMARY KEY,
    name     TEXT NOT NULL UNIQUE,
    email    TEXT NOT NULL UNIQUE
);

INSERT INTO account_tbl (id, name, email) values('00000000-0000-0000-0000-000000000000','guest','guest@guest.com');

CREATE TABLE login_token_tbl (
    token          UUID NOT NULL PRIMARY KEY,
    account_id     UUID NOT NULL,
    expire_date    DATE NOT NULL
);


UPDATE sys_tbl SET sql_ver = '20140716_00';
