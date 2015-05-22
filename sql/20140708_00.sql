

CREATE TABLE room_tbl (
    id      UUID NOT NULL PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE
);

CREATE TABLE sys_tbl (
    sql_ver TEXT NOT NULL UNIQUE
);

INSERT INTO sys_tbl (sql_ver) values('20140708_00');
