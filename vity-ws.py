
# -*- coding: utf-8 -*-

from gevent import monkey;
monkey.patch_all()

from psycogreen.gevent import patch_psycopg
patch_psycopg()

from bottle import request, Bottle, abort
from gevent.pywsgi import WSGIServer
from geventwebsocket import WebSocketError
from geventwebsocket.handler import WebSocketHandler
from gevent.event import Event
import simplejson as json
import uuid
import vity
import os
import ConfigParser

vity_ws = Bottle()
vity_ws.debug = True

rooms_peers = []
rooms = {}   # <room_id: room>

evt = Event()

@vity_ws.route('/__SERVER_EVENT_LISTENER__')
def handle_websocket_rooms():
    wsock = request.environ.get('wsgi.websocket')
    if not wsock:
        abort(400, 'Expected WebSocket request.')
    room_peers = get_room_list_peers(rooms)
    msgs = [{'type': 'RoomListPeers', 'data': room_peers}]
    wsock.send(json.dumps(msgs))
    while True:
        evt.wait()
        room_peers = get_room_list_peers(rooms)
        msgs = [{'type': 'RoomListPeers', 'data': room_peers}]
        wsock.send(json.dumps(msgs))

@vity_ws.route('/<room_name>')
def handle_websocket(room_name):
    global rooms
    wsock = request.environ.get('wsgi.websocket')
    if not wsock:
        abort(400, 'Expected WebSocket request.')

    room_id = room_name
    if room_id not in rooms:
        room = vity.Room(room_id)
        rooms[room_id] = room
    room = rooms[room_id]

    peer = vity.Peer(wsock)
    peer.ip_addr = request.get_header('X-Real-IP')

    try:
        peer.join(room)     # assign peer id and broadcast to others
                            # PermissionDeniedException will raise here
        evt.set()
        evt.clear()
        peer.catchup()      # catch up the existing status

        while True:
            msg = peer.receive()
            if msg is None:
                break   # normal close
            if msg['type'] == 'Nickname':
                evt.set()
                evt.clear()
            peer.handle(msg)

    except (vity.UnrecognizedMessageException, vity.PermissionDeniedException) as e:
        peer.logger.exception(e)
    except WebSocketError as e:
        peer.logger.exception(e)
    finally:
        peer.leave()
        evt.set()
        evt.clear()


def get_room_list_peers(rooms):
    room_peers = []
    for room in rooms.values():
        peers = []
        for peer in room.peers.values():
            peers.append(peer.nickname)
        room_peers.append({'room_name' :room.id, 'peers' : peers})
    return room_peers


def run():
    config = ConfigParser.ConfigParser()
    config.read("config.ini")
    ws_port = config.get('port_config', 'ws_port')
    server = WSGIServer(("0.0.0.0", int(ws_port)), vity_ws, handler_class=WebSocketHandler,
            keyfile=config.get('ssl', 'keyfile'), certfile=config.get('ssl', 'certfile'))
    server.serve_forever()


if __name__ == '__main__':
    run()
