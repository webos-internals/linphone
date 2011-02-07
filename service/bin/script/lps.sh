#!/bin/sh

LINPHONEDIR="`dirname $0`"
export LD_LIBRARY_PATH=$LINPHONEDIR
$LINPHONEDIR/linphoneservice ${1+"$@"}
