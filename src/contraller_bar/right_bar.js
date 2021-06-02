import React, { useState, useMemo, useEffect, useCallback,useRef } from 'react'
import IconFont from '../iconfont'
import Bar from './bar'
import { isFullscreen, fullScreenListener, computedBound, findVideoAttribute, getScreenRate, getGlobalCache} from '../util'
import {VIDEO_RESOLUTION, GL_CACHE} from '../constant'
import PropTypes from 'prop-types'
import ColorPicker from './colorPicker'
import ResolutionPicker from './resolutionPicker'
 
function RightBar({ playContainer, api, scale, snapshot, rightExtContents, rightMidExtContents, isLive, switchResolution, colorPicker, hideBar}) {
  const [dep, setDep] = useState(Date.now())

  // 分辨率-默认显示
  const [viewText, setViewText] = useState(findVideoAttribute(api.getResolution(),'name'));

  // 控制调色盘显示
  const isPalette = getGlobalCache(GL_CACHE.PT) || false
  // 控制分辨率显示
  const isSwithRate = getGlobalCache(GL_CACHE.SR) || false

  useEffect(() => {
    const update = () => setDep(Date.now())
    fullScreenListener(true, update)
    return () => fullScreenListener(false, update)
  }, [])

  const isfull = useMemo(() => isFullscreen(playContainer), [dep, playContainer])

  const fullscreen = useCallback(() => {
    const isFullScreen = !isFullscreen(playContainer)
    
    if(isFullScreen){
      api.requestFullScreen()
      switchResolution && switchResolution('')
      setViewText(findVideoAttribute('','name'))
    }else{
      api.cancelFullScreen()
      switchResolution && switchResolution(getScreenRate(api.getCurrentScreen()))
      setViewText(findVideoAttribute(getScreenRate(api.getCurrentScreen()),'name'))
    }

    // 设置对应的分辨率名称
    setDep(Date.now())
  }, [api, playContainer])

  const setScale = useCallback(
    (...args) => {
      const dragDom = playContainer.querySelector('.player-mask-layout')
      api.setScale(...args)
      let position = computedBound(dragDom, api.getPosition(), api.getScale())
      if (position) {
        api.setPosition(position, true)
      }
    },
    [api, playContainer]
  )

  return (
    <div className="contraller-right-bar">
      {rightMidExtContents}
      {scale && (
        <>
          <Bar>
            <IconFont title="缩小" onClick={() => setScale(-0.2)} type={'lm-player-ZoomOut_Main'} />
          </Bar>
          <Bar>
            <IconFont title="复位" onClick={() => setScale(1, true)} type={'lm-player-ZoomDefault_Main'} />
          </Bar>
          <Bar>
            <IconFont title="放大" onClick={() => setScale(0.2)} type={'lm-player-ZoomIn_Main'} />
          </Bar>
        </>
      )}
      {isPalette && (<ColorPicker colorfilter={colorPicker} hideBar={hideBar} />)}
      {isLive && isSwithRate && (
        <ResolutionPicker name={viewText} switchResolution={switchResolution} api={api} hideBar={hideBar} />
      )}
      
      {snapshot && (
        <Bar>
          <IconFont title="截图" onClick={() => snapshot(api.snapshot())} type="lm-player-SearchBox" />
        </Bar>
      )}

      <Bar>
        <IconFont title={isfull ? '窗口' : '全屏'} onClick={fullscreen} type={isfull ? 'lm-player-ExitFull_Main' : 'lm-player-Full_Main'} />
      </Bar>
      {rightExtContents}
    </div>
  )
}

RightBar.propTypes = {
  api: PropTypes.object,
  event: PropTypes.object,
  playerProps: PropTypes.object,
  playContainer: PropTypes.node,
  reloadHistory: PropTypes.func,
  isHistory: PropTypes.bool,
}
export default RightBar
