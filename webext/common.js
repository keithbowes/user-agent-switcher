'use strict';

// For older browsers, that have the chrome object instead of the standard browser
if (window.chrome && !window.browser)
    browser = chrome;

/* Compare two hosts */
String.prototype.compareHost = function(compared)
{
    compared = compared.toHost();
    var url = this.toHost();

    return url.localeCompare(compared);
}

/* Convert a URL to domain to be added to the domains list
 * ex: 'https://blog.mozilla.org/addons/2015/08/21/the-future-of-developing-firefox-add-ons/'.toHost();
 * yields: .mozilla.org
 * */
String.prototype.toHost = function()
{
    var _url = this;

    try
    {
        var url = new URL(_url);

        if (!url.hostname)
            throw new Error('Incomplete URL implementation');
    }
    catch (e)
    {
        // Invalid URL (e.g. / for matching all URLs)
        if (e instanceof TypeError)
            return _url;
        // Incomplete URL implementation; try to get the hostname out myself
        else
            url.hostname = _url.replace(/^.*:\/\/([^:\/]+).*$/, '$1');
    }

    // If IPv4 address
    if (url.hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/))
        return url.hostname;

    var match, matches;
    while ((match = url.hostname.match(/\./g)) && 2 < (matches = match.length))
        url.hostname = url.hostname.replace(/^[^\.]+\./, '');

    // If there's no subdomain
    if (2 > matches)
        url.hostname = '.' + url.hostname;

    return url.hostname.replace(/^[^\.]+([^\/]+\..+)$/, '$1');
}

// Set the language of the current page to the used locale
document.documentElement.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'lang',
    browser.i18n.getUILanguage().replace(/_/g, '-'));
