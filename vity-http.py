# -*- coding: utf-8 -*-
from gevent import monkey;
monkey.patch_all()

from psycogreen.gevent import patch_psycopg
patch_psycopg()

import os
import ConfigParser
import simplejson as json
import vity
import vity.entity as entity
import uuid
import datetime
import vity.bottle_plugin as plugin

from bottle import run, get, post, request, response, HTTPError, Bottle
from vity.authenticator import Authenticator


config = ConfigParser.ConfigParser()
config.read("config.ini")
http_port = config.get('port_config', 'http_port')
ws_port = config.get('port_config', 'ws_port')
nginx_port = config.get('port_config', 'nginx_port')
host_address = config.get('host', 'hostname')


vity_api = Bottle()

vity_api.install(plugin.db)
vity_api.install(plugin.login_validation)

@vity_api.post('/api/login', skip=[plugin.login_validation])
def login(db):
    login_id = request.forms.get('login_id')
    password = request.forms.get('password')
    via = request.forms.get('via')
    account_id = '00000000-0000-0000-0000-000000000000'
    if login_id != 'guest@guest.com':
        client = Authenticator()
        ok = client.authenticate(login_id, password)
        if(not ok):
            return HTTPError(401, 'Unauthorized')
        #check if the loginid already exists in db , else add loginid to db
        login_method = db.query(entity.LoginMethod).filter_by(via=via, login_id=login_id).first()
        if not login_method:
            account_id = str(uuid.uuid4())
            login_method = entity.LoginMethod(via, login_id, account_id)
            account = entity.Account(account_id, '', '')
            db.add(login_method)
            db.add(account)
        account_id = login_method.account_id
    loginToken = db.query(entity.LoginToken).filter_by(token=request.get_cookie("loginToken")).first()
    if loginToken is not None:
        db.delete(loginToken)
    # new login token, set in cookie
    token = uuid.uuid4()
    expire_date = datetime.date.today() + datetime.timedelta(days=7)
    login_token = entity.LoginToken(str(token), account_id, expire_date);
    db.add(login_token)
    response.set_cookie("loginToken", str(token), expires=expire_date, path="/")



@vity_api.get('/api/rooms/<room_name>')
def get_url(room_name, db):
    #pass the room info if room exists else create new room and pass room info
    room = db.query(entity.Room).filter(entity.Room.name == room_name).first()
    if room is None:
        if request.query.get('createIfNotExists', 0):
            room = entity.Room(str(uuid.uuid4()), room_name)
            db.add(room)
        else:
            return HTTPError(404, 'Entity not found.')
    ws_url = "/wss/" + room_name
    rtc_param = config.get('room_info', 'rtc_param')
    return {'ws_url': ws_url, 'rtc_param': rtc_param, 'room_id': room.id, 'room_name': room.name}


@vity_api.get('/api/rooms')
def get_room_list(db):
    rooms = []
    rtc_param = config.get('room_info', 'rtc_param')
    for room in db.query(entity.Room).all():
        ws_url = "/wss/" + room.name
        rooms.append({'ws_url': ws_url,
                      'rtc_param': rtc_param,
                      'room_id': room.id,
                      'room_name': room.name})
    return json.dumps(rooms)

vity_api.run(host='0.0.0.0', port=http_port, server='gevent',
        keyfile=config.get('ssl', 'keyfile'), certfile=config.get('ssl', 'certfile'))
