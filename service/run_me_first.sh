#!/bin/sh

SCRIPTDIR="`dirname $0`"

ARCH_LIST="\
 armv7 \
 armv6 \
 i686 \
 "

PROG_LIST="\
 linphoneservice \
 linphonec  \
 linphonecsh \
 lp.sh \
 lps.sh \
 glp.sh \
 glps.sh \
 "

for arch in $ARCH_LIST; do
  for prog in $PROG_LIST; do
    file="$SCRIPTDIR/bin/$arch/$prog"
    if [ -f $file ]; then
      echo "Setting rx bits on $file"
      chmod a+rx $file
    fi
  done
done
