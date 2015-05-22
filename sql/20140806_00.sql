

CREATE TABLE login_method_tbl (
    via             TEXT NOT NULL,
    login_id        TEXT NOT NULL,
    account_id      UUID NOT NULL,
    PRIMARY KEY (via, login_id)
);

-- remove the email and name unique value constraints
-- constraints move to login_method_tbl

ALTER TABLE account_tbl DROP CONSTRAINT account_tbl_email_key;
ALTER TABLE account_tbl DROP CONSTRAINT account_tbl_name_key;

UPDATE sys_tbl SET sql_ver = '20140806_00';
