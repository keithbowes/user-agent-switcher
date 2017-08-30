'use strict';
document.getElementById('configure').addEventListener('click', function () { browser.runtime.openOptionsPage(); });
document.getElementById('configure').value = browser.i18n.getMessage('Configure');

var test = document.getElementById('test');
var table = document.createElement('table');
test.appendChild(table);

var thead = document.createElement('thead');
table.appendChild(thead);

var descrow = document.createElement('tr');
thead.appendChild(descrow);

var namedesc = document.createElement('th');
namedesc.appendChild(document.createTextNode(browser.i18n.getMessage('PropertyName')));
descrow.appendChild(namedesc);

var valuedesc = document.createElement('th');
valuedesc.appendChild(document.createTextNode(browser.i18n.getMessage('PropertyValue')));
descrow.appendChild(valuedesc);

var tbody = document.createElement('tbody');
table.appendChild(tbody);

Background.userAgent.set();
var props = Background.userAgent.getProperties();

for (let i = 0; i < props.length; i++)
{
    let tr = document.createElement('tr');
    tbody.appendChild(tr);

    let name = document.createElement('td');
    name.appendChild(document.createTextNode(`navigator.${props[i]}`));
    tr.appendChild(name);

    let value = document.createElement('td');
    value.appendChild(document.createTextNode(navigator[props[i]]));
    tr.appendChild(value);
}
