Components.utils.import("resource://gre/modules/Services.jsm");

var stringBundle = Services.strings.createBundle("chrome://useragentswitcher/locale/useragentswitcher.properties");

function startup(data,reason) {
    //Components.utils.import("chrome://myAddon/content/myModule.jsm");
    //myModule.startup();  // Do whatever initial startup stuff you need to do

    forEachOpenWindow(loadIntoWindow);
    Services.wm.addListener(WindowListener);
}

function shutdown(data,reason) {
    if (reason == APP_SHUTDOWN)
        return;

    forEachOpenWindow(unloadFromWindow);
    Services.wm.removeListener(WindowListener);

    //myModule.shutdown();  // Do whatever shutdown stuff you need to do on addon disable

    //Components.utils.unload("chrome://myAddon/content/myModule.jsm");  // Same URL as above

    // HACK WARNING: The Addon Manager does not properly clear all addon related caches on update;
    //               in order to fully update images and locales, their caches need clearing here
    Services.obs.notifyObservers(null, "chrome-flush-caches", null);
}

function install(data,reason) { }
function uninstall(data,reason) { }

function loadIntoWindow(window) {
/* call/move your UI construction function here */
	createMenu(window, ['TasksMenu'], ['downloadmgr']);
	createMenu(window, ['ToolsMenu', 'tools-menu'], ['devToolsSeparator']);
	createTool(window); 
}

function createMenuSkeleton(window, menu, type)
{
	var menupopup = window.document.createElement('menupopup');
	menupopup.id = 'useragentswitcher-popup-' + type;
	menu.appendChild(menupopup);

	var defaultmenu = window.document.createElement('menuitem');
	defaultmenu.id = 'useragentswitcher-default-' + type;
	defaultmenu.setAttribute('label', stringBundle.GetStringFromName('useragentswitcher_defaultUserAgent'));
	defaultmenu.setAttribute('name', 'useragentswitcher-group-' + type);
	defaultmenu.setAttribute('oncommand', 'UserAgentSwitcher.reset();');
	defaultmenu.setAttribute('type', 'radio');

	if (type == 'toolbar')
		defaultmenu.setAttribute('accesskey', 'useragentswitcher_default_user_agent_key');

	menupopup.appendChild(defaultmenu);

	for (var i = 1; i < 3; i++)
	{
		sep = window.document.createElement('menuseparator');
		sep.id = 'useragentswitcher-separator-' + i + '-' + type;
		menupopup.appendChild(sep);
	}

	editmenu = window.document.createElement('menuitem');
	editmenu.id = 'useragentswitcher-edit-user-agents-' + type;
	editmenu.setAttribute('label', stringBundle.GetStringFromName('useragentswitcher_edit_user_agents'));
	editmenu.setAttribute('oncommand', 'UserAgentSwitcher.options();');

	if (type == 'toolbar')
		editmenu.setAttribute('accesskey', 'useragentswitcher_edit_user_agents_key');

	menupopup.appendChild(editmenu);

	sep = sep.cloneNode();
	sep.id = 'useragentswitcher-separator-3-' + type;
	menupopup.appendChild(sep);

	var uamenu = menu.cloneNode();
	uamenu.className = null;
	uamenu.id = 'useragentswitcher-extension-' + type;
	uamenu.removeAttribute('image');
	menupopup.appendChild(uamenu);

	var uapopup = window.document.createElement('menupopup');
	uamenu.appendChild(uapopup);

	var optionsmenu = editmenu.cloneNode();
  optionsmenu.setAttribute('label', stringBundle.GetStringFromName('useragentswitcher_options'));

	if (type == 'toolbar')
		optionsmenu.setAttribute('accesskey', 'useragentswitcher_options_key');

	uapopup.appendChild(optionsmenu);

	sep = sep.cloneNode();
	sep.id = 'useragentswitcher-extension-seperator-' + type;
	uapopup.appendChild(sep);

	menus = ['help', 'test', 'about'];
	var sub = [];
	for (var i = 0; i < menus.length; i++)
	{
		sub[i] = window.document.createElement('menuitem');
		sub[i].id = 'useragentswitcher-' + menus[i] + '-' + type;
		sub[i].setAttribute('label', stringBundle.GetStringFromName('useragentswitcher_' + menus[i]));
		sub[i].setAttribute('oncommand', 'UserAgentSwitcher.' + menus[i] + '()');

		if (type == 'toolbar')
			sub[i].setAttribute('accesskey', stringBundle.GetStringFromName('useragentswitcher_' + menus[i] + '_key'));

		uapopup.appendChild(sub[i]);
	}
}

function createMenu(window, uamenus, siblings)
{
	removeMenus(window.document.getElementById('useragentswitcher-menu'));

	var menu = window.document.createElement('menu');
	menu.className = 'menuitem-iconic';
	menu.setAttribute('image', 'chrome://useragentswitcher/skin/default.png');
	menu.setAttribute('label', stringBundle.GetStringFromName('useragentswitcher_name'));
	createMenuSkeleton(window, menu, 'menu');

	var toolsmenu = null;
	for (var i = 0; i < uamenus.length; i++)
		if (toolsmenu = window.document.getElementById(uamenus[i]))
			break;

	if (!toolsmenu)
			toolsmenu = window.document.getElementById('main-menubar').childNodes[5];

	toolsmenu = toolsmenu.firstChild;

	var dmg = null;
	for (var i = 0; i < siblings.length && !dmg; i++)
		for (j = 0; j < toolsmenu.childNodes.length; j++)
			if (toolsmenu.childNodes[j].id == siblings[i])
			{
				dmg = toolsmenu.childNodes[j].nextSibling;
				break;
			}

	if (!dmg)
		dmg = toolsmenu.lastChild;

	toolsmenu.insertBefore(menu, dmg);
}

function createTool(window)
{
	palette = window.document.getElementById('BrowserToolbarPalette');
	button = window.document.createElement('toolbarbutton');
	button.setAttribute('accesskey', stringBundle.GetStringFromName('useragentswitcher_name_key'));
	button.setAttribute('image', 'chrome://useragentswitcher/skin/default.png');
	button.setAttribute('label', stringBundle.GetStringFromName('useragentswitcher_name'));
	button.setAttribute('onmouseover', 'UserAgentSwitcher.openToolBar(this);');
	button.setAttribute('type', 'menu');
	palette.appendChild(button);
	createMenuSkeleton(window, button, 'toolbar');
}

function removeMenus(menu)
{
	if (!menu)
		return;

	if (menu.hasChildNodes())
	{
		for (i = 0; i < menu.childNodes.length; i++)
			removeMenus(menu.childNodes[i]);
	}
	menu.parentNode.removeChild(menu);
}

function unloadFromWindow(window) {
/* call/move your UI tear down function here */
	//window.document.unloadOverlay("chrome://useragentswitcher/content/useragentswitcher.xul");
	removeMenus(window.document.getElementById('useragentswitcher-menu'));
}

function forEachOpenWindow(todo)  // Apply a function to all open browser windows
{
    var windows = Services.wm.getEnumerator("navigator:browser");
    while (windows.hasMoreElements())
        todo(windows.getNext().QueryInterface(Components.interfaces.nsIDOMWindow));
}

var WindowListener =
{
    onOpenWindow: function(xulWindow)
    {
        var window = xulWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                              .getInterface(Components.interfaces.nsIDOMWindow);
        function onWindowLoad()
        {
            window.removeEventListener("load",onWindowLoad);
            if (window.document.documentElement.getAttribute("windowtype") == "navigator:browser")
                loadIntoWindow(window);
        }
        window.addEventListener("load",onWindowLoad);
    },
    onCloseWindow: function(xulWindow) { },
    onWindowTitleChange: function(xulWindow, newTitle) { }
};
