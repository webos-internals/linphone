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

var LinphoneCallState = {

// General state as returned by the linphone service (3 groups: power/registration/call)
  GlobalOff          : "GlobalOff",
  GlobalStartup      : "GlobalStartup",
  GlobalOn           : "GlobalOn",
  GlobalShutdown     : "GlobalShutdown",
  
  RegistrationNone           : "RegistrationNone",
  RegistrationOk             : "RegistrationOk",
  RegistrationFailed         : "RegistrationFailed",
  RegistrationProgress       : "RegistrationProgress",
  RegistrationCleared        : "RegistrationCleared",
  
  CallIdle          : "CallIdle",
  CallOutgoingInit    : "CallOutgoingInit",
  CallOutgoingProgress : "CallOutgoingProgress",
  CallOutgoingRinging   : "CallOutgoingRinging",
  CallOutgoingEarlyMedia : "CallOutgoingEarlyMedia",
  CallIncomingReceived     : "CallIncomingReceived",
  CallConnected : "CallConnected",
  CallStreamsRunning : "CallStreamsRunning",
  CallPausing : "CallPausing",
  CallPaused : "CallPaused",
  CallResuming : "CallResuming",
  CallRefered : "CallRefered",
  CallEnd           : "CallEnd",
  CallError         : "CallError",
  

  INVALID            : "INVALID",

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  generalState:  null,

  powerState:    null,
  registerState: null,
  callState:     null,
  
  powerEvent:    false,
  registerEvent: false,
  callEvent:     false,
  callInEvent:   false,
  callOutEvent:  false,

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  initialize: function (params) {
  },

  update: function (newstate, message, anyCB, pwrCB, regCB, callCB, callInCB, callOutCB, invCB) {

    this.generalState  = newstate;
//    QDLogger.log ("LinphoneCallState#update: newstate =", newstate, "/ this.generalState =", this.generalState);
    if (anyCB) anyCB (newstate, message);

    this.powerEvent    = false;
    this.registerEvent = false;
    this.callEvent     = false;
    this.callInEvent   = false;
    this.callOutEvent  = false;

    switch (newstate) {

    case this.GlobalOff:
    case this.GlobalStartup:
    case this.GlobalOn:
    case this.GlobalShutdown:
      this.powerState = newstate;
//      QDLogger.log ("LinphoneCallState#update: powerState =", newstate, "/ this.powerState =", this.powerState);
      this.powerEvent = true;
      if (newstate !== this.GlobalOn) {
	this.callState = false;
	if (callCB) callCB (newstate, message);
	this.registerState = false;
	if (regCB) regCB (newstate, message);
      }
      if (pwrCB) pwrCB (newstate, message);
      break;

    case this.RegistrationNone:
    case this.RegistrationOk:
    case this.RegistrationProgress:
    case this.RegistrationFailed:
      this.powerState = this.GlobalOn;
      this.registerState = newstate;
//      QDLogger.log ("LinphoneCallState#update: registerState =", newstate, "/ this.registerState =", this.registerState);
      this.registerEvent = true;
      // Beware: RegistrationOk is a special case as Linphone periodically confirms registration...
      if (newstate !== this.RegistrationOk) {
	this.callState = false;
	if (callCB) callCB (newstate, message);
      }
      if (regCB) regCB (newstate, message);
      break;

    case this.CallIdle:
    case this.CallEnd:
    case this.CallError:
      this.powerState    = this.GlobalOn;
      this.registerState = this.RegistrationOk;
      this.callState = newstate;
      this.callEvent = true;
      if (callCB) callCB (newstate, message);
      break;

    case this.CallOutgoingInit:
    case this.CallOutgoingRinging:
      this.powerState    = this.GlobalOn;
      this.registerState = this.RegistrationOk;
      this.callState    = newstate;
      this.callEvent    = true;
      this.callOutEvent = true;
      if (callOutCB) callOutCB (newstate, message);
      break;

    case this.CallIncomingReceived:
      this.powerState    = this.GlobalOn;
      this.registerState = this.RegistrationOk;
      this.callState   = newstate;
      this.callEvent   = true;
      this.callInEvent = true;
      if (callInCB) callInCB (newstate, message);
      break;

    case this.CallConnected:
      this.powerState    = this.GlobalOn;
      this.registerState = this.RegistrationOk;
      this.callState   = newstate;
      this.callEvent   = true;

      if(this.callInEvent) {
        if (callInCB) callInCB (newstate, message);
      }
      else if(this.callOutEvent) {
        if (callOutCB) callOutCB (newstate, message);
      }
      break;

    case this.INVALID:
      this.powerState = newstate;
      this.regState   = newstate;
      this.callState  = newstate;
      if (invCB) incCB (newstate, message);
      break;

    }
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  powerOK: function () {
    var status = (this.powerState === this.GlobalOn);
//    QDLogger.log ("LinphoneCallState#powerOK?", status, "[ this.powerState =", this.powerState, "]");
    return status;
  },

  registerNONE: function () {
//    QDLogger.log ("LinphoneCallState#registerNONE?");
    return (   this.powerOK ()
	    && (   !this.registerState
		|| (this.registerState === this.RegistrationFailed)
	       )
	   );
  },

  registerPENDING: function () {
//    QDLogger.log ("LinphoneCallState#registerPENDING?");
    return (   this.powerOK ()
	    && (this.registerState === this.RegistrationProgress)
	   );
  },

  registerVALID: function () {
//    QDLogger.log ("LinphoneCallState#registerVALID?");
    return (   this.powerOK ()
	    && (this.registerState === this.RegistrationOk)
	   );
  },

  registerFAILED: function () {
//    QDLogger.log ("LinphoneCallState#registerFAILED?");
    return (    this.powerOK ()
	    &&  (this.registerState === this.RegistrationFailed)
	   );
  },

  callIDLE: function () {
//    QDLogger.log ("LinphoneCallState#callNONE?");
    return (   this.registerVALID ()
	    && (   !this.callState
		|| (this.callState  === this.CallIdle)
	       )
	   );
  },

  callACTIVE: function () {
//    QDLogger.log ("LinphoneCallState#callACTIVE?");
    return (   this.callDIALING ()
	    || this.callRINGOUT ()
	    || this.callCONNECTED ()
	   );
  },

  callFAILED: function () {
//    QDLogger.log ("LinphoneCallState#callFAILED?");
    return (   this.registerVALID ()
	    && (this.callState === this.CallError)
	   );
  },

  callDIALING: function () {
//    QDLogger.log ("LinphoneCallState#callDIALING?");
    return (   this.registerVALID ()
	    && (this.callState === this.CallOutgoingInit)
	   );
  },

  callRINGOUT: function () {
//    QDLogger.log ("LinphoneCallState#callRINGOUT?");
    return (   this.registerVALID ()
	    && (this.callState === this.CallOutgoingRinging)
	   );
  },

  callRINGIN: function () {
//    QDLogger.log ("LinphoneCallState#callRINGIN?");
    return (   this.registerVALID ()
	    && (this.callState === this.CallIncomingReceived)
	   );
  },

  callCONNECTED: function () {
//    QDLogger.log ("LinphoneCallState#callCONNECTED?");
    return (   this.registerVALID ()
	    && (this.callState === this.CallConnected)
	   );
  },

  callENDED: function () {
//    QDLogger.log ("LinphoneCallState#callENDED?");
    return (   this.registerVALID ()
	    && (this.callState === this.CallEnd)
	   );
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // Only to end the function list with no trailing comma...
  dummy: false
    
}
