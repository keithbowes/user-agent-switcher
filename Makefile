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
AMO_DOM ?= allizom.org
JWT ?= $(strip $(shell jwtgen --api-key $(AMO_API_KEY) --api-secret $(AMO_API_SECRET)))

# Default to all locales, but it can be overridden
LINGUAS ?= *
locales = $(notdir $(wildcard $(addprefix source/locale_common/,$(addsuffix *,en $(LINGUAS)))))

ID = $(call jq,.applications.gecko.id)
VERSION = $(call jq,.version)

jq = $(shell jq -r $(1) $(if $(2),$(2),manifest.json))

out_prefix = $(if $(findstring $(firstword $(sort 2 $(words $(locales)))),2),-localized,)
out_xpi = builds/user-agent-switcher-$(VERSION)$(out_prefix).xpi
signed_xpi = $(out_xpi:.xpi=-signed.xpi)

common_files = $(addprefix chrome/content/useragentswitcher/,about/common_about.xul common_upgrade.js options/common_options.js) common_install.rdf
generated_files = $(subst common_,,$(common_files))

.PHONY: all build clean chrome distclean generate install sign-download sign-submit update-translations xpi
all build xpi: generate $(out_xpi)
generate: $(generated_files)

clean:
	$(RM) $(wildcard builds/*.xpi)
	$(RM) $(wildcard config.sed)
	$(RM) $(wildcard $(generated_files))

distclean: clean
	$(RMDIR) $(wildcard builds)

install: sign
	$(BROWSER) $(out_xpi)

sign-download:
	$(CURL) -H "Authorization: JWT $(JWT)" -g -o signed.json https://$(AMO_DOMAIN)/api/v3/addons/$(ID)/versions/$(VERSION)/
	$(if $(findstring true,$(call jq,.files[0].signed,signed.json)),\
		$(CURL) -g -o $(signed_xpi) -H "Authorization: JWT $(JWT)" $(call jq,.files[0].download_url,signed.json),\
		$(error Not signed))
	$(RM) signed.json
	
sign-send: $(out_xpi)
	$(CURL) -H "Authorization: JWT $(JWT)" -H "Content-type: multipart/form-data -XPUT -g --form "upload=@$(out_xpi)" https://addons.$(AMO_DOM)/api/v3/addons/$(ID)/versions/$(VERSION)/ 

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

$(generated_files): $(common_files)
	$(SED) \
		-e 's/@author@/$(call jq,.author)/g' \
		-e 's/@description@/$(call jq,.description)/g' \
		-e 's,@home\.page@,$(call jq,.homepage_url),g' \
		-e 's/@name@/$(call jq,.name)/g' \
		-e 's/@id@/$(ID)/g' \
		-e 's,@user\.agents\.page@,$(call jq,.useragents_download),g' \
		-e 's/@version@/$(VERSION)/g' \
		$(dir $@)$(addprefix common_,$(notdir $@))  > $@

$(out_xpi): chrome chrome.manifest install.rdf
	$(MKDIR) builds
	$(ZIP) $@ $^ license.txt $(foreach f,$(common_files),-x $(f))
