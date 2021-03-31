import flvjs from 'flv.zv.js'
import * as Hls from 'hls.js'
import httpx from './service/httpx'
import lcStore from "./service/url/lcStore";
const hostUrl = 'http://127.0.0.1';
/**
 * 全局配置
 * decryptionMode： 是否加密
 * switchRate：码率切换控制
 */
 export const GL_CACHE = {
  DM :'decryptionMode',
  SR :'switchRate',
  PT :'palette',
}

/**
 * 客户端插件模式，随机端口
 */
export const LOCAL_PORT = ["15080", "15081", "15082", "15083", "15084", "15085", "15086", "15087", "15088", "15089"]

export const PLAY_CODE = {
  '10000': '', 
  '10100': '版本需要更新',
  '10200': '插件初始化异常',
  '12000': '插件不存在',
}

export function findVideoAttribute(val, kv) {
  const ens = getVideoRatio()
  for(const key in ens){
    if(ens[key]['resolution'] == val){
      return ens[key][kv]
    }
  }
}


/**
 * 创建HLS对象
 * @param {*} video
 * @param {*} file
 */
export function createHlsPlayer(video, file) {
  if (Hls.isSupported()) {
    const player = new Hls({
      liveDurationInfinity: true,
      levelLoadingTimeOut: 15000,
      fragLoadingTimeOut: 25000,
      enableWorker: true,
    })
    player.loadSource(file)
    player.attachMedia(video)
    return player
  }
}

/**
 * 创建FLV对象
 * @param {*} video
 * @param {*} options
 */
export function createFlvPlayer(video, options) {
  const { flvOptions = {}, flvConfig = {} } = options
  if (flvjs.isSupported()) {
    const player = flvjs.createPlayer(
      Object.assign(
        {},
        {
          type: 'flv',
          url: options.file,
        },
        flvOptions
      ),
      Object.assign(
        {},
        {
          enableWorker: true,
          // lazyLoad: false,
          // Indicates how many seconds of data to be kept for lazyLoad.
          // lazyLoadMaxDuration: 0,
          // autoCleanupMaxBackwardDuration: 3,
          // autoCleanupMinBackwardDuration: 2,
          // autoCleanupSourceBuffer: true,
          enableStashBuffer: false,
          stashInitialSize: 128,
          cors: true,
          seekType: 'range',
          isLive: options.isLive || true,
          // headers:{
          //   "Access-Control-Allow-Origin":"*"
          // }
        },
        flvConfig
      )
    )
    player.attachMediaElement(video)
    player.load()
    return player
  }
}

/**
 * 获取播放文件类型
 * @param {*} url
 */
export function getVideoType(url) {
  return url.indexOf('.flv') > -1 ? 'flv' : url.indexOf('.m3u8') > -1 ? 'm3u8' : 'native'
}

/**
 * 播放时间转字符串
 * @param {*} second_time
 */
export function timeStamp(second_time) {
  let time = Math.ceil(second_time)
  if (time > 60) {
    let second = Math.ceil(second_time % 60)
    let min = Math.floor(second_time / 60)
    time = `${min < 10 ? `0${min}` : min}:${second < 10 ? `0${second}` : second}`
    if (min > 60) {
      min = Math.ceil((second_time / 60) % 60)
      let hour = Math.floor(second_time / 60 / 60)
      time = `${hour < 10 ? `0${hour}` : hour}:${min < 10 ? `0${min}` : min}:${second < 10 ? `0${second}` : second}`
    } else {
      time = `00:${time}`
    }
  } else {
    time = `00:00:${time < 10 ? `0${time}` : time}`
  }

  return time
}

/**
 * 日期格式化
 * @param {*} timetemp
 */
export function dateFormat(timetemp) {
  const date = new Date(timetemp)
  let YYYY = date.getFullYear()
  let DD = date.getDate()
  let MM = date.getMonth() + 1
  let hh = date.getHours()
  let mm = date.getMinutes()
  let ss = date.getSeconds()
  return `${YYYY}.${MM > 9 ? MM : '0' + MM}.${DD > 9 ? DD : '0' + DD} ${hh > 9 ? hh : '0' + hh}.${mm > 9 ? mm : '0' + mm}.${ss > 9 ? ss : '0' + ss}`
}

/**
 * 全屏
 * @param {*} element
 */
export function fullscreen(element) {
  if (element.requestFullScreen) {
    element.requestFullScreen()
  } else if (element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  }
}

/**
 * exitFullscreen 退出全屏
 * @param  {Objct} element 选择器
 */
export function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  }
}

/**
 * 判读是否支持全屏
 */
export function fullscreenEnabled() {
  return document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled
}

/**
 * [isFullscreen 判断浏览器是否全屏]
 * @return [全屏则返回当前调用全屏的元素,不全屏返回false]
 */
export function isFullscreen(ele) {
  if (!ele) {
    return false
  }
  return document.fullscreenElement === ele || document.msFullscreenElement === ele || document.mozFullScreenElement === ele || document.webkitFullscreenElement === ele || false
}
// 添加 / 移除 全屏事件监听
export function fullScreenListener(isAdd, fullscreenchange) {
  const funcName = isAdd ? 'addEventListener' : 'removeEventListener'
  const fullScreenEvents = ['fullscreenchange', 'mozfullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange']
  fullScreenEvents.map((v) => document[funcName](v, fullscreenchange))
}

/**
 * 计算视频拖拽边界
 * @param {*} ele
 * @param {*} currentPosition
 * @param {*} scale
 */
export function computedBound(ele, currentPosition, scale) {
  const data = currentPosition
  const eleRect = ele.getBoundingClientRect()
  const w = eleRect.width
  const h = eleRect.height
  let lx = 0,
    ly = 0
  if (scale === 1) {
    return [0, 0]
  }
  lx = (w * (scale - 1)) / 2 / scale
  ly = (h * (scale - 1)) / 2 / scale
  let x = 0,
    y = 0
  if (data[0] >= 0 && data[0] > lx) {
    x = lx
  }
  if (data[0] >= 0 && data[0] < lx) {
    x = data[0]
  }

  if (data[0] < 0 && data[0] < -lx) {
    x = -lx
  }
  if (data[0] < 0 && data[0] > -lx) {
    x = data[0]
  }

  if (data[1] >= 0 && data[1] > ly) {
    y = ly
  }
  if (data[1] >= 0 && data[1] < ly) {
    y = data[1]
  }

  if (data[1] < 0 && data[1] < -ly) {
    y = -ly
  }
  if (data[1] < 0 && data[1] > -ly) {
    y = data[1]
  }
  if (x !== data[0] || y !== data[1]) {
    return [x, y]
  } else {
    return
  }
}
/**
 * 
 * @returns 获取随机数
 */
export function getRandom() {
  return Math.random().toString(36).substr(2)
}

export function JSONP(url){
  let script = document.createElement('script')//创建script标签
  let functionName = 'fang' + parseInt(Math.random()*10000000,10)//设置调用函数名
  window[functionName] = function(result){
    if(result === 'success'){
      amount.innerText = amount.innerText - 1
    }
  }
  script.src = `${url}&callback=${functionName} `
  document.body.appendChild(script)//将能实现发送跨域请求的script标签插入html
  script.onload = function(e){
    document.body.removeChild(script);
    delete window[functionName]
  }
  script.onerror = function(){
    console.warn('切换分辨率失败！')
    document.body.removeChild(script);
    delete window[functionName]
  }
  //完成传输后删除script标签
}
/**
 * 生成UUID
 */
 export function genuuid() {
  let tid = [];
  let hexDigits = '0123456789abcdef';
  for (let i = 0; i < 36; i++) {
    tid[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }

  tid[14] = '4';
  tid[19] = hexDigits.substr((tid[19] & 0x3) | 0x8, 1);
  tid[8] = tid[13] = tid[18] = tid[23] = '-';

  return tid.join('');
}

/**
 * 获取视频分辨率
 */
 export function getVideoRatio() {
  return {
    '1': { value: '1920*1080', name: '超清', resolution:'1080p', bitrate:'2M',show: true},
    '2': { value: '1280*720', name: '高清', resolution:'720p', bitrate:'2M',show: true},
    '3': { value: '640*360', name: '标清', resolution:'360p', bitrate:'500K',show: true},
    '4': { value: '640*480', name: '标清', resolution:'480p', bitrate:'1M',show: false},
    '5': { value: '', name: '原始', resolution: '', bitrate:'',show: true},
  }
}

/**
 * 根据分屏获取对应的分辨率
 * 默认 960*544
 */
 export function getScreenRate(num){
  const videoRatio = getVideoRatio()
  // 1、4、6、8、9、10、13、16
  if(num < 4){
    return videoRatio['5'].resolution
  }else if(num < 9 && num >= 4){
    return videoRatio['2'].resolution
  }else if(num < 13 && num >= 9){
    return videoRatio['4'].resolution
  }else if(num <= 16 && num >= 13){
    return videoRatio['3'].resolution
  }else{
    return videoRatio['5'].resolution
  }
}


/**
 * 获取全局配置
 * @param {*} key 
 */
 export function getGlobalCache(key){
  const strS = localStorage.getItem('PY_PLUS')
  let playerOptions = null

  try {
    playerOptions = JSON.parse(strS);
  } catch (error) {
    console.error('播放配置出错，请检查浏览器本地存储PY_PLUS！')
    return ''
  }

  return playerOptions ? playerOptions[key] : ''
}

export function BASE64(input) {  
  // private property  
  let _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";  

  function _utf8_encode(string) {  
    string = string.replace(/\r\n/g,"\n");  
    var utftext = "";  
    for (var n = 0; n < string.length; n++) {  
        var c = string.charCodeAt(n);  
        if (c < 128) {  
            utftext += String.fromCharCode(c);  
        } else if((c > 127) && (c < 2048)) {  
            utftext += String.fromCharCode((c >> 6) | 192);  
            utftext += String.fromCharCode((c & 63) | 128);  
        } else {  
            utftext += String.fromCharCode((c >> 12) | 224);  
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);  
            utftext += String.fromCharCode((c & 63) | 128);  
        }  
    }  
    return utftext;
  }  

  // public method for encoding  
  var output = "";  
  var chr1, chr2, chr3, enc1, enc2, enc3, enc4;  
  var i = 0;  
  input = _utf8_encode(input);  
  while (i < input.length) {  
      chr1 = input.charCodeAt(i++);  
      chr2 = input.charCodeAt(i++);  
      chr3 = input.charCodeAt(i++);  
      enc1 = chr1 >> 2;  
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);  
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);  
      enc4 = chr3 & 63;  
      if (isNaN(chr2)) {  
        enc3 = enc4 = 64;  
      } else if (isNaN(chr3)) {  
        enc4 = 64;  
      }  
      output = output +  
      _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +  
      _keyStr.charAt(enc3) + _keyStr.charAt(enc4);  
  }  
  return output;  
}

export function unicodeToBase64(s){
  if(window.btoa){
    return window.btoa(s) +''
  }else{
    return BASE64(s) +''
  }
}

/**
 * 随机获取端口号
 * @returns 
 */
export function getLocalPort(){
  return LOCAL_PORT[Math.floor(Math.random()*LOCAL_PORT.length)]
}

/**
 * 获取系统版本
 * @returns 
 */
 export function getAppPlayerVersion(){
  return sessionStorage.getItem('_APP_PLAY_VERSION')
}

/**
 * 通过本地存储进行播放类型检测
 * @returns 
 */
export function detectorPlayeMode(){
  const isPlus = getGlobalCache('mode')
  sessionStorage.setItem('_TEMP_PLAY_MODE', isPlus)
  // 是否本地插件播放 0是互联网模式，不走插件
  return isPlus
}
/**
 * 解析本地是否安装
 */
export function installState(callback){
  // 进行类型检测 是否插件模式
  if (!detectorPlayeMode()) return;

  if(sessionStorage.getItem('_TEMP_PLAY_CODE') == '10000') return;
  // 进行本地检测
  const port = getLocalPort()
  httpx.get(`${hostUrl}:${port}/video/v1/state`, function(respondData) {
    let res = {}
    try{
      res = JSON.parse(respondData)
      if(res.code == 200){
        sessionStorage.setItem('_TEMP_PLAY_VERSION', res.version)
        if(getAppPlayerVersion() != res.version){
          sessionStorage.setItem('_TEMP_PLAY_CODE','10001')
          throw `检测到版本${res.version}与应用系统版本不匹配，请检查`
        }else{
          sessionStorage.setItem('_TEMP_PLAY_CODE','10000')
        }
      }else{
        sessionStorage.setItem('_TEMP_PLAY_CODE','10002')
        throw res.message || ''
      }
    }catch(err){
      console.log('插件初始化失败，请联系管理员！'+ err)
    }
    callback && callback()
}, function(method, url) {
  console.log('未安装插件！！！')
  sessionStorage.setItem('_TEMP_PLAY_CODE','20000')
  callback && callback()
});
}


/**
 * 客户端插件访问入口
 * @param {*} url 
 * @param {*} resolution 
 * @param {*} onToken 
 * @returns 
 */
export function tansCodingToUrl(player, onToken){
  
  let param1 = ''
  let param2 = ''
  let param3 = ''
  let param4 = ''

  let {file, resolution, deviceInfo} = player

  const key = genuuid()

  // 进行类型检测 是否插件模式
  if (!detectorPlayeMode()) return file

  // 是否加密
  file = file + getGlobalCache(GL_CACHE.DM)

  const url_info ={
      port: getLocalPort(),
      pull_uri: unicodeToBase64(file)?.replaceAll('=','')?.replaceAll('/','_')?.replaceAll('+','-')
  }
  // 分辨率，如果为空，为原始分辨率
  if(resolution){
    param1 = '&resolution=' + resolution
  }

  param2 = '&token=' + key

  // 免责工具使用
  onToken && onToken(key)

  if(resolution){
    param1 = '&resolution=' + resolution

    // 码率
    param3 = '&bitrate=' + findVideoAttribute(resolution,'bitrate')

  }
  
  // value: "100602", label: "球机"
  if(deviceInfo && deviceInfo.type == "100602"){
    param4 = '&quickplay=0'
  }
  console.log(file+param1+param3+param4)

  return lcStore.getTranscodingStream.value.replace('<pull_uri>', url_info.pull_uri).replace('<port>', url_info.port) + param1 + param2 + param3 + param4
}

