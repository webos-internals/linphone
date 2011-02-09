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

var LinphoneService = {

  lpsUri: "palm://" + Mojo.appInfo.id + ".service",

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  version: function(callback) {
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "version",
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

  status: function (callback) {
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "status",
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  register: function (name, password, domain, proxy, callback) {
    QDLogger.log("LinphoneService#register: name =", name, "/ password =", password, "/ domain =", domain, "/ proxy =", proxy);
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "register",
      parameters: {
	"identity": "sip:" + name + "@" + domain,
	"password": password,
	"proxy":    "sip:" + proxy,
      },
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

  unregister: function (callback) {
    QDLogger.log("LinphoneService#unregister");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "unregister",
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

  call: function (number, callback) {
    QDLogger.log("LinphoneService#call: number =", number);
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "call",
      parameters: {
	"sipurl": number,
      },
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

  answer: function (callback) {
    QDLogger.log("LinphoneService#answer");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "answer",
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

  terminate: function (callback) {
    QDLogger.log("LinphoneService#terminate");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "terminate",
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  soundcardList: function (callback) {
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "soundcardList",
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

  soundcardUse: function (device, callback) {
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "soundcardUse",
      parameters: {
	"device": device,
      },
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

  soundcardShow: function (callback) {
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "soundcardShow",
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

  ipv6: function (callback) {
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "ipv6",
      parameters: {
	"enable": device,
      },
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

  signalGState: function (callback) {
    QDLogger.log("LinphoneService#signalGState");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "signalGState",
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  quit: function (callback) {
    QDLogger.log("LinphoneService#quit");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "quit",
      onSuccess: callback,
      onFailure: callback
    });
    return request;
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // Only to end the function list with no trailing comma...
  dummy: false

}
