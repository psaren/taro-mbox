import Taro, { Component } from "@tarojs/taro"
import { 
  View,
  Swiper,
  SwiperItem,
  Image,
  Text,
  Icon 
} from "@tarojs/components"

import { Dialog } from "@components"

import { chunk } from '@utils/array'
import { toFixed } from '@utils/format'
import { getIndexData } from '@utils/request'

import './index.scss'

export default class Recommend extends Component {

  constructor() {
    super(...arguments)
    this.state = {
      radioList: [],
      slider: [],
      songList: [],
      showDialog: false
    }
  }

  async componentWillMount() {
    const resp = await this.getRecommendData()
    const {radioList, slider, songList} = resp.data
    this.setState({
      radioList,
      slider,
      songList
    })
  }

  getRecommendData() {
    const storageKey = 'recommend'
    const updateStorage = async () => {
      const resp = await getIndexData()
      const {radioList, slider, songList} = resp.data
      Taro.setStorage({
        key: storageKey,
        data: {radioList, slider, songList, t: Date.now()}
      })
      return resp
    }
    return new Promise((resolve) => {
      Taro.getStorage({
        key: storageKey
      })
        .then(async (resp) => {
          // Storage超过一分钟更新请求
          if(Date.now() - resp.data.t > 60 * 1000) {
            resp = await updateStorage()
          }
          resolve(resp)
        })
        .catch(async (err) => {
          console.log(err)
          const resp = await updateStorage()
          resolve(resp)
        })   
    })
  }

  clickSongList(id) {
    Taro.navigateTo({
      url: `/pages/songList/songList?id=${id}`
    })
  }

  showDialog() {
    this.setState({
      showDialog: true
    })
  }

  closeDialog() {
    this.setState({
      showDialog: false
    })
  }

  render() {
    const {slider, radioList, songList} = this.state
    const formatUrl = url => url.replace('http:', 'https:')
    const swipers = slider.map(item => {
      return (
        <SwiperItem key={item.id}>
          <View 
            className='swiper-item'
            onClick={this.showDialog.bind(this)}
          >
            <Image 
              className='swiper-img'
              src={formatUrl(item.picUrl)} 
            />
          </View>
        </SwiperItem>
      )
    })
    const getClsName = i => 'flex-1 ' + (i % 2 === 0 ? 'radio-left' : 'radio-right')
    const radios = radioList.map((radio, index) => {
      return (
        <View 
          className={getClsName(index)}
          key={radio.radioid}
          onClick={this.showDialog.bind(this)}
        >
          <View 
            className='radio-img-box'
          >
            <Image 
              className='radio-img'
              src={formatUrl(radio.picUrl)}
            />
            <Text className='icon-start'></Text>
          </View>
          <View className='ftitle'>{radio.Ftitle}</View>
        </View>
      )
    })
    const songs = chunk(songList, 2).map(item => {
      const songRow = item.map((song, index) => {
        return (
          <View 
            className={getClsName(index)}
            key={song.id}
            onClick={this.clickSongList.bind(this, song.id)}
          >
          <View 
            className='radio-img-box'
          >
            <Image 
              className='radio-img'
              src={formatUrl(song.picUrl)}
            />
            <Icon className='icon-start' />
            <View className='play-volume'>
              <Icon className='icon-headset' />
              <Text>{toFixed(song.accessnum / 10000, 1)}万</Text>
            </View>
            
          </View>
          <View className='ftitle'>{song.songListDesc}</View>
          <View className='ftitle author'>{song.songListAuthor}</View>
        </View>
        )
      })
      return (
        <View 
          key={item[0].id} 
          className='flex-box__song'
        >
          {songRow}
        </View>
      )
    })

    return (
      <View>
        <Swiper
          className='test-h'
          indicatorColor='rgba(255,255,255,.15)'
          indicatorActiveColor='#fff'
          circular
          indicatorDots
          autoplay
        >
          {swipers}
        </Swiper>
        <View className='section'>
          <View className='section-title'>电台</View>
          <View  className='flex-box__audio'>
            {radios}
          </View>
        </View>  
        <View className='section'>
          <Text className='section-title'>热门歌单</Text>
          <View>
            {songs}
          </View>
        </View>
        <Dialog 
          title='提示'
          message='请下载QQ音乐APP' 
          show={this.state.showDialog} 
          onCancel={this.closeDialog.bind(this)}
          onConfirm={this.closeDialog.bind(this)}
        />
      </View>
    )
  }
}
