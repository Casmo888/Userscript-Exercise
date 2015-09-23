// ==UserScript==
// @name        YoutubeRepeatButton
// @description A repeat button added for your Youtube when you turn on HTML5 player mode
// @namespace   FlandreDaisuki
// @include     https://www.youtube.com/watch?*
// @match       https://www.youtube.com/watch?*
// @version     2015.09.23
// @grant       none
// ==/UserScript==
'use strict';

var YRB = {
    control: document.querySelector('div.ytp-chrome-controls'),
    video: document.querySelector('video'),
    loopOn: false
};


YRB.setup = function () {
    if (!document.querySelector('button.ytp-loop-button')) {
        YRB.control.appendChild(YRB.element);
    }
};

YRB.click = function (event) {
    if (YRB.loopOn) {
        YRB.video.loop = false;
        YRB.loopOn = false;
        YRB.element.style.fill = '#FFF';
    } else {
        YRB.video.loop = true;
        YRB.loopOn = true;
        YRB.element.style.fill = '#6FF';
    }
};

YRB.element = (function () {
    let btn = document.createElement('button');
    btn.classList.add('ytp-button');
    btn.classList.add('ytp-loop-button');
    btn.style.float = 'right';
    btn.style.fill = '#FFF';

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.innerHTML = '<text x="14" y="23" style="font-size: 14px;">1</text><path d="M26.466,21.04 L30.966,16 L27.8,16 C26.873,11.435 22.841,8 18.001,8 C12.474,8 8,12.477 8,18 C8,23.523 12.474,28 18.001,28 C21.181,28 24.009,26.511 25.841,24.197 L24.005,22.361 C22.652,24.217 20.471,25.427 18.001,25.427 C13.899,25.427 10.569,22.101 10.569,18 C10.569,13.898 13.899,10.572 18.001,10.572 C21.407,10.572 24.268,12.871 25.142,16 L21.966,16 L26.466,21.04"></path>';
    svg.style.height = '100%';
    svg.style.width = '100%';

    btn.appendChild(svg);
    btn.addEventListener('click', YRB.click);

    return btn;
})();

YRB.setup();