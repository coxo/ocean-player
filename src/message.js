import React, { useEffect, useState, useMemo } from 'react'
import IconFont from './iconfont'
import EventName from './event/eventName'
import './style/message.less'

function VideoMessage({ event, api , setStreamState}) {
  const [state, setState] = useState({ status: null, errorTimer: null, loading: false })

  const message = useMemo(() => {
    if (!state.status) {
      return ''
    }
    if (state.status === 'fail') {
      return '视频错误'
    }
    if (state.status === 'reload') {
      if (!state.errorTimer) {
        return `视频加载错误，正在进行重连...`
      }
      return `视频加载错误，正在进行重连第${state.errorTimer}次重连`
    }
  }, [state.errorTimer, state.status])

  useEffect(() => {
    const openStartLoading = () => setState((old) => ({ ...old, loading: true }))
    const openWaitLoading = () => setState((old) => ({ ...old }))
    const openSeekLoading = () => setState((old) => ({ ...old, loading: true }))
    const canplayLoading = () => (setState((old) => ({ ...old, loading: false })), setStreamState && setStreamState(1))
    const closeLoading = () => setState((old) => ({ ...old, loading: false }))
    const errorReload = (timer) => setState(() => ({ status: 'reload', errorTimer: timer, loading: true }))
    const reloadFail = () => setState((old) => ({ ...old, status: 'fail', loading: false }))
    const reloadSuccess = () => setState((old) => ({ ...old, status: null, loading: false }))
    const reload = () => setState((old) => ({ ...old, status: 'reload', loading: true }))
    const playEnd = () => (setState((old) => ({ ...old, status: null, loading: false })), api.pause())

    event.addEventListener('loadstart', openStartLoading)
    event.addEventListener('waiting', openWaitLoading)
    event.addEventListener('seeking', openSeekLoading)
    event.addEventListener('loadeddata', closeLoading)
    event.addEventListener('canplay', canplayLoading)
    event.on(EventName.ERROR_RELOAD, errorReload)
    event.on(EventName.RELOAD_FAIL, reloadFail)
    event.on(EventName.RELOAD_SUCCESS, reloadSuccess)
    event.on(EventName.RELOAD, reload)
    event.on(EventName.HISTORY_PLAY_END, playEnd)
    event.on(EventName.CLEAR_ERROR_TIMER, reloadSuccess)

    return () => {
      event.removeEventListener('loadstart', openStartLoading)
      event.removeEventListener('waiting', openWaitLoading)
      event.removeEventListener('seeking', openSeekLoading)
      event.removeEventListener('loadeddata', closeLoading)
      event.removeEventListener('canplay', canplayLoading)
      event.off(EventName.ERROR_RELOAD, errorReload)
      event.off(EventName.RELOAD_FAIL, reloadFail)
      event.off(EventName.RELOAD_SUCCESS, reloadSuccess)
      event.off(EventName.RELOAD, reload)
      event.off(EventName.HISTORY_PLAY_END, playEnd)
      event.off(EventName.CLEAR_ERROR_TIMER, reloadSuccess)
    }
  }, [event])

  const { loading, status } = state
  return (
    <div className={`lm-player-message-mask ${loading || status === 'fail' ? 'lm-player-mask-loading-animation' : ''}`}>
      <IconFont
        type={status === 'fail' ? 'lm-player-YesorNo_No_Dark' : 'lm-player-Loading'}
        className={`${loading && status !== 'fail' ? 'lm-player-loading-animation' : status === 'fail' ? 'lm-player-loadfail' : ''} lm-player-loading-icon`}
      />
      <span className="lm-player-message">{message}</span>
    </div>
  )
}

export const ErrorContainer = ({reconnectHandle}) => {
    return (
      <>
        <div className="lm-player-message-mask lm-player-mask-loading-animation">
          <IconFont style={{ fontSize: 68, color: '#DBE1EA' }} type={'lm-player-YesorNo_No_Dark'}/>
           <span className="lm-player-message">连接失败<span className="refresh-action" onClick={()=> reconnectHandle()}>刷新重试</span></span>
         </div>
      </>
    )
}

export const NoSource = ({ install }) => {
  const _TEMP_PLAY_CODE = sessionStorage.getItem('_TEMP_PLAY_CODE')
  // const _TEMP_PLAY_PATH = sessionStorage.getItem('_TEMP_PLAY_PATH')
  const _APP_PLAY_VERSION  = sessionStorage.getItem('_APP_PLAY_VERSION')
  const _TEMP_PLAY_PATH = window.BSConfig?.playerDownloadUrl || localStorage.getItem('ZVPlayerUrl')
  return (
    <div className="lm-player-message-mask lm-player-mask-loading-animation">
      <IconFont style={{ fontSize: 80 }} type="lm-player-PlaySource" title="请选择视频源"></IconFont>
      {_TEMP_PLAY_CODE == '20000' && (
        <span
          className="lm-player-message"
        >
          请
          <a className="install-link"
            target="_blank"
            href={_TEMP_PLAY_PATH}
            style={{ pointerEvents: 'all', textDecoration: 'none' }}
            download="ZVPlayer.exe"
            rel="noopener noreferrer"
          >下载</a>播放插件
        </span>
      )}
      {_TEMP_PLAY_CODE == '10001' && (
        <span
          className="lm-player-message"
        >
          当前播放插件版本低，建议您升级最新版本
          <a target="_blank"
          href={_TEMP_PLAY_PATH}
          style={{ pointerEvents: 'all', textDecoration: 'none' }}
          download="ZVPlayer.exe"
          rel="noopener noreferrer"className="install-link">{_APP_PLAY_VERSION}</a>
        </span>
      )}
    </div>
  )
}

export default VideoMessage
