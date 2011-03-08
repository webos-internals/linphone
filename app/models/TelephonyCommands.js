var TelephonyCommands = {

  dtmfUri    : "palm://com.palm.audio/dtmf",

  sendDTMF: function(tone, feedback){
    var request = new Mojo.Service.Request(this.dtmfUri, {
      method: ("playDTMF"),
      parameters: ({
	"id": tone,
	oneshot: true,
	feedbackOnly: feedback
      })
    });
    return request;
  },
  
  startDTMF: function(tone, feedback){
    var request = new Mojo.Service.Request(this.dtmfUri, {
      method: ("playDTMF"),
      parameters: ({
	"id": tone,
	oneshot: false,
	feedbackOnly: feedback
      })
    });
    return request;
  },
  
  endDTMF: function(tone){
    var request = new Mojo.Service.Request(this.dtmfUri, {
      method: ("stopDTMF"),
      parameters: {}
    });
    return request;
 },
  
  
/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  displayUri : "palm://com.palm.display/control",

  proxSet: function(state, callback) {
    var request = new Mojo.Service.Request(this.displayUri, {
      method: "setProperty",
      parameters: {
	"proximityEnabled": state,
	"client": Mojo.appInfo.id,
      },
      onSuccess: function(payload){
	if (callback) callback(payload);
      },
      onFailure: function() {
	QDLogger.log( "TelephonyCommands#proxSet: failure (state =" + state + ")");
      }
    });
    return request;
  },
  
  // DNAST == Disable Notification Auto/And Screen Timeout???
  displayDNAST: function(enable, callback) {
    var request = new Mojo.Service.Request(this.displayUri, {
      method: "setProperty",
      parameters: {
	"requestBlock": enable,
	"client": Mojo.appInfo.id,
      },
      onSuccess: function(payload){
	if (callback) callback(payload);
      },
      onFailure: function() {
	QDLogger.log( "TelephonyCommands#displayDNAST: failure (enable =" + enable + ")");
      }
    });
    
    return request;
  },

  displayChangeBlockWithTimeout: function(callback, timeout) {
    var req = this.displayDNAST(true, callback);
    if (req) {
      tosec = timeout ? timeout : 60;
      req = this.cancelRequestAfterTimeout(req, tosec * 1000);
    }
    return req;
  },
  
  cancelRequestAfterTimeout: function(request, timeout) {
    var r = {};
    if (request) {
      r.req = request;
      r.cancel = function() {
	if (this.req) {
	  this.req.cancel();
	  clearTimeout(r.timer);
	  delete this.req;
	}
      }
      
      r.timer = setTimeout(function() {
	r.cancel();
      }, timeout);
    }
		
    return r;
    
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  audioUri: "palm://com.palm.audio/media",
  
  lockVolumeKeys: function (enable, callback) {
    QDLogger.log( "TelephonyCommands#lockVolumeKeys:", enable);
    var request = new Mojo.Service.Request (this.audioUri, {
      method: "lockVolumeKeys",
      parameters: {
        subscribe: enable,
	foregroundApp: true
      },
      onSuccess: callback,
      onFailure: function() {
	QDLogger.log( "TelephonyCommands#lockVolumeKeys: failure (enable =" + enable + ")");
      }
    });
    return request;
  },

  subscribeAudioRouting: function (callback) {
//?    Mojo.Controller.getAppController().assistant.audioEnabledProfiles = new Object();
    // Subscribe to audio notifications
    
    var request = new Mojo.Service.Request (this.audioUri, {
      method: "status",
      parameters: {
        subscribe: true
      },
      onSuccess: callback
    });
//?  this.tempSaveRequest("subscribeAudioRoutingStatus", request);
    
    // Get the list of available audio scenarios now
    request = new Mojo.Service.Request (this.audioUri, {
      method: "listScenarios",
      parameters: {
        enabled: true
      },
      onSuccess: callback
    });
//?  this.tempSaveRequest("subscribeAudioRoutingList", request);
    return request;
  },
    
  setAudioScenario: function (scenario) {
    var request = new Mojo.Service.Request (this.audioUri, {
      method: "setCurrentScenario",
      parameters: {
        scenario: scenario
      },
      onSuccess: function () {
	QDLogger.log( "TelephonyCommands#setAudioScenario", "success");
      },
      onFailure: function () {
	QDLogger.log( "TelephonyCommands#setAudioScenario", "failure");
      }
    });
//  this.tempSaveRequest("setAudioScenario", request);
    return request;
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

//?   svcUri: "palm://com.palm.telephony",
//? 
//?   setPower: function (state, callback) {
//?     QDLogger.log( "TelephonyCommands#setPower", state);
//?     var request = new Mojo.Service.Request(this.svcUri, {
//?       method: "powerSet",
//?       parameters: {
//?         "state": (state ? "on" : "off")
//?       },
//?       onSuccess: callback,
//?       onFailure: callback
//?     });
//? //?    this.tempSaveRequest("powerSet", request);
//?     return request;
//?   },
//?   
//?   getPower: function (subscribe, callback) {
//?     var request = new Mojo.Service.Request(this.svcUri, {
//?       method: "powerQuery",
//?       parameters: {
//? 	"subscribe": subscribe
//?       },
//?       onSuccess: callback,
//?       onFailure: function() {
//? 	QDLogger.log( "TelephonyCommands#getPower", "failure");
//?       }
//?     });
//? //?    this.saveRequest(request);
//?     return request;
//?   },
//?   
//?   getNetworkStatus: function(subscribe, callback){
//?     var request = new Mojo.Service.Request (this.svcUri, {
//?       method: "networkStatusQuery",
//?       parameters: {
//? 	"subscribe": subscribe
//?       },
//?       onSuccess: callback,
//?       onFailure: function() {
//? 	QDLogger.log( "TelephonyCommands#getNetworkStatus", "failure");
//?       }
//?     });
//? //?    this.saveRequest(request);
//?     return request;
//?   },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  powerUri: "palm://com.palm.power/com/palm/power",

  powerStartActivity: function (id, duration, callback) {
    var request = new Mojo.Service.Request (this.powerUri, {
      method: "activityStart",
      parameters: {
        id: Mojo.appInfo.id, //id,
        duration_ms: duration
      },
      onSuccess: callback,
      onFailure: function() {
	QDLogger.log( "TelephonyCommands#powerStartActivity", "failure");
      }
    });
  },

  powerEndActivity: function (id, callback) {
    var request = new Mojo.Service.Request (this.powerUri, {
      method: "activityEnd",
      parameters: {
        id: Mojo.appInfo.id, //id,
      },
      onSuccess: callback,
      onFailure: function() {
	QDLogger.log( "TelephonyCommands#powerEndActivity", "failure");
      }
    });
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  signalUri: "palm://com.palm.bus/signal",

  puckStatusSubscribe: function(callback) {
    var request = new Mojo.Service.Request (this.signalUri, {
      method: "addmatch",
      parameters: {"category":"/com/palm/power","method":"chargerStatus"},
      onSuccess: callback,
      onFailure: function() {
	QDLogger.log( "TelephonyCommands#puckStatusSubscribe", "failure");
      }
    });
    
    return request;
  },

 /* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

 // Only to end the function list with no trailing comma...
  dummy: false
    
}

