import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image, Button, Audio } from '@tarojs/components'
import { decodeHTML, toMillisecond } from '@utils/format'
import { Dialog, Indicator, NotFound } from '@components'
import { chunk } from '@utils/array'
import { getTracks, getTaogeVkey, getTopListInfo, getLrc } from '@utils/request'
import { HOST, CLIENT_ENV } from '@utils/common'
import './index.scss'
import initTracks from './track'

export default class Index extends Component {
  config = {
    navigationBarTitleText: '歌单'
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
      albumDesc: '',
      intro: '',
      fixedTop: false,
      hasAudioError: false,
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
    const topList = Taro.getStorageSync('topList')
    const { id } = this.$router.params
    if(!id) {
      this.setState({
        notFound: true
      })
      return
    }
    if(topList && topList.data) {
      this.setState({
        listName: topList.data.topTitle
      })
    }
    const rankList = await getTopListInfo(id, 'taoge')
    const resp = await getTracks(rankList.songList, 'taoge')
    const tracks = resp.req_1.data.tracks
    const len = tracks.length
    if(len < 50) {
      this.setState({
        total: len,
        mid: tracks[0].mid,
        topListInfo: rankList.toplistInfo,
        loading: false,
        tracks: tracks,
        listName: rankList.toplistInfo.dissname,
        albumDesc: rankList.albumDesc,
        intro: rankList.intro
      })
    } else {
      // 将tracks分成50首歌一个数组
      const tracksChunk = chunk(tracks, 50)
      // 分块去设置tracks（一次性设置weapp会报错）
      const setTracks = (item) => {
        return new Promise(resolve => {
          this.setState(prevState => {
            const list = prevState.tracks.length === 1 
                        ? item 
                        : prevState.tracks.concat(item)
            return {
              tracks: list
            }
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
        listName: rankList.toplistInfo.dissname,
        albumDesc: rankList.albumDesc,
        intro: rankList.intro
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

  getAudioCtx() {
    if(CLIENT_ENV !== 'h5') {
      return Taro.createAudioContext('myAudio')
    } 
    return document.querySelector('#myAudio')
  }

  getAlbum() {
    return this.state.topListInfo.logo
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
    if(resp.lyric) {
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
    const resp = await getTaogeVkey(songList)
    const midurlinfo = resp.req_0.data.midurlinfo.concat(resp.req_1.data.midurlinfo)
    if(midurlinfo.length < 50) {
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
    const { playing, audioIndex, playUrl } = this.state
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
    if(playUrl[item.mid]) {
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
    const { topListInfo, albumDesc, audio, loading, intro, fixedTop, playing, notFound } = this.state
    const playImg = `${HOST}/imgs/${playing ? 'stop' : 'play'}.png`
    
    let introEl = null
    if(intro !== '') {
      introEl = intro.map((item, index) => {
        return (
          <View 
            className='info-line'
            key={index+1}
          >
            {decodeHTML(item)}
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
      return (
        <View
          key={item.mid}
          className={this.getClsName('song-list', item.index)}
          onClick={this.handleClick.bind(this, item)}
        >
          <View 
            className='song-name-box'
          >
            <Text className={this.getClsName('song-name', item.index)}>{item.name}</Text>
          </View>
          <View
            className={this.getClsName('song-info', item.index)} 
          >
            <Text>{singer}</Text>
            {item.subtitle && <Text> - {item.subtitle}</Text>}
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

    return (
      <View className='ranking'>
        <View className={'info-box' + (fixedTop ? ' fixed-top' : '')}>
          <View
            className='info-text'
          >
            <View className='list-name'>{this.state.listName}</View>
            <View 
              className='head-img-box'
            >
              <Image 
                className='head-img'
                src={topListInfo.headurl} 
              />
              <Text 
                className='nickname'
              >
                {topListInfo.nickname}
              </Text>
            </View>
            <View className='album-desc'>
              {albumDesc}
            </View>
          </View>
          <Image 
            className='song-album-img'
            src={this.getAlbum(list[0].album.mid)}
          />
          <Image 
            className='song-album-img-bg'
            src={this.getAlbum(list[0].album.mid)}
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
            <View className='section-title'>歌单 共{this.state.total}首</View>
            {songList}
          </View>
        }
        <View className='info'>
          <View 
            className='info-header'
          >
            歌单简介
          </View>
          {introEl}
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
          closeOnClickMask
          show={this.state.showDialog} 
          message={this.state.dialogMessage}
          onClose={this.closeDialog.bind(this)}
          onCancel={this.closeDialog.bind(this)}
          onConfirm={this.closeDialog.bind(this)}
        />
        {notFound && <NotFound message='歌单不存在' />}
      </View>
    )
  }
}
