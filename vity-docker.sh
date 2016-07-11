#!/bin/bash
cd /etc/vity
source /etc/vity/activate
echo "[db]" > /etc/vity/config.ini
echo "url=postgresql://postgres:postgres@db/vity" >> /etc/vity/config.ini
echo pool_size=10 >> /etc/vity/config.ini
echo max_overflow=0 >> /etc/vity/config.ini
echo "[port_config]" >> /etc/vity/config.ini
echo http_port=8080 >> /etc/vity/config.ini
echo ws_port=8080 >> /etc/vity/config.ini
echo nginx_port=8080 >> /etc/vity/config.ini
echo "[ssl]" >> /etc/vity/config.ini
echo keyfile=/etc/vity/ssl/key.pem >> /etc/vity/config.ini
echo certfile=/etc/vity/ssl/cert.pem >> /etc/vity/config.ini
echo "[host]" >> /etc/vity/config.ini
echo hostname=vity.com >> /etc/vity/config.ini
echo "[room_info]" >> /etc/vity/config.ini
echo rtc_param=rtc_param >> /etc/vity/config.ini

pip install -r $VITY_HOME/pip.deps

if [ "$1" = "ws" ]; then
  echo Running WebSocket daemon...
  python2 /etc/vity/vity-ws.py
else
  echo Running HTTP daemon...
  python2 /etc/vity/vity-http.py
fi
