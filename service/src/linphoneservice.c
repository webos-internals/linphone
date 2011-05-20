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

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <getopt.h>

#include "luna_service.h"
#include "luna_methods.h"

#define DEFAULT_DEBUG_LEVEL 0

int  debug;
char config[MAXBUFLEN];
char Config[MAXBUFLEN];
int  show_gstate;
char sname[MAXBUFLEN];
int  self_name;
char sName[MAXBUFLEN];

static struct option long_options[] = {
  { "help",	no_argument,		0, 'h' },
  { "version",	no_argument,		0, 'V' },
  { "debug",	required_argument,	0, 'd' },
  { "config",	required_argument,	0, 'c' },
  { "Config",	required_argument,	0, 'C' },
  { "state",	no_argument,		0, 'S' },
  { "name",	required_argument,	0, 'n' },
  { "Name",	no_argument,		0, 'N' },
  { 0, 0, 0, 0 }
};

int test_file (char *fname) {
  FILE *f;

  if (!(fname && *fname)) {
    return 0;
  }

  if ((f = fopen (fname,"r")) != NULL) {
    fclose (f);
    return 0;
  } else {
    return 1;
  }

}

char *basename (char *fpath) {
  char *p;

  // We must have a non-null string
  if (!fpath || !(*fpath)) {
    return NULL;
  } 

  // Move forward to the end of the string
  for (p=fpath; *p; p++);

  // Then move backward until the beginning of the string or before a '/' is met
  for (; (p != fpath) && (p[-1] != '/'); p--);

  // Return the segment
  return p;
}

void print_version () {
  printf("Linphone Service (%s)\n", VERSION);
}

void print_help (char *argv[]) {

  printf ("Usage: %s [OPTION]...\n\n"
	  "Miscellaneous:\n"
	  "  -h, --help\t\tprint help information and exit\n"
	  "  -d, --debug\t\tset debug to LEVEL\n"
	  "  -c, --config\t\tload configuration FILE\n"
	  "  -C, --Config\t\tload default configuration FILE\n"
	  "  -S, --state\t\tshow general state messages (disabled by default)\n"
	  "  -n, --name\t\tname the service NAME rather than the default \"%s\"\n"
	  "  -N, --Name\t\tname the service after the executable name rather than the default \"%s\"...\n"
	  "  -V, --version\t\tprint version information and exit\n",
	  basename (argv[0]) || "???",
	  LUNA_SERVICE_NAME,
	  LUNA_SERVICE_NAME);
}

int getopts (int argc, char *argv[]) {

  int c, retVal = 0;

  while (1) {
    int option_index = 0;
    c = getopt_long (argc, argv, "d:c:C:n:SNVh", long_options, &option_index);
    if (c == -1)
      break;
    switch (c) {
    case 'd':
      debug = atoi(optarg);
      break;
    case 'c':
      strcpy (config, optarg);
      break;
    case 'C':
      strcpy (Config, optarg);
      break;
    case 'S':
      show_gstate = 1;
      break;
    case 'n':
      strcpy (sname, optarg);
      break;
    case 'N':
      self_name = 1;
      break;
    case 'V':
      print_version ();
      retVal = 1;
      break;
    case 'h':
      print_help (argv);
      retVal = 1;
      break;
    case '?':
      print_help (argv);
      retVal = 1;
      break;
    default:
      abort ();
    }
  }
  return retVal;
  
}

int main (int argc, char *argv[]) {

  print_version ();

  debug       = DEFAULT_DEBUG_LEVEL;
  config[0]   = 0;
  Config[0]   = 0;
  show_gstate = 0;
  sname[0]    = 0;
  self_name   = 0;

  if (getopts (argc, argv) == 1)
    return 1;

//fprintf (stderr, "** DEBUG: before test_file(config)\n");
  if (test_file (config)) {
    fprintf (stderr, "Config file \"%s\" not found or not readable.\n", config);
    exit (2);
  }
//fprintf (stderr, "** DEBUG: before test_file(Config)\n");
  if (test_file (Config)) {
    fprintf (stderr, "Default config file \"%s\" not found or not readable.\n", Config);
    exit (2);
  }

  if (self_name) {
    char *p = basename (argv[0]);
    if (p == NULL) {
      fprintf (stderr, "Could not extract basename from \"%s\"\n", argv[0]);
      exit (2);
    } else {
      strcpy (sName, p);
    }
  }

//fprintf (stderr, "** DEBUG: before luna_service_initialize()\n");
  if (luna_service_initialize (sname[0] ? sname : (self_name ? sName : LUNA_SERVICE_NAME))) {
    luna_service_start ();
  }

  return 0;

}
