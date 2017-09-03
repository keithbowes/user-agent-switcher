'use strict';

var Background = {
    events: {
        activated: function(activeInfo)
        {
            Background.userAgent.set();
        },
        beforeSendHeaders: function(e)
        {
            Options.currentHost = e.url.toHost();

            for (var header of e.requestHeaders)
                if (header.name.toLowerCase() == 'user-agent')
                    header.value = Background.userAgent.get('userAgent');

            return {requestHeaders: e.requestHeaders};
        },
        command: function(cmd)
        {
            if ('open-options' == cmd)
                browser.runtime.openOptionsPage();
            else if ('open-test' == cmd)
                browser.browserAction.getPopup({}).then(function(url) { window.open(url); }, null);
        },
        updated: function(tabId, changeInfo, tab)
        {
            Background.userAgent.set();
        }
    },
    userAgent: {
        _default: null,
        get: function(prop)
        {
            var host;
            if (!Options.hosts[host=Options.currentHost])
                if (!Options.hosts[host='/'])
                    host = null;

            let pval = Options.hosts[host];
            if (host && pval)
            {
                browser.browserAction.setTitle({title: Options.hosts[host].description});

                if (pval = pval[prop.toLowerCase()])
                {
                    return pval;
                }
            }

            return Background.userAgent._default[prop];
        },
        getProperties: function()
        {
            return ['userAgent', 'appCodeName', 'appName', 'appVersion', 'platform', 'vendor', 'vendorSub'];
        },
        set: function()
        {
            Options.updateCurrentHost();

            let props = Background.userAgent.getProperties();
            for (let i = 0; i < props.length; i++)
            {
                try
                {
                    Object.defineProperty(navigator, props[i], {get: function() { return Background.userAgent.get(props[i]); }});
                }
                catch(e)
                {
                    //TODO
                    console.log(e);
                }
            }
        }
    }
};

browser.commands.onCommand.addListener(Background.events.command);
browser.tabs.onActivated.addListener(Background.events.activated);
browser.tabs.onUpdated.addListener(Background.events.updated);
browser.webRequest.onBeforeSendHeaders.addListener(Background.events.beforeSendHeaders, {urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);

if (!Background.userAgent._default)
{
    Background.userAgent._default = new Object();

    let props = Background.userAgent.getProperties();
    for (let i = 0; i < props.length; i++)
        Background.userAgent._default[props[i]] = navigator[props[i]];
}
