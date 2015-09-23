// ==UserScript==
// @name        EHInfinitePages
// @namespace   FlandreDaisuki
// @include     http://exhentai.org/*
// @include     http://g.e-hentai.org/*
// @version     2015.09.23
// @grant       none
// ==/UserScript==
'use strict';

//=============================
//         User Config
let Waiting_Delay = 5000; // ms; unrecommend < 1000;

//=============================
//         Main Program
let loc = document.location;
let docPath = loc.pathname;
let queryObj = parseURLquery(loc.search);

let uconfig = document.cookie.match(/uconfig=([^;]+)/)[1].split('-');
let dm = uconfig.filter((v) => {
    return v.search(/dm_[lt]/) === 0
})[0];

let lock = true;
let currentPage = queryObj.page | 0;
let pageinfo = {};

if (docPath === '/') {
    init();

    document.addEventListener('wheel', (event) => {
        if (pageinfo.bottomMark.getBoundingClientRect().top < 1000 && !lock) {
            lockFetch();
        }
    });

} else if (docPath.search(/\/(g)\/([\d]+)\/([\d\w]+)\//) === 0) {

};

function lockFetch() {
    let parent = pageinfo.parent;
    Promise.resolve(currentPage).then((c) => {

        console.log(`lock in page ${c}`);
        lock = true;
        return fetchUrl(parent, c);

    }).then((bks) => {

        return new Promise((resolve, reject) => {
            console.log('done fetch');
            currentPage += 1;
            if (bks > 0) {
                setTimeout(resolve, Waiting_Delay, currentPage);
            } else {
                resolve(-1);
            }
        })

    }).then((c) => {
        if (c >= 0) {
            console.log(`unlock in page ${c-1}`);
            lock = false;
        } else {
            pageinfo.bottomMark.innerHTML = 'End';
            lock = true;
        }
    });
}

function parseURLquery(url) {
    let queryObj = {};
    if (!url) {
        return queryObj;
    }
    url.match(/([^?=&]+)(=([^&]*))?/g).forEach((e) => {
        let ee = e.split('=');
        queryObj[ee[0]] = isNaN(parseInt(ee[1], 10)) ? ee[1] : (ee[1] | 0);
    });
    return queryObj;
};

function queryToURL(option) {
    let qo = {};
    let s = loc.protocol + '//' + loc.host + loc.pathname;

    for (let v of Object.keys(queryObj)) {
        qo[v] = queryObj[v];
    }

    if (option) {
        for (let v of Object.keys(option)) {
            qo[v] = option[v];
        }
    };

    var qa = [];
    for (let v of Object.keys(qo)) {
        qa.push(v + '=' + qo[v]);
    }

    return s + '?' + qa.join('&');
};

function fetchUrl(parent, page) {
    console.log(`page ${page} fetching...`);

    return fetch(queryToURL({
            page: page
        }), {
            credentials: 'same-origin'
        })
        .then((response) => {
            return response.text();
        })
        .then((html) => {
            return new DOMParser().parseFromString(html, 'text/html');
        })
        .then((dom) => {
            let books = (dm === 'dm_t') ? dom.querySelectorAll('div.id1') : dom.querySelectorAll('table.itg tr:nth-child(n+2)');
            for (let book of books) {

                if (book.querySelector('div.id3')) {
                    book.style.height = '345px';
                    let a = book.querySelector('div.id3 img').src;
                    if (a !== 'http://exhentai.org/img/blank.gif') {
                        parent.appendChild(book);
                    };
                } else {
                    parent.appendChild(book);
                };
            }
            return Promise.resolve(books.length);
        })
};

function getBottomMark() {
    let mark = document.createElement('div');
    mark.classList.add('btm-mark');
    mark.style = 'clear: both; text-align: center; font-size: 20px;';

    let spin = document.createElement('i');
    spin.className = 'fa fa-spinner fa-pulse';

    mark.appendChild(spin);
    mark.appendChild(document.createTextNode('  Loading...'));

    return mark;
}

function init() {
    document.querySelector('table.ptb').remove();
    document.querySelector('div.ido').style.height = 'auto';
    let fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css';
    document.head.appendChild(fa);

    for (let book of document.querySelectorAll('div.id1')) {
        book.remove();
    };

    pageinfo.parent = (dm === 'dm_t') ? document.querySelector('div.itg') : document.querySelector('table.itg > tbody');
    pageinfo.parent.style.borderBottomStyle = 'none';

    pageinfo.bottomMark = getBottomMark();
    if (dm === 'dm_t') {
        pageinfo.parent.parentNode.appendChild(pageinfo.bottomMark);
    } else {
        document.querySelector('table.itg').parentNode.appendChild(pageinfo.bottomMark);
    }

    lock = false;

    lockFetch();
}
