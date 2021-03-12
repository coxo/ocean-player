
import lcStore from "./url/lcStore";
import { JSONP } from '../util';

class lcStoreService {
  /**
   * @desc 获取视频流接口
   */
  // uri=<pull_uri>&resolution=<resolution>&bitrate=<bitrate>&key=<key>
   getTranscodingStream(data) {

  } 

  /**
   * 修改视频流接口
   * @param {*} data 
   */

   setStreamResolution(code){
    // /video/v1/change?&resolution=<resolution>&bitrate=<bitrate>&key=<key>
    let url = lcStore.setStreamResolution.value.replace('<resolution>',code) + '&key=a123'
    JSONP(url);
  }
}
export default new lcStoreService();
