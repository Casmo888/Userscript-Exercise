#My Userscript Exercise

These userscripts are writing for Firefox with GreaseMonkey.

To use these, you should:
- Install [Firefox](https://www.mozilla.org/en-US/firefox/all/)
- Install [GreaseMonkey on Firefox](https://addons.mozilla.org/zh-tw/firefox/addon/greasemonkey/)
- click following link to download

##Youtube Repeat Button
[Download](https://github.com/FlandreDaisuki/Userscript-Exercise/raw/master/YoutubeRepeatButton.user.js)

###使用方法
在播放器上多一顆單曲循環的按鈕

###已知問題
部分影片在啟動跳回起始位置時，會沒有聲音，但是影像正常，過了幾秒鐘(部份影片可能到幾分鐘)後，才有聲音

##EH Infinite Pages
[Download](https://github.com/FlandreDaisuki/Userscript-Exercise/raw/master/EHInfinitePages.user.js)

###使用方法
- 將滑鼠滾輪不停的滾動

##Pixiv Search Tool
[Download](https://github.com/FlandreDaisuki/Userscript-Exercise/raw/master/PixivSearchTool.user.js)

###使用方法

- 處理圖數：此數字即本插件已處理之結果數量
- 關鍵字：此關鍵字將會對應圖片標籤(tag/タグ)做部份對應
  - 若圖片有標籤為``フランドール・スカーレット``，則可在關鍵字搜尋``フラン|フランドール``即可
  - 若想找多主題一樣可以使用``|``連接，如``艦これ|東方``
- 書籤數：此功能只有在搜尋頁面或書籤頁面啟動，主要是比較藍色星星的數字
  - 若只想顯示數字1000以上(含)的圖片，則輸入1000；0表示全顯示
- 過濾：啟動該插件主要功能
- 暫停：有時不需要處理過多圖片或是電腦效能吃緊時，可暫停本插件過濾功能

###進階使用方法

以下方法需自行更改腳本內程式，有興趣者可自行更改

- UC_autostar：true(default) | false
  - 在進入圖片頁面時將自動評分10顆星(黃色星星)
- UC_search_delay：2000(default)
  - 按下過濾後的延遲時間，單位是ms，基本上值愈小愈快，但考慮網路速度及電腦性能，不建議小於500
- UC_following_style： 'color: #FF0000' | Any CSS string
  - 此為調整顯示已追蹤者的樣式。
  - 若只想改顏色可將``#FF0000``改成喜歡的RGB色碼，否則請參考CSS樣式自行調整
