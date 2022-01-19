import flvjs from 'flv.zv.js'
import * as Hls from 'hls.js'
import httpx from './service/httpx'
import lcStore from './service/url/lcStore';
import {default as BASE64} from './base64';

import {hostUrl, GL_CACHE, LOCAL_PORT, PLAY_CODE, PY_M_CC_NAME , VIDEO_RESOLUTION} from './constant'

window.zvpalyer = window.zvpalyer || {}

export function findVideoAttribute(val, kv) {
  const ens = VIDEO_RESOLUTION
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
        },
        flvConfig
      )
    )
    player.attachMediaElement(video)
    player.load()

    // 日志配置
    flvjs.LoggingControl.enableError = window.zvpalyer.logError === false ? false : true
    flvjs.LoggingControl.enableWarn = window.zvpalyer.logWarn || false
    flvjs.LoggingControl.enableVerbose = window.zvpalyer.logDebug || false
    flvjs.LoggingControl.enableDebug = window.zvpalyer.logDebug || false
    flvjs.LoggingControl.enableInfo = window.zvpalyer.logDebug || false
    flvjs.LoggingControl.forceGlobalTag = true
    flvjs.LoggingControl.globalTag = "ocean-player"

    return player
  }
}

/**
 * 获取播放文件类型
 * @param {*} url
 */
 export function getVideoType(url) {
  let type = url.indexOf('.flv') > -1 ? 'flv' : url.indexOf('.m3u8') > -1 ? 'm3u8' : 'native'
  if( url.indexOf('protocol=flv')>-1 ) type = 'flv'
  return type
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

export function getQueryString(url, name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
   
  var r = url.split("?")[1].match(reg);
  if (r != null) return unescape(r[2]); return null;
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
 * 根据分屏获取对应的分辨率
 * 默认 960*544
 */
 export function getScreenRate(num){
  const videoRatio = VIDEO_RESOLUTION
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
    console.error(PY_M_CC_NAME)
    return ''
  }

  return playerOptions ? playerOptions[key] : ''
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
  const isPlus = getGlobalCache(GL_CACHE.TP)
  sessionStorage.setItem('_TEMP_PLAY_MODE', isPlus)
  // 是否本地插件播放 0是互联网模式，不走插件
  return isPlus
}

export function compare(a, b) {
  if (a === b) {
     return 0;
  }

  var a_components = a.split(".");
  var b_components = b.split(".");

  var len = Math.min(a_components.length, b_components.length);

  // loop while the components are equal
  for (var i = 0; i < len; i++) {
      // A bigger than B
      if (parseInt(a_components[i]) > parseInt(b_components[i])) {
          return 1;
      }

      // B bigger than A
      if (parseInt(a_components[i]) < parseInt(b_components[i])) {
          return -1;
      }
  }

  // If one's a prefix of the other, the longer one is greater.
  if (a_components.length > b_components.length) {
      return 1;
  }

  if (a_components.length < b_components.length) {
      return -1;
  }

  // Otherwise they are the same.
  return 0;
}

/**
 * 版本验证处理
 * @returns 
 */
 export function checkVerson(sysVersion,currentVersion){
   console.info(sysVersion);
   if(!currentVersion){
     console.warn('检测到应用系统版版本配置未生效，请检查配置！')
    return false
   }

   if(compare(currentVersion.substr(1), sysVersion.substr(1)) < 0){
     // 安装版本过低，需要升级
     return false
   }
  return true
}
/**
 * 解析本地是否安装
 */
export function installState(callback){
  // 进行类型检测 是否插件模式
  if (detectorPlayeMode() == 0 || detectorPlayeMode() == 2) return;

  if(sessionStorage.getItem('_TEMP_PLAY_CODE') == '10000') return;
  // 进行本地检测
  const port = getLocalPort()
  httpx.get(`${hostUrl}:${port}/video/v1/state`, function(respondData) {
    let res = {}
    try{
      res = JSON.parse(respondData)
      if(res.code == 200){
        sessionStorage.setItem('_TEMP_PLAY_VERSION', res.version)
        if(!checkVerson(getAppPlayerVersion(),res.version)){
          sessionStorage.setItem('_TEMP_PLAY_CODE','10001')
          throw `检测到版本${res.version}与应用系统版本不匹配，请检查配置`
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

export function monitorHlsFragments(hls, resolution){
  console.log('Start Processing HLS TS...')
  const playeMode = detectorPlayeMode()
  if(playeMode == 1){
    hls.on('hlsManifestParsed',(event,data)=>{
      if(data.levels[0] && data.levels[0].details.fragments){
        data.levels[0].details.fragments.forEach(function(item){
          item.relurl = transformFn(item.relurl,sessionStorage.getItem("__PLAYER_RESOLUTION_CUR", resolution))
        })
      }
    })
  }
}

export function decodeService(player, onToken){
  const playeMode = detectorPlayeMode()
  const key = genuuid()
  let url = ''

  switch (playeMode) {
    case 1:
      url = tansDecoding(player)+ '&token=' + key
      // 免责工具使用
      onToken && onToken(key)
      break;
    case 2:
      url = serverDecoding(player)
      break;
    default:
      url = browserDecoding(player)
      break;
  }
  return url
}

export function transformFn(file, resolution){
  const playeMode = detectorPlayeMode()
  const key = genuuid()
  let url = ''

  switch (playeMode) {
    case 1:
      url = videoTansDecoding(file, resolution)
      break;
    default:
      url = file
      break;
  }
  return url
}

/**
 * 浏览器端解码
 * @param {*} player 
 * @returns 
 */
export function browserDecoding(player){
  if(getGlobalCache(GL_CACHE.UNIQUE)){
    return player?.file + '&timestamp=' + (new Date().getTime())
  }
  return player?.file 
}

/**
 * 服务端解码逻辑
 * @param {*} player 
 * @param {*} onToken 
 * @returns 
 */
export function serverDecoding(player){
  const {file, resolution} = player
  const ip = window.location.origin
  // 从file中提取 Authorization
  const authorization = getQueryString(file, 'Authorization')
  const templateCode = findVideoAttribute(resolution,'templateCode')
  let lastParam = ''

  // 原始码流
  if(templateCode == 10000){
    const url = file.split('?')[0];
    lastParam =  '&cid=' + url.substring(url.lastIndexOf("\/") + 1,url.length);
  }

  const resourceUrl = BASE64.encode(file)?.replaceAll('=','')?.replaceAll('/','_')?.replaceAll('+','-')
  return ip + `/staticResource/v2/video/media/transfer?Authorization=${authorization}&templateCode=${templateCode}&resourceUrl=${resourceUrl}` + lastParam
}

/**
 * 客户端插件访问入口
 * @param {*} url 
 * @param {*} resolution 
 * @param {*} onToken 
 * @returns 
 */
export function tansDecoding(player){
  
  let param1 = ''
  let param2 = ''
  let param3 = ''

  let {file, resolution, deviceInfo} = player

  // 是否加密
  file = file + getGlobalCache(GL_CACHE.DM)

  const url_info ={
      port: getLocalPort(),
      pull_uri: BASE64.encode(file)?.replaceAll('=','')?.replaceAll('/','_')?.replaceAll('+','-')
  }
  
  // 分辨率，如果为空，为原始分辨率
  if(resolution){
    // 分辨率
    param1 = '&resolution=' + resolution
    // 根据分辨率获取码率
    param2 = '&bitrate=' + findVideoAttribute(resolution, 'bitrate')
  }
  
  // value: "100602", label: "球机"
  if(deviceInfo && deviceInfo.type == "100602"){
    param3 = '&quickplay=0'
  }
  console.log(file+param1+param3)

  return lcStore.getTranscodingStream.value.replace('<pull_uri>', url_info.pull_uri).replace('<port>', url_info.port) + param1 + param2 + param3
}


/**
 * 客户端插件访问入口-录像
 * @param {*} url 
 * @returns 
 */
 export function videoTansDecoding(url, resolution){
  let param1 = ''
  let param2 = ''
  let fileUrl = url
  // 是否加密
  fileUrl = fileUrl + getGlobalCache(GL_CACHE.DM)
    // 分辨率，如果为空，为原始分辨率
  if(resolution){
    // 分辨率
    param1 = '&resolution=' + resolution
    // 根据分辨率获取码率
    param2 = '&bitrate=' + findVideoAttribute(resolution, 'bitrate')
  }

  const url_info ={
      port: getLocalPort(),
      pull_uri: BASE64.encode(fileUrl)?.replaceAll('=','')?.replaceAll('/','_')?.replaceAll('+','-')
  }
  
  return lcStore.getTranscodingStream.value.replace('<pull_uri>', url_info.pull_uri).replace('<port>', url_info.port) + param1 + param2
}
