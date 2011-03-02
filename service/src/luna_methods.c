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

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <signal.h>

#include <linphone/config.h>
#include <linphone/linphonecore.h>

#include "luna_service.h"
#include "luna_methods.h"

#define CHARLIST_ALPHA   "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
#define CHARLIST_NUMERIC "0123456789"
#define CHARLIST_QUOTE   "\"'`"
#define CHARLIST_SYMBOL  "!#$%&*+-/=?@\\^_|~"
#define CHARLIST_PUNCT   " ,.:;"
#define CHARLIST_GROUP   "()<>[]{}"

#define CHARLIST_PRINT   CHARLIST_ALPHA  CHARLIST_NUMERIC CHARLIST_QUOTE \
                         CHARLIST_SYMBOL CHARLIST_PUNCT   CHARLIST_GROUP  

//#define ALLOWED_CHARS_SIP_IDENTITY CHARLIST_ALPHA CHARLIST_NUMERIC "._-:@"
//#define ALLOWED_CHARS_SIP_PASSWORD CHARLIST_PRINT
//#define ALLOWED_CHARS_SIP_PROXY    CHARLIST_ALPHA CHARLIST_NUMERIC "._-:"
//#define ALLOWED_CHARS_CALL_SIPURL  CHARLIST_ALPHA CHARLIST_NUMERIC "._-@:<>"

//#define ALLOWED_CHARS "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-:@"

#define API_VERSION "1"

#define LPS_URI "palm://" LUNA_SERVICE_NAME "/linphone/"
#define pxx_serviceHandle pub_serviceHandle

// We'll need to remove the "static" directive in front of liblinphone_version@linphone/coreapi/linphonecore.c:39
// extern char *liblinphone_version;

//
// We use static buffers instead of continually allocating and deallocating stuff,
// since we're a long-running service, and do not want to leak anything.
//
static char buffer[MAXBUFLEN];
static char tmp_buffer[MAXBUFLEN];
static char esc_buffer[MAXBUFLEN];

//
// Create dedicated buffers for the callback routines, they run asynchronously
// from the service requests and we don't want to hit their buffers
//
static char buffer_cb[MAXBUFLEN];
static char tmp_buffer_cb[MAXBUFLEN];
static char esc_buffer_cb[MAXBUFLEN];


//
// Escape a string so that it can be used directly in a JSON response.
// In general, this means escaping quotes, backslashes and control chars.
// It uses a provided (static) buffer, which must be twice as large as the
// largest string this routine can handle.
//
static char *json_escape_str (char *str, char *buffer)
{
  const char *json_hex_chars = "0123456789abcdef";

  // Initialise the output buffer
  strcpy (buffer, "");

  // Check the constraints on the input string
  if (strlen(str) > MAXBUFLEN) return (char *) buffer;

  // Initialise the pointers used to step through the input and output.
  char *resultsPt = (char *) buffer;
  int pos = 0, start_offset = 0;

  // Traverse the input, copying to the output in the largest chunks
  // possible, escaping characters as we go.
  unsigned char c;
  do {
    c = str[pos];
    switch (c) {
    case '\0':
      // Terminate the copying
      break;
    case '\b':
    case '\n':
    case '\r':
    case '\t':
    case '"':
    case '\\': {
      // Copy the chunk before the character which must be escaped
      if (pos - start_offset > 0) {
	memcpy(resultsPt, str + start_offset, pos - start_offset);
	resultsPt += pos - start_offset;
      };
      
      // Escape the character
      if      (c == '\b') {memcpy(resultsPt, "\\b",  2); resultsPt += 2;} 
      else if (c == '\n') {memcpy(resultsPt, "\\n",  2); resultsPt += 2;} 
      else if (c == '\r') {memcpy(resultsPt, "\\r",  2); resultsPt += 2;} 
      else if (c == '\t') {memcpy(resultsPt, "\\t",  2); resultsPt += 2;} 
      else if (c == '"')  {memcpy(resultsPt, "\\\"", 2); resultsPt += 2;} 
      else if (c == '\\') {memcpy(resultsPt, "\\\\", 2); resultsPt += 2;} 

      // Reset the start of the next chunk
      start_offset = ++pos;
      break;
    }

    default:
      
      // Check for "special" characters
      if ((c < ' ') || (c > 127)) {

	// Copy the chunk before the character which must be escaped
	if (pos - start_offset > 0) {
	  memcpy (resultsPt, str + start_offset, pos - start_offset);
	  resultsPt += pos - start_offset;
	}

	// Insert a normalised representation
	sprintf (resultsPt, "\\u00%c%c",
		 json_hex_chars[c >> 4],
		 json_hex_chars[c & 0xf]);

	// Reset the start of the next chunk
	start_offset = ++pos;
      }
      else {
	// Just move along the source string, without copying
	pos++;
      }
    }
  } while (c);

  // Copy the final chunk, if required
  if (pos - start_offset > 0) {
    memcpy (resultsPt, str + start_offset, pos - start_offset);
    resultsPt += pos - start_offset;
  } 

  // Terminate the output buffer ...
  memcpy (resultsPt, "\0", 1);

  // and return a pointer to it.
  return (char *) buffer;
}

//
// Linphone core passed variables
//

extern int   debug;
extern char *config;
extern char *Config;
extern int   show_gstate;

//
// Authorization stack
//

#define MAX_PENDING_AUTH 8
typedef struct {
	LinphoneAuthInfo *elem[MAX_PENDING_AUTH];
	int nitems;
} LPC_AUTH_STACK;
LPC_AUTH_STACK auth_stack;


//
// Linphone core defines
//

#ifndef LC_CONFIG_FILE
  #define LC_CONFIG_FILE NULL
#endif
#ifndef LC_CONFIG_FILE_DEFAULT
  #define LC_CONFIG_FILE_DEFAULT NULL
#endif
#ifndef LC_ITERATE_TIME
  #define LC_ITERATE_TIME 100000
#endif


//
// Use a unique static linphone core pointer and associated start/finish routines
//
static LinphoneCore *lc;
static volatile int lpc;


//
// Linphone core callback
//

static void
lc_cb_bye_received (LinphoneCore *lc, const char *from) {
  fprintf (stdout, "Bye received from %s\n", from);
  fflush (stdout);

  LSError lserror;
  LSErrorInit (&lserror);
  sprintf (buffer_cb, "{\"byeReceivedFrom\": \"%s\"}", json_escape_str (from, esc_buffer_cb));
  if (!LSSignalSendNoTypecheck (pxx_serviceHandle, LPS_URI "byeReceivedFrom", buffer_cb, &lserror)) {
    LSErrorPrint (&lserror, stderr);
    LSErrorFree (&lserror);
  }
}

// Since a call-back, this routine can only be called from the linphone core as a consequence of lc_iterate()...
// So no need to "protect" the call to the linphone core!
static void
lc_cb_notify_received (LinphoneCore *lc, const char *from, const char *msg) {
  fprintf (stdout, "Notify type %s from %s\n", msg, from);
  if (!strcmp (msg,"refer")) {
    fprintf (stdout, "The distant SIP end point get the refer we can close the call\n");
    linphone_core_terminate_call (lc, NULL);
  }
  fflush (stdout);
}

static void
lc_cb_display_status (LinphoneCore *lc, const char *something) {
  fprintf (stdout, "%s\n", something);
  fflush (stdout);

  LSError lserror;
  LSErrorInit (&lserror);
  sprintf (buffer_cb, "{\"displayStatus\": \"%s\"}", json_escape_str (something, esc_buffer_cb));
  if (!LSSignalSendNoTypecheck (pxx_serviceHandle, LPS_URI "displayStatus", buffer_cb, &lserror)) {
    LSErrorPrint (&lserror, stderr);
    LSErrorFree (&lserror);
  }
}

static void
lc_cb_display_something (LinphoneCore *lc, const char *something) {
  fprintf (stdout, "%s\n", something);
  fflush (stdout);

  LSError lserror;
  LSErrorInit (&lserror);
  sprintf (buffer_cb, "{\"displaySomething\": \"%s\"}", json_escape_str(something, esc_buffer_cb));
  if (!LSSignalSendNoTypecheck (pxx_serviceHandle, LPS_URI "displaySomething", buffer_cb, &lserror)) {
    LSErrorPrint (&lserror, stderr);
    LSErrorFree (&lserror);
  }
}

static void
lc_cb_display_warning (LinphoneCore *lc, const char *something) {
  fprintf (stdout, "Warning: %s\n", something);
  fflush (stdout);

  LSError lserror;
  LSErrorInit(&lserror);
  sprintf (buffer_cb, "{\"displayWarning\": \"%s\"}", json_escape_str (something, esc_buffer_cb));
  if (!LSSignalSendNoTypecheck (pxx_serviceHandle, LPS_URI "displayWarning", buffer_cb, &lserror)) {
    LSErrorPrint(&lserror, stderr);
    LSErrorFree(&lserror);
  }
}

static void
lc_cb_display_url (LinphoneCore *lc, const char *something, const char *url) {
  fprintf (stdout, "%s: %s\n", something, url);
  fflush (stdout);
}

static void
lc_cb_text_received(LinphoneCore *lc, LinphoneChatRoom *cr, const char *from, const char *msg) {
  fprintf (stdout, "%s: %s\n", from, msg);
  fflush (stdout);
  // TODO: provide mechanism for answering.. ('say' command?)
}

static void
ls_signal_general_state (unsigned *state, unsigned char *message) {
  LSError lserror;
  LSErrorInit (&lserror);

  sprintf (buffer_cb, "{\"generalState\": \"%s\", \"message\": \"%s\"}", state, (message ? json_escape_str (message, esc_buffer_cb) : ""));
  if (!LSSignalSendNoTypecheck (pxx_serviceHandle, LPS_URI "generalState", buffer_cb, &lserror)) {
    LSErrorPrint (&lserror, stderr);
    LSErrorFree (&lserror);
  }
}

// We don't have to initialize this variable since linphone does the job as soon as started...
static unsigned char general_state[64];

static void
lc_cb_general_state (LinphoneCore *lc, LinphoneGeneralState *gstate) {

#define GSCASE(s) case GSTATE_##s: strcpy (general_state, #s); break
  switch (gstate->new_state) {
    GSCASE(POWER_OFF);
    GSCASE(POWER_STARTUP);
    GSCASE(POWER_ON);
    GSCASE(POWER_SHUTDOWN);

    GSCASE(REG_NONE);
    GSCASE(REG_PENDING);
    GSCASE(REG_OK);
    GSCASE(REG_FAILED);

    GSCASE(CALL_IDLE);
    GSCASE(CALL_OUT_INVITE);
    GSCASE(CALL_OUT_RINGING);
    GSCASE(CALL_OUT_CONNECTED);
    GSCASE(CALL_IN_INVITE);
    GSCASE(CALL_IN_CONNECTED);
    GSCASE(CALL_END);

    GSCASE(CALL_ERROR);
    GSCASE(INVALID);

    default:
      sprintf (general_state, "UNKNOWN_%d", gstate->new_state);
  }

  ls_signal_general_state (general_state, gstate->message);

  if (show_gstate) {
    fprintf (stdout, "%s", general_state);
    if (gstate->message) fprintf (stdout, " %s", gstate->message);
    fprintf (stdout, "\n");
    fflush (stdout);
  }

}

static void
lc_cb_display_refer (LinphoneCore * lc,const char *refer_to) {
  fprintf (stdout, "The distant end point asked to transfer the call to %s, don't forget to terminate the call if not\n", refer_to);
  fflush (stdout);
}

static void
lc_cb_dtmf_received (LinphoneCore *lc, int dtmf) {
  fprintf (stdout, "Receiving tone %c\n", dtmf);
  fflush (stdout);
}

static void
lc_cb_prompt_for_auth (LinphoneCore *lc, const char *realm, const char *username) {
  LinphoneAuthInfo *pending_auth;
    
  if ( auth_stack.nitems+1 > MAX_PENDING_AUTH ) {
    fprintf (stdout, "Can't accept another authentication request.\n" 
	             "Consider incrementing MAX_PENDING_AUTH macro.\n");
    fflush (stdout);
    return;
  }
    
  pending_auth = linphone_auth_info_new (username, NULL, NULL, NULL, realm);
  auth_stack.elem[auth_stack.nitems++] = pending_auth;
}

// void linphonec_set_caller (const char *caller){
//   snprintf (caller_name,sizeof(caller_name)-1, "%s", caller);
// }
// 
// static void
// lc_cb_inv_received (LinphoneCore *lc, const char *from) {
//   linphonec_set_caller (from);
//   if (auto_answer) {
//     answer_call = TRUE;
//   }
// }
// 
// static void
// lc_cb_notify_presence_received (LinphoneCore *lc,LinphoneFriend *fid) {
//   char *tmp = linphone_address_as_string (linphone_friend_get_address (fid));
//   printf ("Friend %s is %s\n", tmp, linphone_online_status_to_string (linphone_friend_get_status (fid)));
//   ms_free (tmp);
//   // todo: update Friend list state (unimplemented)
// }
// 
// static void
// lc_cb_new_unknown_subscriber (LinphoneCore *lc, LinphoneFriend *lf, const char *url) {
//   printf ("Friend %s requested subscription "
// 	     "(accept/deny is not implemented yet)\n", url);
//   // This means that this person wishes to be notified
//   // of your presence information (online, busy, away...).
// }

static void
lc_cb_show (LinphoneCore *lc) {
  fprintf (stdout, "Asked to \"show\"... (wot?)\n");
  fflush (stdout);
}

static void
lc_cb_notify_presence_received (LinphoneCore *lc, const char *from, const char *msg) {
  fprintf (stdout, "Received presence notification from \"%s\": \"%s\"\n", from, msg ? msg : "");
  fflush (stdout);
}

static void
lc_cb_new_unknown_subscriber (LinphoneCore *lc, LinphoneFriend *lf, const char *url) {
  fprintf (stdout, "New unknown subscriber \"%s\" at URL \"%s\"\n", "??", url ? url : "");
  fflush (stdout);
}

static void
lc_cb_display_question (LinphoneCore *lc, const char *message) {
  fprintf (stdout, "Received question \"%s\"\n", message ? message : "");
  fflush (stdout);
}

static void
lc_cb_inv_received (LinphoneCore *lc, const char *from) {
  fprintf (stdout, "Received call invitation from \"%s\"\n", from ? from : "");
  fflush (stdout);
}

static void
lc_cb_buddy_info_updated (LinphoneCore *lc, LinphoneFriend *lf) {
  fprintf (stdout, "Buddy info updated: \"%s\"\n", "??");
  fflush (stdout);
}

static void
stub () {
}

LinphoneCoreVTable lc_cb_vtable = {
  /* Could be dummies if needed */
  .show                   = /* stub, // */ lc_cb_show,
  .notify_presence_recv   = /* stub, // */ lc_cb_notify_presence_received,
  .new_unknown_subscriber = /* stub, // */ lc_cb_new_unknown_subscriber,
  .display_question       = /* stub, // */ lc_cb_display_question,
  .inv_recv               = /* stub, // */ lc_cb_inv_received,
  .buddy_info_updated     = /* stub, // */ lc_cb_buddy_info_updated,

  .bye_recv               = lc_cb_bye_received,
  .notify_recv            = lc_cb_notify_received,
  .display_status         = lc_cb_display_status,
  .display_message        = lc_cb_display_something,
  .display_warning        = lc_cb_display_warning,
  .display_url            = lc_cb_display_url,
  .text_received          = lc_cb_text_received,
  .general_state          = lc_cb_general_state,
  .dtmf_received          = lc_cb_dtmf_received,
  .refer_received         = lc_cb_display_refer,
  .auth_info_requested    = lc_cb_prompt_for_auth

};


static void lc_iterate (int sigval) {
  LinphoneCore *opm = lc;

  // Never iterate the core if a function is currently accessing the core...
  if (lpc) return;

  // Iterate the linphone core... (protected against itself too)!
  lpc = 1;
  linphone_core_iterate (opm);
  lpc =0;

}

static void lc_finish (int sigval) {

  // Terminate pending call, if any
  lpc = 1;
  linphone_core_terminate_call (lc, NULL);
  lpc = 0;

  // Wait a little, then stop the repeating alarm
  usleep (11*LC_ITERATE_TIME);
  ualarm (0, 0);

  // Terminate linphone core
  lpc = 1;
  linphone_core_destroy (lc);

  fprintf (stdout, "Terminating Linphone...\n");

  exit (sigval);

}

static void lc_start () {

  fprintf (stdout, "Activating Linphone...\n");

  if (debug > 0) {
    linphone_core_enable_logs (stdout);
  } else {
    linphone_core_disable_logs ();
  }

  //
  // Initialize auth stack
  //
  auth_stack.nitems=0;

  // Initialize linphone core
  lc = linphone_core_new (&lc_cb_vtable, ((config && *config) ? config : NULL), ((Config && *Config) ? Config : NULL), NULL);

  // Perform a minimum configuration
  linphone_core_enable_ipv6 (lc, FALSE);
  linphone_core_enable_video (lc, FALSE, FALSE);
  linphone_core_enable_video_preview (lc, FALSE);

  // Initialize signal handlers
  signal (SIGTERM, lc_finish);
  signal (SIGINT,  lc_finish);
  
  // Create & handle an alarm so we can iterate the linphone machinery
  lpc = 0;
  signal (SIGALRM, lc_iterate);
  ualarm (LC_ITERATE_TIME, LC_ITERATE_TIME);

}


//
// A dummy method, useful for unimplemented functions or as a status function.
// Called directly from webOS, and returns directly to webOS.
//
bool dummy_method (LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit (&lserror);

  if (!LSMessageReply (lshandle, message, "{\"returnValue\": true}", &lserror)) goto error;

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

//
// Return the current API version of the service.
// Called directly from webOS, and returns directly to webOS.
//
bool version_method (LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit (&lserror);

  if (!LSMessageReply (lshandle, message, "{\"returnValue\": true, \"version\": \"" VERSION "\", \"apiVersion\": \"" API_VERSION "\", \"linphoneVersion\": \"" LINPHONE_VERSION "\"}", &lserror)) goto error;

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

//
// A function pointer, used to filter output messages from commands.
// The input string is assumed to be a buffer large enough to hold
// the filtered output string, and is forcibly overwritten.
// The return value says whether this message should be considered
// to be an immediate terminating error condition from the command.
//
typedef bool (*subscribefun) (char *);

//
// Pass through all messages unchanged.
//
static bool passthrough (char *message) {
  return true;
}

//
// Soundcard list...
//
static
bool soundcard_list_method (LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit (&lserror);

  char *sep = "";
  char **dev;
  int  i;

  strcpy (buffer, "{\"returnValue\": true, \"devices\": [");
  lpc = 1;
  dev = linphone_core_get_sound_devices (lc);
  lpc = 0;
  for (i=0; dev[i]!=NULL; i++) {
    sprintf (tmp_buffer, "%s\"%i: %s\"", sep, i, json_escape_str (dev[i], esc_buffer));
    strcat (buffer, tmp_buffer);
    sep = ", ";
  }
  strcat (buffer, "]}");

  // Return the results to webOS.
  if (!LSMessageReply (lshandle, message, buffer, &lserror)) goto error;

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

//
// Soundcard use...
//
static
bool soundcard_use_method (LSHandle* lshandle, LSMessage *message, void *ctx, char *subcommand) {
  LSError lserror;
  LSErrorInit (&lserror);

  // Extract the arguments from the message
  json_t *object = json_parse_document (LSMessageGetPayload (message));
  json_t *device = json_find_first_label (object, "device");

  // Check the arguments
  if (!device || (device->child->type != JSON_STRING) || (strspn (device->child->text, CHARLIST_PRINT) != strlen (device->child->text))) {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing device\"}",
			 &lserror)) goto error;
    return true;
  }

  int  i;
  char **dev;

  strcpy (buffer, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Unknown device\"}");
  lpc = 1;
  dev = linphone_core_get_sound_devices (lc);
  for (i=0; dev[i]!=NULL; i++) {
    if (strcmp (device->child->text, dev[i]) == 0) {
      linphone_core_set_ringer_device   (lc, dev[i]);
      linphone_core_set_playback_device (lc, dev[i]);
      linphone_core_set_capture_device  (lc, dev[i]);
      strcpy (buffer, "{\"returnValue\": true}");
      break;
    }
  }
  lpc = 0;

  // Return the results to webOS.
  if (!LSMessageReply (lshandle, message, buffer, &lserror)) goto error;

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

//
// Soundcard show...
//
static
bool soundcard_show_method (LSHandle* lshandle, LSMessage *message, void *ctx, char *subcommand) {
  LSError lserror;
  LSErrorInit (&lserror);

  lpc = 1;
  char *ringer   = linphone_core_get_ringer_device   (lc);
  char *playback = linphone_core_get_playback_device (lc);
  char *capture  = linphone_core_get_capture_device  (lc);
  lpc = 0;

  strcpy (buffer, "{\"returnValue\": true");

  sprintf (tmp_buffer, ", \"%s\": \"%s\"", "ringer", json_escape_str (ringer, esc_buffer));
  strcat (buffer, tmp_buffer);

  sprintf (tmp_buffer, ", \"%s\": \"%s\"", "playback", json_escape_str (playback, esc_buffer));
  strcat (buffer, tmp_buffer);

  sprintf (tmp_buffer, ", \"%s\": \"%s\"", "capture", json_escape_str (capture, esc_buffer));
  strcat (buffer, tmp_buffer);

  strcat (buffer, "}");

  // Return the results to webOS.
  if (!LSMessageReply (lshandle, message, buffer, &lserror)) goto error;

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

//
// IPV6 enable/disable...
//
static
bool ipv6_method (LSHandle* lshandle, LSMessage *message, void *ctx, char *subcommand) {
  LSError lserror;
  LSErrorInit (&lserror);

  // Extract the arguments from the message
  json_t *object = json_parse_document (LSMessageGetPayload(message));
  json_t *enable = json_find_first_label (object, "enable");

  // Check the arguments...

  // ... either none
  if (!enable) {
    strcpy (buffer, "{\"returnValue\": true, \"ipv6\": ");
    lpc = 1;
    int ipv6_enabled = linphone_core_ipv6_enabled (lc);
    lpc = 0;
    if (ipv6_enabled) {
      strcat (buffer, "\"enabled\"}");
    } else {
      strcat (buffer, "\"disabled\"}");
    }
  
    // Return the results to webOS.
    if (!LSMessageReply (lshandle, message, buffer, &lserror)) goto error;

  }

  // ... or not a boolean "enable"
  else if ((enable->child->type != JSON_TRUE) && (enable->child->type != JSON_FALSE)) {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid enable type, boolean required\"}",
			 &lserror)) goto error;
    return true;
  }

  // ... or an enable/disable request
  else {
    lpc = 1;
    linphone_core_enable_ipv6 (lc, (enable->child->type == JSON_TRUE) ? TRUE : FALSE);
    lpc = 0;
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": true}",
			 &lserror)) goto error;
    return true;
  }

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

//
// generalState
//
bool signal_gstate_method (LSHandle* lshandle, LSMessage *message, void *ctx) {

  lpc = 1;
  ls_signal_general_state (general_state, NULL);
  lpc = 0;

  LSError lserror;
  LSErrorInit (&lserror);

  if (!LSMessageReply (lshandle, message, "{\"returnValue\": true}", &lserror)) goto error;

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

//
// Register...
//
static
bool register_method (LSHandle* lshandle, LSMessage *message, void *ctx, char *subcommand) {
  LSError lserror;
  LSErrorInit (&lserror);

  // Linphone stuff
  LinphoneProxyConfig *cfg;
  const MSList *elem;

  // Extract the arguments from the message
  json_t *object   = json_parse_document (LSMessageGetPayload (message));
  json_t *identity = !object ? NULL : json_find_first_label (object, "identity");
  json_t *proxy    = !object ? NULL : json_find_first_label (object, "proxy");
  json_t *password = !object ? NULL : json_find_first_label (object, "password");

  // Check the arguments
  if (!identity || (identity->child->type != JSON_STRING) || (strspn (identity->child->text, CHARLIST_PRINT /*ALLOWED_CHARS_SIP_IDENTITY*/) != strlen (identity->child->text))) {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing identity\"}",
			 &lserror)) goto error;
    return true;
  }
  if (!proxy || (proxy->child->type != JSON_STRING) || (strspn (proxy->child->text, CHARLIST_PRINT /*ALLOWED_CHARS_SIP_PROXY*/) != strlen (proxy->child->text))) {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing proxy\"}",
			 &lserror)) goto error;
    return true;
  }
  if (!password || (password->child->type != JSON_STRING) || (strspn (proxy->child->text, CHARLIST_PRINT /*ALLOWED_CHARS_SIP_PASSWORD*/) != strlen (proxy->child->text))) {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing password\"}",
			 &lserror)) goto error;
    return true;
  }


  lpc = 1;
  // Perform the SIP registration
  // (excerpt from linphone/console/commands.c)
  //...
  if (password->child->text[0] != '\0') {
    LinphoneAddress  *from;
    LinphoneAuthInfo *info;

    // FIXME: what is "realm" really meant for, as it is unused so far?
    if ((from = linphone_address_new (identity->child->text)) != NULL) {
      char realm[128];
      snprintf (realm, sizeof (realm)-1,"\"%s\"", linphone_address_get_domain (from));
      info = linphone_auth_info_new (linphone_address_get_username (from), NULL, password->child->text, NULL, NULL);
      linphone_core_add_auth_info (lc, info);
      linphone_address_destroy (from);
      linphone_auth_info_destroy (info);
    }
  }

  elem = linphone_core_get_proxy_config_list (lc);
  if (elem) {
    cfg = (LinphoneProxyConfig*) elem->data;
    linphone_proxy_config_edit (cfg);
  } else {
    cfg = linphone_proxy_config_new ();
  }

  linphone_proxy_config_set_identity (cfg, identity->child->text);
  linphone_proxy_config_set_server_addr (cfg, proxy->child->text);
  linphone_proxy_config_enable_register (cfg, TRUE);

  if (elem)
    linphone_proxy_config_done (cfg);
  else
    linphone_core_add_proxy_config (lc, cfg);

  linphone_core_set_default_proxy (lc, cfg);
  //...
  lpc = 0;

  // Return the results to webOS.
  if (!LSMessageReply (lshandle, message, "{\"returnValue\": true}", &lserror)) goto error;

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

//
// Status...
//
static
bool status_method(LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit (&lserror);

  LinphoneProxyConfig *cfg = NULL;
  int   registered = 0;
  char *identity = "";
  int   expires  = 0;

  lpc = 1;
  linphone_core_get_default_proxy (lc, &cfg);
  if (cfg) {
    if (registered = linphone_proxy_config_is_registered (cfg)) {
      identity = linphone_proxy_config_get_identity (cfg);
      expires  = linphone_proxy_config_get_expires (cfg);
    }
  }
  lpc = 0;

  if (registered) {
    sprintf (buffer, "{\"returnValue\": true, \"registered\": true, \"identity\":\"%s\", \"duration\": %i}", json_escape_str (identity, esc_buffer), expires);
  } else {
    strcpy (buffer, "{\"returnValue\": true, \"registered\": false}");
  }

  // Return the results to webOS.
  if (!LSMessageReply (lshandle, message, buffer, &lserror)) goto error;

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

//
// Unregister...
//
static
bool unregister_method (LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit (&lserror);

// FIXME: is there a need for this later? 
//
//  // Extract the arguments from the message
//  json_t *object = json_parse_document (LSMessageGetPayload(message));
//  json_t *sipurl = json_find_first_label (object, "proxy");
//
//  // Check the arguments
//  if (!proxy || (proxy->child->type != JSON_STRING) || (strspn (proxy->child->text, CHARLIST_PRINT /*ALLOWED_CHARS_CALL_PROXY*/) != strlen (proxy->child->text))) {
//    if (!LSMessageReply (lshandle, message,
//			 "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing proxy\"}",
//			 &lserror)) goto error;
//    return true;
//  }

  LinphoneProxyConfig *cfg = NULL;
  lpc = 1;
  linphone_core_get_default_proxy (lc, &cfg);
  if (cfg && linphone_proxy_config_is_registered (cfg)) {
    linphone_proxy_config_edit (cfg);
    linphone_proxy_config_enable_register (cfg, FALSE);
    linphone_proxy_config_done (cfg);
  } else {
//    linphonec_out ("unregistered\n");
  }
  lpc = 0;

  // Return the results to webOS.
  if (!LSMessageReply (lshandle, message, "{\"returnValue\": true}", &lserror)) goto error;

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

static
bool call_method (LSHandle* lshandle, LSMessage *message, void *ctx, char *subcommand) {
  LSError lserror;
  LSErrorInit (&lserror);

  // Extract the arguments from the message
  json_t *object = json_parse_document (LSMessageGetPayload(message));
  json_t *sipurl = json_find_first_label (object, "sipurl");

  // Check the arguments
  if (!sipurl || (sipurl->child->type != JSON_STRING) || (strspn (sipurl->child->text, CHARLIST_PRINT /*ALLOWED_CHARS_CALL_SIPURL*/) != strlen (sipurl->child->text))) {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing sipurl\"}",
			 &lserror)) goto error;
    return true;
  }

  lpc = 1;
  LinphoneCall *call   = linphone_core_get_current_call (lc);
  int           invite = linphone_core_invite (lc, sipurl->child->text);
  lpc = 0;
  if (call != NULL) {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Terminate current call first\"}",
			 &lserror)) goto error;
    return true;
  } else if (invite == -1) {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Error from linphone_core_invite\"}",
			 &lserror)) goto error;
    return true;
  } else {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": true}",
			 &lserror)) goto error;
  }


  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

static
bool answer_method (LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit (&lserror);

  lpc = 1;
  int answer = linphone_core_accept_call (lc, NULL);
  lpc = 0;

  if (answer == -1) {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Failed to accept incoming call\"}",
			 &lserror)) goto error;
  }
  else  {
    if (!LSMessageReply (lshandle, message,
			 "{\"returnValue\": true}",
			 &lserror)) goto error;
  }

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

static
bool terminate_method (LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit (&lserror);

  lpc = 1;
  int terminate = linphone_core_terminate_call (lc, NULL);
  lpc = 0;
  if (terminate == -1) {
    strcpy(buffer, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"No active call\"}");
  } else {
    strcpy(buffer, "{\"returnValue\": true}");
  }

  // Return the results to webOS.
  if (!LSMessageReply (lshandle, message, buffer, &lserror)) goto error;

  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  return false;
}

static
bool quit_method (LSHandle* lshandle, LSMessage *message, void *ctx) {
  LSError lserror;
  LSErrorInit (&lserror);

  // Return the results to webOS.
  if (!LSMessageReply (lshandle, message, "{\"returnValue\": true}", &lserror)) goto error;


  // Exit (gracefuly?) anyway
  lc_finish (0);
//  return true;
 error:
  LSErrorPrint (&lserror, stderr);
  LSErrorFree (&lserror);
 end:
  lc_finish (0);
//  return false;
}


LSMethod luna_methods[] = {
  { "status",		status_method         },
  { "version",		version_method        },
  { "soundcardList",	soundcard_list_method },
  { "soundcardShow",	soundcard_show_method },
  { "soundcardUse",	soundcard_use_method  },
  { "ipv6",	        ipv6_method           },
  { "signalGState",     signal_gstate_method  },
  { "register",	        register_method       },
  { "unregister",       unregister_method     },
  { "call",	        call_method           },
  { "answer",	        answer_method         },
  { "terminate",        terminate_method      },
  { "quit",             quit_method           },
  { 0, 0 }
};

LSSignal luna_signals[] = {
  { "byeReceivedFrom"  },
  { "displayStatus"    },
  { "displaySomething" },
  { "generalState"     },
  { 0, 0}
};

bool luna_register_methods(LSPalmService *serviceHandle, LSError lserror) {
  lc_start ();
  return LSPalmServiceRegisterCategory(serviceHandle, "/",
				       luna_methods, NULL,
				       luna_signals, NULL,
				       &lserror);
}
