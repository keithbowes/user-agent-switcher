SHELL = /bin/sh

BROWSER ?= $(if $(and $(DISPLAY),$(XDG_SESSION_ID)),xdg-open, \
	   $(if $(and $(COMSPEC),$(OS)),start,firefox))

CMARK ?= cmark
CURL ?= curl
ECHO ?= echo
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

jq = $(shell jq -r $(1) $(if $(2),$(2),webext/manifest.json))

out_prefix = $(if $(findstring $(firstword $(sort 2 $(words $(locales)))),2),-localized,)
out_xpi = builds/user-agent-switcher-$(VERSION)$(out_prefix).xpi
signed_xpi = $(out_xpi:.xpi=-signed.xpi)

common_files = $(addprefix chrome/content/useragentswitcher/,about/common_about.xul options/common_options.js) common_install.rdf
generated_files = $(subst common_,,$(common_files))

.PHONY: all build clean chrome distclean generate install sign-download
.PHONY: sign-submit update-translations webext webext-sign xpi
all build xpi: generate $(out_xpi)
generate: $(generated_files) $(wildcard docs/*.html)

clean:
	$(RM) $(wildcard $(addprefix builds/*,.xpi .zip))
	$(RM) $(wildcard config.sed)
	$(RM) $(wildcard $(generated_files))

distclean: clean
	$(RMDIR) $(wildcard builds)

install: $(out_xpi)
	$(BROWSER) $<

sign-download:
	$(CURL) -H "Authorization: JWT $(JWT)" -g -o signed.json https://$(AMO_DOM)/api/v3/addons/$(ID)/versions/$(VERSION)/
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
	$(file > $@,<title>User Agent Switcher Overview</title>)
	$(file >> $@,$(shell $(CMARK) $<))
	-tidy -config docs/tidy.conf $@

docs/help.html: docs/HELP.md
	$(MKDIR) $(dir $@)
	$(file > $@,<title>User Agent Switcher Help</title>)
	$(file >> $@,$(shell $(CMARK) $<))
	-tidy -config docs/tidy.conf $@

$(generated_files): $(common_files)
	$(SED) \
		-e 's/@author@/$(call jq,.author)/g' \
		-e 's,@home\.page@,$(call jq,.homepage_url),g' \
		-e 's/@name@/$(call jq,.name)/g' \
		-e 's/@id@/$(ID)/g' \
		-e 's,@user\.agents\.page@,$(call jq,.useragents_download),g' \
		-e 's/@version@/$(VERSION)/g' \
		$(dir $@)$(addprefix common_,$(notdir $@))  > $@

$(out_xpi): chrome chrome.manifest install.rdf
	$(MKDIR) builds
	$(ZIP) $@ $^ license.txt $(foreach f,$(common_files),-x $(f))

webext:
	$(MKDIR) builds
	web-ext build -a builds -o -s webext

webext-sign:
	web-ext sign --api-key $(AMO_API_KEY) --api-secret $(AMO_API_SECRET) --api-url-prefix https://$(AMO_DOM)/api/v3 \
		-a builds -s webext
