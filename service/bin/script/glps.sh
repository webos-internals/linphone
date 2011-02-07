#!/bin/sh

LINPHONEDIR="`dirname $0`"
export LD_LIBRARY_PATH=$LINPHONEDIR
gdb $LINPHONEDIR/linphoneservice ${1+"$@"}
