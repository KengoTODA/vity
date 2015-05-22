
function vity_stop {
    while read -r line; do
        if [ "x$line" != "x" ]; then
            kill $line
        fi
    done < ./logs/vity.pid
}

function vity_start {
    echo -n "" > ./logs/vity.pid
    nohup python2 vity-http.py >> ./logs/http.log &
    echo $! >> ./logs/vity.pid
    nohup python2 vity-ws.py   >> ./logs/ws.log   &
    echo $! >> ./logs/vity.pid
    cat ./logs/vity.pid
}


if [ "$1" = "build" ]; then
  # TODO: this section will be moved to npm run xxx
    npm run less
    sed -i "s/urlArgs.*bust=.*$/urlArgs:\ \"bust=$(git rev-parse HEAD)\",/g" html/js/main.js
    find html -name "*.html" -exec sed -i '/livereload.js/d' {} \;
elif [ "$1" = "start" ]; then
    vity_start
elif [ "$1" = "stop" ]; then
    vity_stop
elif [ "$1" = "restart" ]; then
    vity_stop
    vity_start
elif [ "$1" = "echo" ]; then
    cat ./logs/vity.pid
else
    echo "$0 [build|start|restart|stop|echo]"
fi
