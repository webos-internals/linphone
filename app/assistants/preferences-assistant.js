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

var PreferencesAssistant = Class.create ({

  prefs: false,

  menuModel: {
    visible: true,
    items: [ {
      label:   "Help",
      command: 'do-help'
    } ]
  },

  initialize: function () {
    QDLogger.log ("PreferencesAssistant#initialize");
  },

  setup: function () {

    // Stuff menu
    this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.menuModel);

    // Set this scene's default transition
    this.controller.setDefaultTransition(Mojo.Transition.zoomFade);

//?    // listener for help toggle
//?    this.helpTap = this.helpRowTapped.bindAsEventListener(this);
//?    this.controller.listen(this.controller.get('help-toggle'), Mojo.Event.tap, this.helpButtonTapped.bindAsEventListener(this));

    // Fill-in preferences fields
    this.prefs = preferenceCookie.load ();
    this.prefWidgetTextField ('sipName');
    this.prefWidgetTextField ('sipPassword');
    this.prefWidgetTextField ('sipDomain');
    this.prefWidgetToggleButtonField ('sipUseProxy', 'sipProxyField');
    this.prefWidgetTextField ('sipProxy');
    this.prefWidgetToggleButton ('sipUnregisterOnExit'); // BEWARE: hidden in the HTML for now...

  },

  activate: function (event) {
    QDLogger.log ("PreferencesAssistant#activate");
    this.prefs = preferenceCookie.load ();
  },

  deactivate: function (event) {
    QDLogger.log ("PreferencesAssistant#deactivate");
    preferenceCookie.save (this.prefs);
  },

  cleanup: function () {
    QDLogger.log ("PreferencesAssistant#cleanup");
  },

  // ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<----

  prefWidgetTextField: function (name) {
    this.controller.setupWidget (
      name,
      {
	autoFocus: false,
	focus: false,
	multiline: false,
	enterSubmits: false,
//	charsAllow: this.validChars,
	textCase: Mojo.Widget.steModeLowerCase
      },
      {
	value: this.prefs[name],
      }
    );
    this.controller.listen (name,
			    Mojo.Event.propertyChange,
			    this.prefChanged.bindAsEventListener (this, name));
  },

  prefWidgetToggleButton: function (name) {
    this.controller.setupWidget (
      name,
      {
	trueLabel:  $L("Yes"),
	falseLabel: $L("No"),
      },
      {
	value: this.prefs[name],
      }
    );
    this.controller.listen (name,
			    Mojo.Event.propertyChange,
			    this.prefToggled.bindAsEventListener (this, name));
  },

  prefWidgetToggleButtonField: function (name, field) {
    this.controller.setupWidget (
      name,
      {
	trueLabel:  $L("Yes"),
	falseLabel: $L("No"),
      },
      {
	value: this.prefs[name],
      }
    );
    this.controller.listen (name,
			    Mojo.Event.propertyChange,
			    this.prefToggledField.bindAsEventListener (this, name, field));
    if (this.prefs[name]) {
      this.controller.get (field).show ();
    } else {
      this.controller.get (field).hide ();
    }
  },

  prefChanged: function (event, property) {
    QDLogger.log ("PreferencesAssistant#prefChanged:", property, event.value);
    this.prefs[property]  = event.value;
    this.prefs.sipValid   = (this.prefs.sipName && this.prefs.sipPassword && this.prefs.sipDomain && (!this.prefs.sipUseProxy || this.prefs.sipProxy)) ? true : false;
    this.prefs.sipUpdated = true;
  },

  prefToggledField: function (event, property, field) {
    QDLogger.log ("PreferencesAssistant#fieldToggle:", property, event.value, field);
    this.prefs[property]  = event.value;
    this.prefs.sipValid   = (this.prefs.sipName && this.prefs.sipPassword && this.prefs.sipDomain && (!this.prefs.sipUseProxy || this.prefs.sipProxy)) ? true : false;
    this.prefs.sipUpdated = true;
    if (event.value) {
      this.controller.get (field).show ();
    } else {
      this.controller.get (field).hide ();
    }
    this.prefs.sipUpdated = true;
  },

  prefToggled: function (event, property) {
    QDLogger.log ("PreferencesAssistant#prefToggled:", property, event.value);
    this.prefs[property] = event.value;
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // Only to end the function list with no trailing comma...
  dummy: false

});
