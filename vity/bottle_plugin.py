
from bottle import run, get, post, request, response, HTTPError, Bottle
import vity.entity as entity
import bottle.ext.sqlalchemy
import datetime

db = bottle.ext.sqlalchemy.Plugin(entity.engine, entity.Base.metadata,
                keyword='db', create=False, commit=True, use_kwargs=False)


def login_validation(callback):
    def wrapper(db, *args, **kwargs):
        token = request.get_cookie("loginToken")
        if token is None:
            return HTTPError(499, 'Token required')

        loginToken = db.query(entity.LoginToken).filter_by(token=token).first()
        if loginToken is None or loginToken.expire_date < datetime.date.today():
            return HTTPError(499, 'Token expired')

        account = db.query(entity.Account).filter_by(id=loginToken.account_id).first()
        if account is None :
            return HTTPError(401, 'Unauthorized')

        kwargs['db'] = db
        return callback(*args, **kwargs)

    return wrapper
