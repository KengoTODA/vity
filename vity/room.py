
# -*- coding: utf-8 -*-

import ConfigParser
import simplejson as json
from sqlalchemy.orm import sessionmaker
import logging
import re
import gevent
import sets
import datetime

from exceptions import PermissionDeniedException, UnrecognizedMessageException
from bottle import request
import vity.entity as entity


config = ConfigParser.ConfigParser()
config.read("config.ini")

CONSOLE_HANDLER = logging.StreamHandler()
fmt = logging.Formatter('[%(levelname)s] %(asctime)s | %(name)s  %(message)s')
CONSOLE_HANDLER.setFormatter(fmt)


def getLogger(name):
    l = logging.getLogger(name)
    l.setLevel(logging.INFO)
    l.addHandler(CONSOLE_HANDLER)
    return l


GLOBAL = 'Global'   # special variable represent un-registered access
class Region(object):

    def __init__(self, region_name, ip_regex_list):
        self.name = region_name
        self.ip_regex_list = ip_regex_list
        self.proxy_peer = None
        self.attached_peers = sets.Set()

    def isMatched(self, peer):
        if self.name == GLOBAL:
            return True
        for ip_regex in self.ip_regex_list:
            if re.match(ip_regex, peer.ip_addr):
                return True
        return False

    def attachPeer(self, peer):
        self.attached_peers.add(peer)
        peer.region = self

    def detachPeer(self, peer):
        if self.proxy_peer is peer:
            self.proxy_peer = None
        self.attached_peers.remove(peer)
        peer.region = None

    def selectProxy(self):
        '''
        Return a [proxy_peer, is_reselected]
        eg.
            [P<0000>, True ] means, peer with id 0000 is the proxy, and it's new selected
            [P<1111>, False] means, peer with id 1111 is the proxy, and it's not new selected
            [None, False] means, this region is empty

            If they're new selected, it should broadcast to every peer in the region to
        re-allocate region.
        '''
        if self.proxy_peer is not None:
            return [self.proxy_peer, False]
        if not self.attached_peers:  # if this region is empry
            return [None, False]
        # re-selected peer
        self.proxy_peer = list(self.attached_peers)[0]
        return [self.proxy_peer, True]

    def __str__(self):
        return self.name + ': ' + str(self.ip_regex_list)


class Room(object):

    def __init__(self, room_id):
        self.id = room_id
        self.peers = {}  # <peer_id: peer>
        self.logger = getLogger('R-' + room_id)

        _regions = config.has_section('region') and json.loads(config.get('region', 'regions')) or []
        self.regions = map(lambda x: Region(x[0] , x[1]), _regions) + [Region(GLOBAL, [])]

        self.global_region = Region(GLOBAL, [])
        self.text_msgs = []
        self.db = entity.Session()

    def broadcast(self, obj, to=[], dont=[]):
        if not to:
            to = self.peers
        peer_ids = filter(lambda id: id in to and id not in dont, to)

        for peer_id in peer_ids:
            try:
                self.peers[peer_id].send(obj)
            except KeyError as e:
                self.logger.info(peer_id + ' already left')
                pass        # It's normal and handled by vity-ws. Ignore it.

    def _addPeer(self, peer):

        if peer.ip_addr is None:
            e = PermissionDeniedException('ip address not detected')
            raise e

        db = self.db
        token = request.get_cookie("loginToken")
        if token is None:
            raise PermissionDeniedException(peer.id + ' token not found in header')

        loginToken = db.query(entity.LoginToken).filter_by(token=token).first()
        if loginToken is None or loginToken.expire_date < datetime.date.today():
            raise PermissionDeniedException(peer.id + ' token expired')

        account = db.query(entity.Account).filter_by(id=loginToken.account_id).first()
        if account is None :
            raise PermissionDeniedException(peer.id + ' account not in database')

        peer.account = {'id'   : account.id}
        if account.id != '00000000-0000-0000-0000-000000000000':
            login_method = db.query(entity.LoginMethod).filter_by(via='default',
                                    account_id=account.id).first()
            peer.nickname = login_method.login_id

        for region in self.regions:
            if region.isMatched(peer):
                region.attachPeer(peer)
                region.selectProxy() # it will only take effect if
                                     # it's the first peer in this region
                break

        # allow to join
        peer.room = self
        self.peers[peer.id] = peer

    def _removePeer(self, old_peer):
        del self.peers[old_peer.id]

        if not self.peers:
            self.text_msgs = []

        # broadcast StreamRevoke message
        msgs = map(lambda x: {'type': 'StreamRevoke',
                              'data': x},
                              old_peer.streams.itervalues())
        self.broadcast(msgs)

        # handle about region proxy
        region = old_peer.region
        region.detachPeer(old_peer)
        proxy_peer, is_new = region.selectProxy()
        if is_new is True:
            self.broadcast({'type': 'SwitchProxy',
                            'data': {'region': region.name,
                                     'new'   : proxy_peer.id,
                                     'old'   : old_peer.id}},
                            to=map(lambda p: p.id, region.attached_peers))
            self.logger.info('SwitchProxy')

        # notify all at the end
        self.broadcast({'type': 'Leave', 'data': old_peer.id})
