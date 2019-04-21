import Taro, { Component } from "@tarojs/taro"
import { View, Image, Text } from "@tarojs/components"
import { toFixed } from '@utils/format'
import PropTypes from 'prop-types'
import './index.scss'

export default class RankingList extends Component {
  constructor() {
    super(...arguments)
  }

  static defaultProps = {
    topList: []
  }

  handleClick(item) {
    Taro.setStorage({
      key: 'topList',
      data: item
    })
    Taro.navigateTo({
      url: `/pages/ranking/ranking?id=${item.id}`
    })
  }

  render() {
    const formatUrl = url => url.replace('http:', 'https:')
    const list = this.props.topList.map(item => {
      const songList = item.songList.map((song, index) => {
        return (
          <View 
            className='song-item'
            key={song.songname}
          >
            <Text>{index + 1} </Text>
            <Text className='song-name'>{song.songname}</Text>
            <Text> - {song.singername}</Text>
          </View>
        )
      })
      let count = toFixed(item.listenCount / 10000, 1)
      count += /\./.test(count) ? '' : '.0'
      return (
        <View 
          key={item.id} 
          className='list-item flex-box'
          onClick={this.handleClick.bind(this, item)}
        >
          <View 
            className='cover-box'
          >
            <Image 
              className='cover-img'
              src={formatUrl(item.picUrl)}
            />
            <View 
              className='listen-count'
            >
              <Text className='icon-headset' />
              <Text className='count-text'>{count}万</Text>
            </View>
          </View>
          <Text className='topic-arrow'></Text>
          <View 
            className='rank-list'
          >
            <View className='top-title'>{item.topTitle}</View>
            {songList}
          </View>
        </View>
      )
    })
    return (
      <View className='ranking'>{list}</View>
    )
  }
}

RankingList.propTypes = {
  topList: PropTypes.array
}
