var EXPORTED_SYMBOLS = ['UserAgentSwitcherStringBundle'];

Components.utils.import("resource://gre/modules/Services.jsm");
var stringBundle = Services.strings.createBundle("chrome://useragentswitcher/locale/useragentswitcher.properties");

// User Agent Switcher string bundle
var UserAgentSwitcherStringBundle =
{
	// Returns a formatted string from a string bundle
	getFormattedString: function(key, token)
	{
		// If the string bundle, key and token are set
		if(stringBundle && key && token)
		{
			// Try to get the string from the bundle
			try
			{
				return stringBundle.formatStringFromName("useragentswitcher_" + key, token, token.length);
			}
			catch(exception)
			{
				// Do nothing
			}
		}
		
		return "";
	},

	// Returns a string from a string bundle
	getString: function(key)
	{
		// If the string bundle and key are set
		if(stringBundle && key)
		{
			// Try to get the string from the bundle
			try
			{
				return stringBundle.GetStringFromName("useragentswitcher_" + key);
			}
			catch(exception)
			{
				// Do nothing
			}
		}
	}
}
