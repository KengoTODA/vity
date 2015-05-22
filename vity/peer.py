
# -*- coding: utf-8 -*-


import simplejson as json
import uuid
import logging
import time
from geventwebsocket import WebSocketError
from exceptions import PermissionDeniedException, UnrecognizedMessageException

CONSOLE_HANDLER = logging.StreamHandler()
fmt = logging.Formatter('[%(levelname)s] %(asctime)s | %(name)s  %(message)s')
CONSOLE_HANDLER.setFormatter(fmt)


def getLogger(name):
    l = logging.getLogger(name)
    l.setLevel(logging.INFO)
    l.addHandler(CONSOLE_HANDLER)
    return l


_peer_msg_callbacks = {}

class Peer(object):

    def __init__(self, wsock):
        self.id = str(uuid.uuid4())[:8]
        self.nickname = self.id
        self.ip_addr = None
        self.region = None
        self.wsock = wsock
        self.logger = getLogger(self.id)
        self.room = None
        self.streams = {}

    def send(self, msg):
        if type(msg) is dict:
            msg = [msg]
        if type(msg) is list and all(map(lambda x: type(x) is dict, msg)):
            try:
                self.wsock.send(json.dumps(msg))
            except WebSocketError as e:
                # If WebSocketError raised, it will also raise WebSocketError in
                #   vity-ws.py (peer.receive()), it should be handle there.
                # Just ignore WebSocketError in current greenlet.
                self.logger.info('safe leave on MSG_SOCKET_DEAD in Peer.send')
                pass
        else:
            raise TypeError("msg must be type '[dict1, dict2, ...]' in Peer.send(msg)")

    def receive(self):
        msg_json_string = self.wsock.receive()
        if msg_json_string is None:
            return None
        msg = json.loads(msg_json_string)
        msg['from'] = self.id
        return msg

    @property
    def info(self):
        return {'id': self.id, 'nickname': self.nickname,
                'ip': self.ip_addr, 'region': self.region.name,
                'account': self.account}

    @property
    def is_proxy(self):
        return self is self.region.proxy_peer

    def join(self, room):
        room._addPeer(self)  # Exception will break this process if permission denied
        msgs = [{'type': 'PeerId', 'data': self.id}]

        self.send(msgs)
        # broadcast to others, it's newly joined
        self_info = self.info
        self_info['is_new'] = True
        self.broadcast({'type': 'PeerInfo', 'data': self_info})
        self.logger.info('IP : {}'.format(self.ip_addr))
        self.logger.info('Join  {: <10} ({})'.format(self.room.id, len(self.room.peers)))

    def leave(self):
        if (not self.room) or (self.id not in self.room.peers):
            return
        self.room._removePeer(self)
        self.logger.info('Leave {: <10} ({})'.format(self.room.id, len(self.room.peers)))

    def catchup(self):
        room = self.room
        msgs = map(lambda peer: {'type': 'PeerInfo', 'data': peer.info},
                    room.peers.itervalues())
        msgs += map(lambda peer: {'type': 'SwitchProxy',
                                  'data': {'region': peer.region.name,
                                           'new': peer.id}},
                    filter(lambda peer: peer.is_proxy is True,
                            room.peers.itervalues()))
        for peer in room.peers.itervalues():
            msgs += map(lambda x: {'type': 'StreamAvailable',
                                  'from': peer.id,
                                  'data': x},
                                peer.streams.itervalues())
        msgs += room.text_msgs
        self.send(msgs)

    def broadcast(self, obj, to=[], dont=[]):
        '''This will ignore self. Room.broadcast to broadcast to all.'''
        self.room.broadcast(obj, to=to, dont=dont + [self.id])

    def handle(self, msg):
        try:
            wrap_callback = _peer_msg_callbacks[msg['type']]
        except KeyError:
            raise UnrecognizedMessageException('uncognized message' + str(msg))
        return wrap_callback(self, msg)


    def messageHandler(callback):
        if not callback.__name__.startswith('on'):
            raise ValueError("error name on Peer.message decorator. Decorated function" +
                    "should be named as 'onMessagename'.")
        _peer_msg_callbacks[callback.__name__[2:]] = callback
        def wrapper(self, msg):
            return callback(self, msg)
        return wrapper

    @messageHandler
    def onNickname(self, msg):
        if 'data' not in msg or msg['data'] is None or msg['data'] == '':
            return
        self.nickname = msg['data']
        self.room.broadcast(msg)
        self.logger = getLogger(self.id + ' [' + self.nickname + ']')
        self.logger.info('broadcast Nickname')

    @messageHandler
    def onTextMessage(self, msg):
        if 'data' not in msg or msg['data'] is None or msg['data'] == '':
            return
        self.room.broadcast(msg)
        self.logger.info('broadcast TextMessage : ' + msg['data'])
        # save in memory, it'll be clear the room is empty
        msg['from'] = self.room.peers[msg['from']].nickname
        self.room.text_msgs.append(msg)

    @messageHandler
    def onStreamAvailable(self, msg):
        self.streams[msg['data']['stream']['id']] = msg['data']
        self.broadcast(msg)
        self.logger.info('broadcast StreamAvailable type: ' + msg['data']['stream']['type'])

    @messageHandler
    def onStreamRequest(self, msg):
        to = msg.pop('to')
        self.broadcast(msg, to=[to])
        self.logger.info('StreamRequest to : ' + to)

    @messageHandler
    def onStreamRevoke(self, msg):
        revoked_stream = self.streams.pop(msg['data']['stream']['id'])
        self.broadcast(msg)
        self.logger.info('broadcast StreamRevoke type: ' + revoked_stream['stream']['type'])

    @messageHandler
    def onOfferSDP(self, msg):
        to = msg.pop('to')
        self.broadcast(msg, to=[to])
        self.logger.info('OffserSDP to ' + to)

    @messageHandler
    def onAnswerSDP(self, msg):
        to = msg.pop('to')
        self.broadcast(msg, to=[to])
        self.logger.info('AnswerSDP to ' + to)

    @messageHandler
    def onOfferCandidate(self, msg):
        to = msg.pop('to')
        self.broadcast(msg, to=[to])
        self.logger.info('OfferCandidate to ' + to)

    @messageHandler
    def onAnswerCandidate(self, msg):
        to = msg.pop('to')
        self.broadcast(msg, to=[to])
        self.logger.info('AnswerCandidate to ' + to)

    @messageHandler
    def onServerLog(self, msg):
        self.logger.info(msg['data'])
