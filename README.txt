 ===============================================================================
 Copyright (C) 2011 WebOS Internals <support@webos-internals.org>
 Copyright (C) 2011 Thibaud Gaillard <thibaud.gaillard@gmail.com>

 This program is free software; you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation; either version 2 of the License, or (at your option) any later 
 version.

 This program is distributed in the hope that it will be useful, but WITHOUT
 ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program; if not, write to the Free Software Foundation, Inc., 51 Franklin
 Street, Fifth Floor, Boston, MA  02110-1301, USA.
 ===============================================================================

In order to run the service, please:

 - First log into the Pre and go to the application directory

   cd /media/cryptofs/apps/usr/palm/applications/org.webosinternals.linphone
   
 - Then execute a script to add rx mode bits on scripts and executable

   sh service/run_me_first.sh

 - Then manually launch the service (asking for states to be shown on stdout)

   service/bin/lps.sh -S &

 
