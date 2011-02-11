var DialpadAssistant = Class.create ({

  DIAL_PREFIX_DELAY: 750, // ms to wait before adding dialing prefix when typing numbers
  POWER_MAX_ACTIVITY: 15*60*1000,

  prefs: false,

  menuModel: {
    visible: true,
    items: [
      {
	label:   "Preferences",
	command: 'do-prefs'
      },
      {
	label:   "Help",
	command: 'do-help'
      }
    ]
  },

  initialize: function (params) {
    QDLogger.log ("DialpadAssistant#initialize");

    this.dialString = "";
    this.inputNecessaryButtonsVisible = true;

  },

  setup: function () {
    QDLogger.log ("DialpadAssistant#setup");

    // Setup menu
    this.controller.setupWidget (Mojo.Menu.appMenu, {omitDefaultItems: true}, this.menuModel);

    // Bind to dialpad number buttons
    var that = this;
    ['b_1', 'b_2', 'b_3', 'b_4', 'b_5', 'b_6', 'b_7',
     'b_8', 'b_9', 'b_0', 'b_*', 'b_#'].each (function (key) {
       var button = that.controller.get (key);
       button.observe ('mousedown', that.numberClick.bindAsEventListener (that, key.charAt (2)));
//	 button.observe (Mojo.Event.hold, that.handleHeldKey.bindAsEventListener (that, key.charAt (2)));
     });

    // Other dialpad area buttons
    this.controller.get ('delete_button'    ).observe (Mojo.Event.tap,  this.back.bindAsEventListener (this));
    this.controller.get ('delete_button'    ).observe (Mojo.Event.hold, this.clear.bindAsEventListener (this));
    this.controller.get ('empty_button'     ).observe (Mojo.Event.tap,  this.emptyClick.bindAsEventListener (this));
    this.controller.get ('dial_button'      ).observe (Mojo.Event.tap,  this.dialClick.bindAsEventListener (this));
    this.controller.get ('disconnect_button').observe (Mojo.Event.tap,  this.disconnectClick.bindAsEventListener (this));

    if (this.controller.get ('dial_hinttext')) {
      this.controller.get ('dial_hinttext').innerHTML = "Enter number..."; //"Enter name or number...";
    }
    this.disableInputNecessaryButtons ();
//?    this.controller.get ('phone-menu').addClassName ("fixed");

//?    TelephonyCommands.powerStartActivity ('linphone', this.POWER_MAX_ACTIVITY);
    TelephonyCommands.proxSet (false);
    TelephonyCommands.setAudioScenario ("media_back_speaker");

    // Subscribe to the linphone GState signal and ask for a very first one (events are sent only once in event-driven schemes...)
    LinphoneEventListener.gstateSubscribe (this.gstateUpdate.bind (this));
    LinphoneService.signalGState ();

    // Say we must try to register
    this.forceRegistration = true;
  },

  activate: function (args) {
    QDLogger.log ("DialpadAssistant#activate");

    this.prefs = preferenceCookie.load ();
    QDLogger.log ("DialpadAssistant#activate: sipName     =",         this.prefs.sipName);
    QDLogger.log ("DialpadAssistant#activate: sipPassword =",         this.prefs.sipPassword);
    QDLogger.log ("DialpadAssistant#activate: sipDomain   =",         this.prefs.sipDomain);
    QDLogger.log ("DialpadAssistant#activate: sipUseProxy =",         this.prefs.sipUseProxy);
    QDLogger.log ("DialpadAssistant#activate: sipProxy    =",         this.prefs.sipProxy);
    QDLogger.log ("DialpadAssistant#activate: sipUpdated  =",         this.prefs.sipUpdated);
    QDLogger.log ("DialpadAssistant#activate: sipValid    =",         this.prefs.sipValid);
    QDLogger.log ("DialpadAssistant#activate: sipUnregisterOnExit =", this.prefs.sipUnregisterOnExit);

    // Register if SIP parameters were updated
    if (   (   this.forceRegistration 
	    || this.prefs.sipUpdated
	   )
	&& this.prefs.sipValid
	&& LinphoneCallState.powerOK ()) {
      QDLogger.log ("DialpadAssistant#activate: registering...");

      this.forceRegistration = false;
      LinphoneService.register (this.prefs.sipName, this.prefs.sipPassword, this.prefs.sipDomain, this.prefs.sipUseProxy ? this.prefs.sipProxy : this.prefs.sipDomain);
      preferenceCookie.save ("sipUpdated", false);
    }

    // keyboard and document listeners
//    this.controller.listen (this.controller.sceneElement, Mojo.Event.keyup, this.handleKeyUp);
//    this.controller.listen (this.controller.sceneElement, Mojo.Event.keydown, this.handleKeyDown);
  },

  deactivate: function () {
    QDLogger.log ( "DialpadAssistant#deactivate");
  },

  cleanup: function () {
    QDLogger.log ( "DialpadAssistant#cleanup");
    TelephonyCommands.displayDNAST (false);
    TelephonyCommands.proxSet (false);
    TelephonyCommands.setAudioScenario ("media_back_speaker");
//?    TelephonyCommands.powerEndActivity ('linphone');

    if (this.prefs.sipUnregisterOnExit) {
      LinphoneService.unregister ();
      LinphoneEventListener.gstateUnsubscribe ();
    }
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // Catch LinphoneService events and dispatch/handle them using callbacks
  gstateUpdate: function (payload) {
    QDLogger.log ("DialpadAssistant#gstateUpdate [", payload.generalState, ", (", (!payload.message || (payload.message === "")) ? "." : payload.message, ")]")

    if (!payload.generalState)
      return;
    
    this.handleInitBind ();

    this.controller.get ('lpstate_button').innerHTML = payload.generalState;
    LinphoneCallState.update (
      payload.generalState,
      payload.message,
      this.handleAnyBound,
      this.handlePowerBound,
      this.handleRegisterBound,
      this.handleCallBound,
      this.handleCallInBound,
      this.handleCallOutBound,
      this.handleInvalidBound
    );
  },

  handleInitBound: false,
  handleInitBind: function () {
    if (!this.handleInitBound) {
      QDLogger.log ("DialpadAssistant#handleInitBind");

      this.handleAnyBound           = this.handleAny.bind           (this);
      this.handlePowerBound         = this.handlePower.bind         (this);
      this.handleRegisterBound      = this.handleRegister.bind      (this);
      this.handleCallBound          = this.handleCall.bind          (this);
      this.handleCallInBound        = this.handleCallIn.bind        (this);
      this.handleCallOutBound       = this.handleCallOut.bind       (this);
      this.handleInvalidBound       = this.handleInvalid.bind       (this);

      this.missedCallSubscribeBound = this.missedCallSubscribe.bind (this);

      this.handleInitBound          = true;
    };
  },

  handleAny: function (state, message) {
    QDLogger.log ("DialpadAssistant#handleAny");

    // In case "someone" registered to get informed about missed call, inform him and cancel subscription
    if (!LinphoneCallState.callACTIVE ()) {
      this.missedCallInform ();
      this.missedCallSubscribe (undefined);
    }
  },

  handlePower: function (state, message) {
    QDLogger.log ("DialpadAssistant#handlePower");

    // Cancel everything if no "power" available... (LP stopped or no network?)
    if (!LinphoneCallState.powerOK ()) {
      this.buttonEmptyON (true);
    }

    // Register if we can
    if (LinphoneCallState.registerNONE () && this.prefs.sipValid) {
      QDLogger.log ("DialpadAssistant#handlePower: registering...");
      LinphoneService.register (this.prefs.sipName, this.prefs.sipPassword, this.prefs.sipDomain, this.prefs.sipUseProxy ? this.prefs.sipProxy : this.prefs.sipDomain);
    }
  },

  dirtyRegister: false,
  handleRegister: function (state, message) {
    QDLogger.log ("DialpadAssistant#handleRegister");

    // Remember a failed registration
    this.dirtyRegister = (   !LinphoneCallState.registerVALID ()
			  && (   LinphoneCallState.registerFAILED ()
			      || this.dirtyRegister
			     )
			 );

    if (!LinphoneCallState.registerVALID ()) {
      QDLogger.log ("DialpadAssistant#handleRegister: !VALID");
      this.buttonEmptyON (true);
      
      if (this.forceRegistration && this.prefs.sipValid) {
	QDLogger.log ("DialpadAssistant#handleRegister: registering... (forced)");
	this.forceRegistration = false;
	LinphoneService.register (this.prefs.sipName, this.prefs.sipPassword, this.prefs.sipDomain, this.prefs.sipUseProxy ? this.prefs.sipProxy : this.prefs.sipDomain);
      }
    }
    else if (!LinphoneCallState.callACTIVE ()) {
      QDLogger.log ("DialpadAssistant#handleRegister: VALID and !callACTIVE");
      this.buttonDialON (true);
    }

  },

  handleCall: function (state, message) {
    QDLogger.log ("DialpadAssistant#handleCall");

    // If back to idle, show dial button
    if (LinphoneCallState.callIDLE ()) {
      QDLogger.log ("DialpadAssistant#handleCall: IDLE");
      this.buttonDialON (true);
    }

    // If call finished for any reason, hide any dial/disconnect button
    if (   LinphoneCallState.callENDED ()
	|| LinphoneCallState.callFAILED ()
       ) {

      QDLogger.log ("DialpadAssistant#handleCall: ENDED or FAILED");
      this.buttonEmptyON (true);
      // In case call failed, we might suspect a registration issue, so retry a registration...
      if (LinphoneCallState.callFAILED ()) {
	QDLogger.log ("DialpadAssistant#handleCall: FAILED -- retry registration");
	this.alert ("Call Error: need to confirm registration");
	LinphoneService.register (this.prefs.sipName, this.prefs.sipPassword, this.prefs.sipDomain);
      }
    }
  },

  handleCallIn: function (state, message) {
    QDLogger.log ("DialpadAssistant#handleCallIn");

    // So we get an incoming call: push a popup scene to manage answer/reject & information
    if (LinphoneCallState.callRINGIN ()) {
      QDLogger.log ("DialpadAssistant#handleCallIn: RINGIN");
      this.incomingCallPopup (message, this.missedCallSubscribeBound);
      this.buttonEmptyON (true);
    }

    // Show disconnect button as soon as connected
    if (LinphoneCallState.callCONNECTED ()) {
      QDLogger.log ("DialpadAssistant#handleCallIn: CONNECTED");
      this.missedCallSubscribe (undefined);
      this.buttonDisconnectON (true);
    }
  },

  handleCallOut: function (state, message) {
    QDLogger.log ("DialpadAssistant#handleCallOut");

    // If active call, show disconnect button
    if (LinphoneCallState.callACTIVE ()) {
      QDLogger.log ("DialpadAssistant#handleCallOut: ACTIVE");
      this.buttonDisconnectON (true);
    }
  },

  // This is not expected, so let's get stuck into this trap for now...
  handleInvalid: function (state, message) {
    QDLogger.log ("DialpadAssistant#handleInvalid");
    this.buttonEmptyON (true);
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  buttonEmptyON: function (setAudioProx) {
    QDLogger.log ("DialpadAssistant#buttonEmptyON", setAudioProx);
    if (setAudioProx) {
      TelephonyCommands.setAudioScenario ("media_back_speaker");
      TelephonyCommands.proxSet (false);
    }
    this.controller.get ('empty_button'     ).show ();
    this.controller.get ('dial_button'      ).hide ();
    this.controller.get ('disconnect_button').hide ();
  },

  buttonDialON: function (setAudioProx) {
    QDLogger.log ("DialpadAssistant#buttonDialON", setAudioProx);
    if (setAudioProx) {
      TelephonyCommands.setAudioScenario ("media_back_speaker");
      TelephonyCommands.proxSet (false);
    }
    this.controller.get ('empty_button'     ).hide ();
    this.controller.get ('dial_button'      ).show ();
    this.controller.get ('disconnect_button').hide ();
  },

  buttonDisconnectON: function (setAudioProx) {
    QDLogger.log ("DialpadAssistant#buttonDisconnectON", setAudioProx);
    if (setAudioProx) {
      TelephonyCommands.setAudioScenario ("media_front_speaker");
      TelephonyCommands.proxSet (true);
    }
    this.controller.get ('empty_button'     ).hide ();
    this.controller.get ('dial_button'      ).hide ();
    this.controller.get ('disconnect_button').show ();
  },


  alert: function (message, title) {
    this.controller.showAlertDialog ({
      onChoose: function (value) {},
      message: message,
      choices: [{
	title: title,
	label: "OK",
	value: "continue",
	type: "affirmative"
      }]
    });
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  incomingCallPopup: function (caller, missedCallSubscribe) {
    QDLogger.log ("DialpadAssistant#incomingCallPopup");

    var appController = Mojo.Controller.getAppController();
    appController.createStageWithCallback(
      {
	name:        "incomingcallPopupAlert",
	lightweight:  true,
	height:       100
      },
      function (stageController) {
	stageController.pushScene ("incomingcall", caller, missedCallSubscribe);
      }.bind (this),
      "popupalert"
    );
  },

  missedCallSubscription: false,
  missedCallSubscribe: function (callback) {
    if (callback !== undefined) {
      this.missedCallSubscription = callback;
    } else {
      this.missedCallSubscription = false;
    }
  },

  missedCallInform: function () {
    if (this.missedCallSubscription) {
      this.missedCallSubscription ();
    }
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  /** DIALPAD BUTTONS **/
  numberClick: function (event, key) {
    QDLogger.log ( "DialpadAssistant#numberclick", "key=", key);

    if (key) {
      TelephonyCommands.sendDTMF (key, true);
      this.formatAndUpdateDialString (key,event);
    }
  },

  dialClick: function (event) {
    QDLogger.log ( "DialpadAssistant::dialClick", this.dialString);

    QDLogger.log ( "DialpadAssistant::dialClick / powerState =", LinphoneCallState.powerState);

    // If registration was successful and non-empty dial number, engage dial and hide dial button
    if (LinphoneCallState.registerVALID () && (this.dialString.length > 0)) {
      QDLogger.log ("DialpadAssistant#dialClick: calling...");

      LinphoneService.call (this.dialString);
      this.buttonEmptyON ();
    }
  },

  disconnectClick: function (event) {
    QDLogger.log ( "DialpadAssistant::disconnectClick", this.dialString);

    // If a call was active, terminate it and hide disconnect button
    if (LinphoneCallState.callACTIVE ()) {
      LinphoneService.terminate ();
      this.buttonEmptyON ();
    }
  },

  emptyClick: function (event) {
    QDLogger.log ( "DialpadAssistant::emptyClick", this.dialString);
  },

  clear: function (event) {
    this.clearSetDialString ();

    this.dialString = "";
    this.speedDialString = "";
    if (this.controller.get ('dial_textfield')) {
      this.controller.get ('dial_textfield').innerHTML = "";
      this.disableInputNecessaryButtons ();
    }
    if (this.controller.get ('dial_textfield_name'))
      this.controller.get ('dial_textfield_name').innerHTML = "";

    // don't allow any more taps on dial textfield
//    this.clearTapDialStringToOpenContacts ();
  },

  back: function (event) {
    this.clearSetDialString ();

    if (this.controller.get ('dial_textfield_name')) {
      this.controller.get ('dial_textfield_name').innerHTML = "";
    }

//	    // hitting delete when there's a contact displayed clears it
//	    if (this.redialContactParams && this.redialContactParams.contactId) {
//		this.clear ();
//		return;
//	    }

	    // don't allow any more taps on dial textfield
//	    this.clearTapDialStringToOpenContacts ();

    var length = this.dialString.length;
    if (length > 0) {
      this.dialString = this.dialString.substring (0, length - 1);

      // CASE: Truncated dialstring: change dialstring without changing display
      if (length > 19 && this.controller.get ('dial_textfield').innerHTML.indexOf ("...") == 0) {
	this.resizeDialString (length);
      }

      // CASE: Normal dialstring: set (and delay set prefix if needed)
      else {
//		    var prefix = this.appAssistant.getQuickdialPrefix (this.dialString);
//		    if (prefix !== undefined) {
//			this.setDialString (prefix + this.dialString, true);
//		    }
	this.setDialString (this.dialString);
      }
    }

    if (length == 1 || length == 0) {
      this.speedDialString = "";
      this.disableInputNecessaryButtons ();
    }
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // helper sets the dialstring with optional delay
  setDialString: function (string, delayed) {
    if ( delayed === true ) {
      this.setDialStringTimeout = this.controller.window.setTimeout (arguments.callee.bind (this,string,false), this.DIAL_PREFIX_DELAY);
    } else {
      this.controller.get ('dial_textfield').innerHTML = FormatPhoneNumber (string);
      this.resizeDialString (string.length);
    }
  },

  // helper clears any pending delayed setDialString ()
  clearSetDialString: function () {
    if ( this.setDialStringTimeout ) {
      this.controller.window.clearTimeout (this.setDialStringTimeout);
      this.setDialStringTimeout = undefined;
    }
  },

  formatAndUpdateDialString: function (keyIn,evt) {
    QDLogger.log ( "DialpadAssistant#formatAndUpdateDialString", "key=", keyIn, "event=", evt);

    this.clearSetDialString ();

//	    if (!this.controller)
//		return;

    if (this.isValidDialKey (keyIn)) {

		// don't allow any more taps on dial textfield
//		this.clearTapDialStringToOpenContacts ();

//		if (this.speedDialString && this.speedDialString.length > 0) {//for speed dial
//		    this.controller.get ('dial_textfield_name').innerHTML = "";
//		    this.speedDialString = "";
//		}
		// if we're on CDMA, don't let the user put a + anywhere but at the beginning
		// GSM needs + anywhere to do MMI with international numbers
//		if (!(PlatformType.isGSM ())
//		    && keyIn == "+"
//		    && this.dialString.length > 0) {
//		    return;
//		}

      if (this.dialString.length > 0) {
	this.dialString = this.dialString + keyIn;
      } else {
	this.dialString = keyIn;
      }

//		var prefix = this.appAssistant.getQuickdialPrefix (this.dialString);
//		if (prefix !== undefined) {
//		    this.setDialString (prefix + this.dialString, true);
//		}
      this.setDialString (this.dialString);

		// enable buttons that act on an input number
//		if (this.dialString.length > 0) {
      this.enableInputNecessaryButtons ();
//		}

    }
  },

  resizeDialString: function (length) {
    if (length <= 9) {
      this.controller.get ('dial_textfield').className = "truncating-text text-input";
    } else if (length >= 10 && length <= 13) {
      this.controller.get ('dial_textfield').className = "truncating-text text-input small1";
    } else if (length >= 14 && length <= 15) {
      this.controller.get ('dial_textfield').className = "truncating-text text-input small2";
    } else if (length >= 16 && length <= 17) {
      this.controller.get ('dial_textfield').className = "truncating-text text-input small3";
    } else if (length >= 18 && length <= 19) {
      this.controller.get ('dial_textfield').innerHTML = this.dialString;
      this.controller.get ('dial_textfield').className = "truncating-text text-input small4";
    } else {
      //this.controller.get ('dial_textfield').className = "truncating-text text-input small5";
      this.leftTruncatedDialString = "..." + this.dialString.slice (this.dialString.length-17, this.dialString.length);
      this.controller.get ('dial_textfield').innerHTML = this.leftTruncatedDialString;
    }
  },

  isValidDialKey: function (key) {
    if (PlatformType.isGSM () == true) {
      for (i = 0; i < key.length; i++) {
	if (!(   (   key[i] >= '0'
	          && key[i] <= '9')
	      || key[i] == '*'
	      || key[i] == '#'
	      || key[i] == 'w'
	      || key[i] == 'p'
	      || key[i] == '+'
	     ))
	  return false;
      }
      return true;
    }
    else {
      for (i = 0; i < key.length; i++) {
	if (!(   (   key[i] >= '0'
		  && key[i] <= '9')
	      || key[i] == '*'
	      || key[i] == '#'
	      || key[i] == 't'
	      || key[i] == 'p'
	      || key[i] == '+'
	     )
	   )
	  return false;
      }
      return true;
    }
  },

  isValidToneKey: function (key) {
    if (!(   (   key >= '0'
	      && key <= '9')
	  || key == '*'
	  || key == '#'
	 ))
      return false;

    return true;
  },


/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  disableInputNecessaryButtons: function () {
//	    if (this.abridged === true) {
//		return this.disableInputNecessaryButtonsAbridged ();
//	    }

    if (this.inputNecessaryButtonsVisible) {
      this.inputNecessaryButtonsVisible = false;
      QDLogger.log ( "DialpadAssistant::disableInputNecessaryButtons");
      if (this.controller.get ('contact_add_button')) {
//		    this.controller.get ('contact_add_button').hide ();
//		    this.controller.get ('voicemail_button'  ).show ();
//		    this.controller.get ('call_log_button'   ).show ();

	this.controller.get ('delete_button').hide ();
//		    this.controller.get ('lookup_button').show ();
	this.controller.get ('dial_hinttext' ).show ();
	this.controller.get ('dial_textfield').hide ();
      }
    }

  },

  enableInputNecessaryButtons: function (isContact) {
//	   if (this.abridged === true) {
//	       return this.enableInputNecessaryButtonsAbridged ();
//	   }

    if (!this.inputNecessaryButtonsVisible) {
      this.inputNecessaryButtonsVisible = true;
      QDLogger.log ( "DialpadAssistant::enableInputNecessaryButtons");
//	       this.controller.get ('voicemail_button').hide ();
//	       this.controller.get ('call_log_button').hide ();

      this.controller.get ('delete_button' ).show ();
      this.controller.get ('lookup_button' ).hide ();
      this.controller.get ('dial_hinttext' ).hide ();
      this.controller.get ('dial_textfield').show ();
    }
//following button was hide when speed dial was shown
//	   if (!isContact)
//	       this.controller.get ('contact_add_button').show ();
  },


/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  handleCommand: function (event) {
    if (event.type == Mojo.Event.command) {
      switch (event.command) {

      case 'do-prefs':
	this.controller.stageController.pushScene ('preferences');
	break;

//      case 'do-help':
//	this.controller.stageController.pushScene ('help');
//	break;

      }
    }
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

    // Only to end the function list with no trailing comma...
    dummy: false

});