'use strict';

var HostsList = {
    add: function(e, p)
    {
        if (!p)
            p = prompt(browser.i18n.getMessage('EnterHost'), Options.currentHost);

        if (p)
        {
            var hl = document.querySelector('#hosts-list');
            var opt = document.createElement('option');
            opt.appendChild(document.createTextNode(p));

            hl.add(opt);
            hl.options[hl.options.length - 1].selected = true;

            var ul = document.querySelector('#ua-list');
            if (ul.options.length > 0)
                ul.options[0].selected = true;

            ul.focus();
        }
    },
    delete: function(e)
    {
        var hl = document.getElementById('hosts-list');
        if (hl.options.length > 0)
        {
            var si = hl.selectedIndex;
            hl.remove(si);

            if (si < hl.options.length)
                hl.options[si].selected = true;
            else if (hl.options.length > 0)
                hl.options[si - 1].selected = true;
        }
    },
    down: function(e)
    {
        var hl = document.querySelector('#hosts-list');
        var si = hl.selectedIndex;
        if (si < hl.options.length)
            hl.add(hl.options[si], si + 2);
    },
    selectUserAgent: function(e)
    {
        var ul = document.querySelector('#ua-list');
        for (var i = 0; i < ul.options.length; i++)
        {
            if (ul.options[i].dataset.description == e.target.options[e.target.selectedIndex].dataset.description)
            {
                ul.options[i].selected = true;
                break;
            }
        }
    },
    up: function(e)
    {
        var hl = document.querySelector('#hosts-list');
        var si = hl.selectedIndex;
        if (si > 0)
            hl.add(hl.options[si], si - 1);
    }
};

var Options = {
    currentHost: '',
    hosts: [],
    ua_file: '',
    get: function()
    {
        browser.storage.local.get('hosts').then(function (o) { if (o.hosts) Options.hosts = JSON.parse(o.hosts); }, null);
        browser.storage.local.get('uafile').then(function (o) { Options.ua_file = o.uafile ? o.uafile : browser.runtime.getURL('useragents.xml'); }, null);
    },
    reset: function(e)
    {
        if (confirm(browser.i18n.getMessage('ResetConfirmation')))
        {
            browser.storage.local.clear();
            location.reload();
        }
    },
    save: function(e)
    {
        browser.storage.local.set({uafile: document.getElementById('ua-file').value});

        var hl = document.querySelector('#hosts-list');
        var hosts = new Object();
        for (let i = 0; i < hl.options.length; i++)
        {
            let opt = hl.options[i];
            let ods = opt.dataset;
            hosts[opt.firstChild.nodeValue] = new UserAgent(ods.description, ods.useragent, ods.appcodename, ods.appname, ods.appversion, ods.platform, ods.vendor, ods.vendorsub);
        }

        if (Object.keys(hosts).length > 0)
            browser.storage.local.set({hosts: JSON.stringify(hosts)});
    },
    updateCurrentHost: function()
    {
        browser.tabs.query({active: true, currentWindow: true}).then(function(tabs) { for (let tab of tabs) { let url = tab.url; if (url) Options.currentHost = url.toHost(); } }, null);
    }
};

var OptionsPage = {
    hosts: HostsList,
    userAgents: {
        selected: function(e)
        {
            var hl = document.querySelector('#hosts-list');
            var opt = e.target.options[e.target.selectedIndex];
            var attrs = opt.attributes;

            for (let i = 0; i < attrs.length; i++)
                hl.options[hl.selectedIndex].setAttribute(attrs[i].name, attrs[i].value);
        }
    },
    createLists: function(e)
    {
        var hostscell = document.getElementById('hosts-cell');
        var hostlist = document.createElement('select');
        hostlist.id = 'hosts-list';
        hostlist.size = 10;
        hostscell.appendChild(hostlist);

        var uacell = document.getElementById('ua-cell');
        var ualist = document.createElement('select');
        ualist.id = 'ua-list';
        ualist.size = 10;
        ualist.tabIndex = 2;
        uacell.appendChild(ualist);
    },
    downloadList: function(e)
    {
        var options = {
            conflictAction: 'overwrite',
            filename: Options.ua_file,
            method: 'GET',
            /* For the time being, downloads to relative to the downloads directory
             * instead of to the absolute path specified by Options.ua_file, so the
             * user will have to choose the proper directory: */
            saveAs: true,
            url: browser.runtime.getManifest().useragents_download
        };

        browser.downloads.download(options).then(null, function(e) { alert(browser.i18n.getMessage(DownloadFailed, e)); });
    },
    initialize: function(e)
    {
        OptionsPage.createLists(e);
        OptionsPage.loadEventListeners(e);
        OptionsPage.loadLists(e);
        OptionsPage.loadTranslations(e);
    },
    loadEventListeners: function(e)
    {
        document.getElementById('add-new').addEventListener('click', OptionsPage.hosts.add);
        document.getElementById('delete').addEventListener('click', OptionsPage.hosts.delete);
        document.getElementById('dl-ua').addEventListener('click', OptionsPage.downloadList);
        document.getElementById('hosts-list').addEventListener('change', OptionsPage.hosts.selectUserAgent);
        document.getElementById('move-down').addEventListener('click', OptionsPage.hosts.down);
        document.getElementById('move-up').addEventListener('click', OptionsPage.hosts.up);
        document.getElementById('reset').addEventListener('click', Options.reset);
        document.getElementById('save').addEventListener('click', Options.save);
        document.getElementById('ua-list').addEventListener('change', OptionsPage.userAgents.selected);

        // Just in case you forgot to push "Save" before leaving the page
        window.addEventListener('beforeunload', Options.save);
    },
    loadLists: function(e)
    {
        var hl = document.querySelector('#hosts-list');
        var obj = Options.hosts;

        for (let prop in obj)
        {
            OptionsPage.hosts.add(e, prop);

            for (let attr in obj[prop])
                if ('string' == typeof obj[prop][attr])
                    hl.options[hl.selectedIndex].dataset[attr] = obj[prop][attr];
        }

        document.querySelector('#ua-file').value = Options.ua_file;
        OptionsPage.loadUserAgents(e);

        if (0 < hl.options.length)
            hl.options[0].selected = true;
    },
    loadTranslations: function(e)
    {
        document.querySelector('#add-new').value = browser.i18n.getMessage('AddNew');
        document.querySelector('#delete').value = browser.i18n.getMessage('Delete');
        document.querySelector('#dl-ua').value = browser.i18n.getMessage('DownloadLatest');
        document.querySelector('#move-down').value = browser.i18n.getMessage('MoveDown');
        document.querySelector('#move-up').value = browser.i18n.getMessage('MoveUp');
        document.querySelector('#reset').value = browser.i18n.getMessage('Reset');
        document.querySelector('#save').value = browser.i18n.getMessage('Save');
        document.querySelector('[for="ua-file"]').appendChild(document.createTextNode(browser.i18n.getMessage('UserAgentsFile')));
    },
    loadUserAgents: function(e)
    {
        function getElem(doc, select)
        {
            while (doc && Node.ELEMENT_NODE != doc.nodeType)
                doc = doc.nextSibling;

            do
            {
                if (Node.ELEMENT_NODE == doc.nodeType)
                {
                    switch (doc.tagName)
                    {
                        case 'folder':
                            let optg;

                            // Avoid nested optgroups, which causes options in inner optgroups to be invisible
                            if ('optgroup' != select.tagName)
                            {
                                optg = document.createElement('optgroup');
                                optg.label = doc.getAttribute('description');
                                select.appendChild(optg);
                                getElem(doc.firstChild, optg);
                                break;
                            }
                        case 'separator':
                            let sep = document.createElement('hr');
                        case 'useragent':
                            let opt = document.createElement('option');
                            opt.className = doc.tagName;
                            opt.disabled = !doc.getAttribute('useragent');

                            if (!opt.disabled)
                            {
                                let attrs = doc.attributes;
                                for (let i = 0; i < attrs.length; i++)
                                    opt.dataset[attrs[i].name] = attrs[i].value;
                            }

                            let text = 'separator' != doc.tagName ? document.createTextNode(doc.getAttribute('description')) : sep;
                            opt.appendChild(text);
                            select.appendChild(opt);

                            if ('folder' == doc.tagName)
                                getElem(doc.firstChild, select);
                            break;
                    }
                }
            } while (doc = doc.nextSibling);
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', Options.ua_file);
        xhr.onload = function (e)
        {
            if (XMLHttpRequest.DONE === xhr.readyState)
            {
                if (200 === xhr.status)
                {
                    var doc = xhr.responseXML.getElementsByTagName('useragentswitcher')[0];
                    getElem(doc.firstChild, document.getElementById('ua-list'));

                    // After the list has loaded, send an event to select the user agent
                    // of the selected host
                    document.getElementById('hosts-list').dispatchEvent(new Event('change'));
                }
                else
                {
                    alert(browser.i18n.getMessage(XMLHttpRequestError, xhr.statusText));
                }
            }
        }

        xhr.onerror = function(e) {
            alert(browser.i18n.getMessage(XMLHttpRequestError, xhr.statusText));
        }

        xhr.send();
        OptionsPage.xhr = xhr;
    }
};

function UserAgent(description, useragent, appcodename, appname, appversion, platform, vendor, vendorsub)
{
    this.description = description;
    this.useragent = useragent;
    this.appcodename = appcodename;
    this.appname = appname;
    this.appversion = appversion;
    this.platform = platform;
    this.vendor = vendor;
    this.vendorsub = vendorsub;
}

// Only try to build the options page only on the options page itself
// Could be handled better in the options page itself, but it seems that only
// external scripts work
if (document.getElementById('options-page'))
    document.addEventListener('DOMContentLoaded', OptionsPage.initialize);

Options.get();
Options.updateCurrentHost();
