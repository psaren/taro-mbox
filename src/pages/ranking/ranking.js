import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image, Button, Audio } from '@tarojs/components'
import { decodeHTML, toMillisecond } from '@utils/format'
import { Dialog, Indicator, UpdateIcon, NotFound } from '@components'
import { chunk } from '@utils/array'
import { HOST, CLIENT_ENV } from '@utils/common'
import { getTracks, getVkey, getTopListInfo, getLrc } from '@utils/request'
import './index.scss'
import initTracks from './track'

export default class Index extends Component {
  config = {
    navigationBarTitleText: '排行榜'
  }
  
  constructor() {
    super(...arguments)
    this.state = {
      tracks: initTracks,
      total: 1,
      listName: '巅峰榜·流行指数',
      mid: initTracks[0].mid,
      audio: {
        name: '',
        author: '',
        id: '',
        type: ''
      },
      playing: false,
      midurlinfo: [],
      topListInfo: {
        listName: '',
        info: ''
      },
      played: false,
      lrcList: [],
      timeStamp: 0,
      showDialog: false,
      dialogMessage: '',
      playUrl: {},
      loading: true,
      audioIndex: 0,
      fixedTop: false,
      hasAudioError: false,
      albumDesc: ['', ''],
      albumId: '26',
      notFound: false
    }
    if(CLIENT_ENV !== 'h5') {
      this.onPageScroll = function (o) {
        if(o.scrollTop > 150) {
          !this.state.fixedTop && this.setState({
            fixedTop: true
          })
        } else {
          this.state.fixedTop && this.setState({
            fixedTop: false
          })
        }
      }
    }
  }

  async componentWillMount () {
    const topList = await Taro.getStorage({key: 'topList'})
    const { id } = this.$router.params
    if(!id) {
      this.setState({
        notFound: true
      })
      return
    }
    this.setState({
      albumId: id + ''
    })
    if(topList.errMsg === 'getStorage:ok') {
      const title = topList.data.topTitle
      this.setState({
        listName: title
      })
      this.setTitle(title)
    }
    const rankList = await getTopListInfo(id)
    const resp = await getTracks(rankList.songList)
    const tracks = resp.req_1.data.tracks
    const len = tracks.length
    for(let i = 0;i < len;i++) {
      if(tracks[i].mid === rankList.songList[i].data.songmid) {
        tracks[i].in_count = rankList.songList[i].in_count
        tracks[i].Franking_value = rankList.songList[i].Franking_value
        tracks[i].cur_count = rankList.songList[i].cur_count
        tracks[i].old_count = rankList.songList[i].old_count
      }
    }
    if(CLIENT_ENV === 'h5' || len <= 50) {
      this.setState({
        total: len,
        mid: tracks[0].mid,
        topListInfo: rankList.toplistInfo,
        loading: false,
        tracks: tracks,
        albumDesc: rankList.albumDesc
      })
    } else {
      // 将tracks分成50首歌一个数组
      const tracksChunk = chunk(tracks, 50)
      // 分块去设置tracks（一次性设置weapp会报错）
      const setTracks = (item) => {
        return new Promise(resolve => {
          this.setState(prevState => {
            let o = {
              tracks: prevState.tracks.length === 1 
                ? item 
                : prevState.tracks.concat(item)
            }
            return o
          }, () => {
            resolve()
          })
        })
      }
      
      this.setState({
        total: len,
        mid: tracks[0].mid,
        topListInfo: rankList.toplistInfo,
        loading: false,
        albumDesc: rankList.albumDesc
      }, async () => {
        for(let item of tracksChunk) {
          await setTracks(item)
        }
      })
    }
    this.getMidurlinfo(rankList.songList)
  }

  async componentDidMount () {
    this.setState({
      audioCtx: this.getAudioCtx()
    })
    if(CLIENT_ENV === 'h5') {
      this.h5HandlePageScroll()
    }
  }

  setTitle(title) {
    if(CLIENT_ENV === 'h5') {
      document.querySelector('title').innerHTML = title
    } else {
      Taro.setNavigationBarTitle({title: title})
    }
  }

  getAudioCtx() {
    if(CLIENT_ENV !== 'h5') {
      return Taro.createAudioContext('myAudio')
    } 
    return document.querySelector('#myAudio')
  }

  getAlbum() {
    const { tracks } = this.state
    const mid = tracks.length ? tracks[0].album.mid : '0000fRPth1q9r7z'
    return `https://y.gtimg.cn/music/photo_new/T002R300x300M000${mid}.jpg?max_age=2592000`
  }

  // 根据mid获取audio url
  getAudioUrl () {
    const { midurlinfo, mid } = this.state
    const currentSong = midurlinfo.find(item => item.songmid === mid)
    if(currentSong) {
      const url = `http://dl.stream.qqmusic.qq.com/${currentSong.purl}`
      return url
    }
    return ''
  }

  async handlePlay() {
    this.setState({
      playing: true,
      played: true
    })
    const {sid, type} = this.state.audio
    let resp = await getLrc(sid, type)
    resp = JSON.parse(resp.match(/({.+})/g)[0])
    if(resp.retcode != 0) {
      return '暂无歌词'
    } else {
      const str = decodeHTML(resp.lyric)
      let list = str.split('\n')
      list = list.filter(item => /^\[[0-9]{2}:[0-9]{2}\.[0-9]{2}\](.)+/.test(item))
      const lrcList = list.map(item => {
        return {
          time: toMillisecond(item.slice(1, 9)),
          context: item.slice(10)
        }
      })
      this.setState({
        lrcList
      })
    }
  }

  playAll() {
    try {
      if(this.state.played) {
        this.state.audioCtx.play()
      } else {
        const item = this.state.tracks[0]
        this.handleClick(item)
      }
    } catch(e) {
      this.handleError()
    }
  }

  stopPlay() {
    this.state.audioCtx.pause()
    this.setState({
      playing: false
    })
  }
  
  async getMidurlinfo(songList) {
    const resp = await getVkey(songList)
    const midurlinfo = resp.req_0.data.midurlinfo.concat(resp.req_1.data.midurlinfo)
    // h5 或 数量少于50直接赋值
    if(CLIENT_ENV === 'h5' || midurlinfo.length <= 50) {
      this.setState({
        midurlinfo: midurlinfo
      }, () => {
        this.setState(prevState => {
          const playUrl = {}
          prevState.midurlinfo.forEach(item => {
            playUrl[item.songmid] = item.purl
          })
          return {
            playUrl
          }
        })
      })
    } else {
      const midurlinfoChunk = chunk(midurlinfo, 50)
      const setMidUrlInfo = (item) => {
        return new Promise(resolve => {
          this.setState(prevState => ({
            midurlinfo: prevState.midurlinfo.concat(item)
          }), () => {
            resolve()
          })
        })
      }
      for(let item of midurlinfoChunk) {
        await setMidUrlInfo(item)
      }
      this.setState(prevState => {
        const playUrl = {}
        prevState.midurlinfo.forEach(item => {
          playUrl[item.songmid] = item.purl
        })
        return {
          playUrl
        }
      })
    }
  }

  handleError() {
    if(this.state.hasAudioError) {
      this.setState({
        showDialog: true,
        dialogMessage: '此歌曲为付费歌曲，请先登录'
      })
    } else {
      this.setState({
        hasAudioError: true
      })
    }
  }

  handleClick(item, e) {
    e && e.stopPropagation()
    const { playing, audioIndex } = this.state
    // 点击正在播放的歌曲，则暂停播放
    if(playing && audioIndex === item.index) {
      this.state.audioCtx.pause()
      return
    }
    const singer = item.singer
                     .map(s => {
                        return s.name
                      })
                      .join('/')
    // 检测是否获取到purl,获取不到弹窗提示
    if(this.state.playUrl[item.mid] !== '') {
      this.setState({
        mid: item.mid,
        audioIndex: item.index,
        audio: {
          name: item.name,
          author: singer,
          sid: item.id,
          type: item.type,
        }
      }, () => {
        this.state.audioCtx.play()
      })
    } else {
      this.setState({
        showDialog: true,
        dialogMessage: '此歌曲为付费歌曲，请先登录'
      }, () => {
        this.state.audioCtx.pause()
      })
    }
  }

  hancleClickPlay() {
    if(this.state.playing) {
      this.stopPlay()
    } else {
      this.playAll()
    }
  }

  handlePlayEnd() {
    this.playNext()
  }

  playNext() {
    const {audioIndex} = this.state
    if(this.state.tracks.length > audioIndex) {
      const item = this.state.tracks[audioIndex + 1]
      item.index = audioIndex + 1
      this.handleClick(item)
    }
  }

  handleTimeUpdate(e) {
    this.setState({
      timeStamp: e.detail.currentTime * 1000
    })
  }

  handlePause() {
    this.state.playing && this.setState({
      playing: false
    })
  }

  getClsName(name, index) {
    const { playing, audioIndex } = this.state
    return name + (playing && audioIndex === index ? ` current-${name}` : '')
  }

  h5HandlePageScroll() {
    window.addEventListener('scroll', () => {
      if(window.scrollY > 150) {
        !this.state.fixedTop && this.setState({
          fixedTop: true
        })
      } else {
        this.state.fixedTop && this.setState({
          fixedTop: false
        })
      }
    })
  }

  closeDialog() {
    this.setState({
      showDialog: false
    })
  }

  render () {
    const list = this.state.tracks
    const audioUrl = this.getAudioUrl()
    const playImg = `${HOST}/imgs/${this.state.playing ? 'stop' : 'play'}.png`
    const { audio, loading, fixedTop, topListInfo, albumDesc, listName, albumId, notFound } = this.state
    let info = null
    if(topListInfo.info !== '') {
      info = topListInfo.info.split('<br>').map((item, index) => {
        return (
          <View 
            className='info-line'
            key={index}
          >
            {item}
          </View>
        )
      })
    }
    const songList = list.map((item, index) => {
      const singer = item.singer
                     .map(s => {
                        return s.name
                      })
                      .join('/')
      item.index = index
      const { Franking_value, cur_count, old_count, in_count } = item
      const iconInfo = { Franking_value, cur_count, old_count, in_count }
      return (
        <View
          key={item.mid}
          className={this.getClsName('song-list', item.index)}
          onClick={this.handleClick.bind(this, item)}
        >
          <View className='list-order'>
            <View className={'song-index' + (index < 3 ? ' song-index-top' : '')}>{index + 1} </View>
            <UpdateIcon item={iconInfo} albumId={albumId} />
          </View>
          <View className='list-info'>
            <View className={this.getClsName('song-name', item.index)}>{item.name}</View>
            <View
              className={this.getClsName('song-info', item.index)}  
            >
              <Text className={this.getClsName('singer-name', item.index)}>{singer}</Text>
              {item.subtitle && <Text> - {item.subtitle}</Text>}
            </View>
          </View>
        </View>
      )
    })
    
    const { lrcList } = this.state
    let lrcListNew = []
    for(let i = 0;i < lrcList.length;i++) {
      if(lrcList[i].time < this.state.timeStamp) {
        lrcListNew = lrcList.slice(i)
      }
    }
    const lrcEl = lrcListNew.map(item => {
      return (
        <View 
          className='lrc-line'
          key={item.time}
        >
          {item.context}
        </View>
      )
    })

    const descEl = albumDesc.map(item => {
      return <View className='update-date' key={item}>{item}</View>
    })
    return (
      <View className='ranking'>
        <View className={'info-box' + (fixedTop ? ' fixed-top' : '')}>
          <View className='info-text'>
            <View className='list-name'>{listName}</View>
            {descEl}
          </View>
          <Image 
            className='song-album-img'
            src={this.getAlbum()}
          />
          <Image 
            className='song-album-img-bg'
            src={this.getAlbum()}
          />
          <View className='play-status'>
            {this.state.played &&
              <Image 
                className='img-play'
                src={playImg} 
                onClick={this.hancleClickPlay.bind(this)}
              />
            }
            <View
              className='playing-song'
            >
              <View className='playing-song-name'>
                {audio.name}
              </View>
              <View className='lrc-box'>{lrcEl}</View>
            </View>
          </View>
          {!this.state.played && 
            <Button 
              className='btn-play-all'
              onClick={this.playAll.bind(this)}
            >
              <View className='triangle-right'></View>
              <Text>播放全部</Text>
            </Button>
          }
        </View>
        <Audio
          id='myAudio'
          className='my-audio'
          src={audioUrl}
          loop={false}
          initialTime={200000}
          name={audio.name}
          author={audio.author}
          onPlay={this.handlePlay.bind(this)}
          onPause={this.handlePause.bind(this)}
          onError={this.handleError.bind(this)}
          onEnded={this.handlePlayEnd.bind(this)}
          onTimeUpdate={this.handleTimeUpdate.bind(this)}
        />
        {loading &&
          <View className='loading-box'>
            <Indicator 
              mode='center' 
              loadingText='加载中' 
            />
          </View>
        }
        {!loading && 
          <View className={'list-box' + (fixedTop ? ' is-fixed-top' : '')}>
            <View className='section-title'>排行榜 共{this.state.total}首</View>
            {songList}
          </View>
        }
        <View className='info'>
          <View 
            className='info-header'
          >
            简介
          </View>
          {info}
        </View>
        <View className='brand'>
          <Image 
            className='brand-logo'
            src='https://y.gtimg.cn/mediastyle/mod/mobile/img/logo.svg?max_age=2592000'
          />
          <View 
            className='brand-name'
          >
            QQ音乐
          </View>
        </View>
        <Dialog 
          show={this.state.showDialog} 
          message={this.state.dialogMessage}
          closeOnClickMask
          onClose={this.closeDialog.bind(this)}
          onCancel={this.closeDialog.bind(this)}
          onConfirm={this.closeDialog.bind(this)}
        />
        {notFound && <NotFound message='获取排行榜数据错误' />}
      </View>
    )
  }
}
