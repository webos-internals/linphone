var IncomingcallAssistant = Class.create ({

  initialize: function (caller, missedCallSubscribe, dialogSceneController) {
    QDLogger.log( "IncomingcallAssistant#initialize", caller);

    this.caller = caller;
    this.missedCallSubscribe = missedCallSubscribe;

    this.dialogSceneController = dialogSceneController;
    if (this.dialogSceneController) {
      QDLogger.log( "IncomingcallAssistant#initialize", "i has a dialog");
      this.dialog = true;
    }

    this.appControl = Mojo.Controller.getAppController();
    this.appAssistant = this.appControl.assistant;
//    this.appAssistant = Mojo.Controller.getAppController ().assistant;

    // Register so we get informed of any missed call
    this.missedCallSubscribe (this.onMissed.bind (this));
  },

  setup: function () {
    QDLogger.log( "IncomingcallAssistant#setup", this.caller);

    this.sceneCtrl = this.dialogSceneController || this.controller;

    this.controller.listen (this.controller.document, Mojo.Event.deactivate, this.onBlur.bind (this));

    this.sceneCtrl.get ('answer_button').addEventListener (Mojo.Event.tap, this.answerCall.bindAsEventListener (this));
    this.sceneCtrl.get ('reject_button').addEventListener (Mojo.Event.tap, this.rejectCall.bindAsEventListener (this));
    
    var  displayTemplate = "incomingcall/details-unknown";

    var matchedAddress = this.caller.match(/(\".*\")?\s*<sip:(.*)@(.*)>/);

    if(matchedAddress) {
      if(matchedAddress[1]) {
        this.displayName = matchedAddress[1].replace(/\"/g, "");
      } else {
        this.displayName = "Unknown Caller";
      }

      if(matchedAddress[2]) {
        this.displayNumber = matchedAddress[2];
      } else {
        this.displayNumber = "Unknown Number";
      }
    }

    var displayData = Mojo.View.render ({
      object: this,
      template: displayTemplate
    });
    this.sceneCtrl.get ('incoming_message').update (displayData);

  },

  activate: function () {
    QDLogger.log( "IncomingcallAssistant#activate", this.caller);

  },

  deactivate: function () {
    QDLogger.log( "IncomingcallAssistant#deactivate", this.caller);

  },

  cleanup: function () {
    QDLogger.log( "IncomingcallAssistant#cleanup", this.caller);

  },

  answerCall: function () {
    QDLogger.log( "IncomingcallAssistant#answerCall", this.caller);

    this.missedCallSubscribe (undefined);
    LinphoneService.answer ();
    this.onAnswered ();
  },

  rejectCall: function () {
    QDLogger.log( "IncomingcallAssistant#rejectCall", this.caller);

    this.missedCallSubscribe (undefined);
    LinphoneService.terminate ();
    this.onRejected ();
  },
  
/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // called AFTER call is answered (i.e. radio has or will answer call)
  // could be called externally if radio auto-answers call (i.e. loopback call)
  onAnswered: function () {
    QDLogger.log( "IncomingcallAssistant#onAnswered", this.caller);
    this.exitStatus = "answered";
    this.appAssistant.focusStage ();
    this.closeWindow ();
  },
  
  onRejected: function (id) {
    QDLogger.log( "IncomingcallAssistant#onRejected", this.caller);
    this.exitStatus = "rejected"
    this.closeWindow ();
  },
  
  onMissed: function (id) {
    QDLogger.log( "IncomingcallAssistant#onMissed", this.caller);
    this.exitStatus = "missed"
    this.closeWindow ();
  },
  
  closeWindowNoAction: function () {
    QDLogger.log( "IncomingcallAssistant#closeWindowNoAction", this.caller);
    this.exitStatus = "closed";
    this.closeWindow ();
  },

  closeWindow: function () {
    QDLogger.log( "IncomingcallAssistant#closeWindow", this.caller);
//    if (this.dialog) {
//      // use announcer's dialog close			
//      this.onBlur();
//      this.announcer.closeIncomingCallDialog(true /* also deactivate stage */);
//    } else{
      // incoming call stage is persistent, so leave window around but hide it
      Mojo.Controller.getAppController().closeStage("incomingcallPopupAlert");
      this.controller.stageController.deactivate ();
//    }
  },

  onBlur: function () {
    QDLogger.log ("IncomingcallAssistant#onBlur", this.exitStatus);

  },
  
/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

    // Only to end the function list with no trailing comma...
    dummy: false

});
