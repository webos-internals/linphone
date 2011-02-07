#!/bin/sh

LINPHONEDIR="`dirname $0`"
export LD_LIBRARY_PATH=`cd $LINPHONEDIR; pwd`

scenario="`luna-send -n 1 palm://com.palm.audio/media/getCurrentScenario '' 2>&1 | tr ':' '\012' | tr -d '{}' | tail -1`"
luna-send -n 1 palm://com.palm.audio/media/setCurrentScenario '{"scenario":"media_front_speaker"}' 2>&1 | cat > /dev/null
$LINPHONEDIR/linphonec ${1+"$@"}
luna-send -n 1 palm://com.palm.audio/media/setCurrentScenario '{"scenario":'$scenario'}' 2>&1 | cat > /dev/null
