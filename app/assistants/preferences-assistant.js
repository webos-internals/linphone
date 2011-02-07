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

var PreferencesAssistant = Class.create({

  prefs: false,

  menuModel: {
    visible: true,
    items: [ {
      label:   "Help",
      command: 'do-help'
    } ]
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

  },

  activate: function (event) {
    QDLogger.log ("PreferencesAssistant#activate");
    this.prefs = preferenceCookie.load ();
  },

  deactivate: function (event) {
    QDLogger.log ("PreferencesAssistant#deactivate");
    preferenceCookie.save (this.prefs);
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

  prefChanged: function (event, property) {
    QDLogger.log ("PreferencesAssistant#prefChanged:", property, event.value);
    this.prefs[property]  = event.value;
    this.prefs.sipValid   = (this.prefs.sipName && this.prefs.sipPassword && this.prefs.sipDomain) ? true : false;
    this.prefs.sipUpdated = true;
  }


});
