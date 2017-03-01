# User Agent Switcher

The User Agent Switcher extension adds a menu and a toolbar button to switch the user agent of a browser.
The extension is available for [Toolkit](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Toolkit_API)-based [Gecko](https://developer.mozilla.org/en-US/docs/Mozilla/Gecko) applications (see the *[Works in](#worksin)* section for more details), and will run on any platform that this layout engine supports, including Windows, OS X, and Linux.

## Downloading and installing

The extension can be installed from from the [releases page](https://github.com/keithbowes//user-agent-switcher/releases/).

The latest source code can be downloaded as a [ZIP file](https://github.com/keithbowes/user-agent-switcher/zipball/master), a [tarball](https://github.com/keithbowes/user-agent-switcher/zipball/master), or directly from [Github](https://github.com/keithbowes/user-agent-switcher.git).


## <span id="worksin">Works in</span>

The current version should work in any Toolkit-based application using [Gecko 1.9 or higher](https://developer.mozilla.org/en-US/docs/Mozilla/Gecko/Versions).  It's been successfully tested in:

* [Firefox](https://www.mozilla.org/en-US/firefox/organizations/all/) 45.7.0
* [Nightingale](http://getnightingale.com/all-versions.php) 1.12.1
* [Pale Moon](http://www.palemoon.org/) 27.0.3
* [SeaMonkey](http://www.seamonkey-project.org/releases/) 2.46

It should also work in [Flock](https://web.archive.org/web/20110325151017/http://www.flock.com/) 2.x, Firefox 3.0 or higher, Nightingale 1.8 or higher, Palemoon 2.0 or higher, SeaMonkey 2.0 or higher, versions 0.3 or higher of Nightingale's predecessor, [Songbird](http://getsongbird.net/), and in other applications using Toolkit and Gecko 1.9 or higher, but these haven't been tested.

[Older versions](https://addons.mozilla.org/addon/user-agent-switcher/versions/) [claim to support](https://github.com/keithbowes/user-agent-switcher/blob/e8ddcbafcfc5caeac9c33bc787dd4328741df456/development/common_install.rdf) older 1.x and 2.x versions of Firefox and older 1.x versions of Flock.  For SeaMonkey, 2.0 or higher is needed for it to function in a meaningful way (older versions claim to work in SeaMonkey 1.x, but they don't). 

Of course, I recommend you use a current version of a maintained application if possible, to avoid putting yourself at risk for exploits.  Currently, such applications are Firefox and SeaMonkey.  Flock and Songbird have been discontinued and shouldn't be used.

## Plans

Currently my planned releases are:

* ~~0.8: My first release, separating it from the original.  Maybe it should be 0.7.4, as there are no major changes, but just some annoyances I've had have been fixed (persistent settings, the name of the menu item stays the same, fix for Netflix not working with the Tech Patterns list).~~
* 0.9: This should be a hybrid XPCOM/WebExtension in browsers that support it, or pure XPCOM in those that don't.  Chris Pederick's list of issues and to-dos will be fixed in the WebExtensions and shared code.  Not much might be different from 0.8.1 in the XPCOM code.
* 1.0: Completely separate XPCOM and WebExtension extensions.  They might share the same tree or I might create a branch for the legacy extension.  Doubtlessly other features and bug fixes.

## Help

* [Help](https://github.com/keithbowes/docs/help.html)
* [Known issues](https://github.com/keithbowes/user-agent-switcher/issues/)

## Acknowledgements

Supported by:

* [BrowserStack](https://www.browserstack.com/)

## Authors

* [Chris Pederick](http://chrispederick.com/), 0.1&ndash;0.7.3
* [Keith Bowes](http://github.com/keithbowes), 0.8&ndash;current

## License

All files are distributed for free under the terms of the
[GNU General Public License](https://github.com/keithbowes/user-agent-switcher/blob/master/license.txt).
This does not apply to the icons included in the extension which have their own individual licenses.
