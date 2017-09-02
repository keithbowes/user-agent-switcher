// User Agent Switcher
var UserAgentSwitcher =
{
    uninstalled: false,
	// Displays the about dialog
	about: function()
	{
		window.openDialog("chrome://useragentswitcher/content/about/about.xul", "useragentswitcher-about-dialog", "centerscreen,chrome,modal");
	},

	// Called when a button has been dropped
	buttonDrop: function(event)
	{
		nsDragAndDrop.drop(event, UserAgentSwitcher);
	},

    // Information about the add-on state
    addonListener:
    {
        onInstalling: function(addon, needsRestart)
        {
            UserAgentSwitcher.uninstalled = addon.pendingUpgrade;
        },

        onOperationCancelled: function(addon)
        {
            UserAgentSwitcher.uninstalled = !UserAgentSwitcher.uninstalled;
        },

        onUninstalled: function(addon)
        {
            UserAgentSwitcher.uninstalled = true;
        },

        onUninstalling: function(addon, needsRestart)
        {
            UserAgentSwitcher.uninstalled = true;
        }
    },

	// Changes the options
	changeOptions: function()
	{
		var hideMenuPreference = false;
		var menu               = document.getElementById("useragentswitcher-menu");

		// If the hide menu preference is set
		if(UserAgentSwitcherPreferences.isPreferenceSet("useragentswitcher.menu.hide"))
		{
			hideMenuPreference = UserAgentSwitcherPreferences.getBooleanPreference("useragentswitcher.menu.hide", true);
		}

		// If the menu exists
		if(menu)
		{
			menu.setAttribute("hidden", hideMenuPreference);
		}
	},

	// Finds the selected user agent and returns its position and description
	findSelectedUserAgent: function()
	{
		var selectedUserAgent = {};
		var userAgent         = null;
		var userAgents        = document.getElementById("useragentswitcher-popup-menu").getElementsByAttribute("type", "radio");
		var userAgentsLength  = userAgents.length;

		selectedUserAgent.description = "";
		selectedUserAgent.position    = "";

		// Loop through the user agents
		for(var i = 0; i < userAgentsLength; i++)
		{
			userAgent = userAgents.item(i);

			// If this is the selected user agent
			if(UserAgentSwitcher.isSelectedUserAgent(userAgent))
			{
				selectedUserAgent.description = userAgent.getAttribute("label");
				selectedUserAgent.position    = i;

				break;
			}
		}

		return selectedUserAgent;
	},

	// Returns the selected user agents for a particular menu
	getIndividualSelectedUserAgents: function(menu)
	{
		var userAgents = [];

		// If the menu is set
		if(menu)
		{
			var subMenus       = menu.getElementsByTagName("menu");
			var subMenusLength = subMenus.length;

			userAgents = userAgents.concat(UserAgentSwitcherArray.convertCollectionToArray(menu.getElementsByAttribute("checked", "true")));

			// Loop through the sub menus
			for(var i = 0; i < subMenusLength; i++)
			{
				userAgents = userAgents.concat(UserAgentSwitcher.getIndividualSelectedUserAgents(subMenus[i].firstChild));
			}
		}

		return userAgents;
	},

	// Returns the selected user agents
	getSelectedUserAgents: function(windowDocument)
	{
		return UserAgentSwitcher.getIndividualSelectedUserAgents(windowDocument.getElementById("useragentswitcher-popup-menu")).concat(UserAgentSwitcher.getIndividualSelectedUserAgents(windowDocument.getElementById("useragentswitcher-popup-toolbar")));
	},

	// Return the supported flavours
	getSupportedFlavours: function()
	{
	var flavourSet = new FlavourSet();

	flavourSet.appendFlavour("text/toolbarwrapper-id/" + document.documentElement.id);

	return flavourSet;
	},

	// Opens the help
	help: function()
	{
		window.getBrowser().selectedTab = window.getBrowser().addTab("@home.page@docs/help/");
	},

	// Initializes the extension
	initialize: function(event)
	{
		// Try to get the window content
		try
		{
			var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

			UserAgentSwitcherImporter.installUserAgents();
			UserAgentSwitcherImporter.import(UserAgentSwitcherImporter.importTypeMenu, UserAgentSwitcherImporter.getUserAgentFileLocation(), true);

			// If the observer service is set
			if(observerService)
			{
				observerService.addObserver(UserAgentSwitcher, "quit-application-requested", false);
			}

			document.getElementById("navigator-toolbox").addEventListener("dragdrop", UserAgentSwitcher.buttonDrop, false);
			window.removeEventListener("load", UserAgentSwitcher.initialize, false);
		}
		catch(exception)
		{
			UserAgentSwitcherLog.log("UserAgentSwitcher.initialize", exception);
		}
	},

	// Initializes the display
	initializeDisplay: function()
	{
		var allWindows           = UserAgentSwitcherDOM.getAllWindows();
		var allWindowsLength     = allWindows.length;
		var defaultUserAgent     = null;
		var position             = null;
		var userAgentDescription = null;
		var userAgentSet         = false;

		// If the user agent override preference is set
		if(UserAgentSwitcherPreferences.isPreferenceSet("general.useragent.override"))
		{
			var selectedUserAgent = UserAgentSwitcher.findSelectedUserAgent();

			position             = selectedUserAgent.position;
			userAgentDescription = selectedUserAgent.description;
			userAgentSet         = true;
		}
		else
		{
			defaultUserAgent = UserAgentSwitcherStringBundle.getString("defaultUserAgent");
		}

		// Loop through the open windows
		for(var i = 0; i < allWindowsLength; i++)
		{
			// If a user agent is set
			if(userAgentSet)
			{
				UserAgentSwitcher.selectUserAgent(allWindows[i].document, position, userAgentDescription);
			}
			else
			{
				UserAgentSwitcher.resetUserAgent(allWindows[i].document, defaultUserAgent);
			}
		}
	},

	// Checks whether a preferences matches an attribute
	isMatch: function(userAgent, pref, attr)
	{
		if (UserAgentSwitcherPreferences.isPreferenceSet(pref))
			return UserAgentSwitcherPreferences.getStringPreference(pref, true) == userAgent.getAttribute("useragentswitcher" + attr);
		else
			return true;
	},

	// Returns true if this is the selected user agent
	isSelectedUserAgent: function(userAgent)
	{
		// If all the attributes match
		if (UserAgentSwitcher.isMatch(userAgent, "general.useragent.appName", "appcodename") &&
			UserAgentSwitcher.isMatch(userAgent, "general.appname.override", "appname") &&
			UserAgentSwitcher.isMatch(userAgent, "general.appversion.override", "appversion") &&
			UserAgentSwitcher.isMatch(userAgent, "general.platform.override", "platform") &&
			UserAgentSwitcher.isMatch(userAgent, "general.useragent.override", "useragent") &&
			UserAgentSwitcher.isMatch(userAgent, "general.useragent.vendor", "vendor") &&
			UserAgentSwitcher.isMatch(userAgent, "general.useragent.vendorSub", "vendorsub"))
		{
			return true;
		}

		return false;
	},

	// Observes quits
	observe: function(subject, topic, data)
	{
        if ('quit-application' == topic)
        {
            // If the reset on close preference is not set or is set to true
            if(!UserAgentSwitcherPreferences.isPreferenceSet("useragentswitcher.reset.onclose") || UserAgentSwitcherPreferences.getBooleanPreference("useragentswitcher.reset.onclose", true))
            {
                UserAgentSwitcher.reset();
            }

            // If the add-on is to be uninstalled, delete the data
            if (UserAgentSwitcher.uninstalled)
            {
                UserAgentSwitcher.reset();

                UserAgentSwitcherPreferences.deletePreference("useragentswitcher.import.overwrite");
                UserAgentSwitcherPreferences.deletePreference("useragentswitcher.menu.hide");
                UserAgentSwitcherPreferences.deletePreference("useragentswitcher.reset.onclose");
                UserAgentSwitcherPreferences.deletePreference("useragentswitcher.version");

                if (confirm(UserAgentSwitcherStringBundle.getString("deleteFile")))
                    UserAgentSwitcherImporter.getUserAgentDirectoryLocation().remove(true);
            }
        }

		return false;
	},

	// Called when a button has been dropped
	onDrop: function (event, transferData, session)
	{
		// If the User Agent Switcher button was dropped
	if(transferData.data == "useragentswitcher-button")
	{
			UserAgentSwitcherImporter.import(UserAgentSwitcherImporter.importTypeMenu, UserAgentSwitcherImporter.getUserAgentFileLocation(), true);
	}
	},

	// Opens a toolbar button automatically if another toolbar button is open on the toolbar
	openToolbarButton: function(currentToolbarButton)
	{
		// If the toolbar button is set and is not open
		if(currentToolbarButton && !currentToolbarButton.open)
		{
			var toolbarButton        = null;
			var toolbarButtons       = currentToolbarButton.parentNode.getElementsByTagName("toolbarbutton");
			var toolbarButtonsLength = toolbarButtons.length;

			// Loop through the toolbar buttons
			for(var i = 0; i < toolbarButtonsLength; i++)
			{
				toolbarButton = toolbarButtons.item(i);

				// If the toolbar button is set, is not the same toolbar button and is open
				if(toolbarButton && toolbarButton != currentToolbarButton && toolbarButton.open)
				{
					toolbarButton.open        = false;
					currentToolbarButton.open = true;

					break;
				}
			}
		}
	},

	// Displays the options dialog
	options: function()
	{
		window.openDialog("chrome://useragentswitcher/content/options/options.xul", "useragentswitcher-options-dialog", "centerscreen,chrome,modal,resizable");

		UserAgentSwitcher.changeOptions();
	},

	// Resets the user agent
	reset: function()
	{
		var allWindows       = UserAgentSwitcherDOM.getAllWindows();
		var allWindowsLength = allWindows.length;
		var defaultUserAgent = UserAgentSwitcherStringBundle.getString("defaultUserAgent");

		// If an override app code name is set
		if(UserAgentSwitcherPreferences.isPreferenceSet("general.useragent.appName"))
		{
			UserAgentSwitcherPreferences.deletePreference("general.useragent.appName");
		}

		// If an override app name is set
		if(UserAgentSwitcherPreferences.isPreferenceSet("general.appname.override"))
		{
			UserAgentSwitcherPreferences.deletePreference("general.appname.override");
		}

		// If an override app version is set
		if(UserAgentSwitcherPreferences.isPreferenceSet("general.appversion.override"))
		{
			UserAgentSwitcherPreferences.deletePreference("general.appversion.override");
		}

		// If an override platform is set
		if(UserAgentSwitcherPreferences.isPreferenceSet("general.platform.override"))
		{
			UserAgentSwitcherPreferences.deletePreference("general.platform.override");
		}

		// If an override user agent is set
		if(UserAgentSwitcherPreferences.isPreferenceSet("general.useragent.override"))
		{
			UserAgentSwitcherPreferences.deletePreference("general.useragent.override");
		}

		// If an override vendor is set
		if(UserAgentSwitcherPreferences.isPreferenceSet("general.useragent.vendor"))
		{
			UserAgentSwitcherPreferences.deletePreference("general.useragent.vendor");
		}

		// If an override vendor sub is set
		if(UserAgentSwitcherPreferences.isPreferenceSet("general.useragent.vendorSub"))
		{
			UserAgentSwitcherPreferences.deletePreference("general.useragent.vendorSub");
		}

		// Loop through the open windows
		for(var i = 0; i < allWindowsLength; i++)
		{
			UserAgentSwitcher.resetUserAgent(allWindows[i].document, defaultUserAgent);
		}
	},

	// Resets the user agent for a window
	resetUserAgent: function(windowDocument, defaultUserAgent)
	{
		var defaultMenu              = windowDocument.getElementById("useragentswitcher-default-menu");
		var defaultToolbar           = windowDocument.getElementById("useragentswitcher-default-toolbar");
		var selectedUserAgent        = null;
		var selectedUserAgents       = UserAgentSwitcher.getSelectedUserAgents(windowDocument);
		var selectedUserAgentsLength = selectedUserAgents.length;
		var userAgentButton          = windowDocument.getElementById("useragentswitcher-button");
		var userAgentMenu            = windowDocument.getElementById("useragentswitcher-menu");

		// If the user agent menu exists
		if(userAgentMenu)
		{
			userAgentMenu.setAttribute("image", "chrome://useragentswitcher/skin/default.png");
			userAgentMenu.setAttribute("tooltiptext", defaultUserAgent);
		}

		// If the user agent button is set
		if(userAgentButton)
		{
			// If the user agent button has a default attribute
			if(userAgentButton.hasAttribute("default"))
			{
				userAgentButton.removeAttribute("default");
			}

			userAgentButton.setAttribute("label", defaultUserAgent);
			userAgentButton.setAttribute("tooltiptext", defaultUserAgent);
		}

		// Loop through the selected user agents
		for(var i = 0; i < selectedUserAgentsLength; i++)
		{
			selectedUserAgent = selectedUserAgents[i];

			// If the selected user agent does not have an id or the id is not the default
			if(!selectedUserAgent.hasAttribute("id") || selectedUserAgent.getAttribute("id").indexOf("useragentswitcher-default-") != 0)
			{
				selectedUserAgent.removeAttribute("checked");
			}
		}

		// If the default menu exists
		if(defaultMenu)
		{
			defaultMenu.setAttribute("checked", true);
		}

		// If the default toolbar exists
		if(defaultToolbar)
		{
			defaultToolbar.setAttribute("checked", true);
		}
	},

	// Selects the user agent for a window
	selectUserAgent: function(windowDocument, position, selectedUserAgentDescription)
	{
		var positionMenu             = windowDocument.getElementById("useragentswitcher-user-agent-" + position + "-menu");
		var positionToolbar          = windowDocument.getElementById("useragentswitcher-user-agent-" + position + "-toolbar");
		var selectedUserAgent        = null;
		var selectedUserAgents       = UserAgentSwitcher.getSelectedUserAgents(windowDocument);
		var selectedUserAgentsLength = selectedUserAgents.length;
		var userAgentButton          = windowDocument.getElementById("useragentswitcher-button");
		var userAgentMenu            = windowDocument.getElementById("useragentswitcher-menu");

		// If the user agent menu exists
		if(userAgentMenu)
		{
			userAgentMenu.setAttribute("image", "chrome://useragentswitcher/skin/non-default.png");
			userAgentMenu.setAttribute("tooltiptext", selectedUserAgentDescription);

			//// If the selected user agent description is set
			//if(selectedUserAgentDescription)
			//{
			//	userAgentMenu.setAttribute("label", selectedUserAgentDescription);
			//}
		}

		// If the user agent button is set
		if(userAgentButton)
		{
			userAgentButton.setAttribute("default", "false");

			// If the selected user agent description is set
			if(selectedUserAgentDescription)
			{
				userAgentButton.setAttribute("label", selectedUserAgentDescription);
				userAgentButton.setAttribute("tooltiptext", selectedUserAgentDescription);
			}
		}

		// Loop through the selected user agents
		for(var i = 0; i < selectedUserAgentsLength; i++)
		{
			selectedUserAgent = selectedUserAgents[i];

			// If the selected user agent does not have an id or the id does not match the position
			if(!selectedUserAgent.hasAttribute("id") || selectedUserAgent.getAttribute("id").indexOf("useragentswitcher-user-agent-" + position + "-") != 0)
			{
				selectedUserAgent.removeAttribute("checked");
			}
		}

		// If the position menu exists
		if(positionMenu)
		{
			positionMenu.setAttribute("checked", true);
		}

		// If the position toolbar exists
		if(positionToolbar)
		{
			positionToolbar.setAttribute("checked", true);
		}
	},

	// Switches the user agent
	switchUserAgent: function(userAgent)
	{
		var allWindows           = UserAgentSwitcherDOM.getAllWindows();
		var allWindowsLength     = allWindows.length;
		var appCodeName          = userAgent.getAttribute("useragentswitcherappcodename");
		var position             = userAgent.getAttribute("useragentswitcherposition");
		var userAgentDescription = userAgent.getAttribute("label");

		var properties = ['appcodename', 'appname', 'appversion', 'platform', 'useragent', 'vendor', 'vendorsub'];
		var pref;
		for (i = 0; i < properties.length; i++)
		{
			switch (properties[i])
			{
				case 'appcodename':
					pref = 'general.useragent.appName';
					break;
				case 'platform':
					pref = 'general.platform.override';
					break;
				case 'vendor':
				case 'vendorsub':
					pref = 'general.useragent.' + properties[i];
					break;
				default:
					pref = 'general.' + properties[i] + '.override';
					break;
			}

			if (userAgent.getAttribute('useragentswitcher' + properties[i]) || userAgent.getAttribute('useragentswitcherallowemptyproperties') != 0)
				UserAgentSwitcherPreferences.setStringPreference(pref, userAgent.getAttribute("useragentswitcher" + properties[i]));
			else
				UserAgentSwitcherPreferences.deletePreference(pref);
		}

		// Loop through the open windows
		for(var i = 0; i < allWindowsLength; i++)
		{
			UserAgentSwitcher.selectUserAgent(allWindows[i].document, position, userAgentDescription);
		}
	},

	// Opens the test page
	test: function()
	{
		window.getBrowser().selectedTab = window.getBrowser().addTab("chrome://useragentswitcher/content/test.html");
	},

	// Uninitializes the extension
	uninitialize: function(event)
	{
		// Try to get the window content
		try
		{
			var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

			// If the observer service is set
			if(observerService)
			{
				observerService.removeObserver(UserAgentSwitcher, "quit-application-requested", false);
			}

			// If the reset on close preference is not set or is set to true
			if(!UserAgentSwitcherPreferences.isPreferenceSet("useragentswitcher.reset.onclose") || UserAgentSwitcherPreferences.getBooleanPreference("useragentswitcher.reset.onclose", true))
			{
				var allWindows  = UserAgentSwitcherDOM.getAllWindows();
				var windowCount = allWindows.length;

				// If this is the last window closing
				if(windowCount == 0)
				{
					UserAgentSwitcher.reset();
				}
			}

			document.getElementById("navigator-toolbox").removeEventListener("dragdrop", UserAgentSwitcher.buttonDrop, false);
			window.removeEventListener("close", UserAgentSwitcher.uninitialize, false);
		}
		catch(exception)
		{
			UserAgentSwitcherLog.log("UserAgentSwitcher.uninitialize", exception);
		}
	}
};

window.addEventListener("load", UserAgentSwitcher.initialize, false);
window.addEventListener("unload", UserAgentSwitcher.uninitialize, false);

// Delete preferences on uninstall or upgrade
Components.utils.import("resource://gre/modules/AddonManager.jsm");
AddonManager.addAddonListener(UserAgentSwitcher.addonListener);
