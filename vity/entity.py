

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Date, DateTime, String, Text, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import ConfigParser

Base = declarative_base()

config = ConfigParser.ConfigParser()
config.read("config.ini")
db_url = config.get('db', 'url')
poolSize = config.get('db', 'pool_size')
maxOverflow = config.get('db', 'max_overflow')

engine = create_engine(db_url, echo=False, pool_size=int(poolSize), max_overflow=int(maxOverflow))
engine.pool._use_threadlocal = True


# configure session factory for websocket use
Session = sessionmaker()
Session.configure(bind=engine, autocommit=False)


class Room(Base):
    __tablename__ = 'room_tbl'
    id = Column(UUID, primary_key=True, nullable=False)
    name = Column(Text, unique=True, nullable=False)

    def __init__(self, id, name):
        self.id = id
        self.name = name


class Account(Base):
    __tablename__ = 'account_tbl'
    id = Column(UUID, primary_key=True, nullable=False)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)

    def __init__(self, id, name, email):
        self.id = id
        self.name = name
        self.email = email


class LoginMethod(Base):
    __tablename__ = 'login_method_tbl'
    via = Column(Text, primary_key=True)
    login_id = Column(Text, primary_key=True)
    account_id = Column(UUID, nullable=False)

    def __init__(self, via, login_id, account_id):
        self.via = via
        self.login_id = login_id
        self.account_id = account_id


class LoginToken(Base):
    __tablename__ = 'login_token_tbl'
    token = Column(UUID, primary_key=True, nullable=False)
    account_id = Column(UUID, nullable=False)
    expire_date = Column(Date, nullable=False)

    def __init__(self, token, account_id, expire_date):
        self.token = token
        self.account_id = account_id
        self.expire_date = expire_date
