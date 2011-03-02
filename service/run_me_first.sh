#!/bin/sh

# ===============================================================================
# Copyright (C) 2011 Thibaud Gaillard <thibaud.gaillard@gmail.com>
# Copyright (C) 2011 WebOS Internals <support@webos-internals.org>
#
# This program is free software; you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free Software
# Foundation; either version 2 of the License, or (at your option) any later 
# version.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with
# this program; if not, write to the Free Software Foundation, Inc., 51 Franklin
# Street, Fifth Floor, Boston, MA  02110-1301, USA.
# ===============================================================================

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
