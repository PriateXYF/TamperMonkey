// ==UserScript==
// @name         PriateLib
// @version      0.0.5
// @description  自用
// @author       Priate
// @grant        GM_xmlhttpRequest
// @include      *
// ==/UserScript==

// 睡眠多少秒
async function Sleep(sleepSecs) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve()
		}, sleepSecs * 1000)
	})
}

// 等待某个函数执行完毕（每多少秒检测一次）
async function WaitUntil(conditionFunc, sleepSecs) {
	sleepSecs = sleepSecs || 1
	return new Promise((resolve, reject) => {
		if (conditionFunc()) resolve()
		let interval = setInterval(() => {
			if (conditionFunc()) {
				clearInterval(interval)
				resolve()
			}
		}, sleepSecs * 1000)
	})
}

// GM_xmlhttpRequest 简单封装
function Request(url, opt = {}) {
	Object.assign(opt, {
		url,
		timeout: 2000,
		responseType: 'json'
	})

	return new Promise((resolve, reject) => {
		opt.onerror = opt.ontimeout = reject
		opt.onload = resolve
		GM_xmlhttpRequest(opt)
	}).then(res => {
		if (res.status === 200) return Promise.resolve(res.response)
		else return Promise.reject(res)
	}, err => {
		return Promise.reject(err)
	})
}

// easy http(s) get
function Get(url, opt = {}) {
	Object.assign(opt, {
		method: 'GET'
	})
	return Request(url, opt)
}

// easy http(s) post
function Post(url, opt = {}) {
	Object.assign(opt, {
		method: 'POST'
	})
	return Request(url, opt)
}

// simple toast
function showToast(msg, doNotFade) {
	let style = `position: fixed; right: 10px; top: 80px; width: 300px; text-align: left; background-color: rgba(255, 255, 255, 0.9); z-index: 99; padding: 10px 20px; border-radius: 5px; color: #222; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2); font-weight: bold;`

	let span = document.createElement('span')
	span.setAttribute('style', style)
	span.innerText = msg
	document.body.appendChild(span)
	if (!doNotFade) {
		setTimeout(() => {
			document.body.removeChild(span)
		}, 5000)
	}
}

async function GetElementByText(startElem, selector, text, exist) {
	/*
  selector: 选择器
  text: 内容
  exist: 是否只要存在就ojbk
  */
	exist = exist || false
	let elemList = startElem.querySelectorAll(selector)
	for (let i = 0; i < elemList.length; ++i) {
		let elem = elemList[i]
		if (exist) {
			if (elem.innerText.search(text) !== -1) return elem
		} else {
			if (elem.innerText === text) return elem
		}
	}
}
/**
 * 替换全部匹配到的内容
 * @param FindText  需要查找的字符串
 * @param RepText   将要替换的字符串
 * @returns {string}
 */
String.prototype.replaceAll = function(FindText, RepText) {
	let regExp = new RegExp(FindText, "g");
	return this.replace(regExp, RepText);
}

/**
 * 移除iframe页面元素，用于wifi劫持和去除iframe广告
 */
function removeIframe() {
	let filter = new Object();
	filter.ad = function() {
		let tar = document.getElementsByTagName('iframe');
		let len = tar.length;
		if (len > 0) {
			for (let i = 0; i < len; i++) {
				tar[0].remove()
			}
		}
	}
	filter.timer = function() {
		let clean = setInterval(function() {
			if (document.getElementsByTagName('iframe').length == 0) {
				clearInterval(clean)
				console.log('清除')
			} else {
				filter.ad()
			}
		}, 300)
	}
	filter.timer()
}
/**
 * 向页面中添加div
 * @param className   类名
 * @param innerHtml   内容
 * @param clickFunc   点击事件函数
 * @returns {HTMLDivElement}
 */
function loadDiv(className = '', innerHtml = '', clickFunc = false) {
	let div = document.createElement('div')
	div.className = className
	div.innerHTML = innerHtml
	if (typeof clickFunc == 'function') {
		div.onclick = clickFunc
	}
	document.body.append(div)
	return div
}
/**
 * 加载js文件
 * @param url  js文件路径
 * @param callback  加载成功后执行的回调函数
 */
function loadJs(url, callback) {
	let head = document.getElementsByTagName('head')[0];
	let script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;
	if (typeof(callback) == 'function') {
		script.onload = script.onreadystatechange = function() {
			if (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") {
				callback();
				script.onload = script.onreadystatechange = null;
			}
		};
	}
	head.appendChild(script);
}
/**
 * 获取当前URL地址参数
 * @param name  参数名称
 * @returns {string|null}
 */
function getUrlParam(name) {
	let reg = new RegExp("(.|&)" + name + "=([^&]*)(&|$)");
	let r = window.location.href.match(reg);
	if (r != null) return unescape(r[2]);
	return null;
}
/**
 * 执行函数
 * @param func    函数
 * @param time    延时，负数：延时->执行，正数：执行->延时
 * @param desc
 * @returns {Promise<unknown>}
 */
function obsFunc(func, time = 0, desc = 'func') {
	return new Promise(resolve => {
		if (!!func) {
			if (time < 0) {
				setTimeout(() => {
					func()
					console.log(desc)
					resolve('func')
				}, Math.abs(time) * 1000)
			} else if (time > 0) {
				func()
				setTimeout(() => {
					console.log(desc)
					resolve('func')
				}, Math.abs(time) * 1000)
			} else {
				func()
				console.log(desc)
				resolve('func')
			}
		}
	})
}


/**
 * 懒加载某元素
 * @param el  元素选择器(字符串)
 * @param func 回调函数
 * @param times 次数
 * @param interval 间隔时间
 */
function loadElement(el, func, times, interval) {
	var _times = times || 100, //100次
		_interval = interval || 200, //200毫秒每次
		_self = document.querySelector(el),
		_iIntervalID; //定时器id
	if (_self) { //如果已经获取到了，就直接执行函数
		func && func.call(el);
	} else {
		_iIntervalID = setInterval(function() {
			if (!_times) { //是0就退出
				clearInterval(_iIntervalID);
			}
			_times <= 0 || _times--; //如果是正数就 --
			_self = document.querySelector(el); //再次选择
			if (_self) { //判断是否取到
				func && func.call(el);
				clearInterval(_iIntervalID);
			}
		}, _interval);
	}
	return this;
}


/**
 * 获取当前时间字符串
 */
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

/**
 * Aria2下载
 * @param url 下载文件地址
 * @param filename 下载文件名(带后缀)
 * @param config 下载配置
 */
function Aria2(url, filename, config = {
	wsurl: "ws://127.0.0.1:6800/jsonrpc",
	token: ""
}) {
	var wsurl = config.wsurl
	var token = config.token
	var uris = [url]
	var options = {
		"max-connection-per-server": "16",
		"user-agent": "Opera\/9.80 (Windows NT 6.0) Presto\/2.12.388 Version\/12.14",
	}
	if (filename != "") {
		options.out = filename;
	}

	let json = {
		"id": "priate-script",
		"jsonrpc": '2.0',
		"method": 'aria2.addUri',
		"params": [uris, options],
	};

	if (token != "") {
		json.params.unshift("token:" + token);
	}
	var ws = new WebSocket(wsurl);

	ws.onerror = event => {
		console.log(event);
	};
	ws.onopen = () => {
		ws.send(JSON.stringify(json));
	}

	ws.onmessage = event => {
		console.log(event);
		let received_msg = JSON.parse(event.data);
		if (received_msg.error !== undefined) {
			if (received_msg.error.code === 1)
				console.log(received_msg.error.message)
		}
		switch (received_msg.method) {
			case "aria2.onDownloadStart":
				console.log('Aria2 已经开始下载!' + filename)
				break;
			case "aria2.onDownloadError":
				;
				console.log('Aria2 下载错误!');
				break;
			case "aria2.onDownloadComplete":
				console.log('Aria2 下载完成!');
				break;
			default:
				break;
		}
	};
}


/**
 * 显示赞赏图片
 */
function showDonate() {
	var priate_donate_script_div = document.createElement("div")
	priate_donate_script_div.innerHTML = `
<div id="priate_donate_script_div">
<p class="priate_donate_script_p"><a href="https://donate.virts.app/" target="_blank"><img class="priate_donate_script_img" src="https://priate.oss-cn-beijing.aliyuncs.com/products/picture/all.jpg"></a></p>
<p class="priate_donate_script_text">推荐通过 <a href="https://afdian.net/@cyberubbish" target="_blank" class="hover-underline-animation a-purple">爱发电</a> 或 <a href="https://dun.mianbaoduo.com/@Cyberabbit" target="_blank" class="hover-underline-animation a-yellow">顿顿饭</a> 赞助我哦</p>
<p class="priate_donate_script_text">谢谢你这么好看还给我零花钱!</p>
<p id="exitDonate" class="priate_donate_script_text"><a class="hover-underline-animation a-pink">【点我关闭此页面】</a></p>
</div>
`
	GM_addStyle(`
#priate_donate_script_div{
height : 100%;
width : 100%;
position : fixed;
z-index : 2147483647;
top : 0;
background-color: #fff;
}
.priate_donate_script_p{
text-align : center;
margin-top : 100px;
}
.priate_donate_script_img{
cursor : pointer;
width : 600px;
}
.priate_donate_script_text{
text-align : center;
font-size: 20px;
color: #660000;
margin-bottom : 0 !important;
margin-top : 5px !important;
}
.hover-underline-animation {
	display: inline-block;
	position: relative;
	text-decoration: none;
	cursor: pointer;
}
.hover-underline-animation:after {
	content: '';
	position: absolute;
	width: 100%;
	transform: scaleX(0);
	height: 2px;
	bottom: 0;
	left: 0;
	/* background-color: #0087ca; */
	transform-origin: bottom right;
	transition: transform 0.25s ease-out;
}
.hover-underline-animation:hover:after {
	transform: scaleX(1);
	transform-origin: bottom left;
}
.a-purple{
	color: #946ce6 !important;
}
.a-purple:after{
	background-color: #946ce6;
}

.a-blue{
	color: #1778FF !important;
}
.a-blue:after{
	background-color: #1778FF;

}.a-green{
	color: #05DF6D !important;
}
.a-green:after{
	background-color: #05DF6D;
}
.a-yellow{
	color: #FFD404 !important;
}
.a-yellow:after{
	background-color: #FFD404;
}
.a-pink{
	color: hsl(312, 100%, 69%) !important;
}
.a-pink:after{
	background-color: hsl(312, 100%, 69%);
}
`);
	document.querySelector("html").appendChild(priate_donate_script_div)
	document.querySelector("#exitDonate").addEventListener('mouseenter', function() {
		this.children[0].innerText = "【～～嘤嘤嘤～～】"
		var _this = this
		setTimeout(function() {
			_this.children[0].innerText = "【点我关闭此页面】"
		}, 2000)
	})
	document.querySelector("#exitDonate").addEventListener('click', function() {
		priate_donate_script_div.remove()
	})
}