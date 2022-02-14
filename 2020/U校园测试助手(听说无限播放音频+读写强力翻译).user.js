// ==UserScript==
// @name         U校园测试助手(听说无限播放音频+读写强力翻译)
// @namespace    http://tampermonkey.net/
// @version      3.1.8
// @description  U校园视听说测试中无限次数播放音频，读写测试中各种翻译。
// @author       Priate
// @match        *://uexercise.unipus.cn/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/jquery.md5@1.0.2/index.min.js
// @license      MIT
// ==/UserScript==


(function () {
    'use strict';
    const trans_appid = '20200420000425147'; //百度翻译开放平台上申请的APPID
    const trans_key = '3gAE6Z7ol4xHEm3fuHWp'; //百度翻译开放平台上申请的密钥

    //自定义设置，将参数设为0（或false）代表关闭该功能，1（或true）代表开启该功能
    const setting = {
        allow_multiple_play : 1,        //听力允许多次播放

        translate_option : 1,           //听力选项翻译

        composite_dictation : 1,        //复合式听写翻译段落

        long_reading : 1,               //长篇阅读翻译段落及选项

        reading_comprehension : 1,      //阅读理解翻译选项及段落

        select_word : 1,                //选词填空翻译选项及段落

        paragraph_translate : 1,        //段落翻译（中翻英）

        writing : 1,                    //写作翻译（中翻英）
    }

    setTimeout(function(){
        //听力允许多次播放
        setting.allow_multiple_play ? allow_multiple_play() : false;
        //听力选项翻译
        setting.translate_option ? translate_option() : false;
        //复合式听写功能辅助
        setting.composite_dictation ? composite_dictation() : false;
        //长篇阅读功能辅助
        setting.long_reading ? long_reading() : false;
        //阅读理解功能辅助
        setting.reading_comprehension ? reading_comprehension() : false;
        //选词填空功能辅助
        setting.select_word ? select_word() : false;
        //段落翻译功能辅助
        setting.paragraph_translate ? paragraph_translate() : false;
        //写作功能辅助
        setting.writing ? writing() : false;
        //设置样式
        set_style();
    }, 2000)


    //允许多次播放
    function allow_multiple_play(){

        $(".itest-hear-reslist").each(function () {
            $(this).mouseover(function (param) {
                $(this).removeClass('disabled-active');
            })
        });
        //添加音频audio标签
        $(".itest-hear-reslist").each(function () {
            var option_musics = $(this).children('span').text().match(/(http.*?\.mp3)/g);
            if(option_musics){
                var new_option_musics = []
                option_musics.forEach((item)=>{
                    if(new_option_musics.indexOf(item) === -1 && !item.match(/(http.*?question\.mp3)/g)){
                        new_option_musics.unshift(item);
                    }
                })
                var option_ques = $(this).parent().children('.itest-ques')[0];
                for(var option_music in new_option_musics){
                    option_ques.innerHTML = "<audio controls='controls' src='" + new_option_musics[option_music] + "'>您的浏览器不支持 audio 标签。</audio>" + option_ques.innerHTML;
                }
            }
        });


    }
    //复合式听写功能辅助
    function composite_dictation(){
        //为复合式听写添加按钮
        $.each($('.itest-section'), function(index, value){
            if($(value).attr('part1') == "复合式听写"){
                $.each($(value).children('.itest-ques-set'), function(index, value){
                    $(value).find('.itest-ques').prepend("</br><button class='composite_dictation_btn'>翻译</br>内容</button>");
                })
            }
        })

        //为翻译内容按钮注册功能
        $(document).on("click",".composite_dictation_btn",function(){
            $(this).removeClass('composite_dictation_btn').addClass('composite_dictation_hide_btn').html("清空</br>翻译");
            var context_list = "";
            var re = new RegExp("[0-9][0-9]\\)","g");
            var re2 = new RegExp("\n","g");
            var re3 = new RegExp("<.*?>","g");
            $(this).next().next().find('span').children('div').each(function(){
                //将偶数的br替换为hr
                $(this).children('br:even').replaceWith('<hr>')
                context_list = $(this).html().split('<br>');
                $.each(context_list,function(index, value){
                    context_list[index] = value.replace(re, "（XXX）").replace(re2, " ").replace(re3, "") + '\n';
                })
            });
            for (var contents in context_list) {
                (function (contents, btn) {
                    setTimeout(function () {
                        var trans_salt = (new Date).getTime();
                        var trans_from = 'en';
                        var trans_to = 'zh';
                        var trans_str = trans_appid + context_list[contents] + trans_salt + trans_key;
                        var trans_sign = $.md5(trans_str);
                        $.ajax({
                            type: "post",
                            async: false,
                            url: "https://api.fanyi.baidu.com/api/trans/vip/translate",
                            dataType: "jsonp",
                            data: {
                                q: context_list[contents],
                                from: trans_from,
                       