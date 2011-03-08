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

VERSION = 0.2.4

STAGING_DIR = /srv/preware/cross-compile/staging/${ARCH}
CC = gcc

# Target the final installation & force a different runtime dir (used to be ${STAGING_DIR}/usr/lib, now rpath-linked... Quite nice!)
PID = org.webosinternals.linphone
RUNTIME_DIR = /var/usr/lib/${PID}

CFLAGS  := -g -DVERSION=\"${VERSION}\" -I${STAGING_DIR}/usr/include/glib-2.0 -I${STAGING_DIR}/usr/lib/glib-2.0/include -I${STAGING_DIR}/usr/include
LDFLAGS := -g -L${STAGING_DIR}/usr/lib -Wl,-rpath,${RUNTIME_DIR} -Wl,-rpath-link,${STAGING_DIR}/usr/lib -llunaservice -lmjson -lglib-2.0 -llinphone

linphoneservice: linphoneservice.o luna_service.o luna_methods.o

HOST = cdma-pre

install: linphoneservice
#	- ssh root@${HOST} killall org.webosinternals.linphoneservice
#	scp linphoneservice root@${HOST}:/var/usr/sbin/org.webosinternals.linphoneservice.new
#	ssh root@${HOST} mv /var/usr/sbin/org.webosinternals.linphoneservice.new /var/usr/sbin/org.webosinternals.linphoneservice
	novacom put file://home/root/linphoneservice < linphoneservice

clobber:
	rm -rf *.o linphoneservice
