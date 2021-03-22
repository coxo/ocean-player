import React, { useRef, useEffect, useState,useMemo } from 'react';
import VideoEvent from './event';
import { getVideoType, createFlvPlayer, createHlsPlayer,detectorPlayeMode,tansCodingToUrl, getScreenRate, installState } from './util';
import ContrallerBar from './contraller_bar';
import ContrallerEvent from './event/contrallerEvent';
import VideoMessage, { NoSource } from './message';
import TimeLine from './time_line';
import ErrorEvent from './event/errorEvent';
import DragEvent from './event/dragEvent';
import Api from './api';
import LiveHeart from './live_heart';
import PropTypes from 'prop-types';
import './style/index.less';

function SinglePlayer({ type, file, className, autoPlay, muted, poster, playsinline, loop, preload, children, onInitPlayer, screenNum, onVideoFn,deviceInfo, ...props }) {
  const playContainerRef = useRef(null);
  const [playerObj, setPlayerObj] = useState(null);
  const playerRef = useRef(null);
  // 分屏数 分辨率
  const rate = useMemo(() => getScreenRate(screenNum), [screenNum]);
  const [resolution, setResolution] = useState(rate);

  const [install, setInstall] = useState(false);

  installState(function(){
    setInstall(true)
  })

  function onToken(token){
    if(onVideoFn){
      onVideoFn({
        uuid: token
      })
    }
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
    };
    let isInit = false;
    const formartType = getVideoType(file);
    if (formartType === 'flv' || type === 'flv') {
      isInit = true;
      try{
        playerObject.flv = createFlvPlayer(playerObject.video, { ...props, file: tansCodingToUrl({file, resolution, deviceInfo}, onToken) });
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
  return (
    <div className={`lm-player-container ${className}`} ref={playContainerRef}>
      <div className="player-mask-layout">
        <video autoPlay={autoPlay} preload={preload} muted={muted} poster={poster} controls={false} playsInline={playsinline} loop={loop} />
      </div>
      <VideoTools
        playerObj={playerObj}
        isLive={props.isLive}
        key={file}
        install={install}
        hideContrallerBar={props.hideContrallerBar}
        errorReloadTimer={props.errorReloadTimer}
        scale={props.scale}
        switchResolution={(resolution)=>{
          setResolution(resolution)
        }}
        snapshot={props.snapshot}
        leftExtContents={props.leftExtContents}
        leftMidExtContents={props.leftMidExtContents}
        rightExtContents={props.rightExtContents}
        rightMidExtContents={props.rightMidExtContents}
        draggable={props.draggable}
      />
      {children}
    </div>
  );
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
  errorReloadTimer,
  install,
}) {
  if (!playerObj) {
    return <NoSource install={install}/>;
  }
  return (
    <>
      <VideoMessage api={playerObj.api} event={playerObj.event} />
      {draggable && <DragEvent playContainer={playerObj.playContainer} api={playerObj.api} event={playerObj.event} />}
      {!hideContrallerBar && (
        <ContrallerEvent event={playerObj.event} playContainer={playerObj.playContainer}>
          <ContrallerBar
            api={playerObj.api}
            event={playerObj.event}
            playContainer={playerObj.playContainer}
            video={playerObj.video}
            snapshot={snapshot}
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
      <ErrorEvent flv={playerObj.flv} hls={playerObj.hls} api={playerObj.api} event={playerObj.event} errorReloadTimer={errorReloadTimer} />
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
