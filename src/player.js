import React, { useRef, useEffect, useState, useMemo, useCallback, useContext, createContext } from 'react';
import VideoEvent from './event';
import { getVideoType, createFlvPlayer, createHlsPlayer,detectorPlayeMode, decodeService, getScreenRate, installState } from './util';
import ContrallerBar from './contraller_bar';
import ContrallerEvent from './event/contrallerEvent';
import VideoMessage, { NoSource } from './message';
import TimeLine from './time_line';
import ErrorEvent from './event/errorEvent';
import DragEvent from './event/dragEvent';
import Api from './api';
import LiveHeart from './live_heart';
import PropTypes from 'prop-types';
import IconFont from './iconfont'
import './style/index.less';
import './style/message.less'

const CountContext = createContext(12)

const ReConnection = ({connectHandle}) => {
  const {connectCount, connectStatus, children} = useContext(CountContext)

  return (
    <>
       <div className={'lm-player-container lm-c-player-component ocean-error'}>
          <div className="player-mask-layout"><video/></div>
          {children}
          <div className="lm-player-message-mask lm-player-mask-loading-animation">
            {
              connectStatus !== 2 ? <span  className="lm-player-message" style={{ fontSize: 24 }}>第{ connectCount }次连接中，请稍候...</span> : 
              <> 
              <IconFont style={{ fontSize: 68, color: '#DBE1EA' }} type={'lm-player-M_Device_jiazaishibai'}/>
              <span className="lm-player-message">连接失败<span className="refresh-action" onClick={()=> connectHandle()}>刷新重试</span></span>
              </>
            }
          </div>
        </div>
    </>
  )
}

/**
 * 播放控件容器
 * @param {*} param0 
 * @returns 
 */
function SinglePlayer({...props}){
  const [connectStatus, setConnectStatus] = useState(1);
  const connectCount = useRef(0)

  const timer = useRef(null)
  const playerStatus = useRef(0)

  useEffect(() => {
    return () => {
      timer && clearTimeout(timer)
    }
  }, [])

  const setConnectCount = (count)=>{
    connectCount.current = count;
  }

  const reconnectHandle = ()=>{
    setConnectCount(0)
    setConnectStatus(1)
  }

  const updateStatus = (status)=>{
    playerStatus.current = status;
  }



  return (<>
    {connectStatus == 1 ? 
    <ZPlayer
    errorNoticeHandle={()=>{
      console.warn('开流状态记录....'+playerStatus.current);

      if(playerStatus.current == 0){
        console.warn('首次开流失败！');
        setConnectStatus(2)
        return
      }

      if(playerStatus.current == 1){
        setConnectCount(0)
        updateStatus(2)
      }

      console.warn('开流连接次数....'+connectCount.current)

      const currentStatus = props.errorReloadTimer > connectCount.current
      if(currentStatus){
        setConnectCount(connectCount.current + 1)
        setConnectStatus(0)
        // 开启定时器-更新连接状态
        timer.current = setTimeout(()=>{
          // 连接状态重置为可连接状态
          setConnectStatus(1)
        }, 1000*1)
      }else{
        // 结束连接
        setConnectStatus(2)
      }
      
   }}
   {...props}
   onStreamMounted={(data)=>{
    if(data.streamState == 1){
      updateStatus(1)
    }
    props.onStreamMounted && props.onStreamMounted(data)
  }}
   >
   </ZPlayer> :     
   <CountContext.Provider value={{
     connectStatus,
     connectCount: connectCount.current,
     children: props.errorExtContents
   }}>
      <ReConnection connectHandle={()=>reconnectHandle()}/>
   </CountContext.Provider>}
   </> )
}

function ZPlayer({ type, file, className, autoPlay, muted, poster, playsinline, loop, preload, children, onInitPlayer, screenNum,deviceInfo, ...props }) {
  const playContainerRef = useRef(null);
  const [playerObj, setPlayerObj] = useState(null);
  const playerRef = useRef(null);
  // 分屏数 分辨率
  const rate = useMemo(() => getScreenRate(screenNum), [screenNum]);
  const [resolution, setResolution] = useState(rate);

  const [colorPicker, setColorPicker] = useState(null);

  const [install, setInstall] = useState(false);

  // 开流状态 0 失败/未开流  1 开流成功
  const [streamState, setStreamState] = useState(0);

  function onToken(token){
    props.onVideoFn && props.onVideoFn({
      uuid: token
    })
  }

  useEffect(
    () => () => {
      if (playerRef.current && playerRef.current.event) {
        playerRef.current.event.destroy();
      }
      if (playerRef.current && playerRef.current.api) {
        playerRef.current.api.destroy();
      } 
      playerRef.current = null;
    },
    [file,resolution]
  );
  useEffect(() => {
    if (!file) {
      return;
    }
    const playerObject = {
      playContainer: playContainerRef.current,
      video: playContainerRef.current.querySelector('video'),
      resolution: resolution,
      screenNum: screenNum,
      playeMode : detectorPlayeMode(),
      deviceInfo: deviceInfo,
      stream : 0
    };
    let isInit = false;
    const formartType = getVideoType(file);
    if (formartType === 'flv' || type === 'flv') {
      isInit = true;
      try{
        playerObject.flv = createFlvPlayer(playerObject.video, { ...props, file: decodeService({file, resolution, deviceInfo}, onToken) });
      }catch(e) {
        console.error(e)
      }
    }
    if (formartType === 'm3u8' || type === 'hls') {
      isInit = true;
      try{
        playerObject.hls = createHlsPlayer(playerObject.video, file);
      }catch(e) {
        console.error(e)
      }
    }
    if (!isInit && (!['flv', 'm3u8'].includes(formartType) || type === 'native')) {
      playerObject.video.src = file;
    }
    if (playerObject.event) {
      playerObject.event.destroy();
    }
    playerObject.event = new VideoEvent(playerObject.video);
    if (playerObject.api) {
      playerObject.api.destroy();
    }
    playerObject.api = new Api(playerObject);
    playerRef.current = playerObject;
    setPlayerObj(() => playerObject);

    if (onInitPlayer) {
      onInitPlayer(Object.assign({}, playerObject.api.getApi(), playerObject.event.getApi()));
    }
  }, [file,resolution]);

  useEffect(() => {
    installState(function(){
      setInstall(true)
    })
    props.onStreamMounted && props.onStreamMounted({streamState})
  }, [streamState]);

  return (
    <div className={`lm-player-container ${className}`} ref={playContainerRef}>
      <div className="player-mask-layout">
        <video autoPlay={autoPlay} preload={preload} muted={muted} poster={poster} controls={false} crossorigin={"Anonymous"} usecors={true} playsInline={playsinline} loop={loop} style={colorPicker} />
      </div>
      <VideoTools
        playerObj={playerObj}
        isLive={props.isLive}
        key={file}
        install={install}
        hideContrallerBar={props.hideContrallerBar}
        scale={props.scale}
        switchResolution={(resolution) => {
          setResolution(resolution)
        }}
        colorPicker={(value) => {
          setColorPicker(value)
        }}
        setStreamState={setStreamState}
        snapshot={props.snapshot}
        leftExtContents={props.leftExtContents}
        leftMidExtContents={props.leftMidExtContents}
        rightExtContents={props.rightExtContents}
        rightMidExtContents={props.rightMidExtContents}
        draggable={props.draggable}
        errorNoticeHandle={props.errorNoticeHandle}
      />
      {children}
    </div>
  )
}

function VideoTools({
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
  install,
  colorPicker,
  setStreamState,
  errorNoticeHandle
}) {
  if (!playerObj) {
    return <NoSource install={install}/>;
  }
  return (
    <>
      <VideoMessage api={playerObj.api} event={playerObj.event} setStreamState={setStreamState}/>
      {draggable && <DragEvent playContainer={playerObj.playContainer} api={playerObj.api} event={playerObj.event} />}
      {!hideContrallerBar && (
        <ContrallerEvent event={playerObj.event} playContainer={playerObj.playContainer}>
          <ContrallerBar
            api={playerObj.api}
            event={playerObj.event}
            playContainer={playerObj.playContainer}
            video={playerObj.video}
            snapshot={snapshot}
            colorPicker={colorPicker}
            switchResolution={switchResolution}
            rightExtContents={rightExtContents}
            rightMidExtContents={rightMidExtContents}
            scale={scale}
            isHistory={false}
            isLive={isLive}
            leftExtContents={leftExtContents}
            leftMidExtContents={leftMidExtContents}
          />
          {!isLive && <TimeLine api={playerObj.api} event={playerObj.event} />}
        </ContrallerEvent>
      )}
      <ErrorEvent flv={playerObj.flv} hls={playerObj.hls} api={playerObj.api} event={playerObj.event} errorNoticeHandle={errorNoticeHandle}/>
      {isLive && <LiveHeart api={playerObj.api} />}
    </>
  );
}

SinglePlayer.propTypes = {
  file: PropTypes.string.isRequired, //播放地址 必填
  isLive: PropTypes.bool, //是否实时视频
  errorReloadTimer: PropTypes.number, //视频错误重连次数
  type: PropTypes.oneOf(['flv', 'hls', 'native']), //强制视频流类型
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
  children: PropTypes.element,
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
  hideContrallerBar: false,
};

export default SinglePlayer;
