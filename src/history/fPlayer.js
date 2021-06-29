import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import ContrallerBar from '../contraller_bar';
import VideoMessage, { NoSource } from './message';
import HistoryFsLine from './time_fs_history';
import ErrorEvent from './errorEvent';
import DragEvent from '../event/dragEvent';
import Api from '../api';
import VideoEvent from '../event';
import PlayEnd from './play_end';
import EventName from '../event/eventName';
import ContrallerEvent from '../event/contrallerEvent';
import { getVideoType, createFlvPlayer, decodeService, getScreenRate } from '../util';
import { computedTimeAndIndex } from './utils';

/**
 * 前端录像播放 http-flv
 * @param {*} param0 
 * @returns 
 */
function FPlayer({ type, historyList, defaultTime, className, autoPlay, muted, poster, playsinline, loop, preload, children, onInitPlayer, screenNum, speed, seekFrontRangeData, ...props }) {
  const playContainerRef = useRef(null);
  const [playerObj, setPlayerObj] = useState(null);
  const [seekTime, setSeekTime] = useState(0);
  const [playIndex, setPlayIndex] = useState(0);
  const playerRef = useRef(null);
  const [playStatus, setPlayStatus] = useState(() => computedTimeAndIndex(historyList, defaultTime));

  useEffect(() => {
    setPlayIndex(computedTimeAndIndex(historyList, seekTime)[0])
  }, [seekTime]);

  const defaultSeekTime = useMemo(() => playStatus[1], [playStatus]);
  const rate = useMemo(() => getScreenRate(screenNum), [screenNum]);
  const [resolution, setResolution] = useState(rate);
  const [colorPicker, setColorPicker] = useState(null);

  const file = useMemo(() => {
    let url;
    try {
      url = historyList.fragments[playIndex].file;
    } catch (e) {
      console.warn('未找到播放地址！', historyList);
    }
    return url;
  }, [historyList, playIndex]);

  /**
   * 重写api下的seekTo方法
   */
  const seekTo = useCallback(
    (currentTime,pIndex,dateTime) => {
      if (playerRef.current.event && playerRef.current.api) {
        seekFrontRangeData && seekFrontRangeData(`${dateTime}`.substr(0,10),function(msg){
          if(msg == 'error'){
            //seek异常时， 根据当前seektime获取当前对应的索引
            changePlayIndex(pIndex);
          }else{
            setSeekTime(currentTime)
          }
        })
      }
    },
    [playIndex, historyList]
  );

  /**
   * 录像播放片段-索引发生变化
   * 自动播放
   */
  const changePlayIndex = useCallback(
    (index) => {
      try {
        if (index > historyList.fragments.length - 1) {
          return playerRef.current && playerRef.current.event && playerRef.current.event.emit(EventName.HISTORY_PLAY_END);
        }
        if (!historyList.fragments[index].file) {
          return changePlayIndex(index + 1);
        }
        if (playerRef.current && playerRef.current.event) {
          playerRef.current.event.emit(EventName.CHANGE_PLAY_INDEX, index);
        }
      } catch (error) {
        // console.error('historyList data error', historyList)
      }
      setPlayIndex(index)
    },
    [historyList]
  );

  // 重装
  const reloadHistory = useCallback(() => {
    if (playStatus[0] === 0) {
      playerRef.current.api.seekTo(defaultSeekTime);
    }
    setPlayIndex(0)

    playerRef.current.event.emit(EventName.RELOAD);
  }, []);

  useEffect(() => {
    if (!file) {
      changePlayIndex(playIndex + 1);
    }

    file && playerObj && playerObj.api.setPlaybackRate(speed)

  }, [file, playIndex, historyList, speed]);

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
    [file]
  );

  useEffect(() => {
    console.info('前端录像播放...')
    if (!file) {
      return;
    }
    const playerObject = {
      playContainer: playContainerRef.current,
      video: playContainerRef.current.querySelector('video'),
      resolution: resolution,
      screenNum: screenNum,
    };
    let isInit = false;
    const formartType = getVideoType(file);
    if (formartType === 'flv' || type === 'flv') {
      isInit = true;
      playerObject.flv = createFlvPlayer(playerObject.video, { ...props,  file: decodeService({file, resolution}) });
    }else{
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
    setPlayerObj(playerObject);

    if (defaultSeekTime) {
      playerObject.api.seekHsTo(defaultSeekTime);
    }
    if (onInitPlayer) {
      onInitPlayer(Object.assign({}, playerObject.api.getApi(), playerObject.event.getApi(), { seekTo, changePlayIndex, reload: reloadHistory }));
    }
    // 倍数
    playerObject.api.setPlaybackRate(speed)
  }, [historyList, file]);

  return (
    <div className={`lm-player-container ${className}`} ref={playContainerRef}>
      <div className="player-mask-layout">
        <video autoPlay={autoPlay} preload={preload} muted={muted} poster={poster} controls={false} crossorigin={"Anonymous"} usecors={true} playsInline={playsinline} loop={loop} style={colorPicker} />
      </div>
      <VideoFTools
        defaultTime={defaultSeekTime}
        playerObj={playerObj}
        isLive={props.isLive}
        hideContrallerBar={props.hideContrallerBar}
        errorReloadTimer={props.errorReloadTimer}
        scale={props.scale}
        snapshot={props.snapshot}
        colorPicker={(value)=>{setColorPicker(value)}}
        leftExtContents={props.leftExtContents}
        leftMidExtContents={props.leftMidExtContents}
        rightExtContents={props.rightExtContents}
        rightMidExtContents={props.rightMidExtContents}
        draggable={props.draggable}
        changePlayIndex={changePlayIndex}
        reloadHistory={reloadHistory}
        historyList={historyList}
        playIndex={playIndex}
        seekTo={seekTo}
        key={file}
      />
      {children}
    </div>
  );
}

function VideoFTools({
  playerObj,
  draggable,
  isLive,
  hideContrallerBar,
  scale,
  snapshot,
  leftExtContents,
  leftMidExtContents,
  rightExtContents,
  rightMidExtContents,
  errorReloadTimer,
  changePlayIndex,
  reloadHistory,
  historyList,
  seekTo,
  playIndex,
  defaultTime,
  colorPicker
}) {
  if (!playerObj) {
    return <NoSource />;
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
            colorPicker={colorPicker}
            snapshot={snapshot}
            rightExtContents={rightExtContents}
            rightMidExtContents={rightMidExtContents}
            scale={scale}
            isHistory={true}
            isLive={isLive}
            leftExtContents={leftExtContents}
            leftMidExtContents={leftMidExtContents}
            reloadHistory={reloadHistory}
          />
          <HistoryFsLine
            defaultTime={defaultTime}
            changePlayIndex={changePlayIndex}
            historyList={historyList}
            playIndex={playIndex}
            seekTo={seekTo}
            api={playerObj.api}
            event={playerObj.event}
          />
        </ContrallerEvent>
      )}
      <ErrorEvent
        changePlayIndex={changePlayIndex}
        playIndex={playIndex}
        isHistory={true}
        flv={playerObj.flv}
        hls={playerObj.hls}
        api={playerObj.api}
        event={playerObj.event}
        errorReloadTimer={errorReloadTimer}
      />
      <PlayEnd event={playerObj.event} changePlayIndex={changePlayIndex} playIndex={playIndex} />
    </>
  );
}

FPlayer.propTypes = {
  historyList: PropTypes.object.isRequired, //播放地址 必填
  errorReloadTimer: PropTypes.number, //视频错误重连次数
  type: PropTypes.oneOf(['flv', 'hls', 'native']), //强制视频流类型
  onInitPlayer: PropTypes.func,
  isDraggable: PropTypes.bool,
  isScale: PropTypes.bool,
  muted: PropTypes.string,
  autoPlay: PropTypes.bool,
  playsInline: PropTypes.bool,
  preload: PropTypes.string,
  poster: PropTypes.string,
  loop: PropTypes.bool,
  defaultTime: PropTypes.number,
  className: PropTypes.string,
  playsinline: PropTypes.bool,
  children: PropTypes.any,
  rightExtContents: PropTypes.element,
  rightMidExtContents: PropTypes.element,
  leftExtContents: PropTypes.element,
  leftMidExtContents: PropTypes.element,
  flvOptions: PropTypes.object,
  flvConfig: PropTypes.object,
};
FPlayer.defaultProps = {
  draggable: true,
  scale: true,
  errorReloadTimer: 5,
  muted: 'muted',
  autoPlay: true,
  playsInline: false,
  preload: 'auto',
  loop: false,
  defaultTime: 0,
  historyList: { beginDate: 0, duration: 0, fragments: [] },
};

export default FPlayer;
