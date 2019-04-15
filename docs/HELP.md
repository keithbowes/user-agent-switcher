# User Agent Switcher Help

This is a short help document inspired by [Chris Pederick's](http://chrispederick.com/work/user-agent-switcher/help/).

## Requirements

Please read the [README file](https://keithbowes.gitlab.io/user-agent-switcher/) for that.

## Adding different user agents

Currently that's possible, but the 0.9 rewrite will make it so that you can enter the URI of the user-agents file rather than importing and exporting.  I might add custom user agents as an option.

## How can the localizations be updated?

Please fork the repository and send me a pull request.  I'll try to add the translations.

Note: Currently only the English and German translations are complete.  German isn't my native language, so there may be errors.  The others are around two-thirds complete and include the English strings where translated strings aren't available.

0.9 will transform these into WebExtension JSON files and lose the country code, except where it's necessary to distinguish dialects that aren't mutually intelligible (as mainland and Taiwanese Chinese, but the Portuguese and Spanish translations will be merged).  Please try to send in country-agnostic translations if possible.

## Where are the signed XPIs?

As this extension changes user agent settings, Mozilla won't sign it.  Maybe when it's migrated to WebExtensions (modifying HTTP headers without directly changing user settings), it will be signed.

## How to report bugs

Please use [GitLab issues](https://gitlab.com/keithbowes/user-agent-switcher/issues).
