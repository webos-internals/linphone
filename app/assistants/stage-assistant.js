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

function StageAssistant () {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the stage is first created */
	
	/* for a simple application, the stage assistant's only task is to push the scene, making it
	   visible */
	this.controller.pushScene ("dialpad");
};
