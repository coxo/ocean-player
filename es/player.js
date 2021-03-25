import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import flvjs from 'flv.zv.js';
import * as Hls from 'hls.js';
import { isSupported } from 'hls.js';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Slider as Slider$1 } from 'antd';

class VideoEventInstance {
  constructor(video) {
    this.video = video;
    this.events = {};
    this.playerEvents = {};
  }

  on(eventName, handle) {
    this.events && this.events[eventName] ? this.events[eventName].listener.push(handle) : this.events[eventName] = {
      type: eventName,
      listener: [handle]
    };
  }

  addEventListener(eventName, handle) {
    if (this.video) {
      this.playerEvents[eventName] ? this.playerEvents[eventName].push(handle) : this.playerEvents[eventName] = [handle];
      this.video.addEventListener(eventName, handle, false);
    }
  }

  removeEventListener(eventName, handle) {
    if (this.video) {
      if (!this.playerEvents || !this.playerEvents[eventName]) {
        return;
      }

      let index = this.playerEvents[eventName].findIndex(v => v === handle);
      index > -1 && this.playerEvents[eventName].splice(index, 1);
      this.video.removeEventListener(eventName, handle, false);
    }
  }

  emit(eventName, ...data) {
    if (!this.events || !this.events[eventName]) {
      return;
    }

    this.events[eventName].listener.forEach(v => {
      v(...data);
    });
  }

  off(eventName, handle) {
    if (!this.events || !this.events.eventName) {
      return;
    }

    let index = this.events[eventName].listener.findIndex(v => v === handle);
    index > -1 && this.events[eventName].listener.splice(index, 1);
  }

  getApi() {
    return {
      on: this.on.bind(this),
      off: this.off.bind(this),
      emit: this.emit.bind(this),
      addEventListener: this.addEventListener.bind(this),
      removeEventListener: this.removeEventListener.bind(this)
    };
  }

  destroy() {
    Object.keys(this.playerEvents).forEach(key => {
      this.playerEvents[key].forEach(fn => {
        this.removeEventListener(key, fn);
      });
    });
    this.playerEvents = {};
    this.events = {};
    this.video = null;
  }

}

/* global module,define,console */

/**
 * Extend Object
 *
 * @param {object} dist
 * @param {object} source
 * @return {object} dist
 */
function extend(dist, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      dist[key] = source[key];
    }
  }

  return dist;
}
/**
 * Query url & strings build
 *
 * @param  {string} url  request url
 * @param  {object} data request datas
 * @return {object}
 */


function urlBuild(url, data) {
  if (typeof data === "object") {
    var temp = [];

    for (var i in data) {
      temp.push(i + "=" + encodeURIComponent(data[i]));
    }

    data = temp.join("&");
  }

  url = url + (url.indexOf("?") < 0 ? data === "" || !data ? "" : "?" : data === "" || !data ? "" : "&") + data;
  return {
    url: url,
    data: data
  };
}

var httpx = {
  version: "0.3.1",
  useXDR: false,
  logPrefix: "HTTPx.js:",

  /**
   * Create XHR object
   *
   * @param  {boolean} [xdomain=false]
   * @return {object}  xhr              XMLHttpRequest or XDomainRequest
   */
  xhr: function (xdomain) {
    if (typeof xdomain === "undefined") {
      xdomain = false;
    }

    try {
      var xhr = xdomain ? new XDomainRequest() : new XMLHttpRequest(); // IE7+, XMLHttpRequest Level 1

      return xhr;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  /**
   * Get default's configs
   *
   * @param  {string}         name
   * @return {string|object}
   */
  defaults: function (name) {
    name = name || "";
    var $defaults = {
      debug: false,
      async: true,
      timeout: 3000,
      method: "GET",
      url: "",
      data: "",
      dataType: "text",
      headers: {},
      contentType: "text/plain; charset=UTF-8",
      jsonp: "callback",
      // for query string
      xhrFields: {
        //  like jQuery xhrFields options
        withCredentials: false
      },
      sendBefore: function (xhr) {
        return xhr; // or return this, this == xhr
      },
      success: function () {},
      error: function (method, url) {
        console.error("HTTP Request Error: ", method, url, this.status + " (" + (this.statusText ? this.statusText : "Unkown Error / Timeout") + ")");
      },
      ontimeout: function (method, url) {
        console.error("HTTP Request Timeout: ", method, url, this.status + " (" + (this.statusText ? this.statusText : "Timeout") + ")");
      }
    };
    return name !== "" && typeof name === "string" ? $defaults[name] : $defaults;
  },

  /**
   * check need using XDomainRequest
   *
   * @param   {string}   url
   * @returns {boolean}  useXDR
   */
  needUseXDomainRequest: function (url) {
    var useXDR = false; // For IE8 & IE9

    if (/^((http:|https:)?\/\/)/.test(url) && location.hostname.indexOf(url) < 0) {
      if (window.XDomainRequest) {
        useXDR = true;
      }
    }

    return useXDR;
  },

  /**
   * XHR requester
   *
   * @param  {object}                  [options={}]  request options
   * @return {XMLHttpRequest|boolean}  xhr           XMLHttpRequest Or XDomainRequest Object
   */
  request: function (options) {
    options = options || {};
    var settings = extend(this.defaults(), options);
    settings.method = settings.method.toUpperCase();
    var useXDR = false;
    var url = settings.url;
    var data = settings.data;
    var method = settings.method;
    var urlData = urlBuild(url, data);

    if (settings.debug) {
      console.log(this.logPrefix + " settings =>", settings);
    }

    data = urlData.data;

    if (method === "GET") {
      url = urlData.url;
    }

    if (this.needUseXDomainRequest(url)) {
      useXDR = true;

      if (settings.debug) {
        console.warn(this.logPrefix + " Cross domain request using XDomainRequest.");
        console.warn(location.hostname + " => " + url);
      }

      if (!window.addEventListener && !/MSIE 8\.0/.test(navigator.userAgent)) {
        console.error(this.logPrefix + " Your browser can'nt support cross domain request => " + url + ".");
        return false;
      }
    }

    var xhr = this.xhr(useXDR);

    if (!xhr) {
      return false;
    }

    if (typeof settings.xhrFields.withCredentials !== "undefined") {
      xhr.withCredentials = settings.xhrFields.withCredentials;
    }

    var success = function () {
      var result;

      switch (settings.dataType) {
        case "json":
          result = JSON.parse(xhr.responseText);
          break;

        case "xml":
          result = xhr.responseXML;
          break;

        default:
          result = xhr.responseText;
          break;
      }

      settings.success.bind(xhr)(result);
    };

    var readyStateChange = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 304) {
          success();
        } else {
          settings.error.bind(xhr)(method, url, e);
        }
      }
    };

    if (useXDR) {
      xhr.onload = success;

      xhr.onerror = function (e) {
        settings.error.bind(xhr)(method, url, e);
      };

      xhr.ontimeout = function (e) {
        settings.ontimeout.bind(xhr)(method, url, e);
      };

      if (method !== "GET" && method !== "OPTIONS") {
        method = "POST";
      } else if (method === "OPTIONS") {
        method = "GET";
      }
    } else {
      xhr.addEventListener("readystatechange", readyStateChange);
      xhr.addEventListener("error", function (e) {
        settings.error.bind(xhr)(method, url, e);
      });
      xhr.addEventListener("timeout", function (e) {
        settings.ontimeout.bind(xhr)(method, url, e);
      });
    }

    xhr.open(method, url, settings.async);
    var contentType = settings.contentType;

    if (!useXDR) {
      if (method !== "GET") {
        contentType = "application/x-www-form-urlencoded";
      }

      xhr.setRequestHeader("Content-type", contentType); // Custom http headers, you can override default's Content-Type header.

      for (var key2 in settings.headers) {
        xhr.setRequestHeader(key2, settings.headers[key2]);
      }
    } // New property


    xhr.$request = {
      url: url,
      method: method,
      dataType: settings.dataType,
      contentType: contentType,
      headers: settings.headers
    }; // Compatibility v0.1.0~0.2.0

    xhr.$url = url;
    xhr.$method = method;
    xhr.$dataType = settings.dataType;
    xhr.timeout = settings.timeout;

    if (typeof settings.sendBefore === "function") {
      // sendBefore for custom xhr fields
      var _xhr = settings.sendBefore.bind(xhr)(xhr);

      if (_xhr) {
        if (_xhr instanceof XMLHttpRequest || typeof XDomainRequest !== "undefined" && _xhr instanceof XDomainRequest) {
          xhr = _xhr;
        }
      }
    }

    xhr.send(data);
    return xhr;
  },

  /**
   * Execute request for short methods
   *
   * @param  {string}          method     HTTP method
   * @param  {string|object}   url        request url or options k/v object
   * @param  {object}          data       request data
   * @param  {function}        callback   Success callback
   * @param  {function}        error      Error callback
   * @param  {object}          options    Request options
   * @return {XMLHttpRequest}  xhr        XMLHttpRequest Or XDomainRequest Object
   */
  exec: function (method, url, data, callback, error, options) {
    data = data || {};

    callback = callback || function () {};

    error = error || this.defaults("error");
    options = options || {};

    if (typeof data === "function") {
      error = callback;
      callback = data;
      data = "";
    }

    var defaults = {
      url: url,
      method: method,
      data: data,
      success: callback,
      error: error
    };

    if (typeof url === "object") {
      options = url;
      options.method = method;
    }

    return this.request(extend(defaults, options));
  },

  /**
   * GET method
   *
   * @param  {string|object} url      request url or options k/v object
   * @param  {object}        data     request datas
   * @param  {function}      callback Success callback
   * @param  {function}      error    Error callback
   * @param  {object}        options  Request options
   * @return {void}
   */
  get: function (url, data, callback, error, options) {
    this.exec("GET", url, data, callback, error, options);
  },

  /**
   * POST method
   *
   * @param  {string|object} url      request url or options k/v object
   * @param  {object}        data     request datas
   * @param  {function}      callback Success callback
   * @param  {function}      error    Error callback
   * @param  {object}        options  Request options
   * @return {void}
   */
  post: function (url, data, callback, error, options) {
    this.exec("POST", url, data, callback, error, options);
  },

  /**
   * PUT method
   *
   * @param  {string|object} url      request url or options k/v object
   * @param  {object}        data     request datas
   * @param  {function}      callback Success callback
   * @param  {function}      error    Error callback
   * @param  {object}        options  Request options
   * @return {void}
   */
  put: function (url, data, callback, error, options) {
    this.exec("PUT", url, data, callback, error, options);
  },

  /**
   * PATCH method
   *
   * @param  {string|object} url      request url or options k/v object
   * @param  {object}        data     request datas
   * @param  {function}      callback Success callback
   * @param  {function}      error    Error callback
   * @param  {object}        options  Request options
   * @return {void}
   */
  patch: function (url, data, callback, error, options) {
    this.exec("PATCH", url, data, callback, error, options);
  },

  /**
   * DELETE method
   *
   * @param  {string|object} url      request url or options k/v object
   * @param  {object}        data     request datas
   * @param  {function}      callback Success callback
   * @param  {function}      error    Error callback
   * @param  {object}        options  Request options
   * @return {void}
   */
  "delete": function (url, data, callback, error, options) {
    this.exec("DELETE", url, data, callback, error, options);
  },

  /**
   * Get json, link jQuery getJSON()
   *
   * @param  {string|object} url      request url or options k/v object
   * @param  {object}        data     request datas
   * @param  {function}      callback Success callback
   * @param  {function}      error    Error callback
   * @param  {object}        options  Request options
   * @return {void}
   */
  json: function (url, data, callback, error, options) {
    data = data || {};

    callback = callback || function () {};

    error = error || this.defaults("error");
    options = options || {};

    if (typeof data === "function") {
      error = callback;
      callback = data;
      data = "";
    }

    var defaults = {
      url: url,
      dataType: "json",
      method: "GET",
      data: data,
      success: callback,
      error: error
    };

    if (typeof url === "object") {
      options = url;
      options.method = "GET";
      options.dataType = "json";
    }

    this.request(extend(defaults, options));
  },

  /**
   * Alias json()
   *
   * @param  {string|object} url      request url or options k/v object
   * @param  {object}        data     request datas
   * @param  {function}      callback Success callback
   * @param  {function}      error    Error callback
   * @param  {object}        options  Request options
   * @return {void}
   */
  getJSON: function (url, data, callback, error, options) {
    this.json(url, data, callback, error, options);
  },

  /**
   * JSONP method
   *
   * @param  {string|object} url          request url or options k/v object
   * @param  {object}        data         request datas
   * @param  {function}      callback     Success callback
   * @param  {string}        callbackName for query string name
   * @return {void}
   */
  jsonp: function (url, data, callback, callbackName) {
    callbackName = callbackName || "callback";

    if (typeof data === "function") {
      callbackName = callback;
      callback = data;
      data = "";
    }

    var urlData = urlBuild(url, data);
    url = urlData.url;
    data = urlData.data;
    var fn = "__jsonp_" + callbackName + new Date().getTime() + "_" + Math.floor(Math.random() * 100000) + "__";
    url += (url.indexOf("?") < 0 ? "?" : "&") + callbackName + "=" + fn;

    var evalJsonp = function (callback) {
      return function (data) {
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (e) {}
        }

        data = data || {};
        callback(data, url);
        window[fn] = null;
        document.body.removeChild(document.getElementById(fn));
      };
    };

    window[fn] = evalJsonp(callback);
    var script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.id = fn;
    document.body.appendChild(script);
  },

  /**
   * Get script file, like jQuery getScript()
   *
   * @param   {string}   src      javascript file path
   * @param   {function} callback loaded callback function
   * @returns {void}
   */
  getScript: function (src, callback) {
    if (src === "") {
      console.error("Error: Get script source can't be empty");
      return;
    }

    callback = callback || function () {};

    var head = document.getElementsByTagName("head")[0];
    var loaded = document.querySelectorAll("script[src=\"" + src + "\"]");

    if (loaded.length > 0) {
      head.removeChild(loaded[0]);
    }

    var script = document.createElement("script");
    script.type = "text/javascript";

    script.onload = script.onreadystatechange = function () {
      if (!script.readyState || /loaded|complete/.test(script.readyState)) {
        script.onload = script.onreadystatechange = null;
        script = undefined;
        callback();
      }
    };

    script.src = src;
    script.async = true;
    head.appendChild(script);
  }
};

const hostUrl$1 = 'http://127.0.0.1';
var lcStore$1 = {
  getTranscodingStream: {
    value: `${hostUrl$1}:<port>/video/v1/transcoding?uri=<pull_uri>`,
    label: '获取视频流接口',
    actionName: 'getTranscodingStream'
  },
  setStreamResolution: {
    value: `${hostUrl$1}:<port>/video/v1/change?resolution=<resolution>`,
    label: '修改视频流接口',
    actionName: 'setStreamResolution'
  }
};

const hostUrl = 'http://127.0.0.1';
/**
 * 全局配置
 * decryptionMode： 是否加密
 * switchRate：码率切换控制
 */

const GL_CACHE = {
  DM: 'decryptionMode',
  SR: 'switchRate',
  PT: 'palette'
};
/**
 * 客户端插件模式，随机端口
 */

const LOCAL_PORT = ["15080", "15081", "15082", "15083", "15084", "15085", "15086", "15087", "15088", "15089"];
function findVideoAttribute(val, kv) {
  const ens = getVideoRatio();

  for (const key in ens) {
    if (ens[key]['resolution'] == val) {
      return ens[key][kv];
    }
  }
}
/**
 * 创建HLS对象
 * @param {*} video
 * @param {*} file
 */

function createHlsPlayer(video, file) {
  if (isSupported()) {
    const player = new Hls({
      liveDurationInfinity: true,
      levelLoadingTimeOut: 15000,
      fragLoadingTimeOut: 25000,
      enableWorker: true
    });
    player.loadSource(file);
    player.attachMedia(video);
    return player;
  }
}
/**
 * 创建FLV对象
 * @param {*} video
 * @param {*} options
 */

function createFlvPlayer(video, options) {
  const {
    flvOptions = {},
    flvConfig = {}
  } = options;

  if (flvjs.isSupported()) {
    const player = flvjs.createPlayer(Object.assign({}, {
      type: 'flv',
      url: options.file
    }, flvOptions), Object.assign({}, {
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
      isLive: options.isLive || true // headers:{
      //   "Access-Control-Allow-Origin":"*"
      // }

    }, flvConfig));
    player.attachMediaElement(video);
    player.load();
    return player;
  }
}
/**
 * 获取播放文件类型
 * @param {*} url
 */

function getVideoType(url) {
  return url.indexOf('.flv') > -1 ? 'flv' : url.indexOf('.m3u8') > -1 ? 'm3u8' : 'native';
}
/**
 * 播放时间转字符串
 * @param {*} second_time
 */

function timeStamp(second_time) {
  let time = Math.ceil(second_time);

  if (time > 60) {
    let second = Math.ceil(second_time % 60);
    let min = Math.floor(second_time / 60);
    time = `${min < 10 ? `0${min}` : min}:${second < 10 ? `0${second}` : second}`;

    if (min > 60) {
      min = Math.ceil(second_time / 60 % 60);
      let hour = Math.floor(second_time / 60 / 60);
      time = `${hour < 10 ? `0${hour}` : hour}:${min < 10 ? `0${min}` : min}:${second < 10 ? `0${second}` : second}`;
    } else {
      time = `00:${time}`;
    }
  } else {
    time = `00:00:${time < 10 ? `0${time}` : time}`;
  }

  return time;
}
/**
 * 日期格式化
 * @param {*} timetemp
 */

function dateFormat(timetemp) {
  const date = new Date(timetemp);
  let YYYY = date.getFullYear();
  let DD = date.getDate();
  let MM = date.getMonth() + 1;
  let hh = date.getHours();
  let mm = date.getMinutes();
  let ss = date.getSeconds();
  return `${YYYY}.${MM > 9 ? MM : '0' + MM}.${DD > 9 ? DD : '0' + DD} ${hh > 9 ? hh : '0' + hh}.${mm > 9 ? mm : '0' + mm}.${ss > 9 ? ss : '0' + ss}`;
}
/**
 * 全屏
 * @param {*} element
 */

function fullscreen(element) {
  if (element.requestFullScreen) {
    element.requestFullScreen();
  } else if (element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}
/**
 * exitFullscreen 退出全屏
 * @param  {Objct} element 选择器
 */

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}
/**
 * [isFullscreen 判断浏览器是否全屏]
 * @return [全屏则返回当前调用全屏的元素,不全屏返回false]
 */

function isFullscreen(ele) {
  if (!ele) {
    return false;
  }

  return document.fullscreenElement === ele || document.msFullscreenElement === ele || document.mozFullScreenElement === ele || document.webkitFullscreenElement === ele || false;
} // 添加 / 移除 全屏事件监听

function fullScreenListener(isAdd, fullscreenchange) {
  const funcName = isAdd ? 'addEventListener' : 'removeEventListener';
  const fullScreenEvents = ['fullscreenchange', 'mozfullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'];
  fullScreenEvents.map(v => document[funcName](v, fullscreenchange));
}
/**
 * 计算视频拖拽边界
 * @param {*} ele
 * @param {*} currentPosition
 * @param {*} scale
 */

function computedBound(ele, currentPosition, scale) {
  const data = currentPosition;
  const eleRect = ele.getBoundingClientRect();
  const w = eleRect.width;
  const h = eleRect.height;
  let lx = 0,
      ly = 0;

  if (scale === 1) {
    return [0, 0];
  }

  lx = w * (scale - 1) / 2 / scale;
  ly = h * (scale - 1) / 2 / scale;
  let x = 0,
      y = 0;

  if (data[0] >= 0 && data[0] > lx) {
    x = lx;
  }

  if (data[0] >= 0 && data[0] < lx) {
    x = data[0];
  }

  if (data[0] < 0 && data[0] < -lx) {
    x = -lx;
  }

  if (data[0] < 0 && data[0] > -lx) {
    x = data[0];
  }

  if (data[1] >= 0 && data[1] > ly) {
    y = ly;
  }

  if (data[1] >= 0 && data[1] < ly) {
    y = data[1];
  }

  if (data[1] < 0 && data[1] < -ly) {
    y = -ly;
  }

  if (data[1] < 0 && data[1] > -ly) {
    y = data[1];
  }

  if (x !== data[0] || y !== data[1]) {
    return [x, y];
  } else {
    return;
  }
}
function JSONP(url) {
  let script = document.createElement('script'); //创建script标签

  let functionName = 'fang' + parseInt(Math.random() * 10000000, 10); //设置调用函数名

  window[functionName] = function (result) {
    if (result === 'success') {
      amount.innerText = amount.innerText - 1;
    }
  };

  script.src = `${url}&callback=${functionName} `;
  document.body.appendChild(script); //将能实现发送跨域请求的script标签插入html

  script.onload = function (e) {
    document.body.removeChild(script);
    delete window[functionName];
  };

  script.onerror = function () {
    console.warn('切换分辨率失败！');
    document.body.removeChild(script);
    delete window[functionName];
  }; //完成传输后删除script标签

}
/**
 * 生成UUID
 */

function genuuid() {
  let tid = [];
  let hexDigits = '0123456789abcdef';

  for (let i = 0; i < 36; i++) {
    tid[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }

  tid[14] = '4';
  tid[19] = hexDigits.substr(tid[19] & 0x3 | 0x8, 1);
  tid[8] = tid[13] = tid[18] = tid[23] = '-';
  return tid.join('');
}
/**
 * 获取视频分辨率
 */

function getVideoRatio() {
  return {
    '1': {
      value: '1920*1080',
      name: '超清',
      resolution: '1080p',
      bitrate: '2M',
      show: true
    },
    '2': {
      value: '1280*720',
      name: '高清',
      resolution: '720p',
      bitrate: '2M',
      show: true
    },
    '3': {
      value: '640*360',
      name: '标清',
      resolution: '360p',
      bitrate: '500K',
      show: true
    },
    '4': {
      value: '640*480',
      name: '标清',
      resolution: '480p',
      bitrate: '1M',
      show: false
    },
    '5': {
      value: '',
      name: '原始',
      resolution: '',
      bitrate: '',
      show: true
    }
  };
}
/**
 * 根据分屏获取对应的分辨率
 * 默认 960*544
 */

function getScreenRate(num) {
  const videoRatio = getVideoRatio(); // 1、4、6、8、9、10、13、16

  if (num < 4) {
    return videoRatio['5'].resolution;
  } else if (num < 9 && num >= 4) {
    return videoRatio['2'].resolution;
  } else if (num < 13 && num >= 9) {
    return videoRatio['4'].resolution;
  } else if (num <= 16 && num >= 13) {
    return videoRatio['3'].resolution;
  } else {
    return videoRatio['5'].resolution;
  }
}
/**
 * 获取全局配置
 * @param {*} key 
 */

function getGlobalCache(key) {
  const strS = localStorage.getItem('PY_PLUS');
  let playerOptions = null;

  try {
    playerOptions = JSON.parse(strS);
  } catch (error) {
    console.error('播放配置出错，请检查浏览器本地存储PY_PLUS！');
    return '';
  }

  return playerOptions ? playerOptions[key] : '';
}
function BASE64(input) {
  // private property  
  let _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  function _utf8_encode(string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode(c >> 6 | 192);
        utftext += String.fromCharCode(c & 63 | 128);
      } else {
        utftext += String.fromCharCode(c >> 12 | 224);
        utftext += String.fromCharCode(c >> 6 & 63 | 128);
        utftext += String.fromCharCode(c & 63 | 128);
      }
    }

    return utftext;
  } // public method for encoding  


  var output = "";
  var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  var i = 0;
  input = _utf8_encode(input);

  while (i < input.length) {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);
    enc1 = chr1 >> 2;
    enc2 = (chr1 & 3) << 4 | chr2 >> 4;
    enc3 = (chr2 & 15) << 2 | chr3 >> 6;
    enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
  }

  return output;
}
function unicodeToBase64(s) {
  if (window.btoa) {
    return window.btoa(s);
  } else {
    return BASE64(s);
  }
}
/**
 * 随机获取端口号
 * @returns 
 */

function getLocalPort() {
  return LOCAL_PORT[Math.floor(Math.random() * LOCAL_PORT.length)];
}
/**
 * 获取系统版本
 * @returns 
 */

function getAppPlayerVersion() {
  return sessionStorage.getItem('_APP_PLAY_VERSION');
}
/**
 * 通过本地存储进行播放类型检测
 * @returns 
 */

function detectorPlayeMode() {
  const isPlus = getGlobalCache('mode');
  sessionStorage.setItem('_TEMP_PLAY_MODE', isPlus); // 是否本地插件播放 0是互联网模式，不走插件

  return isPlus;
}
/**
 * 解析本地是否安装
 */

function installState(callback) {
  // 进行类型检测 是否插件模式
  if (!detectorPlayeMode()) return;
  if (sessionStorage.getItem('_TEMP_PLAY_CODE') == '10000') return; // 进行本地检测

  const port = getLocalPort();
  httpx.get(`${hostUrl}:${port}/video/v1/state`, function (respondData) {
    let res = {};

    try {
      res = JSON.parse(respondData);

      if (res.code == 200) {
        sessionStorage.setItem('_TEMP_PLAY_VERSION', res.version);

        if (getAppPlayerVersion() != res.version) {
          sessionStorage.setItem('_TEMP_PLAY_CODE', '10001');
          throw `检测到版本${res.version}与应用系统版本不匹配，请检查`;
        } else {
          sessionStorage.setItem('_TEMP_PLAY_CODE', '10000');
        }
      } else {
        sessionStorage.setItem('_TEMP_PLAY_CODE', '10002');
        throw res.message || '';
      }
    } catch (err) {
      console.log('插件初始化失败，请联系管理员！' + err);
    }

    callback && callback();
  }, function (method, url) {
    console.log('未安装插件！！！');
    sessionStorage.setItem('_TEMP_PLAY_CODE', '');
  });
}
/**
 * 客户端插件访问入口
 * @param {*} url 
 * @param {*} resolution 
 * @param {*} onToken 
 * @returns 
 */

function tansCodingToUrl(player, onToken) {
  var _unicodeToBase, _unicodeToBase$replac, _unicodeToBase$replac2;

  let param1 = '';
  let param2 = '';
  let param3 = '';
  let param4 = '';
  let {
    file,
    resolution,
    deviceInfo
  } = player;
  const key = genuuid(); // 进行类型检测 是否插件模式

  if (!detectorPlayeMode()) return file; // 是否加密

  file = file + getGlobalCache(GL_CACHE.DM);
  const url_info = {
    port: getLocalPort(),
    pull_uri: (_unicodeToBase = unicodeToBase64(file)) === null || _unicodeToBase === void 0 ? void 0 : (_unicodeToBase$replac = _unicodeToBase.replaceAll('=', '')) === null || _unicodeToBase$replac === void 0 ? void 0 : (_unicodeToBase$replac2 = _unicodeToBase$replac.replaceAll('/', '_')) === null || _unicodeToBase$replac2 === void 0 ? void 0 : _unicodeToBase$replac2.replaceAll('+', '-')
  }; // 分辨率，如果为空，为原始分辨率

  if (resolution) {
    param1 = '&resolution=' + resolution;
  }

  param2 = '&token=' + key; // 免责工具使用

  onToken && onToken(key);

  if (resolution) {
    param1 = '&resolution=' + resolution; // 码率

    param3 = '&bitrate=' + findVideoAttribute(resolution, 'bitrate');
  } // value: "100602", label: "球机"


  if (deviceInfo && deviceInfo.type == "100602") {
    param4 = '&quickplay=0';
  }

  console.log(file + param1 + param3 + param4);
  return lcStore$1.getTranscodingStream.value.replace('<pull_uri>', url_info.pull_uri).replace('<port>', url_info.port) + param1 + param2 + param3 + param4;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function IconFont({
  type,
  className = '',
  ...props
}) {
  return /*#__PURE__*/React.createElement("i", _extends({
    className: `lm-player-iconfont ${type} ${className}`
  }, props));
}
IconFont.propTypes = {
  type: PropTypes.string,
  className: PropTypes.string
};

class Slider extends React.Component {
  constructor(props) {
    super(props);

    this.renderSliderTips = e => {
      const {
        renderTips
      } = this.props;

      if (!renderTips) {
        return;
      }

      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        const {
          x,
          width,
          top
        } = this.layoutDom.getBoundingClientRect();
        const tipsX = e.pageX - x;
        let percent = (e.pageX - x) / width;
        percent = percent < 0 ? 0 : percent > 1 ? 1 : percent;
        this.setState({
          tipsX,
          tipsY: top,
          showTips: true,
          tempValue: percent
        });
      }, 200);
    };

    this.hideSliderTips = () => {
      clearTimeout(this.timer);
      this.setState({
        showTips: false
      });
    };

    this.cancelPropagation = e => {
      e.stopPropagation();
    };

    this.startDrag = e => {
      e.stopPropagation();
      this.dragFlag = true;
      document.body.addEventListener('mousemove', this.moveChange);
      document.body.addEventListener('mouseup', this.stopDrag);
    };

    this.moveChange = e => {
      e.stopPropagation();
      const percent = this.computedPositionForEvent(e);
      this.setState({
        value: percent
      });
    };

    this.stopDrag = e => {
      e.stopPropagation();
      document.body.removeEventListener('mousemove', this.moveChange);
      document.body.removeEventListener('mouseup', this.stopDrag);
      this.dragFlag = false;
      let percent = this.state.value / 100;
      percent = percent < 0 ? 0 : percent > 1 ? 1 : percent;
      this.props.onChange && this.props.onChange(percent);
    };

    this.changeCurrentValue = event => {
      event.stopPropagation();
      const {
        width,
        x
      } = this.layoutDom.getBoundingClientRect();
      let percent = (event.pageX - x) / width;
      this.props.onChange && this.props.onChange(percent);
    };

    this.sliderDomRef = /*#__PURE__*/React.createRef();
    this.layoutDom = null;
    this.lineDom = null;
    this.dragDom = null;
    this.dragFlag = false;
    this.state = {
      value: this.props.currentPercent || 0,
      tempValue: 0,
      showTips: false,
      tipsX: 0,
      tipsY: 0
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!this.dragFlag) {
      this.setState({
        value: nextProps.currentPercent || 0
      });
    }
  }

  componentDidMount() {
    this.layoutDom = this.sliderDomRef.current;
    this.dragDom = this.layoutDom.querySelector('.drag-change-icon');
    this.lineDom = this.layoutDom.querySelector('.slider-content');
    this.layoutDom.addEventListener('mousemove', this.renderSliderTips, false);
    this.layoutDom.addEventListener('mouseout', this.hideSliderTips, false);
    this.lineDom.addEventListener('click', this.changeCurrentValue, false);
    this.dragDom.addEventListener('click', this.cancelPropagation, false);
    this.dragDom.addEventListener('mousedown', this.startDrag, false);
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
    this.layoutDom.removeEventListener('mousemove', this.renderSliderTips, false);
    this.layoutDom.removeEventListener('mouseout', this.hideSliderTips, false);
    this.lineDom.removeEventListener('click', this.changeCurrentValue, false);
    this.dragDom.removeEventListener('click', this.cancelPropagation, false);
    this.dragDom.removeEventListener('mousedown', this.startDrag, false);
    document.body.removeEventListener('mousemove', this.moveChange);
    document.body.removeEventListener('mouseup', this.stopDrag);
    this.sliderDomRef = null;
    this.layoutDom = null;
    this.lineDom = null;
    this.dragDom = null;
    this.dragFlag = null;
  }

  computedPositionForEvent(e) {
    const {
      x,
      width
    } = this.layoutDom.getBoundingClientRect();
    const {
      pageX
    } = e;
    let dx = pageX - x;

    if (dx > width) {
      dx = width;
    }

    if (dx < 0) {
      dx = 0;
    }

    return dx / width * 100;
  }

  render() {
    const {
      value,
      showTips,
      tipsX
    } = this.state;
    const {
      availablePercent = 0,
      className = '',
      tipsY
    } = this.props;
    return /*#__PURE__*/React.createElement("div", {
      className: `slider-layout ${className}`,
      ref: this.sliderDomRef
    }, /*#__PURE__*/React.createElement("div", {
      className: "slider-content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "slider-max-line"
    }), /*#__PURE__*/React.createElement("div", {
      className: "slider-visibel-line",
      style: {
        width: `${availablePercent}%`
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "slider-current-line",
      style: {
        width: `${value}%`
      }
    }), this.props.children), /*#__PURE__*/React.createElement("div", {
      className: "slider-other-content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "drag-change-icon",
      draggable: false,
      style: {
        left: `${value}%`
      }
    })), /*#__PURE__*/React.createElement(Tips, {
      visibel: showTips,
      className: "lm-player-slide-tips",
      style: {
        left: tipsX,
        top: tipsY
      },
      getContainer: () => this.sliderDomRef.current
    }, this.props.renderTips && this.props.renderTips(this.state.tempValue)));
  }

}

Slider.propTypes = {
  currentPercent: PropTypes.number,
  seekTo: PropTypes.func,
  video: PropTypes.element,
  renderTips: PropTypes.func,
  availablePercent: PropTypes.number,
  onChange: PropTypes.func,
  children: PropTypes.any,
  className: PropTypes.string,
  tipsY: PropTypes.number
};
Slider.defaultProps = {
  tipsY: -10
};

function Tips({
  getContainer,
  visibel,
  children,
  style,
  className = ''
}) {
  const ele = useRef(document.createElement('div'));
  useEffect(() => {
    const box = getContainer ? getContainer() || document.body : document.body;
    box.appendChild(ele.current);
    return () => box.removeChild(ele.current);
  }, [getContainer]);

  if (!visibel) {
    return null;
  }

  return /*#__PURE__*/ReactDOM.createPortal( /*#__PURE__*/React.createElement("div", {
    className: className,
    style: style
  }, children), ele.current);
}

Tips.propTypes = {
  visibel: PropTypes.bool,
  children: PropTypes.element,
  style: PropTypes.any,
  className: PropTypes.string
};

function Bar({
  visibel = true,
  className = '',
  children,
  ...props
}) {
  if (visibel === false) {
    return null;
  }

  return /*#__PURE__*/React.createElement("span", _extends({
    className: `contraller-bar-item ${className}`
  }, props), children);
}
Bar.propTypes = {
  visibel: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.any
};

var EventName = {
  RELOAD: "reload",
  //手动视频重载
  RELOAD_FAIL: "reloadFail",
  // 视频出错，重连失败
  RELOAD_SUCCESS: "reloadSuccess",
  //视频出错，重连成功
  ERROR: "error",
  //视频出错
  ERROR_RELOAD: "errorRload",
  //视频出错，自动重连
  HISTORY_PLAY_END: "historyPlayEnd",
  //历史视频列表播放结束
  SEEK: "seek",
  //跳跃播放时间
  TRANSFORM: "transform",
  //视频容器缩放
  CHANGE_PLAY_INDEX: "changePlayIndex",
  //历史视频列表播放索引改变
  HIDE_CONTRALLER: "hideContraller",
  SHOW_CONTRALLER: "showContraller",
  CLEAR_ERROR_TIMER: "clearErrorTimer"
};

function LeftBar({
  api,
  event,
  video,
  isHistory,
  reloadHistory,
  isLive,
  leftExtContents,
  leftMidExtContents
}) {
  const [openSliderVolume, setOpenSliderVolume] = useState(false);
  const [dep, setDep] = useState(Date.now());
  useEffect(() => {
    const updateRender = () => {
      setDep(Date.now());
    };

    event.addEventListener('play', updateRender);
    event.addEventListener('pause', updateRender);
    event.addEventListener('volumechange', updateRender);
    return () => {
      event.removeEventListener('play', updateRender);
      event.removeEventListener('pause', updateRender);
      event.removeEventListener('volumechange', updateRender);
    };
  }, [event]); //缓存值

  const paused = useMemo(() => video.paused, [dep, video]);
  const statusIconClassName = useMemo(() => paused ? 'lm-player-Play_Main' : 'lm-player-Pause_Main', [paused]);
  const statusText = useMemo(() => paused ? '播放' : '暂停', [paused]);
  const volumeVal = useMemo(() => video.muted ? 0 : video.volume, [dep, video]);
  const volumeIcon = useMemo(() => volumeVal === 0 ? 'lm-player-volume-close' : video.volume === 1 ? 'lm-player-volume-max' : 'lm-player-volume-normal-fuben', [volumeVal]);
  const volumePercent = useMemo(() => volumeVal === 0 ? 0 : volumeVal * 100, [volumeVal]);
  const sliderClassName = useMemo(() => openSliderVolume ? 'contraller-bar-hover-volume' : '', [openSliderVolume]); //TODO 方法

  const changePlayStatus = useCallback(() => video.paused ? api.play() : api.pause(), [video, api]);
  const mutedChantgeStatus = useCallback(() => video.muted ? api.unmute() : api.mute(), [api, video]);
  const onChangeVolume = useCallback(volume => {
    api.setVolume(parseFloat(volume.toFixed(1)));
    volume > 0 && video.muted && api.unmute();
  }, [api, video]);
  const reload = useCallback(() => {
    isHistory ? reloadHistory() : api.reload();
    event.emit(EventName.CLEAR_ERROR_TIMER);
  }, [event, isHistory, api]);
  return /*#__PURE__*/React.createElement("div", {
    className: "contraller-left-bar"
  }, leftExtContents, /*#__PURE__*/React.createElement(Bar, {
    visibel: !isLive
  }, /*#__PURE__*/React.createElement(IconFont, {
    onClick: changePlayStatus,
    type: statusIconClassName,
    title: statusText
  })), /*#__PURE__*/React.createElement(Bar, {
    className: `contraller-bar-volume ${sliderClassName}`,
    onMouseOver: () => setOpenSliderVolume(true),
    onMouseOut: () => setOpenSliderVolume(false)
  }, /*#__PURE__*/React.createElement(IconFont, {
    onClick: mutedChantgeStatus,
    type: volumeIcon,
    title: "\u97F3\u91CF"
  }), /*#__PURE__*/React.createElement("div", {
    className: "volume-slider-layout"
  }, /*#__PURE__*/React.createElement(Slider, {
    className: "volume-slider",
    currentPercent: volumePercent,
    onChange: onChangeVolume,
    renderTips: precent => /*#__PURE__*/React.createElement("span", null, Math.round(precent * 100), "%"),
    tipsY: -2
  }))), /*#__PURE__*/React.createElement(Bar, null, /*#__PURE__*/React.createElement(IconFont, {
    onClick: reload,
    type: "lm-player-Refresh_Main",
    title: "\u91CD\u8F7D"
  })), leftMidExtContents);
}

LeftBar.propTypes = {
  api: PropTypes.object,
  event: PropTypes.object,
  playerProps: PropTypes.object,
  video: PropTypes.node,
  reloadHistory: PropTypes.func,
  isHistory: PropTypes.bool
};

function ColorPicker({
  playContainer,
  api,
  colorfilter
}) {
  const [brightnessValue, setBrightnessValue] = useState(50);
  const [contrastValue, setContrastValue] = useState(50);
  const [saturateValue, setSaturateValue] = useState(50);
  const [hueValue, setHueValue] = useState(0);
  const brightness = useMemo(() => {
    const cv = brightnessValue / 50;
    if (cv == 1) return '';
    return `brightness(${cv})`;
  }, [brightnessValue]);
  const contrast = useMemo(() => {
    const cv = contrastValue / 50;
    if (cv == 1) return '';
    return `contrast(${cv})`;
  }, [contrastValue]);
  const saturate = useMemo(() => {
    const cv = saturateValue / 50;
    if (cv == 1) return '';
    return `saturate(${cv})`;
  }, [saturateValue]);
  const hue = useMemo(() => {
    const cv = hueValue;
    if (cv == 0) return '';
    return `hue-rotate(${cv}deg)`;
  }, [hueValue]);

  const handleAllChange = data => {
    colorfilter({
      '-webkit-filter': `${brightness} ${contrast} ${saturate} ${hue}`
    });
  };

  const handleBrightnessChange = data => {
    setBrightnessValue(data);
    handleAllChange();
  };

  const handleContrastChange = data => {
    setContrastValue(data);
    handleAllChange();
  };

  const handleSaturateChange = data => {
    setSaturateValue(data);
    handleAllChange();
  };

  const handleHueChange = data => {
    setHueValue(data);
    handleAllChange();
  };

  const handleResetChange = data => {
    setBrightnessValue(50);
    setContrastValue(50);
    setSaturateValue(50);
    setHueValue(0);
    colorfilter({});
  };

  return /*#__PURE__*/React.createElement(Bar, {
    className: 'colorPicker'
  }, /*#__PURE__*/React.createElement(IconFont, {
    title: '画面设置',
    type: 'lm-player-S_Device_shezhi'
  }), /*#__PURE__*/React.createElement("div", {
    class: "colorPicker-container"
  }, /*#__PURE__*/React.createElement("span", null, " \u89C6\u9891\u753B\u9762\u8BBE\u7F6E "), " ", /*#__PURE__*/React.createElement("span", {
    className: "colorPicker-reset",
    onClick: handleResetChange
  }, "\xA0", /*#__PURE__*/React.createElement(IconFont, {
    title: '重置',
    type: 'lm-player-Refresh_Main'
  }), "\u91CD\u7F6E "), /*#__PURE__*/React.createElement("div", {
    className: "colorPicker-container-control"
  }, /*#__PURE__*/React.createElement("span", null, " \u4EAE\u5EA6 "), " ", /*#__PURE__*/React.createElement(Slider$1, {
    min: 0,
    max: 100,
    onChange: handleBrightnessChange,
    value: brightnessValue
  }), /*#__PURE__*/React.createElement("span", null, " ", brightnessValue, " ")), /*#__PURE__*/React.createElement("div", {
    className: "colorPicker-container-control"
  }, /*#__PURE__*/React.createElement("span", null, " \u5BF9\u6BD4\u5EA6 "), " ", /*#__PURE__*/React.createElement(Slider$1, {
    min: 0,
    max: 100,
    onChange: handleContrastChange,
    value: contrastValue
  }), /*#__PURE__*/React.createElement("span", null, " ", contrastValue, " ")), /*#__PURE__*/React.createElement("div", {
    className: "colorPicker-container-control"
  }, /*#__PURE__*/React.createElement("span", null, " \u9971\u548C\u5EA6 "), " ", /*#__PURE__*/React.createElement(Slider$1, {
    min: 0,
    max: 100,
    onChange: handleSaturateChange,
    value: saturateValue
  }), /*#__PURE__*/React.createElement("span", null, " ", saturateValue, " ")), /*#__PURE__*/React.createElement("div", {
    className: "colorPicker-container-control hue-horizontal"
  }, /*#__PURE__*/React.createElement("span", null, " \u8272\u8C03 "), " ", /*#__PURE__*/React.createElement(Slider$1, {
    min: 0,
    max: 360,
    onChange: handleHueChange,
    value: hueValue
  }), /*#__PURE__*/React.createElement("span", null, " ", hueValue, " "))));
}

function RightBar({
  playContainer,
  api,
  scale,
  snapshot,
  rightExtContents,
  rightMidExtContents,
  isLive,
  switchResolution,
  colorPicker
}) {
  const [dep, setDep] = useState(Date.now()); // 获取视频分辨率

  const ratioValue = getVideoRatio(); // 默认

  const [viewText, setViewText] = useState(findVideoAttribute(api.getResolution(), 'name'));
  const isPalette = getGlobalCache(GL_CACHE.PT) || false;
  const isSwithRate = getGlobalCache(GL_CACHE.SR) || false;
  useEffect(() => {
    const update = () => setDep(Date.now());

    fullScreenListener(true, update);
    return () => fullScreenListener(false, update);
  }, []);
  const isfull = useMemo(() => isFullscreen(playContainer), [dep, playContainer]);
  const fullscreen = useCallback(() => {
    const isFullScreen = !isFullscreen(playContainer);

    if (isFullScreen) {
      api.requestFullScreen();
      switchResolution('');
      setViewText(findVideoAttribute('', 'name'));
    } else {
      api.cancelFullScreen();
      switchResolution(getScreenRate(api.getCurrentScreen()));
      setViewText(findVideoAttribute(getScreenRate(api.getCurrentScreen()), 'name'));
    } // 设置对应的分辨率名称


    setDep(Date.now());
  }, [api, playContainer]);
  const setScale = useCallback((...args) => {
    const dragDom = playContainer.querySelector('.player-mask-layout');
    api.setScale(...args);
    let position = computedBound(dragDom, api.getPosition(), api.getScale());

    if (position) {
      api.setPosition(position, true);
    }
  }, [api, playContainer]);
  const setRatio = useCallback((...args) => {
    setViewText(ratioValue[args].name);
    switchResolution(ratioValue[args].resolution);
  }, [api]);
  return /*#__PURE__*/React.createElement("div", {
    className: "contraller-right-bar"
  }, rightMidExtContents, scale && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Bar, null, /*#__PURE__*/React.createElement(IconFont, {
    title: "\u7F29\u5C0F",
    onClick: () => setScale(-0.2),
    type: 'lm-player-ZoomOut_Main'
  })), /*#__PURE__*/React.createElement(Bar, null, /*#__PURE__*/React.createElement(IconFont, {
    title: "\u590D\u4F4D",
    onClick: () => setScale(1, true),
    type: 'lm-player-ZoomDefault_Main'
  })), /*#__PURE__*/React.createElement(Bar, null, /*#__PURE__*/React.createElement(IconFont, {
    title: "\u653E\u5927",
    onClick: () => setScale(0.2),
    type: 'lm-player-ZoomIn_Main'
  }))), isPalette && /*#__PURE__*/React.createElement(ColorPicker, {
    colorfilter: colorPicker
  }), isLive && isSwithRate && /*#__PURE__*/React.createElement(Bar, {
    className: 'resolution-menu'
  }, /*#__PURE__*/React.createElement("span", {
    class: "resolution-menu-main"
  }, viewText), /*#__PURE__*/React.createElement("ul", {
    class: "resolution-menu-level"
  }, Object.keys(ratioValue).map(item => ratioValue[item].show && /*#__PURE__*/React.createElement("li", {
    class: "resolution-menu-level-1",
    onClick: () => setRatio(item)
  }, ratioValue[item].name)))), snapshot && /*#__PURE__*/React.createElement(Bar, null, /*#__PURE__*/React.createElement(IconFont, {
    title: "\u622A\u56FE",
    onClick: () => snapshot(api.snapshot()),
    type: "lm-player-SearchBox"
  })), /*#__PURE__*/React.createElement(Bar, null, /*#__PURE__*/React.createElement(IconFont, {
    title: isfull ? '窗口' : '全屏',
    onClick: fullscreen,
    type: isfull ? 'lm-player-ExitFull_Main' : 'lm-player-Full_Main'
  })), rightExtContents);
}

RightBar.propTypes = {
  api: PropTypes.object,
  event: PropTypes.object,
  playerProps: PropTypes.object,
  playContainer: PropTypes.node,
  reloadHistory: PropTypes.func,
  isHistory: PropTypes.bool
};

function ScaleBar({
  playContainer,
  api,
  scale
}) {
  const setScale = useCallback((...args) => {
    const dragDom = playContainer.querySelector('.player-mask-layout');
    api.setScale(...args);
    let position = computedBound(dragDom, api.getPosition(), api.getScale());

    if (position) {
      api.setPosition(position, true);
    }
  }, [api, playContainer]);
  return /*#__PURE__*/React.createElement("div", {
    className: "contraller-scale-bar"
  }, scale && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Bar, null, /*#__PURE__*/React.createElement(IconFont, {
    title: "\u7F29\u5C0F",
    onClick: () => setScale(-0.2),
    type: 'lm-player-ZoomOut_Main'
  })), /*#__PURE__*/React.createElement(Bar, null, /*#__PURE__*/React.createElement(IconFont, {
    title: "\u590D\u4F4D",
    onClick: () => setScale(1, true),
    type: 'lm-player-ZoomDefault_Main'
  })), /*#__PURE__*/React.createElement(Bar, null, /*#__PURE__*/React.createElement(IconFont, {
    title: "\u653E\u5927",
    onClick: () => setScale(0.2),
    type: 'lm-player-ZoomIn_Main'
  }))));
}

function ContrallerBar({
  playContainer,
  snapshot,
  switchResolution,
  rightExtContents,
  rightMidExtContents,
  scale,
  visibel,
  api,
  event,
  video,
  isHistory,
  reloadHistory,
  isLive,
  leftExtContents,
  leftMidExtContents,
  colorPicker
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: `contraller-bar-layout ${!visibel ? 'hide-contraller-bar' : ''}`
  }, /*#__PURE__*/React.createElement(LeftBar, {
    api: api,
    event: event,
    video: video,
    isHistory: isHistory,
    reloadHistory: reloadHistory,
    isLive: isLive,
    leftMidExtContents: leftMidExtContents,
    leftExtContents: leftExtContents
  }), /*#__PURE__*/React.createElement(RightBar, {
    api: api,
    event: event,
    isLive: isLive,
    playContainer: playContainer,
    snapshot: snapshot,
    colorPicker: colorPicker,
    switchResolution: switchResolution,
    rightExtContents: rightExtContents,
    rightMidExtContents: rightMidExtContents
  })), /*#__PURE__*/React.createElement("div", {
    className: `contraller-scale-layout ${!visibel ? 'hide-contraller-bar' : ''}`
  }, /*#__PURE__*/React.createElement(ScaleBar, {
    api: api,
    playContainer: playContainer,
    scale: scale
  })));
}

ContrallerBar.propTypes = {
  visibel: PropTypes.bool
};

function ContrallerEvent({
  event,
  playContainer,
  children
}) {
  const timer = useRef(null);
  const [visibel, setVisibel] = useState(true);
  useEffect(() => {
    const showContraller = () => {
      setVisibel(true);
      hideContraller();
      event.emit(EventName.SHOW_CONTRALLER);
    };

    const hideContraller = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setVisibel(false);
        event.emit(EventName.HIDE_CONTRALLER);
      }, 3 * 1000);
    };

    playContainer.addEventListener('mousemove', showContraller, false);
    playContainer.addEventListener('mouseout', hideContraller, false);
    return () => {
      playContainer.removeEventListener('mousemove', showContraller, false);
      playContainer.removeEventListener('mouseout', hideContraller, false);
    };
  }, []);
  return React.Children.map(children, child => /*#__PURE__*/React.isValidElement(child) ? /*#__PURE__*/React.cloneElement(child, {
    visibel
  }) : child);
}

function VideoMessage({
  event,
  api
}) {
  const [state, setState] = useState({
    status: null,
    errorTimer: null,
    loading: false
  });
  const message = useMemo(() => {
    if (!state.status) {
      return '';
    }

    if (state.status === 'fail') {
      return '视频错误';
    }

    if (state.status === 'reload') {
      if (!state.errorTimer) {
        return `视频加载错误，正在进行重连...`;
      }

      return `视频加载错误，正在进行重连第${state.errorTimer}次重连`;
    }
  }, [state.errorTimer, state.status]);
  useEffect(() => {
    const openStartLoading = () => setState(old => ({ ...old,
      loading: true
    }));

    const openWaitLoading = () => setState(old => ({ ...old
    }));

    const openSeekLoading = () => setState(old => ({ ...old,
      loading: true
    }));

    const closeLoading = () => setState(old => ({ ...old,
      loading: false
    }));

    const errorReload = timer => setState(() => ({
      status: 'reload',
      errorTimer: timer,
      loading: true
    }));

    const reloadFail = () => setState(old => ({ ...old,
      status: 'fail',
      loading: false
    }));

    const reloadSuccess = () => setState(old => ({ ...old,
      status: null,
      loading: false
    }));

    const reload = () => setState(old => ({ ...old,
      status: 'reload',
      loading: true
    }));

    const playEnd = () => (setState(old => ({ ...old,
      status: null,
      loading: false
    })), api.pause());

    event.addEventListener('loadstart', openStartLoading);
    event.addEventListener('waiting', openWaitLoading);
    event.addEventListener('seeking', openSeekLoading);
    event.addEventListener('loadeddata', closeLoading);
    event.addEventListener('canplay', closeLoading);
    event.on(EventName.ERROR_RELOAD, errorReload);
    event.on(EventName.RELOAD_FAIL, reloadFail);
    event.on(EventName.RELOAD_SUCCESS, reloadSuccess);
    event.on(EventName.RELOAD, reload);
    event.on(EventName.HISTORY_PLAY_END, playEnd);
    event.on(EventName.CLEAR_ERROR_TIMER, reloadSuccess);
    return () => {
      event.removeEventListener('loadstart', openStartLoading);
      event.removeEventListener('waiting', openWaitLoading);
      event.removeEventListener('seeking', openSeekLoading);
      event.removeEventListener('loadeddata', closeLoading);
      event.removeEventListener('canplay', closeLoading);
      event.off(EventName.ERROR_RELOAD, errorReload);
      event.off(EventName.RELOAD_FAIL, reloadFail);
      event.off(EventName.RELOAD_SUCCESS, reloadSuccess);
      event.off(EventName.RELOAD, reload);
      event.off(EventName.HISTORY_PLAY_END, playEnd);
      event.off(EventName.CLEAR_ERROR_TIMER, reloadSuccess);
    };
  }, [event]);
  const {
    loading,
    status
  } = state;
  return /*#__PURE__*/React.createElement("div", {
    className: `lm-player-message-mask ${loading || status === 'fail' ? 'lm-player-mask-loading-animation' : ''}`
  }, /*#__PURE__*/React.createElement(IconFont, {
    type: status === 'fail' ? 'lm-player-YesorNo_No_Dark' : 'lm-player-Loading',
    className: `${loading && status !== 'fail' ? 'lm-player-loading-animation' : status === 'fail' ? 'lm-player-loadfail' : ''} lm-player-loading-icon`
  }), /*#__PURE__*/React.createElement("span", {
    className: "lm-player-message"
  }, message), /*#__PURE__*/React.createElement("div", null));
}

const NoSource = ({
  install
}) => {
  var _window$BSConfig;

  const isPlus = sessionStorage.getItem('_TEMP_PLAY_CODE'); // const _TEMP_PLAY_PATH = sessionStorage.getItem('_TEMP_PLAY_PATH')

  const _TEMP_PLAY_PATH = ((_window$BSConfig = window.BSConfig) === null || _window$BSConfig === void 0 ? void 0 : _window$BSConfig.playerDownloadUrl) || localStorage.getItem('ZVPlayerUrl');

  return /*#__PURE__*/React.createElement("div", {
    className: "lm-player-message-mask lm-player-mask-loading-animation"
  }, /*#__PURE__*/React.createElement(IconFont, {
    style: {
      fontSize: 80
    },
    type: "lm-player-PlaySource",
    title: "\u8BF7\u9009\u62E9\u89C6\u9891\u6E90"
  }), !isPlus && /*#__PURE__*/React.createElement("a", {
    className: "lm-player-message",
    target: "_blank",
    href: _TEMP_PLAY_PATH,
    style: {
      pointerEvents: 'all',
      textDecoration: 'none'
    },
    download: "ZVPlayer.exe",
    rel: "noopener noreferrer"
  }, "\u8BF7", /*#__PURE__*/React.createElement("span", {
    className: "install-link"
  }, "\u4E0B\u8F7D"), "\u64AD\u653E\u63D2\u4EF6"), isPlus == '10001' && /*#__PURE__*/React.createElement("a", {
    className: "lm-player-message",
    target: "_blank",
    href: _TEMP_PLAY_PATH,
    style: {
      pointerEvents: 'all',
      textDecoration: 'none'
    },
    download: "ZVPlayer.exe",
    rel: "noopener noreferrer"
  }, "\u5F53\u524D\u64AD\u653E\u63D2\u4EF6\u7248\u672C\u4F4E\uFF0C\u5EFA\u8BAE\u4F60\u5347\u7EA7\u6700\u65B0\u7248\u672C", /*#__PURE__*/React.createElement("span", {
    className: "install-link"
  }, sessionStorage.getItem('_APP_PLAY_VERSION'))));
};

function TineLine$1({
  event,
  api,
  visibel
}) {
  const [state, setState] = useState({
    duration: 0,
    currentTime: 0,
    buffered: 0
  });
  useEffect(() => {
    const getDuration = () => setState(old => ({ ...old,
      duration: api.getDuration()
    }));

    const getCurrentTime = () => setState(old => ({ ...old,
      currentTime: api.getCurrentTime(),
      buffered: api.getSecondsLoaded()
    }));

    const getBuffered = () => setState(old => ({ ...old,
      buffered: api.getSecondsLoaded()
    }));

    const seekendPlay = () => api.play();

    event.addEventListener('loadedmetadata', getDuration);
    event.addEventListener('durationchange', getDuration);
    event.addEventListener('timeupdate', getCurrentTime);
    event.addEventListener('progress', getBuffered);
    event.addEventListener('suspend', getBuffered);
    event.addEventListener('seeked', seekendPlay);
    return () => {
      event.removeEventListener('loadedmetadata', getDuration);
      event.removeEventListener('durationchange', getDuration);
      event.removeEventListener('timeupdate', getCurrentTime);
      event.removeEventListener('progress', getBuffered);
      event.removeEventListener('suspend', getBuffered);
      event.removeEventListener('seeked', seekendPlay);
    };
  }, [event, api]);
  const {
    duration,
    currentTime,
    buffered
  } = state;
  const playPercent = useMemo(() => Math.round(currentTime / duration * 100), [currentTime, duration]);
  const bufferedPercent = useMemo(() => Math.round(buffered / duration * 100), [buffered, duration]);
  const changePlayTime = useCallback(percent => {
    const currentTime = percent * duration;
    api.pause();
    api.seekTo(currentTime);
    setState(old => ({ ...old,
      currentTime
    }));
  }, [duration, api]);

  const renderTimeLineTips = percent => {
    const currentTime = percent * duration;
    const time = timeStamp(currentTime);
    return /*#__PURE__*/React.createElement("span", null, time);
  };

  return /*#__PURE__*/React.createElement("div", {
    className: `video-time-line-layout ${!visibel ? 'hide-time-line' : ''}`
  }, /*#__PURE__*/React.createElement(IconFont, {
    type: "lm-player-PrevFast",
    onClick: () => api.backWind(),
    className: "time-line-action-item"
  }), /*#__PURE__*/React.createElement(Slider, {
    className: "time-line-box",
    currentPercent: playPercent,
    availablePercent: bufferedPercent,
    onChange: changePlayTime,
    renderTips: renderTimeLineTips
  }), /*#__PURE__*/React.createElement(IconFont, {
    type: "lm-player-NextFast_Light",
    onClick: () => api.fastForward(),
    className: "time-line-action-item"
  }));
}

function ErrorEvent({
  event,
  api,
  errorReloadTimer,
  flv,
  hls,
  changePlayIndex,
  isHistory,
  playIndex
}) {
  const [errorTimer, setErrorTime] = useState(0);
  const errorInfo = useRef(null);
  const reloadTimer = useRef(null);
  useEffect(() => {
    const errorHandle = (...args) => {
      if (args[2] && args[2].msg && args[2].msg.includes('Unsupported audio')) {
        return;
      }

      if (args[1] && args[1].details && (args[1].details.includes("bufferStalledError") || args[1].details.includes("bufferNudgeOnStall") || args[1].details.includes("bufferSeekOverHole") || args[1].details.includes("bufferAddCodecError"))) {
        return;
      }

      console.error(...args);
      errorInfo.current = args;
      setErrorTime(errorTimer + 1);
    };

    const reloadSuccess = () => {
      if (errorTimer > 0) {
        console.warn('视频重连成功！');
        event.emit(EventName.RELOAD_SUCCESS);
        api.success();
        clearErrorTimer();
      }
    };

    const clearErrorTimer = () => setErrorTime(0);

    try {
      if (flv) {
        flv.on('error', errorHandle);
      }

      if (hls) {
        hls.on('hlsError', errorHandle);
      }
    } catch (e) {//
    }

    if (isHistory) {
      //历史视频切换播放索引时清除错误次数
      event.on(EventName.CHANGE_PLAY_INDEX, clearErrorTimer); //历史视频主动清除错误次数

      event.on(EventName.CLEAR_ERROR_TIMER, clearErrorTimer);
    }

    event.addEventListener('error', errorHandle, false); //获取video状态清除错误状态

    event.addEventListener('canplay', reloadSuccess, false);
    return () => {
      try {
        if (flv) {
          flv.off('error', errorHandle);
        }

        if (hls) {
          hls.off('hlsError', errorHandle);
        }
      } catch (e) {
        console.warn(e);
      }

      if (isHistory) {
        event.off(EventName.CHANGE_PLAY_INDEX, clearErrorTimer);
        event.off(EventName.CLEAR_ERROR_TIMER, clearErrorTimer);
      }

      event.removeEventListener('error', errorHandle, false);
      event.removeEventListener('canplay', reloadSuccess, false);
    };
  }, [event, flv, hls, errorTimer]);
  useEffect(() => {
    if (errorTimer === 0) {
      return;
    }

    if (errorTimer > errorReloadTimer) {
      isHistory ? changePlayIndex(playIndex + 1) : event.emit(EventName.RELOAD_FAIL);
      api.unload();
      return;
    }

    console.warn(`视频播放出错，正在进行重连${errorTimer}`);
    reloadTimer.current = setTimeout(() => {
      event.emit(EventName.ERROR_RELOAD, errorTimer, ...errorInfo.current);
      api.reload(true);
    }, 2 * 1000);
    return () => {
      clearTimeout(reloadTimer.current);
    };
  }, [errorTimer, api, event, flv, hls]);
  return /*#__PURE__*/React.createElement(React.Fragment, null);
}

class DragEvent extends React.Component {
  constructor(props) {
    super(props);

    this.openDrag = e => {
      this.position.start = [e.pageX, e.pageY];
      this.dragDom.addEventListener('mousemove', this.moveChange);
      document.body.addEventListener('mouseup', this.stopDrag);
    };

    this.moveChange = e => {
      const {
        api
      } = this.props;
      const currentPosition = api.getPosition();
      this.position.end = [e.pageX, e.pageY];
      const x = currentPosition[0] + (this.position.end[0] - this.position.start[0]);
      const y = currentPosition[1] + (this.position.end[1] - this.position.start[1]);
      const position = [x, y];
      api.setPosition(position);
      this.position.start = [e.pageX, e.pageY];
    };

    this.stopDrag = () => {
      this.dragDom.removeEventListener('mousemove', this.moveChange);
      document.body.removeEventListener('mouseup', this.stopDrag);
      this.transformChange();
    };

    this.transformChange = () => {
      const {
        api
      } = this.props;
      let position = computedBound(this.dragDom, api.getPosition(), api.getScale());
      position && api.setPosition(position, true);
    };

    const {
      playContainer
    } = props;
    this.dragDom = playContainer.querySelector('.player-mask-layout');
    this.position = {
      start: [0, 0],
      end: [0, 0]
    };
  }

  componentDidMount() {
    this.dragDom.addEventListener('mousedown', this.openDrag);
    this.props.event.addEventListener('transform', this.transformChange, true);
  }

  componentWillUnmount() {
    this.dragDom.removeEventListener('mousedown', this.openDrag);
  }

  render() {
    return null;
  }

}

DragEvent.propTypes = {
  api: PropTypes.object,
  event: PropTypes.object,
  playContainer: PropTypes.node,
  playerProps: PropTypes.object
};

class lcStoreService {
  /**
   * @desc 获取视频流接口
   */
  // uri=<pull_uri>&resolution=<resolution>&bitrate=<bitrate>&key=<key>
  getTranscodingStream(data) {}
  /**
   * 修改视频流接口
   * @param {*} data 
   */


  setStreamResolution(code) {
    // /video/v1/change?&resolution=<resolution>&bitrate=<bitrate>&key=<key>
    let url = lcStore$1.setStreamResolution.value.replace('<resolution>', code) + '&key=a123';
    JSONP(url);
  }

}

var lcStore = new lcStoreService();

let index = 0;
class Api {
  constructor({
    video,
    playContainer,
    event,
    flv,
    hls,
    resolution,
    screenNum
  }) {
    this.player = video;
    this.playContainer = playContainer;
    this.flv = flv;
    this.hls = hls;
    this.event = event;
    this.scale = 1;
    this.position = [0, 0]; // 分辨率

    this.resolution = resolution; // 分屏数 其他模式为空

    this.screenNum = screenNum || 0;
  }
  /**
   * 播放器销毁后 动态跟新api下的flv，hls对象
   * @param {*} param0
   */


  updateChunk({
    flv,
    hls
  }) {
    this.flv = flv;
    this.hls = hls;
  }
  /**
   * 全屏
   */


  requestFullScreen() {
    if (!isFullscreen(this.playContainer)) {
      fullscreen(this.playContainer);
    }
  }
  /**
   * 退出全屏
   */


  cancelFullScreen() {
    if (isFullscreen(this.playContainer)) {
      exitFullscreen();
    }
  }

  play() {
    if (this.player.paused) {
      this.player.play();
    }
  }

  pause() {
    if (!this.player.paused) {
      this.player.pause();
    }
  }

  destroy() {
    var _this$flv;

    this.player.removeAttribute('src');
    (_this$flv = this.flv) === null || _this$flv === void 0 ? void 0 : _this$flv.pause();
    this.unload();

    if (this.flv) {
      index++;
      this.flv.detachMediaElement && this.flv.detachMediaElement();
      this.flv.destroy();
    }

    if (this.hls) {
      index++;
      this.hls.destroy();
    }

    this.player = null;
    this.playContainer = null;
    this.flv = null;
    this.hls = null;
    this.event = null;
    this.scale = null;
    this.position = null;
    console.warn('destroy', index);
  }
  /**
   * 设置currentTime实现seek
   * @param {*} seconds
   * @param {*} noEmit
   */


  seekTo(seconds, noEmit) {
    const buffered = this.getBufferedTime();

    if (this.flv && buffered[0] > seconds) {
      this.flv.unload();
      this.flv.load();
    }

    console.log(this.player);

    if (this.player) {
      console.log(this.player.currentTime);
      this.player.currentTime = seconds;

      if (!noEmit) {
        this.event.emit(EventName.SEEK, seconds);
      }
    }
  }

  success(notEmit) {
    var _this$event;

    !notEmit && ((_this$event = this.event) === null || _this$event === void 0 ? void 0 : _this$event.emit(EventName.RELOAD));
  }
  /**
   * 视频重载
   */


  reload(notEmit) {
    if (this.getCurrentTime !== 0) {
      this.seekTo(0);
    }

    if (this.hls) {
      this.hls.swapAudioCodec();
      this.hls.recoverMediaError();
    }

    this.unload();
    this.load();
    this.play();
    !notEmit && this.event.emit(EventName.RELOAD);
  }

  unload() {
    this.flv && this.flv.unload();
    this.hls && this.hls.stopLoad();
  }

  load() {
    if (this.flv) {
      this.flv.load();
    }

    if (this.hls) {
      this.hls.startLoad();
      this.hls.loadSource(this.hls.url);
    }
  }

  setVolume(fraction) {
    this.player.volume = fraction;
  }

  mute() {
    this.player.muted = true;
  }

  unmute() {
    this.player.muted = false;
  }
  /**
   * 开启画中画功能
   */


  requestPictureInPicture() {
    if (this.player.requestPictureInPicture && document.pictureInPictureElement !== this.player) {
      this.player.requestPictureInPicture();
    }
  }
  /**
   * 关闭画中画功能
   */


  exitPictureInPicture() {
    if (document.exitPictureInPicture && document.pictureInPictureElement === this.player) {
      document.exitPictureInPicture();
    }
  }
  /**
   * 设置播放速率
   * @param {*} rate
   */


  setPlaybackRate(rate) {
    this.player.playbackRate = rate;
  }
  /**
   * 获取视频总时长
   */


  getDuration() {
    if (!this.player) return null;
    const {
      duration,
      seekable
    } = this.player;

    if (duration === Infinity && seekable.length > 0) {
      return seekable.end(seekable.length - 1);
    }

    return duration;
  }
  /**
   * 获取当前播放时间
   */


  getCurrentTime() {
    if (!this.player) return null;
    return this.player.currentTime;
  }
  /**
   * 获取缓存时间
   */


  getSecondsLoaded() {
    return this.getBufferedTime()[1];
  }
  /**
   * 获取当前视频缓存的起止时间
   */


  getBufferedTime() {
    if (!this.player) return [];
    const {
      buffered
    } = this.player;

    if (buffered.length === 0) {
      return [0, 0];
    }

    const end = buffered.end(buffered.length - 1);
    const start = buffered.start(buffered.length - 1);
    const duration = this.getDuration();

    if (end > duration) {
      return duration;
    }

    return [start, end];
  }
  /**
   * 快进通过seekTo方法实现
   * @param {*} second
   */


  fastForward(second = 5) {
    const duration = this.getDuration();
    const currentTime = this.getCurrentTime();
    const time = currentTime + second;
    this.seekTo(time > duration - 1 ? duration - 1 : time);
  }
  /**
   * 快退通过seekTo方法实现
   * @param {*} second
   */


  backWind(second = 5) {
    const currentTime = this.getCurrentTime();
    const time = currentTime - second;
    this.seekTo(time < 1 ? 1 : time);
  }
  /**
   * 视频截屏方法
   */


  snapshot() {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.width = this.player.videoWidth;
    canvas.height = this.player.videoHeight;
    ctx.drawImage(this.player, 0, 0, canvas.width, canvas.height);
    setTimeout(() => {
      canvas.remove();
      canvas = null;
      ctx = null;
    }, 200);
    return canvas.toDataURL();
  }

  setScale(num, isRest = false) {
    let scale = this.scale + num;

    if (isRest) {
      scale = num;
    } else {
      if (scale < 1) {
        scale = 1;
      }

      if (scale > 3) {
        scale = 3;
      }
    }

    this.scale = scale;
    this.player.style.transition = 'transform 0.3s';

    this.__setTransform();

    this.event.emit(EventName.TRANSFORM);
    setTimeout(() => {
      this.player.style.transition = 'unset';
    }, 1000);
  }

  getScale() {
    return this.scale;
  }
  /**
   * 获取当前播放对象分辨率
   * @returns 
   */


  getResolution() {
    return this.resolution;
  }
  /**
   * 获取当前分屏数
   * @returns 
   */


  getCurrentScreen() {
    return this.screenNum;
  }

  setPosition(position, isAnimate) {
    this.position = position;
    this.player.style.transition = isAnimate ? 'transform 0.3s' : 'unset';

    this.__setTransform();
  }

  getPosition() {
    return this.position;
  }

  __setTransform() {
    this.player.style.transform = `scale(${this.scale}) translate(${this.position[0]}px,${this.position[1]}px)`;
  }

  exeRatioCommand(ratio) {
    lcStore.setStreamResolution(ratio);
  }

  getApi() {
    return {
      play: this.play.bind(this),
      reload: this.reload.bind(this),
      success: this.success.bind(this),
      pause: this.pause.bind(this),
      seekTo: this.seekTo.bind(this),
      setVolume: this.setVolume.bind(this),
      mute: this.mute.bind(this),
      unmute: this.unmute.bind(this),
      requestPictureInPicture: this.requestPictureInPicture.bind(this),
      exitPictureInPicture: this.exitPictureInPicture.bind(this),
      setPlaybackRate: this.setPlaybackRate.bind(this),
      destroy: this.destroy.bind(this),
      getDuration: this.getDuration.bind(this),
      getCurrentTime: this.getCurrentTime.bind(this),
      getSecondsLoaded: this.getSecondsLoaded.bind(this),
      getBufferedTime: this.getBufferedTime.bind(this),
      fastForward: this.fastForward.bind(this),
      backWind: this.backWind.bind(this),
      snapshot: this.snapshot.bind(this),
      requestFullScreen: this.requestFullScreen.bind(this),
      cancelFullScreen: this.cancelFullScreen.bind(this),
      __player: this.player,
      flv: this.flv,
      hls: this.hls
    };
  }

}

function getHiddenProp() {
  const prefixes = ["webkit", "moz", "ms", "o"]; // 如果hidden 属性是原生支持的，我们就直接返回

  if ("hidden" in document) {
    return "hidden";
  } // 其他的情况就循环现有的浏览器前缀，拼接我们所需要的属性


  for (let i = 0; i < prefixes.length; i++) {
    // 如果当前的拼接的前缀在 document对象中存在 返回即可
    if (prefixes[i] + "Hidden" in document) {
      return prefixes[i] + "Hidden";
    }
  } // 其他的情况 直接返回null


  return null;
}

function getVisibilityState() {
  const prefixes = ["webkit", "moz", "ms", "o"];

  if ("visibilityState" in document) {
    return "visibilityState";
  }

  for (let i = 0; i < prefixes.length; i++) {
    if (prefixes[i] + "VisibilityState" in document) {
      return prefixes[i] + "VisibilityState";
    }
  } // 找不到返回 null


  return null;
}

function visibilityState() {
  return document[getVisibilityState()];
}

function addEventListener(listener) {
  const visProp = getHiddenProp();
  const evtname = visProp.replace(/[H|h]idden/, "") + "visibilitychange";
  document.addEventListener(evtname, listener, false);
}

function removeEventListener(listener) {
  const visProp = getHiddenProp();
  const evtname = visProp.replace(/[H|h]idden/, "") + "visibilitychange";
  document.removeEventListener(evtname, listener, false);
}

var BrowserTab = {
  addEventListener,
  removeEventListener,
  visibilityState
};

function LiveHeart({
  api
}) {
  useEffect(() => {
    const browserTabChange = function () {
      if (BrowserTab.visibilityState() === 'visible') {
        const current = api.getCurrentTime();
        const buffered = api.getSecondsLoaded();

        if (buffered - current > 5) {
          console.warn(`当前延时过大current->${current} buffered->${buffered}, 基于视频当前缓存时间更新当前播放时间 updateTime -> ${buffered - 2}`);
          api.seekTo(buffered - 2 > 0 ? buffered - 2 : 0);
        }
      }
    };

    BrowserTab.addEventListener(browserTabChange);
    return () => {
      BrowserTab.removeEventListener(browserTabChange);
    };
  }, [api]);
  return /*#__PURE__*/React.createElement(React.Fragment, null);
}

function SinglePlayer({
  type,
  file,
  className,
  autoPlay,
  muted,
  poster,
  playsinline,
  loop,
  preload,
  children,
  onInitPlayer,
  screenNum,
  onVideoFn,
  deviceInfo,
  ...props
}) {
  const playContainerRef = useRef(null);
  const [playerObj, setPlayerObj] = useState(null);
  const playerRef = useRef(null); // 分屏数 分辨率

  const rate = useMemo(() => getScreenRate(screenNum), [screenNum]);
  const [resolution, setResolution] = useState(rate);
  const [colorPicker, setColorPicker] = useState(null);
  const [install, setInstall] = useState(false);
  installState(function () {
    setInstall(true);
  });

  function onToken(token) {
    if (onVideoFn) {
      onVideoFn({
        uuid: token
      });
    }
  }

  useEffect(() => () => {
    if (playerRef.current && playerRef.current.event) {
      playerRef.current.event.destroy();
    }

    if (playerRef.current && playerRef.current.api) {
      playerRef.current.api.destroy();
    }

    playerRef.current = null;
  }, [file, resolution]);
  useEffect(() => {
    if (!file) {
      return;
    }

    const playerObject = {
      playContainer: playContainerRef.current,
      video: playContainerRef.current.querySelector('video'),
      resolution: resolution,
      screenNum: screenNum,
      playeMode: detectorPlayeMode(),
      deviceInfo: deviceInfo
    };
    let isInit = false;
    const formartType = getVideoType(file);

    if (formartType === 'flv' || type === 'flv') {
      isInit = true;

      try {
        playerObject.flv = createFlvPlayer(playerObject.video, { ...props,
          file: tansCodingToUrl({
            file,
            resolution,
            deviceInfo
          }, onToken)
        });
      } catch (e) {
        console.error(e);
      }
    }

    if (formartType === 'm3u8' || type === 'hls') {
      isInit = true;

      try {
        playerObject.hls = createHlsPlayer(playerObject.video, file);
      } catch (e) {
        console.error(e);
      }
    }

    if (!isInit && (!['flv', 'm3u8'].includes(formartType) || type === 'native')) {
      playerObject.video.src = file;
    }

    if (playerObject.event) {
      playerObject.event.destroy();
    }

    playerObject.event = new VideoEventInstance(playerObject.video);

    if (playerObject.api) {
      playerObject.api.destroy();
    }

    playerObject.api = new Api(playerObject);
    playerRef.current = playerObject;
    setPlayerObj(() => playerObject);

    if (onInitPlayer) {
      onInitPlayer(Object.assign({}, playerObject.api.getApi(), playerObject.event.getApi()));
    }
  }, [file, resolution]);
  return /*#__PURE__*/React.createElement("div", {
    className: `lm-player-container ${className}`,
    ref: playContainerRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "player-mask-layout"
  }, /*#__PURE__*/React.createElement("video", {
    autoPlay: autoPlay,
    preload: preload,
    muted: muted,
    poster: poster,
    controls: false,
    playsInline: playsinline,
    loop: loop,
    style: colorPicker
  })), /*#__PURE__*/React.createElement(VideoTools$1, {
    playerObj: playerObj,
    isLive: props.isLive,
    key: file,
    install: install,
    hideContrallerBar: props.hideContrallerBar,
    errorReloadTimer: props.errorReloadTimer,
    scale: props.scale,
    switchResolution: resolution => {
      setResolution(resolution);
    },
    colorPicker: value => {
      setColorPicker(value);
    },
    snapshot: props.snapshot,
    leftExtContents: props.leftExtContents,
    leftMidExtContents: props.leftMidExtContents,
    rightExtContents: props.rightExtContents,
    rightMidExtContents: props.rightMidExtContents,
    draggable: props.draggable
  }), children);
}

function VideoTools$1({
  playerObj,
  draggable,
  isLive,
  hideContrallerBar,
  scale,
  snapshot,
  switchResolution,
  leftExtContents,
  leftMidExtContents,
  rightExtContents,
  rightMidExtContents,
  errorReloadTimer,
  install,
  colorPicker
}) {
  if (!playerObj) {
    return /*#__PURE__*/React.createElement(NoSource, {
      install: install
    });
  }

  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(VideoMessage, {
    api: playerObj.api,
    event: playerObj.event
  }), draggable && /*#__PURE__*/React.createElement(DragEvent, {
    playContainer: playerObj.playContainer,
    api: playerObj.api,
    event: playerObj.event
  }), !hideContrallerBar && /*#__PURE__*/React.createElement(ContrallerEvent, {
    event: playerObj.event,
    playContainer: playerObj.playContainer
  }, /*#__PURE__*/React.createElement(ContrallerBar, {
    api: playerObj.api,
    event: playerObj.event,
    playContainer: playerObj.playContainer,
    video: playerObj.video,
    snapshot: snapshot,
    colorPicker: colorPicker,
    switchResolution: switchResolution,
    rightExtContents: rightExtContents,
    rightMidExtContents: rightMidExtContents,
    scale: scale,
    isHistory: false,
    isLive: isLive,
    leftExtContents: leftExtContents,
    leftMidExtContents: leftMidExtContents
  }), !isLive && /*#__PURE__*/React.createElement(TineLine$1, {
    api: playerObj.api,
    event: playerObj.event
  })), /*#__PURE__*/React.createElement(ErrorEvent, {
    flv: playerObj.flv,
    hls: playerObj.hls,
    api: playerObj.api,
    event: playerObj.event,
    errorReloadTimer: errorReloadTimer
  }), isLive && /*#__PURE__*/React.createElement(LiveHeart, {
    api: playerObj.api
  }));
}

SinglePlayer.propTypes = {
  file: PropTypes.string.isRequired,
  //播放地址 必填
  isLive: PropTypes.bool,
  //是否实时视频
  errorReloadTimer: PropTypes.number,
  //视频错误重连次数
  type: PropTypes.oneOf(['flv', 'hls', 'native']),
  //强制视频流类型
  onInitPlayer: PropTypes.func,
  draggable: PropTypes.bool,
  hideContrallerBar: PropTypes.bool,
  scale: PropTypes.bool,
  muted: PropTypes.string,
  autoPlay: PropTypes.bool,
  playsInline: PropTypes.bool,
  preload: PropTypes.string,
  poster: PropTypes.string,
  loop: PropTypes.bool,
  snapshot: PropTypes.func,
  className: PropTypes.string,
  rightExtContents: PropTypes.element,
  rightMidExtContents: PropTypes.element,
  leftExtContents: PropTypes.element,
  leftMidExtContents: PropTypes.element,
  flvOptions: PropTypes.object,
  flvConfig: PropTypes.object,
  children: PropTypes.element
};
SinglePlayer.defaultProps = {
  isLive: true,
  draggable: true,
  scale: true,
  errorReloadTimer: 5,
  muted: 'muted',
  autoPlay: true,
  playsInline: false,
  preload: 'auto',
  loop: false,
  hideContrallerBar: false
};

const computedIndexFormTime = (historyList, time) => {
  let index = 0;

  try {
    index = historyList.fragments.findIndex(v => v.end > time);
  } catch (e) {
    console.error('historyList data error', historyList);
  }

  return index;
};
const computedTimeAndIndex = (historyList, currentTime) => {
  const index = computedIndexFormTime(historyList, currentTime);
  let seekTime = 0;

  try {
    const fragment = historyList.fragments[index];

    if (!fragment) {
      return [0, 0];
    }

    seekTime = currentTime - fragment.begin - 1;
  } catch (e) {
    console.error('historyList data error', historyList);
  }

  return [index, seekTime];
};

const computedLineList = historyList => {
  const duration = historyList.duration;
  return historyList.fragments.map(v => {
    return {
      disabled: !v.file,
      size: (v.end - v.begin) / duration * 100
    };
  });
};

function TineLine({
  event,
  api,
  visibel,
  historyList,
  playIndex,
  seekTo,
  defaultTime
}) {
  const [state, setState] = useState({
    duration: 1,
    currentTime: defaultTime,
    buffered: 0,
    isEnd: false
  });
  useEffect(() => setState(old => ({ ...old,
    currentTime: defaultTime
  })), [defaultTime]);
  useEffect(() => {
    const getDuration = () => setState(old => ({ ...old,
      duration: api.getDuration()
    }));

    const getCurrentTime = () => setState(old => ({ ...old,
      currentTime: api.getCurrentTime(),
      buffered: api.getSecondsLoaded()
    }));

    const getBuffered = () => setState(old => ({ ...old,
      buffered: api.getSecondsLoaded()
    }));

    const historyPlayEnd = () => setState(old => ({ ...old,
      isEnd: true
    }));

    const reload = () => setState(old => ({ ...old,
      isEnd: false,
      currentTime: api.getCurrentTime()
    }));

    const seekendPlay = () => api.play();

    event.addEventListener('loadedmetadata', getDuration);
    event.addEventListener('durationchange', getDuration);
    event.addEventListener('timeupdate', getCurrentTime);
    event.addEventListener('progress', getBuffered);
    event.addEventListener('suspend', getBuffered);
    event.addEventListener('seeked', seekendPlay);
    event.on(EventName.HISTORY_PLAY_END, historyPlayEnd);
    event.on(EventName.RELOAD, reload);
    return () => {
      event.removeEventListener('loadedmetadata', getDuration);
      event.removeEventListener('durationchange', getDuration);
      event.removeEventListener('timeupdate', getCurrentTime);
      event.removeEventListener('progress', getBuffered);
      event.removeEventListener('suspend', getBuffered);
      event.removeEventListener('seeked', seekendPlay);
      event.off(EventName.HISTORY_PLAY_END, historyPlayEnd);
      event.off(EventName.RELOAD, reload);
    };
  }, [event, api]);
  const changePlayTime = useCallback(percent => {
    const currentTime = percent * historyList.duration; //修正一下误差

    const [index, time] = computedTimeAndIndex(historyList, currentTime);
    console.log(index, time);
    seekTo(currentTime, index);
    setState(old => ({ ...old,
      currentTime: time,
      isEnd: false
    }));
  }, [historyList]);

  const renderTimeLineTips = percent => {
    const currentTime = percent * historyList.duration * 1000;
    const date = dateFormat(historyList.beginDate + currentTime);
    return /*#__PURE__*/React.createElement("span", null, date);
  };

  const {
    currentTime,
    buffered,
    isEnd
  } = state;
  const lineList = useMemo(() => computedLineList(historyList), [historyList]);
  const currentLine = useMemo(() => lineList.filter((_, i) => i < playIndex).map(v => v.size), [playIndex, lineList]);
  const currentIndexTime = useMemo(() => currentLine.length === 0 ? 0 : currentLine.length > 1 ? currentLine.reduce((p, c) => p + c) : currentLine[0], [currentLine]);
  const playPercent = useMemo(() => currentTime / historyList.duration * 100 + currentIndexTime, [currentIndexTime, historyList, currentTime]);
  const bufferedPercent = useMemo(() => buffered / historyList.duration * 100 + currentIndexTime, [historyList, currentIndexTime, buffered]);
  return /*#__PURE__*/React.createElement("div", {
    className: `video-time-line-layout ${!visibel ? 'hide-time-line' : ''}`
  }, /*#__PURE__*/React.createElement(IconFont, {
    type: "lm-player-PrevFast",
    onClick: () => api.backWind(),
    className: "time-line-action-item"
  }), /*#__PURE__*/React.createElement(Slider, {
    className: "time-line-box",
    currentPercent: isEnd ? '100' : playPercent,
    availablePercent: bufferedPercent,
    onChange: changePlayTime,
    renderTips: renderTimeLineTips
  }, /*#__PURE__*/React.createElement(React.Fragment, null, lineList.map((v, i) => {
    const currentSizeLine = lineList.filter((v, i2) => i2 < i).map(v => v.size);
    const currentIndexSize = currentSizeLine.length === 0 ? 0 : currentSizeLine.length > 1 ? currentSizeLine.reduce((p, c) => p + c) : currentSizeLine[0];
    return /*#__PURE__*/React.createElement("div", {
      className: `history-time-line-item ${v.disabled ? 'history-time-line-disabled' : ''}`,
      key: i,
      style: {
        width: `${v.size}%`,
        left: `${currentIndexSize}%`
      }
    });
  }))), /*#__PURE__*/React.createElement(IconFont, {
    type: "lm-player-NextFast_Light",
    onClick: () => api.fastForward(),
    className: "time-line-action-item"
  }));
}

TineLine.propTypes = {
  event: PropTypes.object,
  api: PropTypes.object,
  changePlayIndex: PropTypes.func,
  playIndex: PropTypes.number,
  historyList: PropTypes.array,
  seekTo: PropTypes.func,
  visibel: PropTypes.bool
};

/**
 * history下使用 用户切换下个播放地址
 */

function PlayEnd({
  event,
  changePlayIndex,
  playIndex
}) {
  useEffect(() => {
    const endedHandle = () => changePlayIndex(playIndex + 1);

    event.addEventListener('ended', endedHandle, false);
    return () => {
      event.removeEventListener('ended', endedHandle, false);
    };
  }, [event, playIndex, changePlayIndex]);
  return /*#__PURE__*/React.createElement(React.Fragment, null);
}

PlayEnd.propTypes = {
  event: PropTypes.object,
  changePlayIndex: PropTypes.func,
  playIndex: PropTypes.number
};

function HistoryPlayer({
  type,
  historyList,
  defaultTime,
  className,
  autoPlay,
  muted,
  poster,
  playsinline,
  loop,
  preload,
  children,
  onInitPlayer,
  screenNum,
  ...props
}) {
  const playContainerRef = useRef(null);
  const [playerObj, setPlayerObj] = useState(null);
  const playerRef = useRef(null);
  const [playStatus, setPlayStatus] = useState(() => computedTimeAndIndex(historyList, defaultTime));
  const playIndex = useMemo(() => playStatus[0], [playStatus]);
  const defaultSeekTime = useMemo(() => playStatus[1], [playStatus]);
  const rate = useMemo(() => getScreenRate(screenNum), [screenNum]);
  const [resolution, setResolution] = useState(rate);
  const file = useMemo(() => {
    let url;

    try {
      url = historyList.fragments[playIndex].file;
    } catch (e) {
      console.warn('未找到播放地址！', historyList);
    }

    return url;
  }, [historyList, playIndex]);
  /**
   * 重写api下的seekTo方法
   */

  const seekTo = useCallback(currentTime => {
    const [index, seekTime] = computedTimeAndIndex(historyList, currentTime);

    if (playerRef.current.event && playerRef.current.api) {
      //判断是否需要更新索引
      setPlayStatus(old => {
        if (old[0] !== index) {
          return [index, seekTime];
        } else {
          playerRef.current.api.seekTo(seekTime, true);
          return old;
        }
      });
    }
  }, [playIndex, historyList]);
  const changePlayIndex = useCallback(index => {
    if (index > historyList.fragments.length - 1) {
      return playerRef.current && playerRef.current.event && playerRef.current.event.emit(EventName.HISTORY_PLAY_END);
    }

    if (!historyList.fragments[index].file) {
      return changePlayIndex(index + 1);
    }

    if (playerRef.current && playerRef.current.event) {
      playerRef.current.event.emit(EventName.CHANGE_PLAY_INDEX, index);
    }

    setPlayStatus([index, 0]);
  }, [historyList]);
  const reloadHistory = useCallback(() => {
    if (playStatus[0] === 0) {
      playerRef.current.api.seekTo(defaultSeekTime);
    }

    setPlayStatus([0, 0]);
    playerRef.current.event.emit(EventName.RELOAD);
  }, []);
  useEffect(() => {
    if (!file) {
      changePlayIndex(playIndex + 1);
    }
  }, [file, playIndex, historyList]);
  useEffect(() => () => {
    if (playerRef.current && playerRef.current.event) {
      playerRef.current.event.destroy();
    }

    if (playerRef.current && playerRef.current.api) {
      playerRef.current.api.destroy();
    }

    playerRef.current = null;
  }, [file]);
  useEffect(() => {
    if (!file) {
      return;
    }

    const playerObject = {
      playContainer: playContainerRef.current,
      video: playContainerRef.current.querySelector('video'),
      resolution: resolution,
      screenNum: screenNum
    };
    let isInit = false;
    const formartType = getVideoType(file);

    if (formartType === 'flv' || type === 'flv') {
      isInit = true;
      playerObject.flv = createFlvPlayer(playerObject.video, { ...props,
        file: tansCodingToUrl({
          file,
          resolution
        })
      });
    }

    if (formartType === 'm3u8' || type === 'hls') {
      isInit = true;
      playerObject.hls = createHlsPlayer(playerObject.video, file);
    }

    if (!isInit && (!['flv', 'm3u8'].includes(formartType) || type === 'native')) {
      playerObject.video.src = file;
    }

    if (playerObject.event) {
      playerObject.event.destroy();
    }

    playerObject.event = new VideoEventInstance(playerObject.video);

    if (playerObject.api) {
      playerObject.api.destroy();
    }

    playerObject.api = new Api(playerObject);
    playerRef.current = playerObject;
    setPlayerObj(playerObject);

    if (defaultSeekTime) {
      playerObject.api.seekTo(defaultSeekTime);
    }

    if (onInitPlayer) {
      onInitPlayer(Object.assign({}, playerObject.api.getApi(), playerObject.event.getApi(), {
        seekTo,
        changePlayIndex,
        reload: reloadHistory
      }));
    }
  }, [historyList, file]);
  return /*#__PURE__*/React.createElement("div", {
    className: `lm-player-container ${className}`,
    ref: playContainerRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "player-mask-layout"
  }, /*#__PURE__*/React.createElement("video", {
    autoPlay: autoPlay,
    preload: preload,
    muted: muted,
    poster: poster,
    controls: false,
    playsInline: playsinline,
    loop: loop
  })), /*#__PURE__*/React.createElement(VideoTools, {
    defaultTime: defaultSeekTime,
    playerObj: playerObj,
    isLive: props.isLive,
    hideContrallerBar: props.hideContrallerBar,
    errorReloadTimer: props.errorReloadTimer,
    scale: props.scale,
    snapshot: props.snapshot,
    leftExtContents: props.leftExtContents,
    leftMidExtContents: props.leftMidExtContents,
    rightExtContents: props.rightExtContents,
    rightMidExtContents: props.rightMidExtContents,
    draggable: props.draggable,
    changePlayIndex: changePlayIndex,
    reloadHistory: reloadHistory,
    historyList: historyList,
    playIndex: playIndex,
    seekTo: seekTo,
    key: file
  }), children);
}

function VideoTools({
  playerObj,
  draggable,
  isLive,
  hideContrallerBar,
  scale,
  snapshot,
  leftExtContents,
  leftMidExtContents,
  rightExtContents,
  rightMidExtContents,
  errorReloadTimer,
  changePlayIndex,
  reloadHistory,
  historyList,
  seekTo,
  playIndex,
  defaultTime
}) {
  if (!playerObj) {
    return /*#__PURE__*/React.createElement(NoSource, null);
  }

  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(VideoMessage, {
    api: playerObj.api,
    event: playerObj.event
  }), draggable && /*#__PURE__*/React.createElement(DragEvent, {
    playContainer: playerObj.playContainer,
    api: playerObj.api,
    event: playerObj.event
  }), !hideContrallerBar && /*#__PURE__*/React.createElement(ContrallerEvent, {
    event: playerObj.event,
    playContainer: playerObj.playContainer
  }, /*#__PURE__*/React.createElement(ContrallerBar, {
    api: playerObj.api,
    event: playerObj.event,
    playContainer: playerObj.playContainer,
    video: playerObj.video,
    snapshot: snapshot,
    rightExtContents: rightExtContents,
    rightMidExtContents: rightMidExtContents,
    scale: scale,
    isHistory: true,
    isLive: isLive,
    leftExtContents: leftExtContents,
    leftMidExtContents: leftMidExtContents,
    reloadHistory: reloadHistory
  }), /*#__PURE__*/React.createElement(TineLine, {
    defaultTime: defaultTime,
    changePlayIndex: changePlayIndex,
    historyList: historyList,
    playIndex: playIndex,
    seekTo: seekTo,
    api: playerObj.api,
    event: playerObj.event
  })), /*#__PURE__*/React.createElement(ErrorEvent, {
    changePlayIndex: changePlayIndex,
    playIndex: playIndex,
    isHistory: true,
    flv: playerObj.flv,
    hls: playerObj.hls,
    api: playerObj.api,
    event: playerObj.event,
    errorReloadTimer: errorReloadTimer
  }), /*#__PURE__*/React.createElement(PlayEnd, {
    event: playerObj.event,
    changePlayIndex: changePlayIndex,
    playIndex: playIndex
  }));
}

HistoryPlayer.propTypes = {
  historyList: PropTypes.object.isRequired,
  //播放地址 必填
  errorReloadTimer: PropTypes.number,
  //视频错误重连次数
  type: PropTypes.oneOf(['flv', 'hls', 'native']),
  //强制视频流类型
  onInitPlayer: PropTypes.func,
  isDraggable: PropTypes.bool,
  isScale: PropTypes.bool,
  muted: PropTypes.string,
  autoPlay: PropTypes.bool,
  playsInline: PropTypes.bool,
  preload: PropTypes.string,
  poster: PropTypes.string,
  loop: PropTypes.bool,
  defaultTime: PropTypes.number,
  className: PropTypes.string,
  playsinline: PropTypes.bool,
  children: PropTypes.any,
  autoplay: PropTypes.bool,
  rightExtContents: PropTypes.element,
  rightMidExtContents: PropTypes.element,
  leftExtContents: PropTypes.element,
  leftMidExtContents: PropTypes.element,
  flvOptions: PropTypes.object,
  flvConfig: PropTypes.object
};
HistoryPlayer.defaultProps = {
  draggable: true,
  scale: true,
  errorReloadTimer: 5,
  muted: 'muted',
  autoPlay: true,
  playsInline: false,
  preload: 'auto',
  loop: false,
  defaultTime: 0,
  historyList: {
    beginDate: 0,
    duration: 0,
    fragments: []
  }
};

function createPlayer({
  container,
  children,
  onInitPlayer,
  ...props
}) {
  ReactDOM.render( /*#__PURE__*/React.createElement(SinglePlayer, _extends({}, props, {
    onInitPlayer: player => {
      player.destroy = function () {
        ReactDOM.unmountComponentAtNode(container);
      };

      onInitPlayer && onInitPlayer(player);
    }
  }), children), container);
}
function createHistoryPlayer({
  container,
  children,
  onInitPlayer,
  ...props
}) {
  ReactDOM.render( /*#__PURE__*/React.createElement(HistoryPlayer, _extends({}, props, {
    onInitPlayer: player => {
      player.destroy = function () {
        ReactDOM.unmountComponentAtNode(container);
      };

      onInitPlayer && onInitPlayer(player);
    }
  }), children), container);
}

export default SinglePlayer;
export { Bar, EventName, HistoryPlayer, SinglePlayer as Player, createHistoryPlayer, createPlayer };
//# sourceMappingURL=player.js.map
