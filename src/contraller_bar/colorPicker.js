import React, { useMemo,useState,useRef,useEffect } from 'react'
import IconFont from '../iconfont'
import Bar from './bar'
import { Slider } from 'antd'

function ColorPicker({ colorfilter, hideBar }) {
  const [brightnessValue, setBrightnessValue] = useState(127)
  const [contrastValue, setContrastValue] = useState(127)
  const [saturateValue, setSaturateValue] = useState(127)
  const [hueValue, setHueValue] = useState(0)

  const elRef = useRef()
  const [isPicker, setIsPicker] = useState(false)

  const brightness = useMemo(() => {
      const cv = brightnessValue/127
      if(cv == 1) return ''
      return `brightness(${cv})`
  }, [brightnessValue]);

  
  const contrast = useMemo(() => {
    const cv = contrastValue/127
    if(cv == 1) return ''
    return `contrast(${cv})`
   }, [contrastValue]);

   const saturate = useMemo(() => {
    const cv = saturateValue/127
    if(cv == 1) return ''
    return `saturate(${cv})`
   }, [saturateValue]);

   const hue = useMemo(() => {
    const cv = hueValue
    if(cv == 0) return ''
    return `hue-rotate(${cv}deg)`
   }, [hueValue]);

  const handleAllChange = data => {
    colorfilter && colorfilter({
        '-webkit-filter': `${brightness} ${contrast} ${saturate} ${hue}`,
    })
  }

  const handleBrightnessChange = data => {
    setBrightnessValue(data)
    handleAllChange()
  }

  const handleContrastChange = data => {
    setContrastValue(data)
    handleAllChange()
  }

  const handleSaturateChange = data => {
    setSaturateValue(data)
    handleAllChange()
  }

  const handleHueChange = data => {
    setHueValue(data)
    handleAllChange()
  }

  const handleResetChange = data => {
    setBrightnessValue(127)
    setContrastValue(127)
    setSaturateValue(127)
    setHueValue(0)
    colorfilter({})
  }

  const handleOpenPicker = data => {
    setIsPicker(!isPicker)
  }

  useEffect(() => {
    setIsPicker(false)
  }, [hideBar])

  return (
    <Bar className={'colorPicker'}>
      <div ref={elRef}>
        <IconFont title={'画面设置'} type={'lm-player-S_Device_shezhi'} onClick={handleOpenPicker} />
      {
        isPicker && (
        <div class="colorPicker-container">
        <span> 视频画面设置 </span> 
        <span className='colorPicker-reset' onClick={handleResetChange}>&nbsp;<IconFont title={'重置'} type={'lm-player-Refresh_Main'} />重置 </span>
        <div className="colorPicker-container-control">
          <span> 亮度 </span> <Slider min={0} max={255} onChange={handleBrightnessChange} value={ brightnessValue }  /><span> {brightnessValue} </span>
        </div>
        <div className="colorPicker-container-control">
          <span> 对比度 </span> <Slider min={0} max={255} onChange={handleContrastChange} value={ contrastValue }  /><span> {contrastValue} </span>
        </div>
        <div className="colorPicker-container-control">
          <span> 饱和度 </span> <Slider min={0} max={255} onChange={handleSaturateChange} value={ saturateValue }  /><span> {saturateValue} </span>
        </div>
        <div className="colorPicker-container-control hue-horizontal">
          <span> 色调 </span> <Slider min={0} max={360} onChange={handleHueChange} value={ hueValue } /><span> {hueValue} </span>
        </div>
      </div>
        )
      }
      </div>
    </Bar>
  )
}

export default ColorPicker
