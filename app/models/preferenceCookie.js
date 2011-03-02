/*
 ===============================================================================
 Copyright (C) 2011 Thibaud Gaillard <thibaud.gaillard@gmail.com>
 Copyright (C) 2011 WebOS Internals <support@webos-internals.org>

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
*/

var preferenceCookie = {

  // Public

  data: {
    sipName:     false,
    sipPassword: false,
    sipDomain:   false,
    sipUseProxy: false,
    sipUpdated:  false,
    sipValid:    false,

    sipUnregisterOnExit: true
  },

  load: function () {
//    QDLogger.log ("preferenceCookie#load");

    try {
      this.init ();
      var data = this.cookie.get ();
      if (data) {
//	QDLogger.log ("preferenceCookie#load: from COOKIE");
	for (i in data) {
	  this.data[i] = data[i];
	}
      }
      return this.data;
    }
    catch (error) {
      QDLogger.error("preferenceCookie#load", error);
    }

  },

  save: function (data, value) {
//    QDLogger.log ("preferenceCookie#save");

    try {
      this.init ();
      if (data) {
	if (value !== undefined) {
	  this.data[data] = value;
//	  QDLogger.log("preferenceCookie#save:", data," =", value);
	} else {
	  for (i in data) {
	    this.data[i] = data[i];
	  }
	}
      }
      this.cookie.put (this.data);
    }
    catch (error) {
      QDLogger.error("preferenceCookie#save", error);
    }

  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // Private

  cookie: false,

  init: function () {
//    QDLogger.log ("preferenceCookie#init");
    if (!this.cookie) {
//      QDLogger.log ("preferenceCookie#init COOKIE");
      this.cookie = new Mojo.Model.Cookie ("Preferences");
    }
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // Just so a comma can be left above...
  trailer: false

};
