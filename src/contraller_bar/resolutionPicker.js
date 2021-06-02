import React, { useMemo,useState,useRef,useEffect,useCallback  } from 'react'
import Bar from './bar'
import { findVideoAttribute} from '../util'
import {VIDEO_RESOLUTION} from '../constant'

function ResolutionPicker({ switchResolution, api, name, hideBar }) {
  const [isResolution, setIsResolution] = useState(false)
  const resolutionRef = useRef()
    
    // 获取视频分辨率
  const ratioValue = VIDEO_RESOLUTION
   // 分辨率-默认显示
  const [viewText, setViewText] = useState(findVideoAttribute(api.getResolution(),'name'));

  const handleOpenResolution = data => {
    setIsResolution(!isResolution)
  }
  const setRatio = useCallback((...args) => {
        setViewText(ratioValue[args].name)
        switchResolution && switchResolution(ratioValue[args].resolution)
  },[api])

  useEffect(() => {
        // 点击其他地方隐藏输入框
        // const handleClickOutside = (e) =>{
        //   if(!resolutionRef.current?.contains(e.target)){
        //     setIsResolution(false)
        //   }
        //  }
        // document.querySelector(":root").addEventListener('click', handleClickOutside)
        // return () => document.querySelector(":root").removeEventListener('click', handleClickOutside);
        setIsResolution(false)
  }, [hideBar])

  useEffect(() => {
      setViewText(name)
  }, [name])

  return (
      <Bar className={'fl-menu-hc '} onClick={handleOpenResolution}>
        <div ref={resolutionRef}>
        <span class='fl-menu-hc-main'>{viewText}</span>
        {isResolution && <ul class="fl-menu-hc-level">
          {
            Object.keys(ratioValue).map((item)=>(
              ratioValue[item].show && (<li class="fl-menu-hc-level-1" onClick={() => setRatio(item)}>{ratioValue[item].name}</li>) 
            ))
          }
        </ul>
        }
        </div>
    </Bar>
  )
}

export default ResolutionPicker