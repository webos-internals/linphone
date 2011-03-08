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

    this.prefWidgetTextField ('sipName',     this.prefChangedSIP);
    this.prefWidgetTextField ('sipPassword', this.prefChangedSIP);
    this.prefWidgetTextField ('sipDomain',   this.prefChangedSIP);
    this.prefWidgetToggleButtonField ('sipUseProxy', 'sipProxyField', this.prefToggledFieldSIP);
    this.prefWidgetTextField ('sipProxy',    this.prefChangedSIP);
    this.prefWidgetToggleButton ('sipUnregisterOnExit', this.prefChanged); // FIXME: hidden in the HTML for now...
    
    this.prefWidgetListSelectorField ('netFirewallPolicy', [{label: 'NONE', value: 'none', field: ''},
							    {label: 'NAT',  value: 'nat',  field: 'netNatAddressField'},
							    {label: 'STUN', value: 'stun', field: 'netStunServerField'}
							   ], this.prefSelectedFieldNET);
    this.prefWidgetTextField ('netStunServer', this.prefChangedNET);
    this.prefWidgetTextField ('netNatAddress', this.prefChangedNET);

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

  prefWidgetTextField: function (name, callback) {
    QDLogger.log ("PreferencesAssistant#prefWidgetTextField", name);
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
			    callback.bindAsEventListener (this, name));
  },

  prefWidgetToggleButton: function (name, callback) {
    QDLogger.log ("PreferencesAssistant#prefWidgetToggleButtond", name);
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
			    callback.bindAsEventListener (this, name));
  },

  prefWidgetToggleButtonField: function (name, field, callback) {
    QDLogger.log ("PreferencesAssistant#prefWidgetToggleButtonField", name);
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
			    callback.bindAsEventListener (this, name, field));
    if (this.prefs[name]) {
      this.controller.get (field).show ();
    } else {
      this.controller.get (field).hide ();
    }
  },

  prefWidgetListSelectorField: function (name, fieldlist, callback) {
    QDLogger.log ("PreferencesAssistant#prefWidgetListSelectorField", name);
    this.controller.setupWidget (
      name,
      {
	choices : fieldlist
      },
      {
	value: this.prefs[name],
      }
    );
    this.controller.listen (name,
			    Mojo.Event.propertyChange,
			    callback.bindAsEventListener (this, name, fieldlist));
    for (i=0; i<fieldlist.length; i++) {
//      QDLogger.log ("PreferencesAssistant#prefWidgetListSelectorField", name, '=', this.prefs[name], '/', i, fieldlist[i].value, fieldlist[i].field);
      if (fieldlist[i].field) {
	if (this.prefs[name] == fieldlist[i].value) {
	  this.controller.get (fieldlist[i].field).show ();
	} else {
          this.controller.get (fieldlist[i].field).hide ();
	}
      }
    }
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  prefChanged: function (event, property) {
    QDLogger.log ("PreferencesAssistant#prefChanged:", property, event.value);
    this.prefs[property] = event.value;
  },

  prefChangedSIP: function (event, property) {
    QDLogger.log ("PreferencesAssistant#prefChangedSIP:", property, event.value);
    this.prefs[property]  = event.value;
    this.prefs.sipValid   = (   this.prefs.sipName
			     && this.prefs.sipPassword
			     && this.prefs.sipDomain
			     && (   !this.prefs.sipUseProxy
				 || (this.prefs.sipProxy && (this.prefs.sipProxy != ""))
				)
			    ) ? true : false;
    this.prefs.sipUpdated = true;
  },

  prefToggledFieldSIP: function (event, property, field) {
    QDLogger.log ("PreferencesAssistant#prefToggledFielSIP:", property, event.value, field);
    this.prefChangedSIP (event, property);
    if (event.value) {
      this.controller.get (field).show ();
    } else {
      this.controller.get (field).hide ();
    }
  },

  prefChangedNET: function (event, property) {
    QDLogger.log ("PreferencesAssistant#prefChangedNET:", property, event.value);
    this.prefs[property]  = event.value;
    this.prefs.netValid   = (    (this.prefs.netFirewallPolicy == 'none')
			     || ((this.prefs.netFirewallPolicy == 'nat' ) && (this.prefs.netNatAddress != ""))
			     || ((this.prefs.netFirewallPolicy == 'stun') && (this.prefs.netStunServer != ""))
			    );
    this.prefs.netUpdated = true;
  },

  prefSelectedFieldNET: function (event, property, fieldlist) {
    QDLogger.log ("PreferencesAssistant#prefSelectedFieldNET:", property, event.value);
    this.prefChangedNET (event, property);
    for (i=0; i<fieldlist.length; i++) {
      if (fieldlist[i].field) {
	if (event.value == fieldlist[i].value) {
	  this.controller.get (fieldlist[i].field).show ();
	} else {
          this.controller.get (fieldlist[i].field).hide ();
	}
      }
    }
  },

/* ----8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<--------8<---- */

  // Only to end the function list with no trailing comma...
  dummy: false

});
