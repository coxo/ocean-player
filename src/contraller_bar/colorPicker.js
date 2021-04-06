import React, { useMemo,useState } from 'react'
import IconFont from '../iconfont'
import Bar from './bar'
import { Slider } from 'antd'

function ColorPicker({ playContainer, api, colorfilter }) {
  const [brightnessValue, setBrightnessValue] = useState(50)
  const [contrastValue, setContrastValue] = useState(50)
  const [saturateValue, setSaturateValue] = useState(50)
  const [hueValue, setHueValue] = useState(0)

  const brightness = useMemo(() => {
      const cv = brightnessValue/50
      if(cv == 1) return ''
      return `brightness(${cv})`
  }, [brightnessValue]);

  
  const contrast = useMemo(() => {
    const cv = contrastValue/50
    if(cv == 1) return ''
    return `contrast(${cv})`
   }, [contrastValue]);

   const saturate = useMemo(() => {
    const cv = saturateValue/50
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
    setBrightnessValue(50)
    setContrastValue(50)
    setSaturateValue(50)
    setHueValue(0)
    colorfilter({})
  }

  return (
    <Bar className={'colorPicker'}>
      <IconFont title={'画面设置'} type={'lm-player-S_Device_shezhi'} />
      <div class="colorPicker-container">
        <span> 视频画面设置 </span> <span className='colorPicker-reset' onClick={handleResetChange}>&nbsp;<IconFont title={'重置'} type={'lm-player-Refresh_Main'} />重置 </span> 
        <div className="colorPicker-container-control">
          <span> 亮度 </span> <Slider min={0} max={100} onChange={handleBrightnessChange} value={ brightnessValue }  /><span> {brightnessValue} </span>
        </div>
        <div className="colorPicker-container-control">
          <span> 对比度 </span> <Slider min={0} max={100} onChange={handleContrastChange} value={ contrastValue }  /><span> {contrastValue} </span>
        </div>
        <div className="colorPicker-container-control">
          <span> 饱和度 </span> <Slider min={0} max={100} onChange={handleSaturateChange} value={ saturateValue }  /><span> {saturateValue} </span>
        </div>
        <div className="colorPicker-container-control hue-horizontal">
          <span> 色调 </span> <Slider min={0} max={360} onChange={handleHueChange} value={ hueValue } /><span> {hueValue} </span>
        </div>
      </div>
    </Bar>
  )
}

export default ColorPicker
