#!/bin/sh

LINPHONEDIR="`dirname $0`"
export LD_LIBRARY_PATH=`cd $LINPHONEDIR; pwd`

MACHINE="`uname -m`"

if [ "$MACHINE" != "i686" ]; then
  SCENARIO="`luna-send -n 1 palm://com.palm.audio/media/getCurrentScenario '' 2>&1 | tr ':' '\012' | tr -d '{}' | tail -1`"
  luna-send -n 1 palm://com.palm.audio/media/setCurrentScenario '{"scenario":"media_front_speaker"}' 2>&1 | cat > /dev/null
fi
$LINPHONEDIR/linphonec ${1+"$@"}
if [ "$MACHINE" != "i686" ]; then
  luna-send -n 1 palm://com.palm.audio/media/setCurrentScenario '{"scenario":'$SCENARIO'}' 2>&1 | cat > /dev/null
fi
