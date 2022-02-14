// ==UserScript==
// @name         超星考试允许粘贴
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  在超星考试中允许粘贴答案。
// @author       Priate
// @match        *://*.chaoxing.com/*
// @grant        none
// @downloadURL none
// ==/UserScript==

(function() {
    'use strict';
    if(window.UE){
        var text_inputs = document.getElementsByTagName("textarea");
        for(var i=0;i<text_inputs.length;++i){
            UE.getEditor(text_inputs[i].id).removeListener('beforepaste', myEditor_paste);
        }
    }
})();