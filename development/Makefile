SHELL = /bin/sh

BROWSER ?= $(if $(and $(DISPLAY),$(XDG_SESSION_ID)),xdg-open, \
	   $(if $(and $(COMSPEC),$(OS)),start,firefox))

CP ?= install -m 644
CURL ?= curl
ECHO ?= echo
MKDIR ?= install -d -m 755
MV ?= mv
RM ?= rm -f
RMDIR ?= $(RM) -r
SED ?= sed
ZIP ?= zip -q -r -9

CERT_PASS ?= password

AMO_API_KEY ?= user:12345678:987
AMO_API_SECRET ?= 28934y23i4h32i4j23nk4j3244
JWT ?= $(shell jwtgen --api-key $(AMO_API_KEY) --api-secret $(AMO_API_SECRET))

LINGUAS ?= en-US
locales = $(notdir $(wildcard $(addprefix source/locale_common/,$(addsuffix *,$(LINGUAS)))))

# In GNU make 4.2+, you can portably read files with the $(file ...) function
# In older version, I'll just use the cat command (which may not available on some OSes)
needed_version ::= 4.2
is_needed_version ::= $(filter $(needed_version),$(firstword $(sort $(MAKE_VERSION) $(needed_version))))
ID ::= $(subst id=,,$(filter id=%,$(if $(is_needed_version),$(file < config.properties),$(shell cat config.properties))))
VERSION ::= $(subst version=,,$(filter version=%,$(if $(is_needed_version),$(file < config.properties),$(shell cat config.properties))))

out_prefix = $(if $(findstring $(firstword $(sort 2 $(words $(locales)))),2),-localized,)
out_xpi = builds/user-agent-switcher-$(VERSION)$(out_prefix).xpi
signed_xpi = $(subst .xpi,.1-signed.1-signed.xpi,$(out_xpi))

adjust_path = $(subst source,chrome,$(subst _common,,$(1)))
chrome_files = $(wildcard $(addprefix source/content_common/useragentswitcher/,*.* */*.* options/dialogs/*.*) \
	       $(addprefix source/locale_common/,$(addsuffix /useragentswitcher/*.*,$(addsuffix *,$(LINGUAS)))) \
	       source/skin_common/classic/useragentswitcher/*.*)

.PHONY: all build clean chrome distclean generate install selfsign sign update-translations xpi
all build xpi: $(out_xpi)

chrome: chrome/useragentswitcher.jar
generate: chrome install.js install.rdf

clean:
	$(RM) $(wildcard builds/*.xpi chrome/useragentswitcher.jar)
	$(RM) $(wildcard config.sed)
	$(RM) $(wildcard install.js install.rdf)

distclean: clean
	$(RMDIR) $(wildcard META-INF builds chrome)

install: sign
	$(BROWSER) $(out_xpi)

sign: $(out_xpi)
	$(CURL) -H "Authorization: JWT $(JWT)" -XPUT --form "upload=@$(out_xpi)" https://addons.mozilla.org/api/v3/addons/$(ID)/versions/$(VERSION) 
	$(CURL) -o $(signed_xpi) https://addons.mozilla.org/addon/$(ID)/$(notdir $(signed_xpi))

dtd_files ::= $(addsuffix /useragentswitcher/useragentswitcher.dtd,$(wildcard source/locale_common/*))
update-translations: $(dtd_files)
$(dtd_files): $(addprefix source/locale_common/en-US/useragentswitcher/useragentswitcher.,dtd properties)
	$(MKDIR) po
	-$(foreach t,$(subst /useragentswitcher/useragentswitcher.dtd,,$@), \
		moz2po -t $(dir $(t))en-US $(t) po; po2moz -t $(dir $(t))en-US po $(t);)
	$(RMDIR) po

chrome/useragentswitcher.jar: config.sed $(chrome_files)
	$(MKDIR) chrome
	$(foreach dir,content locale skin,$(MKDIR) $(addprefix chrome/,$(dir);))
	$(foreach file,$(subst $<,,$^),$(MKDIR) $(dir $(call adjust_path,$(file))); $(SED) -f $< -e "s/@build.date@/`date +'%B %d, %Y'`/g" $(file) > $(call adjust_path,$(file));)
	cd chrome && $(ZIP) -0 $(notdir $@) content locale skin
	$(RMDIR) $(addprefix chrome/,content locale skin)

config.sed: config.properties
	$(SED) -e 's/^\(.\+\)=\(.\+\)$$/s,@\1@,\2,g/g' $< > $@

install.%: config.sed common_install.%
	$(SED) -f $^ > $@

$(out_xpi): chrome/useragentswitcher.jar chrome.manifest install.js install.rdf
	$(MKDIR) builds
	$(ZIP) $@ $^ license.txt

# The older, more convenient way to sign. 
# I hope Mozilla reintroduces something like this.
selfsign: generate x509.cert
	$(MKDIR) META-INF
	signtool -d . -k $(ID) -p $(CERT_PASS) .
	$(ZIP) $(out_xpi) META-INF/zigbert.rsa
	$(ZIP) -D $(out_xpi) chrome/useragentswitcher.jar install.js install.rdf license.txt \
		$(filter-out %.rsa,$(wildcard META-INF/*))
	$(MV) $(out_xpi) $(subst .xpi,-selfsigned.xpi,$(out_xpi))

x509.cert: x509.cacert
	$(CP) $< $@

x509.cacert: key3.db
	signtool -G $(ID) -d . -p $(CERT_PASS)

key3.db:
	certutil -N -d .
