#!/bin/sh

LINPHONEDIR="`dirname $0`"
export LD_LIBRARY_PATH=`cd $LINPHONEDIR; pwd`
gdb $LINPHONEDIR/linphonec ${1+"$@"}
