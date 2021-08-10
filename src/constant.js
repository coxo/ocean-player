export const hostUrl = 'http://127.0.0.1';
/**
 * 全局配置
 * decryptionMode： 是否加密
 * switchRate：码率切换控制
 */
 export const GL_CACHE = {
    TP :'mode', 
    DM :'decryptionMode',
    SR :'switchRate',
    PT :'palette',
    FR_CON :'connectOnce',
  }
  
  /**
   * 客户端插件模式，随机端口
   */
  export const LOCAL_PORT = ["15080", "15081", "15082", "15083", "15084", "15085", "15086", "15087", "15088", "15089"]
  
  /**
   * 插件播放版本提示
   */
  export const PLAY_CODE = {
    '10000': '', 
    '10100': '版本需要更新',
    '10200': '插件初始化异常',
    '12000': '插件不存在',
  }

  
/**
 * 获取视频分辨率
 * typecode为多媒体使用
 */
 export const VIDEO_RESOLUTION = {
    '1': { value: '1920*1080', name: '超清', resolution:'1080p', bitrate:'2M', templateCode: 171001, show: true},
    '2': { value: '1280*720', name: '高清', resolution:'720p', bitrate:'2M', templateCode: 171002, show: true},
    '3': { value: '640*360', name: '标清', resolution:'360p', bitrate:'500K', templateCode: 171003, show: true},
    '4': { value: '640*480', name: '标清', resolution:'480p', bitrate:'1M', templateCode: 171002, show: false},
    '5': { value: '', name: '原始', resolution: '', bitrate:'', templateCode: 10000, show: true},
}
  
export const PY_M_CC_NAME = '播放配置出错，请检查浏览器本地存储PY_PLUS！'


export const VIDEO_SPEED = [0.125, 0.25, 0.5, 1, 2, 4, 8];