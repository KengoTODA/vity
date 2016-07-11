# Vity
Video chat system using WebRTC

Dependency
-------

1. python2.7               (the higher the better)
2. easy_install and pip
3. virtualenv
4. nginx                   (1.7 or above)
5. PostgreSQL              (9.3 or above



Setup: (all under the repo directory)
-------------------------------------

1. sh bin/setup-virtualenv.sh  (if you haven't vity-python27 environment)
2. source ./activate
3. pip install -r pip.deps
4. sh bin/nginx
5. sh vity-daemon.sh


Code style
----------------------------------
Javascript & Python
```
ClassName, methodName, variable_name
```

Done.


How to launch docker-compose containers
----------------------------------

1. `npm install && grunt` to generate static files
2. `docker-compose build` to build docker images
3. `docker-compose run -d` to launch cluster
4. access http://localhost:8080/ or http://192.168.99.100:8080/
