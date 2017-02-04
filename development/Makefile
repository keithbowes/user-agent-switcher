SHELL = /bin/sh

BROWSER ?= $(if $(and $(DISPLAY),$(XDG_SESSION_ID)),xdg-open, \
	   $(if $(and $(COMSPEC),$(OS)),start,firefox))

CURL ?= curl
ECHO ?= echo
MARKDOWN ?= Markdown.pl
MKDIR ?= install -d -m 755
RM ?= rm -f
RMDIR ?= $(RM) -r
SED ?= sed
ZIP ?= zip -q -r -9

AMO_API_KEY ?= user:12345678:987
AMO_API_SECRET ?= 28934y23i4h32i4j23nk4j3244
AMO_DOMAIN ?= addons.allizom.org
JWT ?= $(shell jwtgen --api-key $(AMO_API_KEY) --api-secret $(AMO_API_SECRET))

# In GNU make 4.2+, you can portably read files with the $(file ...) function
# In older version, I'll just use the cat command (which may not available on some OSes)
needed_version ::= 4.2
is_needed_version ::= $(filter $(needed_version),$(firstword $(sort $(MAKE_VERSION) $(needed_version))))
ID ::= $(subst id=,,$(filter id=%,$(if $(is_needed_version),$(file < config.properties),$(shell cat config.properties))))
VERSION ::= $(subst version=,,$(filter version=%,$(if $(is_needed_version),$(file < config.properties),$(shell cat config.properties))))

out_xpi = builds/user-agent-switcher-$(VERSION).xpi
signed_xpi = $(out_xpi:.xpi=-signed.xpi)

.PHONY: all build clean chrome distclean generate install sign-download sign-submit update-translations xpi
all build xpi: $(out_xpi)
generate: install.rdf

clean:
	$(RM) $(wildcard builds/*.xpi)
	$(RM) $(wildcard config.sed)
	$(RM) $(wildcard install.rdf)

distclean: clean
	$(RMDIR) $(wildcard builds)

install: sign
	$(BROWSER) $(out_xpi)

sign-download:
	$(CURL) -H "Authorization: JWT $(JWT)" -g -o signed.json https://$(AMO_DOMAIN)/api/v3/addons/$(ID)/versions/$(VERSION)/
	$(if $(findstring true,$(call jq,.files[0].signed signed.json)),\
		$(CURL) -g -o $(signed_xpi) -H "Authorization: JWT $(JWT)" $(call jq,.files[0].download_url),\
		$(error Not signed))
	$(RM) signed.json
	
sign-submit: $(out_xpi)
	$(CURL) -H "Authorization: JWT $(JWT)" -H "Content-type: multipart/form-data" -XPUT -g --form "upload=@$(out_xpi)" https://$(AMO_DOMAIN)/api/v3/addons/$(ID)/versions/$(VERSION)/ 

dtd_files ::= $(addsuffix /useragentswitcher/useragentswitcher.dtd,$(wildcard chrome/locale/*))
update-translations: $(dtd_files)
$(dtd_files): $(addprefix chrome/locale/en-US/useragentswitcher/useragentswitcher.,dtd properties)
	$(MKDIR) po
	-$(foreach t,$(subst /useragentswitcher/useragentswitcher.dtd,,$@), \
		moz2po -t $(dir $(t))en-US $(t) po; po2moz -t $(dir $(t))en-US po $(t);)
	$(RMDIR) po

docs/index.html: README.md
	$(MKDIR) $(dir $@)
	$(file > $@,<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>User Agent Switcher Overview</title></head><body>)
	$(file >> $@,$(shell $(MARKDOWN) $<))
	$(file >> $@,</body></html>)
	tidy -asxhtml -utf8 -w -im $@

config.sed: config.properties
	$(SED) -e 's/^\(.\+\)=\(.\+\)$$/s,@\1@,\2,g/g' $< > $@

install.rdf: config.sed common_install.rdf
	$(SED) -f $^ > $@

$(out_xpi): bootstrap.js chrome chrome.manifest install.rdf
	$(MKDIR) builds
	$(ZIP) $@ $^ license.txt
