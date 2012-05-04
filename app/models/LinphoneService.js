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

var LinphoneService = {

  lpsUri: "palm://" + Mojo.appInfo.id + ".service",

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  version: function (callback) {
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "version",
      onSuccess: callback,
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#version failure:", reason.errorText);
	if (callback) callback (reason);
      }
    });
    return request;
  },

  status: function (callback) {
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "status",
      onSuccess: callback,
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#status failure:", reason.errorText);
	if (callback) callback (reason);
      }
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
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#register failure:", reason.errorText);
	if (callback) callback (reason);
      }
    });
    return request;
  },

  unregister: function (callback) {
    QDLogger.log("LinphoneService#unregister");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "unregister",
      onSuccess: callback,
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#unregister failure:", reason.errorText);
	if (callback) callback (reason);
      }
    });
    return request;
  },

  firewall: function (policy, address, callback) {
    QDLogger.log("LinphoneService#firewall: policy =", policy, "/ address =", address);
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "firewall",
      parameters: {
	"policy": policy,
	"address": address
      },
      onSuccess: callback,
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#firewall failure:", reason.errorText);
	if (callback) callback (reason);
      }
    });
    return request;
  },

  dtmfMethod: function (method, callback) {
    QDLogger.log("LinphoneService#dtmfMethod: method =", method);
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "dtmfMethod",
      parameters: {
        "dtmfMethod": method
      },
      onSuccess: callback,
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#dtmfMethod failure:", reason.errorText);
	if (callback) callback (reason);
      }
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
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#call failure:", reason.errorText);
	if (callback) callback (reason);
      }
    });
    return request;
  },

  answer: function (callback) {
    QDLogger.log("LinphoneService#answer");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "answer",
      onSuccess: callback,
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#answer failure:", reason.errorText);
	if (callback) callback (reason);
      }
    });
    return request;
  },

  callInfo: function (callback) {
    QDLogger.log("LinphoneService#callInfo");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "callInfo",
      onSuccess: callback,
      onFailure: function (reason) {
        QDLogger.error ("LinphoneService#callInfo failure:", reason.errorText);
        if (callback) callback (reason);
      }
    });
    return request;
  },

  sendDTMF: function (dtmf, callback) {
    QDLogger.log("LinphoneService#sendDtmf: dtmf =", dtmf);
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "sendDtmf",
      parameters: {
	"dtmf": dtmf,
      },
      onSuccess: callback,
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#sendDtmf failure:", reason.errorText);
	if (callback) callback (reason);
      }
    });
    return request;
  },

  terminate: function (callback) {
    QDLogger.log("LinphoneService#terminate");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "terminate",
      onSuccess: callback,
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#terminate failure:", reason.errorText);
	if (callback) callback (reason);
      }
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
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#signalGState failure:", reason.errorText);
	if (callback) callback (reason);
      }
    });
    return request;
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  quit: function (callback) {
    QDLogger.log("LinphoneService#quit");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "quit",
      onSuccess: callback,
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#quit failure:", reason.errorText);
	if (callback) callback (reason);
      }
    });
    return request;
  },

  abort: function (callback) {
    QDLogger.log("LinphoneService#abort");
    var request = new Mojo.Service.Request(this.lpsUri, {
      method: "abort",
      onSuccess: callback,
//      onFailure: callback
      onFailure: function (reason) {
	QDLogger.error ("LinphoneService#abort failure:", reason.errorText);
	if (callback) callback (reason);
      }
    });
    return request;
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // Only to end the function list with no trailing comma...
  dummy: false

}
