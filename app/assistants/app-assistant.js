function AppAssistant (appController) {
  QDLogger.log ("AppAssistant");
  this.appController = appController;
  this.hidden = false; // todo see [PIX-10371]
}

AppAssistant.prototype.stageName         = "LinphoneApp";
AppAssistant.prototype.dialpadScene      = "dialpad";
AppAssistant.prototype.incomingcallScene = "incomingcall";

AppAssistant.prototype.handleLaunch = function(launchParams) {
 
  QDLogger.log ("AppAssistant#handleLaunch", "no args, no calls: focusing stage");
  var appControl = Mojo.Controller.getAppController ();
  var stageController = appControl.getStageController (this.stageName);
    
  if (!stageController) {
    this.showDialpad ();
  }
  this.focusStage ();
}

// shows the dialpad. pops existing scenes to get to it (except for active call.)
AppAssistant.prototype.showDialpad = function(dialParams, keepHidden){
  // make a stage if we don't have one
  QDLogger.log ("AppAssistant#showDialpad");
	
  var stageController = Mojo.Controller.getAppController().getStageController (this.stageName);
  var stageProxy      = Mojo.Controller.getAppController().getStageProxy      (this.stageName);
	
  // push the scene
  var dialpadScenePush = function(sc) {
    QDLogger.log ("AppAssistant#showDialpad", "pushing: ", this.dialpadScene);
    this.sceneStack.push (this.dialpadScene);
    sc.pushScene (
      {
	name: this.dialpadScene,
	automaticFocusAdvance: false,
	transition: Mojo.Transition.crossFade
      },
      dialParams
    );
  }.bind(this);
   
  if (stageController === undefined && stageProxy === undefined) {
    QDLogger.log ("AppAssistant#showDialpad", "creating stage:" , this.stageName ," because " , stageController);
    this.createPhoneStage (dialpadScenePush);
    return;
  }

  else if (stageController !== undefined) {

    if (!keepHidden)
      this.showPhoneStage (stageController.window);

    dialpadScenePush (stageController);

//    // if no scenes, push dialpad
//    if (this.sceneStack.length == 0) {
//      QDLogger.log ("AppAssistant#showDialpad", "will push");
//      dialpadScenePush (stageController);
//    }
//
//    //
//    else {
//      var sceneIdx = this.sceneStack.indexOf (this.dialpadScene);
//
//      if (sceneIdx == this.sceneStack.length-1) {
//	QDLogger.log ("AppAssistant#showDialpad", "already on top");
//	stageController.delegateToSceneAssistant ("handleSceneArgs", dialParams)
//	return;
//	// if there's a dialpad, pop to it
//      }
//
//      else if (sceneIdx !== -1) {
//	QDLogger.log ("AppAssistant#showDialpad", "popping to");
//	this.sceneStack = this.sceneStack.slice(0,sceneIdx+1);
//	stageController.popScenesTo(this.dialpadScene, dialParams);
//      }
//
//      else {
//	var activeCallIdx = this.sceneStack.indexOf("activecall");
//	// if there's an active call pop to it...
//	if (activeCallIdx !== -1) {
//	  QDLogger.log ("AppAssistant#showDialpad", "popping to active call");
//	  this.showActiveCall ();
//	} else {
//	  // otherwise blow away all scenes
//	  this.sceneStack = [];
//	  QDLogger.log ("AppAssistant#showDialpad", "popping all");
//	  stageController.popScenesTo ();
//	}
//	// ...then push dialpad scene
//	dialpadScenePush (stageController);
//      }
//    } 

  } 
};

// creates the stage and executes callback on creation
// clears sceneStack
AppAssistant.prototype.createPhoneStage = function(callback) {
  this.sceneStack = [];

  Mojo.Controller.getAppController ().createStageWithCallback (
    {
      lightweight: true,
      name: this.stageName
    },
    function (sc) {
      //FIXME: enable for keepalive
//      sc.window.Mojo.show = this.onShow.bind (this);
//      sc.window.Mojo.hide = this.onHide.bind (this, sc);
      sc.document.addEventListener(Mojo.Event.stageActivate,   function () { sc.useSceneTransitions (true);  });
      sc.document.addEventListener(Mojo.Event.stageDeactivate, function () { sc.useSceneTransitions (false); });
      sc.activate ();
      callback (sc);
    }.bind(this)
  );
  
};

AppAssistant.prototype.onShow = function(params) {
  QDLogger.log ("AppAssistant#onShow", params);
  this.handleLaunch (Mojo.convertLaunchParams (params));
};

AppAssistant.prototype.onHide = function (sc) {
  QDLogger.log ("AppAssistant#onHide");
  this.hidden = true;
  // if we're on calls, kill them
  if (this.telephonyEventListener.callExists()) {
    this.telephonyEventListener.disconnectAllCalls();
  } else {
    // otherwise, if dialpad or one of its children is on top
    // pop to it to reset it 
    if (this.topScene () == "dialpad") {
      sc.popScenesTo ("dialpad");
      sc.delegateToSceneAssistant ("resetOnHide")
    } 
  }
};

AppAssistant.prototype.showPhoneStage = function (win) {
  QDLogger.log ("AppAssistant#showPhoneStage");
  if (this.hidden) {
    this.appController.getStageController (this.stageName).useSceneTransitions (true);
    QDLogger.log ("AppAssistant#showPhoneStage", "showing!");
    this.hidden = false;
    win.PalmSystem.show ();
    //this.focusStage();
  }
}

AppAssistant.prototype.hidePhoneStage = function(win) {
  QDLogger.log ("AppAssistant#hidePhoneStage");
  this.appController.getStageController (this.stageName).useSceneTransitions(false);
  win.PalmSystem.hide ();
  this.showDialpad (null, true /* keep hidden */);
  this.hidden = true;
}

AppAssistant.prototype.focusStage = function () {
  QDLogger.log ("AppAssistant#focusStage");
  var stageController = Mojo.Controller.getAppController ().getStageController (this.stageName);
  if (stageController)
    stageController.activate ();
}

