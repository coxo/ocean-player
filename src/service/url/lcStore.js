const hostUrl = 'http://127.0.0.1';

export default {
  getTranscodingStream: {
    value: `${hostUrl}:<port>/video/v1/transcoding?uri=<pull_uri>`,
    label: '获取视频流接口',
    actionName: 'getTranscodingStream'
  },
  setStreamResolution:{
    value: `${hostUrl}:<port>/video/v1/change?resolution=<resolution>`,
    label: '修改视频流接口',
    actionName: 'setStreamResolution'
  }
};
