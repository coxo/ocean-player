import React, { useState, useEffect, useRef } from 'react'

function ErrorEvent({api, event, flv, hls, errorNoticeHandle }) {
  const errorInfo = useRef(null)
  /**
    * 流播放，出错情况捕获
    * @param  {...any} args 
    * @returns 
  */
  const errorHandle = (...args) => {
    console.error(...args)
    if (args[2] && args[2].msg && args[2].msg.includes('Unsupported audio')) {
      return
    }

    if(args[1] && args[1].details && (
      args[1].details.includes("bufferStalledError") || 
      args[1].details.includes("bufferNudgeOnStall") || 
      args[1].details.includes("bufferSeekOverHole") || 
      args[1].details.includes("bufferAddCodecError") 
    )){
      return
    }
    errorInfo.current = args
    api.unload()
    errorNoticeHandle && errorNoticeHandle()
  }

  useEffect(() => {
    try {
      if (flv) {
        flv.on('error', errorHandle)
        flv.on('media_source_buffer_full', errorHandle);
        flv.on('media_source_ended', errorHandle)
      }
      if (hls) {
        hls.on('hlsError', errorHandle)
      }
    } catch (e) {
      console.warn(e)
    }
     
    event.addEventListener('error', errorHandle, false)
    return () => {
      try {
        if (flv) {
          flv.off('error', errorHandle)
          flv.off('media_source_buffer_full', errorHandle)
          flv.off('media_source_ended', errorHandle)
        }
        if (hls) {
          hls.off('hlsError', errorHandle)
        }
      } catch (e) {
        console.warn(e)
      }
      event.removeEventListener('error', errorHandle, false)
    }
  }, [event, flv, hls])

  return <></>
}

export default ErrorEvent
