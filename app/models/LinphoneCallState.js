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
  POWER_OFF          : "POWER_OFF",
  POWER_STARTUP      : "POWER_STARTUP",
  POWER_ON           : "POWER_ON",
  POWER_SHUTDOWN     : "POWER_SHUTDOWN",
  
  REG_NONE           : "REG_NONE",
  REG_OK             : "REG_OK",
  REG_FAILED         : "REG_FAILED",
  REG_PENDING        : "REG_PENDING",
  
  CALL_IDLE          : "CALL_IDLE",
  CALL_OUT_INVITE    : "CALL_OUT_INVITE",
  CALL_OUT_RINGING   : "CALL_OUT_RINGING",
  CALL_OUT_CONNECTED : "CALL_OUT_CONNECTED",
  CALL_IN_INVITE     : "CALL_IN_INVITE",
  CALL_IN_CONNECTED  : "CALL_IN_CONNECTED",
  CALL_END           : "CALL_END",
  CALL_ERROR         : "CALL_ERROR",

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

    case this.POWER_OFF:
    case this.POWER_STARTUP:
    case this.POWER_ON:
    case this.POWER_SHUTDOWN:
      this.powerState = newstate;
//      QDLogger.log ("LinphoneCallState#update: powerState =", newstate, "/ this.powerState =", this.powerState);
      this.powerEvent = true;
      if (newstate !== this.POWER_ON) {
	this.callState = false;
	if (callCB) callCB (newstate, message);
	this.registerState = false;
	if (regCB) regCB (newstate, message);
      }
      if (pwrCB) pwrCB (newstate, message);
      break;

    case this.REG_NONE:
    case this.REG_OK:
    case this.REG_PENDING:
    case this.REG_FAILED:
      this.powerState = this.POWER_ON;
      this.registerState = newstate;
//      QDLogger.log ("LinphoneCallState#update: registerState =", newstate, "/ this.registerState =", this.registerState);
      this.registerEvent = true;
      // Beware: REG_OK is a special case as Linphone periodically confirms registration...
      if (newstate !== this.REG_OK) {
	this.callState = false;
	if (callCB) callCB (newstate, message);
      }
      if (regCB) regCB (newstate, message);
      break;

    case this.CALL_IDLE:
    case this.CALL_END:
    case this.CALL_ERROR:
      this.powerState    = this.POWER_ON;
      this.registerState = this.REG_OK;
      this.callState = newstate;
      this.callEvent = true;
      if (callCB) callCB (newstate, message);
      break;

    case this.CALL_OUT_INVITE:
    case this.CALL_OUT_RINGING:
    case this.CALL_OUT_CONNECTED:
      this.powerState    = this.POWER_ON;
      this.registerState = this.REG_OK;
      this.callState    = newstate;
      this.callEvent    = true;
      this.callOutEvent = true;
      if (callOutCB) callOutCB (newstate, message);
      break;

    case this.CALL_IN_INVITE:
    case this.CALL_IN_CONNECTED:
      this.powerState    = this.POWER_ON;
      this.registerState = this.REG_OK;
      this.callState   = newstate;
      this.callEvent   = true;
      this.callInEvent = true;
      if (callInCB) callInCB (newstate, message);
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
    var status = (this.powerState === this.POWER_ON);
//    QDLogger.log ("LinphoneCallState#powerOK?", status, "[ this.powerState =", this.powerState, "]");
    return status;
  },

  registerNONE: function () {
//    QDLogger.log ("LinphoneCallState#registerNONE?");
    return (   this.powerOK ()
	    && (   !this.registerState
		|| (this.registerState === this.REG_FAILED)
	       )
	   );
  },

  registerPENDING: function () {
//    QDLogger.log ("LinphoneCallState#registerPENDING?");
    return (   this.powerOK ()
	    && (this.registerState === this.REG_PENDING)
	   );
  },

  registerVALID: function () {
//    QDLogger.log ("LinphoneCallState#registerVALID?");
    return (   this.powerOK ()
	    && (this.registerState === this.REG_OK)
	   );
  },

  registerFAILED: function () {
//    QDLogger.log ("LinphoneCallState#registerFAILED?");
    return (    this.powerOK ()
	    &&  (this.registerState === this.REG_FAILED)
	   );
  },

  callIDLE: function () {
//    QDLogger.log ("LinphoneCallState#callNONE?");
    return (   this.registerVALID ()
	    && (   !this.callState
		|| (this.callState  === this.CALL_IDLE)
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
	    && (this.callState === this.CALL_ERROR)
	   );
  },

  callDIALING: function () {
//    QDLogger.log ("LinphoneCallState#callDIALING?");
    return (   this.registerVALID ()
	    && (this.callState === this.CALL_OUT_INVITE)
	   );
  },

  callRINGOUT: function () {
//    QDLogger.log ("LinphoneCallState#callRINGOUT?");
    return (   this.registerVALID ()
	    && (this.callState === this.CALL_OUT_RINGING)
	   );
  },

  callRINGIN: function () {
//    QDLogger.log ("LinphoneCallState#callRINGIN?");
    return (   this.registerVALID ()
	    && (this.callState === this.CALL_IN_INVITE)
	   );
  },

  callCONNECTED: function () {
//    QDLogger.log ("LinphoneCallState#callCONNECTED?");
    return (   this.registerVALID ()
	    && (   (this.callState === this.CALL_OUT_CONNECTED)
		|| (this.callState === this.CALL_IN_CONNECTED)
	       )
	   );
  },

  callENDED: function () {
//    QDLogger.log ("LinphoneCallState#callENDED?");
    return (   this.registerVALID ()
	    && (this.callState === this.CALL_END)
	   );
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // Only to end the function list with no trailing comma...
  dummy: false
    
}
