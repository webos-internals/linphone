NAME = linphoneservice
VERSION = unknown
DEPENDS = # common/cjson common/dbus-lib common/glib-2.0 common/libgdbus common/luna-service common/mjson

include ../../../support/staging.mk
include ../../../support/cross-compile.mk

stage-local:: build/${ARCH}.built

.SECONDARY: build/${ARCH}.aclocal
build/%.aclocal: Makefile
	rm -f $@
	rm -rf build/$*
	mkdir -p build/$*
	cp -R src/* build/$*
	touch $@

build/%.built: build/${ARCH}.aclocal
	rm -f $@
	( cd build/$* ; ${SB2} $(MAKE) ARCH=$(ARCH) )
	touch $@

clobber::
	rm -rf build
