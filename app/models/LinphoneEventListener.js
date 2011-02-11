/*
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
*/

var LinphoneEventListener = {

  signalUri: "palm://com.palm.bus/signal/",

  /* General State & associated message*/
  gstateHandler : null,

  gstateSubscribe: function (callback) {
    // Subscribe to Battery Power Notifications
    this.gstateHandler = new Mojo.Service.Request (this.signalUri, {
      method: "addmatch",
      parameters: {
	category: "/linphone",
	method:   "generalState"
      },
      onSuccess: callback,
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneEventListener#gstateSubscribe failure: %j", reason.errorText);
	if (callback) callback (reason);
      }
    });
  },

  gstateUnsubscribe: function () {
    if (this.gstateHandler) {
      this.gstateHandler.cancel ();
      delete this.gstateHandler;
    }
  },

  /* Display Status */
  dstatusHandler : null,

  dstatusSubscribe: function (callback) {
    // Subscribe to Battery Power Notifications
    this.dstatusHandler = new Mojo.Service.Request (this.signalUri, {
      method: "addmatch",
      parameters: {
	category: "/linphone",
	method:   "displayStatus"
      },
      onSuccess: callback,
      onFailure: callback
    });
  },

  dstatusUnsubscribe: function () {
    if (this.dstatusHandler) {
      this.dstatusHandler.cancel ();
      delete this.dstatusHandler;
    }
  },

  /* Display Something */
  dsomethingHandler : null,

  dsomethingSubscribe: function (callback) {
    // Subscribe to Battery Power Notifications
    this.dsomethingHandler = new Mojo.Service.Request (this.signalUri, {
      method: "addmatch",
      parameters: {
	category: "/linphone",
	method:   "displaySomething"
      },
      onSuccess: callback,
      onFailure: callback
    });

  },

  dsomethingUnsubscribe: function () {
    if (this.dsomethingHandler) {
      this.dsomethingHandler.cancel ();
      delete this.dsomethingHandler;
    }
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // Only to end the function list with no trailing comma...
  dummy: false

};
