NAME = linphoneservice
VERSION = alpha

#
# We really want to compile out of the WIDK, so express dependencies accordingly
#
DEPENDS = voip/liblinphone common/cjson common/mjson common/luna-service common/libgdbus

#
# Manually set a few WIDK-like variables we need so we can build from outside of WIDK,
# still getting full (dependency & more) support from it...
#
WIDK_DIR     = /srv/preware/cross-compile
STAGING_DIR  = $(WIDK_DIR)/staging/$(ARCH)
MAPPING_FILE = $(WIDK_DIR)/staging/mapping-$(ARCH)
SB2 = sb2 -t $(ARCH) \
	  -M $(MAPPING_FILE) \
	  PATH=/usr/local/bin:$$PATH  \
	  PKG_CONFIG_LIBDIR=/usr/local/lib/pkgconfig:/usr/local/share/pkgconfig

#
# Make sure the WIDK had the bare minimum setup done
#
ifeq (,$(ARCH))
  $(error ERROR, ARCH is not defined...)
else ifeq (,$(wildcard $(MAPPING_FILE)))
  $(error ERROR, could not find a WIDK mapping file for $(ARCH))
endif

#
# Identify the local source files this service depends on
#
SRC_FILES = src/Makefile \
	    src/linphoneservice.c \
	    src/luna_service.c src/luna_service.h \
	    src/luna_methods.c src/luna_methods.h

#
# Here is the build stuff...
#

stage-local:: build/$(ARCH).built
depend::      build/$(ARCH).depend
install::     build/$(ARCH).installed

.SECONDARY: build/$(ARCH).aclocal
build/%.aclocal: Makefile $(SRC_FILES)
	rm -f $@
	rm -rf build/$*
	mkdir -p build/$*
	cp -R src/* build/$*
	touch $@

.SECONDARY: build/$(ARCH).depend
build/%.depend: build/$(ARCH).aclocal
	$(MAKE) -C $(WIDK_DIR) ARCH=$(ARCH) INC_DEPS=1 $(addprefix build_,$(DEPENDS))
	touch $@

build/%.built: build/$(ARCH).depend
	rm -f $@
	cd build/$*; $(SB2) $(MAKE) ARCH=$(ARCH)
	touch $@

INSTALL_EXE_LIST = \
  build/$(ARCH)/linphoneservice \
  $(addprefix $(STAGING_DIR)/usr/bin/, \
     linphonec \
     linphonecsh \
  )

INSTALL_LIB_LIST = \
  $(addprefix $(STAGING_DIR)/usr/lib/, \
     liblinphone.so.3 \
     libortp.so.8 \
     libmediastreamer.so.0 \
     libosip2.so.4 \
     libosipparser2.so.4 \
     libeXosip2.so.4 \
     libspeex.so.1 \
     libspeexdsp.so.1 \
     libgsm.so.1 \
  )

build/%.installed: Makefile build/$(ARCH).built
	rm -f $@
	rm -rf bin/$(ARCH)
	@echo "Installing files in bin/$(ARCH)"; \
	 mkdir -p bin/$(ARCH)
	@for file in $(INSTALL_EXE_LIST) $(INSTALL_LIB_LIST); do \
	   echo " - $${file}"; \
	   install -m 766 $${file} bin/$(ARCH); \
	 done
	@(echo "Linking scripts in bin/$(ARCH)"; \
	  cd bin/script; \
	  for link in *.sh; do \
	    echo " - $${link}"; \
	    ln -s ../script/$${link} ../../bin/$(ARCH)/$${link}; \
	  done)
	touch $@

clobber::
	rm -rf build
