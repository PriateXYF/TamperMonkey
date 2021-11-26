// ==UserScript==
// @name         喜马拉雅专辑下载器
// @version      0.0.8
// @description  可能是你见过最丝滑的喜马拉雅下载器啦！登录后支持VIP音频下载，支持专辑批量下载，多线程下载，链接导出等功能，直接下载M4A文件。
// @author       Priate
// @match        *://www.ximalaya.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_download
// @icon         https://www.ximalaya.com/favicon.ico
// @require      https://cdn.jsdelivr.net/npm/vue@2
// @require      https://cdn.jsdelivr.net/npm/sweetalert@2.1.2/dist/sweetalert.min.js
// @require https://cdn.bootcss.com/jquery/3.3.1/jquery.js
// @require https://greasyfork.org/scripts/435476-priate-lib/code/Priate%20Lib.js?version=987980
// @license MIT
// @namespace https://greasyfork.org/users/219866
// ==/UserScript==

(function() {
    'use strict';

    // 用户自定义设置
    const global_setting = {
        // 多线程下载
        multithreading : false
    }

    function initSetting(){
        var setting;
        if (!GM_getValue('priate_script_xmly_data')) {
            GM_setValue('priate_script_xmly_data', {
                // 多线程下载
                multithreading : false,
                left : 20,
                top : 100,
                manualMusicURL : null,
            })
        }
        setting = GM_getValue('priate_script_xmly_data')
        setting.multithreading = global_setting.multithreading
        GM_setValue('priate_script_xmly_data', setting)
    }

    // 手动获取音频地址功能
    function manualGetMusicURL(){
        let windowID = getRandStr("1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM", 100)
        function getRandStr(chs, len) {
            let str = "";
            while (len--) {
                str += chs[parseInt(Math.random() * chs.length)];
            }
            return str;
        }
        (function() {
            let playOriginal = HTMLAudioElement.prototype.play;
            function play() {
                let link = this.src;
                window.top.postMessage(Array("audioVideoCapturer", link, windowID, "link"), "*");
                return playOriginal.call(this);
            }
            HTMLAudioElement.prototype.play = play;
            HTMLAudioElement.prototype.play.toString = HTMLAudioElement.prototype.play.toString.bind(playOriginal);
        })();
        if (window.top == window) {
            window.addEventListener("message", function(event) {
                if (event.data[0] == "audioVideoCapturer") {
                    var setting = GM_getValue('priate_script_xmly_data')
                    setting.manualMusicURL = event.data[1]
                    GM_setValue('priate_script_xmly_data', setting)
                }
            });
        }
    }

    manualGetMusicURL()

    function injectDiv(){
        var priate_script_div = document.createElement("div")
        priate_script_div.innerHTML = `
<div id="priate_script_div">
<div>
<b style='font-size:30px; margin: 0 0'>喜马拉雅下载器</b><p style='margin: 0 0'>by <a href="https://donate.virts.app/#sponsor" target="_blank" style='color:#337ab7'>Priate</a></p>
<button v-show="!isDownloading" @click="loadMusic">{{filterData.length > 0 ? '重载数据' : '加载数据'}}</button>
<button id='readme' @click="downloadAllMusics" v-show="!isDownloading && (musicList.length > 0)">下载所选</button>
<button @click="copyAllMusicURL" v-show="!isDownloading && (musicList.length > 0)">导出地址</button>
<button @click="cancelDownload" v-show="isDownloading">取消下载</button>
</br>
<table v-show="filterData.length > 0">
<thead><tr><th><a @click='selectAllMusic'>全选</a></th><th>标题</th><th>操作</th></tr></thead>
<tbody id="priate_script_table">
<tr v-for="(item, index) in filterData" key="index">
<td><input v-model="musicList" :value='item' type="checkbox" :disabled="item.isDownloaded || isDownloading"></td>
<td><a style='color:#337ab7'>{{item.title}}</a></td>
<td>
<a v-show="!item.isDownloading && !item.isDownloaded && !isDownloading" style='color:#993333' @click="downloadMusic(item)">下载</a>
<a v-show="isDownloading && !item.isDownloading && !item.isDownloaded" style='color:gray'>等待中</a>
<a v-show="item.isDownloading" style='color:#C01D07'>{{item.progress}}</a>
<a v-show="item.isDownloaded" style='color:#00947E'>已完成</a>
<a v-show="item.isFailued" style='color:red'>下载失败</a> |
<a :style="'color:' + (item.url ? '#00947E' : '#993333')" @click="copyMusic(item)">地址</a></td>
</tr>
</tbody>
</table>
</div>
</div>
`
        GM_addStyle(`
#priate_script_div{
font-size : 15px;
position: fixed;
background-color: rgba(240, 223, 175, 0.9);
color : #660000;
text-align : center;
padding: 10px;
z-index : 2147483647;
border-radius : 20px;
border:2px solid black;
}
#priate_script_div:hover{
box-shadow: 5px 5px 5px #000000;
transition: box-shadow 0.3s;
}
.priate_script_hide{
padding: 0 !important;
border:none !important;
}
a{
cursor : pointer;
text-decoration : none;
}
/*表格样式*/
#priate_script_div table{
text-align: center;
border:2px solid #660000;
margin: 5px auto;
padding: 2px;
border-collapse: collapse;

display: block;
height : 200px;
overflow-y: scroll;
}


/*表格框样式*/
#priate_script_div td{
border:2px solid #660000;
padding: 8px 12px;
max-width : 300px;
word-wrap : break-word;
}
/*表头样式*/
#priate_script_div th{
border:2px solid #660000;
padding: 8px 12px;
}

/*脚本按钮样式*/
#priate_script_div button{
display: inline-block;
border-radius: 4px;
border: 1px solid #660000;
background-color: transparent;
color: #660000;
text-decoration: none;
padding: 5px 10px;
margin : 5px 10px;
}
/*脚本按钮悬浮样式*/
#priate_script_div button:hover{
cursor : pointer;
color: rgb(240, 223, 175);
background-color: #660000;
}
/*右下角显示按钮*/
#priate_script_div .hide-button{
z-index: 2147483647;
width: 32px;
height: 32px;
cursor: pointer;
position: fixed;
left: 0px;
bottom: 0px;
color: #660000;
text-align: center;
line-height: 32px;
margin: 10px;
border-width: 1px;
border-style: solid;
border-color: #660000;
border-image: initial;
border-radius: 100%;
}
/*右下角显示按钮悬浮样式*/
#priate_script_div .hide-button:hover{
background-color : rgba(240, 223, 175, 0.9);
}
/*输入框样式*/
#priate_script_div textarea{
height : 50px;
width : 200px;
background-color: #fff;
border:1px solid #000000;
padding: 4px;
}
`);
        document.querySelector("html").appendChild(priate_script_div)
        var setting = GM_getValue('priate_script_xmly_data')
        document.getElementById("priate_script_div").style.left = (setting.left || 20)  + "px";
        document.getElementById("priate_script_div").style.top = (setting.top || 100)  + "px";
    }

    function dragFunc(id) {
        var Drag = document.getElementById(id);
        var setting = GM_getValue('priate_script_xmly_data')
        Drag.onmousedown = function(event) {
            var ev = event || window.event;
            event.stopPropagation();
            var disX = ev.clientX - Drag.offsetLeft;
            var disY = ev.clientY - Drag.offsetTop;
            document.onmousemove = function(event) {
                var ev = event || window.event;
                setting.left = ev.clientX - disX
                Drag.style.left = setting.left  + "px";
                setting.top = ev.clientY - disY
                Drag.style.top = setting.top + "px";
                Drag.style.cursor = "move";
                GM_setValue('priate_script_xmly_data', setting)
            };
        };
        Drag.onmouseup = function() {
            document.onmousemove = null;
            this.style.cursor = "default";
        };
    };

    // 获取当前时间
    function getNowFormatDate() {
        var date = new Date();
        var seperator1 = "-";
        var seperator2 = ":";
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        var currentdate = month + seperator1 + strDate + " " + date.getHours() + seperator2 + date.getMinutes()
        return currentdate;
    }

    //初始化脚本设置
    initSetting()
    //注入脚本div
    injectDiv()
    // 处理数据等逻辑
    var vm = new Vue({
        el: '#priate_script_div',
        data: {
            setting: GM_getValue('priate_script_xmly_data'),
            data: [],
            musicList: [],
            isDownloading : false,
            cancelDownloadObj : null,
            stopDownload : false
        },
        methods : {
            loadMusic(){
                const all_li = document.querySelectorAll('.sound-list>ul li');
                var result = [];
                all_li.forEach((item)=>{
                    const item_a =  item.querySelector('a');
                    const music = {
                        id : item_a.href.split('/')[5],
                        title : item_a.title,
                        isDownloading : false,
                        isDownloaded : false,
                        progress : 0,
                    }
                    result.push(music)
                })
                // 如果没有获取到数据,则判断为单个音频
                if(result.length == 0 && location.pathname.split('/')[3]){
                    const music = {
                        id : location.pathname.split('/')[3],
                        title : document.querySelector('h1.title-wrapper').innerText,
                        isDownloading : false,
                        isDownloaded : false,
                        progress : 0,
                        isSingle : true
                    }
                    result.push(music)
                }
                this.data = result
                this.musicList = []
                this.data.forEach((item)=>{
                    this.musicList.push(item)
                })
            },
            async getMusicURL(item){
                var res = null
                if(item.url){
                    res = item.url
                }else{
                    var url = `https://www.ximalaya.com/revision/play/v1/audio?id=${item.id}&ptype=1`
                    $.ajax({
                        type: 'get',
                        url: url,
                        async: false,
                        dataType : "json",
                        success: function (data) {
                            if(data.ret == 200) res = data.data.src;
                        }
                    });
                }
                var setting;
                if(!res){
                    const all_li = document.querySelectorAll('.sound-list>ul li');
                    for(var num = 0; num < all_li.length; num++) {
                        var li = all_li[num]
                        const item_a = li.querySelector('a');
                        const id = item_a.href.split('/')[5]
                        if(id == item.id){
                            li.querySelector('div.all-icon').click()
                            while(!res){
                                await Sleep(1)
                                setting = GM_getValue('priate_script_xmly_data')
                                res = setting.manualMusicURL
                            }
                            setting.manualMusicURL = null
                            GM_setValue('priate_script_xmly_data', setting)
                            li.querySelector('div.all-icon').click()
                            break
                        }
                    }
                }
                if(!res && item.isSingle){
                    document.querySelector('div.play-btn').click()
                    while(!res){
                        await Sleep(1)
                        setting = GM_getValue('priate_script_xmly_data')
                        res = setting.manualMusicURL
                    }
                    setting.manualMusicURL = null
                    GM_setValue('priate_script_xmly_data', setting)
                    document.querySelector('div.play-btn').click()
                }
                this.$set(item, 'url', res)
                return res
            },
            async downloadMusic(item){
                //this.isDownloading = true
                item.isDownloading = true
                item.isFailued = false
                var _this = this
                const details = {
                    url : item.url || await this.getMusicURL(item),
                    name : item.title.replaceAll(/\./, '-'),
                    onload : function(e){
                        _this.isDownloading = false
                        item.isDownloading = false
                        item.isDownloaded = true
                        _this.selectAllMusic()
                    },
                    onerror : function(e){
                        _this.isDownloading = false
                        console.log(e)
                        item.isDownloading = false
                        if(e.error != 'aborted') item.isFailued = true
                    },
                    onprogress : function(d){
                        item.progress = (Math.round(d.done / d.total * 10000) / 100.00)+"%";
                    }
                }
                this.cancelDownloadObj = GM_download(details)
            },
            // 顺序下载
            async sequenceDownload(index, data){
                this.isDownloading = true
                const item = data[index]
                if(!item) {
                    this.isDownloading = false
                    this.selectAllMusic()
                    this.stopDownload = false
                    return;
                };
                if(item.isDownloading || item.isDownloaded || this.stopDownload) return this.sequenceDownload(index+1, data);
                item.isDownloading = true
                item.isFailued = false
                const _this = this
                const details = {
                    url : item.url || await this.getMusicURL(item),
                    name : item.title.replaceAll(/\./, '-'),
                    onload : function(e){
                        item.isDownloading = false
                        item.isDownloaded = true
                        _this.cancelDownloadObj = _this.sequenceDownload(index+1, data)
                    },
                    onerror : function(e){
                        console.log(e)
                        item.isDownloading = false
                        if(e.error != 'aborted') item.isFailued = true
                        _this.cancelDownloadObj = _this.sequenceDownload(index+1, data)
                    },
                    onprogress : function(d){
                        item.progress = (Math.round(d.done / d.total * 10000) / 100.00)+"%";
                    }
                }
                this.cancelDownloadObj = GM_download(details)
                return this.cancelDownloadObj
            },
            async copyMusic(item){
                item.url = item.url || await this.getMusicURL(item)
                GM_setClipboard(item.url)
                swal("复制成功!", {
                    icon: "success",
                    buttons: false,
                    timer: 1000,
                });
            },
            // 下载当前列表全部音频
            async downloadAllMusics(){
                await this.sequenceDownload(0, this.musicList)
            },
            async copyAllMusicURL(){
                var res = []
                for(var num = 0; num < this.musicList.length; num++) {
                    var item = this.musicList[num];
                    const url = await this.getMusicURL(item)
                    res.push(url)
                }
                GM_setClipboard(res.join('\n'))
                swal("复制成功!", {
                    icon: "success",
                    buttons: false,
                    timer: 1000,
                });
            },
            selectAllMusic(){
                if(this.musicList.length == this.notDownloadedData.length){
                    this.musicList = []
                }else{
                    this.musicList = []
                    this.data.forEach((item)=>{
                        !item.isDownloaded && this.musicList.push(item)
                    })

                }
            },
            //取消下载功能
            cancelDownload(){
                this.stopDownload = true
                this.cancelDownloadObj.abort()
            },
        },
        computed: {
            filterData(){
                if(this.isDownloading){
                    return this.musicList
                }else{
                    return this.data
                }

            },
            notDownloadedData(){
                return this.data.filter((item)=>{
                    return item.isDownloaded == false
                })
            }
        }
    })
    //设置div可拖动
    dragFunc("priate_script_div");
})();