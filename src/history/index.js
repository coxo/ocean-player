import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import HPlayer from './hPlayer';
import FPlayer from './fPlayer';
import { getVideoType} from '../util';

function HistoryPlayer({ type, historyList, defaultTime, className, autoPlay, muted, poster, playsinline, loop, preload, children, onInitPlayer, screenNum, speed, seekFrontRangeData, ...props }) {
  const formartType = useMemo(() => {
    try {
      const fragment = historyList.fragments.find((item)=> {
        if(item.file) return item
      })
      return getVideoType(fragment.file);
    } catch (error) {
      return ''
    }
  }, [historyList]);

  const Player = formartType === 'flv'? FPlayer: HPlayer

  return <Player type={type} historyList={historyList} defaultTime={defaultTime} className={className} 
  autoPlay= {autoPlay}
  muted ={muted}
  poster ={poster}
  playsinline ={playsinline}
  loop ={loop}
  preload ={preload}
  children ={children}
  onInitPlayer ={onInitPlayer}
  screenNum ={screenNum}
  seekFrontRangeData={seekFrontRangeData}
  speed  ={speed}
  {...props }></Player>
}

HistoryPlayer.propTypes = {
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
HistoryPlayer.defaultProps = {
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

export default HistoryPlayer;
