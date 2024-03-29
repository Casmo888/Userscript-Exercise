// ==UserScript==
// @name            Pixiv Search Tool
// @description     An alternative to premium search
// @namespace       FlandreDaisuki
// @include         http://www.pixiv.net/*
// @match           http://www.pixiv.net/*
// @version         2015.09.28
// @updateURL       https://github.com/FlandreDaisuki/Userscript-Exercise/raw/master/PixivSearchTool.user.js
// @grant           none
// ==/UserScript==
'use strict';
/////////////////////
// User Customization 
let UC_autostar = true;
let UC_search_delay = 2000;
let UC_following_style = 'color: #FF0000';
//////////////////////////////////////////
let PST = {};
PST.loc = window.location;
PST.objs = [];
PST.run = false;
PST.pageType = '';

PST.queryObj = new Map().set('p', 1);

PST.setting = {
    bklike: 0,
    keyword: '',
    rate: 0
};

PST.supportPages = [
    'search',
    'bookmark',
    'new_illust',
    'member_illust',
    'new_illust_r18',
    'bookmark_new_illust'
];

PST.ads = [
    '.ad',
    '.ads_area',
    '.ad-footer',
    '.ads_anchor',
    '.ads_area_no_margin'
];

PST.premium = [
    '.ad-printservice',
    '.bookmark-ranges',
    '.showcase-reminder',
    '.sample-user-search',
    '.popular-introduction'
];

////////////////////
// Sync Functions //
////////////////////

function Remove(selector, without) {
    for (let r of document.querySelectorAll(selector)) {
        if (!r.classList.contains(without)) {
            r.remove();
        }
    }
}

function RemoveAds() {
    PST.ads.forEach((selector) => {
        Remove(selector);
    })
}

function RemovePremium() {
    PST.premium.forEach((selector) => {
        Remove(selector);
    })
}

function SetPageType() {
    let locpath = PST.loc.pathname;

    for (let s of PST.supportPages) {
        if (locpath === `/${s}.php`) {
            PST.pageType = s;
        }
    }
}

function IsSupportPages() {
    return PST.supportPages.some(x => x === PST.pageType);
}

function TextToDOM(text) {
    return new DOMParser().parseFromString(text, 'text/html');
}

function ParseUrlQuery(url) {
    // '?a=b&c=3.14'
    if (url) {
        url.match(/([^?=&]+)(=([^&]*))?/g).forEach((e) => {
            let ee = e.split('=');
            PST.queryObj.set(ee[0], isNaN(parseInt(ee[1], 10)) ? ee[1] : (ee[1] | 0));
        });
    }
}

function QueryObjToUrl() {
    let l = PST.loc;
    let q = [];
    for (let [key, value] of PST.queryObj) {
        q.push(`${key}=${value}`);
    }
    return `${l.protocol}\/\/${l.host}${l.pathname}?${q.join('&')}`;
}

function PstobjsAppendToDOM(page_pstobjs) {
    for (let pstobj of page_pstobjs) {
        PST.objParent.appendChild(pstobj.p_item);
    }
}

function DisplayBySetting(pstobjs) {
    let setting = PST.setting;

    pstobjs.forEach((pstobj) => {
        let pick = true;

        if (setting.keyword !== '') {
            pick = pick && pstobj.tags.some(w => w.match(new RegExp(setting.keyword)));
        }
        pick = pick && (pstobj.bklike >= setting.bklike);
        pick = pick && (pstobj.rate >= setting.rate);

        if (pick) {
            pstobj.p_item.style.display = 'inline-block';
        } else {
            pstobj.p_item.style.display = 'none';
        }
    });
}
////////////////////////
// DOM Based Function //
////////////////////////

function GetImageSize(dom) {
    let img_size_element = dom.querySelector('ul.meta>li:nth-of-type(2)');

    if (img_size_element === null) {
        return [];
    } else {
        let str = img_size_element.innerHTML;

        if (str.match(/\d+×\d+/) !== null) {
            // OOO×OOO
            return str.split('×').map((x) => x | 0);
        } else {
            // 複数枚投稿 OOP
            return str.match(/\d+/).map((x) => x | 0);
        }
    }
}

function GetImageTags(dom) {
    return Array.from(dom.querySelectorAll('li.tag>a.text')).map(x => x.innerHTML);
}

function IsFollowing(dom) {
    return dom.querySelector('#favorite-button').classList.contains('following');
}

function GetImageItemsParent(dom) {
    return dom.querySelector(PST.objParentName);
}

function GetImageItems(dom) {
    return Array.from(dom.querySelectorAll(`${PST.objParentName} li.image-item`));
}

function GetImageRate(dom) {
    return dom.querySelector('dd.score-count').innerHTML | 0;
}

function GetBkLike(p_item) {
    return (p_item.querySelector('.bookmark-count')) ? (p_item.querySelector('.bookmark-count').childNodes.item(1).data | 0) : 0;
}

function GetPSTSetting() {
    let dom = PST.DOMRoot;
    let bklike = dom.querySelector('#pst-bookmark-like').value | 0;
    let keyword = dom.querySelector('#pst-keyword').value;
    let rate = dom.querySelector('#pst-rate').value | 0;
    PST.setting.bklike = bklike;
    PST.setting.keyword = keyword;
    PST.setting.rate = rate;
}
/////////////////////
// Async Functions //
/////////////////////

function ParseImagePage(pstobj) {
    let with_cookies = {
        credentials: 'same-origin'
    };
    return fetch(pstobj.url, with_cookies)
        .then((response) => {
            return response.text();
        })
        .then((text) => {
            return TextToDOM(text);
        })
        .then((dom) => {
            pstobj.size = GetImageSize(dom);
            pstobj.tags = GetImageTags(dom);
            pstobj.following = IsFollowing(dom);
            pstobj.rate = GetImageRate(dom);

            return pstobj;
        })
}

function ParseSearchPage() {
    let with_cookies = {
        credentials: 'same-origin'
    };
    return fetch(QueryObjToUrl(), with_cookies)
        .then((response) => {
            return response.text();
        })
        .then((text) => {
            return TextToDOM(text);
        })
        .then((dom) => {
            let p_items = GetImageItems(dom);
            return p_items.map((p_item) => {
                p_item.style = '';
                p_item.classList.add('PST');

                let pstobj = {};
                pstobj.p_item = p_item;
                if (!p_item.querySelector('a')) {
                    return pstobj; //Pixiv Error or Private Image
                }
                pstobj.url = p_item.querySelector('a').href;
                pstobj.illust_id = pstobj.url.match(/.*illust_id=(\d*)/)[1];
                pstobj.bklike = GetBkLike(p_item);
                return pstobj;
            }).filter((p_item) => {
                return p_item.illust_id; //Pixiv Error
            });
        })
        .then((page_pstobjs) => {
            return Promise.all(page_pstobjs.map((pstobj) => {
                return ParseImagePage(pstobj);
            }));
        })
        .then((page_pstobjs) => {
            for (let pstobj of page_pstobjs) {
                if (PST.pageType !== 'member_illust' && pstobj.following) {
                    pstobj.p_item.querySelector('.user').style = UC_following_style;
                }
                PST.objs.push(pstobj);
            }
            return page_pstobjs;
        })
        .then((page_pstobjs) => {
            PstobjsAppendToDOM(page_pstobjs);
            PST.DOMRoot.querySelector('#pst-process').innerHTML = PST.objs.length;
            DisplayBySetting(page_pstobjs);
            PST.queryObj.set('p', PST.queryObj.get('p') + 1);
            return page_pstobjs;
        });
}

function DelayFetch() {
    Promise.resolve(ParseSearchPage()).then((page_pstobjs) => {
        if (page_pstobjs.length > 0 && PST.run && PST.queryObj.get('p') <= 1000) {
            setTimeout(DelayFetch, UC_search_delay);
        }
    });
}
///////////////////////
// PST DOM Functions //
///////////////////////

function HTML() {
    return `<div id="PixivSearchTool">
                <div class="set-raw process">
                    <p>處理圖數: <span id="pst-process"></span></p>
                </div>
                <div class="set-raw keyWord">
                    <label for="pst-keyword">關鍵字</label>
                    <input type="text" id="pst-keyword">
                </div>
                <div class="set-raw rateNum">
                    <label for="pst-rate"><span class="rate-star">★</span>評分</label>
                    <input type="number" id="pst-rate" min="0" step="1000" value="0">
                </div>
                <div class="set-raw likeNum">
                    <label for="pst-bookmark-like">★書籤</label>
                    <input type="number" id="pst-bookmark-like" min="0" step="20" value="0">
                </div>
                <div class="set-raw buttons">
                    <div class="button" id="pst-filter">過濾</div>
                    <div class="button" id="pst-pause">暫停</div>
                </div>
            </div>`;
}

function CSS() {
    return `<style>
            #PixivSearchTool {
                width: 150px;
                position: fixed;
                left: 0px;
                bottom: 0px;
                padding: 5px 0px;
                background-color: #E4E7EE;
                box-shadow: 1px -1px 1px #BBB;
                font-size: 14px;
            }

            #PixivSearchTool .set-raw {
                margin: 3px 0px;
                text-align: center;
            }

            #PixivSearchTool > .likeNum label {
                color: #0069B1;
                background-color: #CCEEFF;
            }
            
            #PixivSearchTool .rate-star {
                /*background-image: background-image: repeating-linear-gradient(-45deg, rgb(245, 182, 0) 50%, rgb(241, 131, 0));*/
                color: #F18300;
            }

            #PixivSearchTool .imgPageNum {
                font-size: 20px;
            }

            #PixivSearchTool .imgPageNum > i.fa {
                cursor: pointer;
            }

            #PixivSearchTool .imgPageNum > i.fa:hover {
                color: #3AA;
            }

            #PixivSearchTool .img-per-page {
                margin: 0px 5px;
                cursor: default;
            }

            #PixivSearchTool input[type="text"],
            #PixivSearchTool input[ type="number"] {
                width: 80px;
                height: 20px;
                border: 1px solid #BECAD7;
                margin: 0px 4px;
                padding: 0px 2px;
            }

            #PixivSearchTool .button {
                font-size: 14px;
                background-color: #83BDE2;
                text-decoration: none;
                border-radius: 3px;
                padding: 1px 4px;
                color: #000;
                box-shadow: 1px 1px 1px #58C;
                display: inline-block;
                cursor: pointer;
            }

            #PixivSearchTool .button:active {
                box-shadow: inset 1px 1px 1px #58C;
            }
            </style>`;
}

function LinkCSS() {
    return `<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">`
}

function SetupDOM() {
    PST.DOMRoot = TextToDOM(HTML()).querySelector('#PixivSearchTool');
    document.body.appendChild(PST.DOMRoot);
    document.head.appendChild(TextToDOM(LinkCSS()).querySelector('link'));
    document.head.appendChild(TextToDOM(CSS()).querySelector('style'));
}

function SetupDOMEvent() {

    var run_filter = function(event) {
        if (!PST.run) {
            PST.run = true;

            switch (PST.pageType) {
                case 'search':
                case 'bookmark_new_illust':
                case 'new_illust':
                case 'new_illust_r18':
                case 'bookmark':
                    DelayFetch();
                    break;
                case 'member_illust':
                    if (PST.objParent) {
                        DelayFetch();
                    }
                    break;
                default:
                    break;
            }
        }
        GetPSTSetting();
        DisplayBySetting(PST.objs);
    }

    PST.DOMRoot.querySelector('#pst-filter').addEventListener('click', run_filter);
    PST.DOMRoot.querySelector('#pst-bookmark-like').addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            run_filter(event)
        }
    });

    PST.DOMRoot.querySelector('#pst-pause').addEventListener('click', (event) => {
        PST.run = false;
    });
}

////////////////////
// Main Functions //
////////////////////

function init() {
    RemoveAds();
    RemovePremium();
    SetPageType();
    ParseUrlQuery(PST.loc.search);
    if (IsSupportPages()) {
        SetupDOM();
        SetupDOMEvent();
    }
};

Promise.resolve(init())
    .then(() => {
        switch (PST.pageType) {
            case 'search':
                PST.queryObj.set('order', 'date_d').set('s_mode', 's_tag');
                PST.objParentName = '.autopagerize_page_element';
                break;
            case 'bookmark':
                PST.queryObj.set('rest', 'show');
                PST.objParentName = '._image-items';
                break;
            case 'member_illust':
                PST.queryObj.set('type', 'all');
                PST.objParentName = '._image-items';

                PST.DOMRoot.querySelector('#pst-bookmark-like').disabled = true;

                if (PST.queryObj.has('illust_id')) {
                    //Image Page
                    if (UC_autostar) {
                        setTimeout(() => {
                            pixiv.rating.apply(10)
                        }, 500);
                    }
                    PST.DOMRoot.querySelector('#pst-keyword').disabled = true;
                    PST.DOMRoot.querySelector('#pst-rate').disabled = true;
                }
                break;
            case 'new_illust':
            case 'new_illust_r18':
            case 'bookmark_new_illust':
                PST.objParentName = '.autopagerize_page_element';

                PST.DOMRoot.querySelector('#pst-bookmark-like').disabled = true;
                break;
            default:
                break;
        }
    })
    .then(() => {
        let p;
        PST.objParent = GetImageItemsParent(document);
        switch (PST.pageType) {
            case 'search':
            case 'bookmark':
            case 'new_illust':
            case 'new_illust_r18':
            case 'bookmark_new_illust':
                p = ParseSearchPage();
                break;
            case 'member_illust':
                if (PST.objParent) {
                    p = ParseSearchPage();
                }
                break;
            default:
                break;
        }
        return p;
    }).then((p) => {
        if (IsSupportPages()) {
            Remove('li.image-item', 'PST');
        }
    });
