import Taro, { Component } from "@tarojs/taro"
import { View, Text, Input, Icon, Image } from "@tarojs/components"
import { connect } from '@tarojs/redux'
import { getHotKey, search } from '@utils/request'
import { HOST } from '@utils/common'
import * as actions from '@actions/counter'
import { Indicator, Dialog } from '@components'

import './index.scss'

@connect(state => state.counter, actions)

export default class Search extends Component {

  constructor() {
    super(...arguments)
    this.state = {
      isInit: false,
      isFocus: false,
      hotword: {
        hotkey: []
      },
      keyword:'',
      showClear: false,
      searchList: [],
      historyWords: [],
      zhida: {
        type: 0
      },
      showDialog: false
    }
  }

  async componentWillMount() { 
    const resp = await getHotKey()
    const { data } = resp
    this.setState({
      hotword: data,
      isInit: true
    })
    Taro.getStorage({key: 'keyword'})
      .then(res => {
        this.setState({
          historyWords: res.data
        })
      })
  }

  onFocus() {
    this.setState({
      isFocus: true
    }, () => {
      if(this.state.keyword) {
        this.setState({
          showClear: true
        })
      }
    })
  }

  async onCancel() {
    this.setState({
      searchList: [],
      showClear: false,
      keyword: ''
    })
    await this.inputBlur()
  }

  handleInput(el) {
    const value = el.target.value.trim()
    if(value === '') {
      this.state.showClear && this.setState({
        showClear: false
      })
    } else {
      this.setState({
        keyword: value
      })
      !this.state.showClear && this.setState({
        showClear: true
      })
    }
  }

  onClear(e) {
    e.stopPropagation()
    this.setState({
      keyword: '',
      showClear: false,
      searchList: [],
      isFocus: true
    })
  }

  inputBlur() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.setState({
          isFocus: false
        }, resolve)
      }, 10)
    })
  }

  async handleConfirm() {
    const { keyword } = this.state
    if(keyword.trim() === '') {
      return
    }
    const resp = await search(keyword)
    if(keyword !== '' && resp.data.zhida.type !== 0) {
      Taro.getStorage({
        key: 'keyword'
      })
        .then(res => {
          let words = res.data
          if(words.indexOf(keyword) < 0) {
            words.unshift(keyword)
            words = words.slice(0, 7)
            this.setState({
              historyWords: words
            })
            Taro.setStorage({
              key: 'keyword',
              data: words
            })
          }
        })
        .catch(() => {
          Taro.setStorage({
            key: 'keyword',
            data: [keyword]
          })
        })
    }
    this.setState({
      isFocus: true,
      showClear: true,
      zhida: resp.data.zhida,
      searchList: resp.data.song.list.slice(0, 4)
    })
  }

  clearHistory() {
    this.setState({
      historyWords: []
    }, () => {
      Taro.setStorage({key: 'keyword', data: []})
    })
  }

  searchHistory(index) {
    this.setState({
      keyword: this.state.historyWords[index]
    }, () => {
      const words = [].concat(this.state.historyWords)
      words.splice(index, 1)
      this.setState({
        historyWords: words
      })
      Taro.setStorage({
        key: 'keyword',
        data: words
      })
        .then(() => {
          this.handleConfirm()
        })
    })
  }

  searchTag(tag) {
    const tagWord = tag.trim()
    this.setState({
      keyword: tagWord
    }, () => {
      // 判断点击的tag是否已经存在搜索历史，不存在则添加，已存在直接搜索
      if(!this.state.historyWords.includes(tagWord)) {
        let words = [tagWord].concat(this.state.historyWords)
        words = words.slice(0, 7)
        this.setState({
          historyWords: words
        })
        Taro.setStorage({
          key: 'keyword',
          data: words
        })
          .then(() => {
            this.handleConfirm()
          })
      } else {
        this.handleConfirm()
      }
    })
  }

  deleteHistory(index, e) {
    e.stopPropagation()
    const words = [].concat(this.state.historyWords)
    words.splice(index, 1)
    this.setState({
      historyWords: words
    }, () => {
      Taro.setStorage({key: 'keyword', data: words})
    })
  }

  getImgUrl(i, id) {
    return `https://y.gtimg.cn/music/photo_new/T00${i}R68x68M000${id}.jpg?max_age=2592000`
  }

  searchMore() {
    this.setState({
      showDialog: true
    })
  }

  closeDialog() {
    this.setState({
      showDialog: false
    })
  }

  showDialog() {
    this.setState({
      showDialog: true
    })
  }

  render() {
    const hotWord = this.state.hotword
    const {searchList, isInit, historyWords, isFocus, showDialog, showClear, keyword, zhida } = this.state
    // 获取前八个热搜词
    let tagList = hotWord.hotkey.slice(0, 8).map(item => {
      return (
        <Text 
          key={item.n}
          className='search-tag'
          onClick={this.searchTag.bind(this, item.k)}
        >
          {item.k}
        </Text>
      )
    })

    const searchListEl = searchList.map(item => {
      const singer = item.singer
                     .map(s => {
                        return s.name
                      })
                      .join('/')
      return (
        <View 
          className='search-list-item'
          key={item.songid}
          onClick={this.showDialog.bind(this)}
        >
          <Icon className='icon-music'></Icon>
          <View className='flex-1 name-box ellipsis'>
            <View className='songname'>{item.songname}</View>
            <View className='singer-name'>{singer}</View>
          </View>
        </View>
      )
    })
    
    const historyList = historyWords.map((item, index) => {
      return (
        <View 
          key={item}
          className='keyword-item'
          onClick={this.searchHistory.bind(this, index)}
        >
          <Icon className='icon-clock'></Icon>
          <View className='flex-1'>{item}</View>
          <View
            className='close-btn'
            onClick={this.deleteHistory.bind(this, index)}
          >
            <Image
              className='icon-close'
              src={`${HOST}/imgs/close.svg`} 
            />
          </View>
          
        </View>
      )
    })
    let zhidaType = null
    if(zhida.type === 2) {
      
      zhidaType = (
        <View className='zhida'>
          <View>
            <View className='avatar'>
              <Image
                src={this.getImgUrl(1, zhida.singermid)}
                className='avatar-img'
              />
            </View>
            <View 
              className='zhida-singer-name'
            >
              {zhida.singername}
            </View>
            <View 
              className='zhida-album'
            >
              <Text className='songnum'>单曲 {zhida.songnum}</Text>
              <Text className='albumnum'>专辑 {zhida.albumnum}</Text>
            </View>

          </View>
        </View>
      )
    } else if(zhida.type === 3) {
      zhidaType = (
        <View 
          className='zhida'
        >
          <View className='cover'>
            <Image 
              className='cover-img'
              src={this.getImgUrl(2, zhida.albummid)} 
            />
          </View>
          <View 
            className='zhida-album'
          >
            <View className='album-name'>{zhida.albumname}</View>
            <View className='singer-name'>{zhida.singername}</View>
          </View>
        </View>
      )
    } else {
      zhidaType = null
    }

    return (
      <View className='search'>
        <View 
          className='search-box'
        >
          <Input 
            onFocus={this.onFocus.bind(this)}
            onInput={this.handleInput.bind(this)}
            onChange={this.handleConfirm.bind(this)}
            type='text' 
            className={'search-input' + (isFocus ? ' search-input-active' : '')}
            placeholderClass='search-input-holder'
            placeholder='搜索歌曲、歌单、专辑' 
            value={keyword}
            confirmType='search'
          />
          <Icon 
            className='icon-search'
            size='16' 
            type='search'
            color='rgba(0,0,0,.3)'
          />
          {showClear && <Icon 
            className='icon-clear'
            size='16' 
            type='clear' 
            color='#b1b1b1'
            onClick={this.onClear.bind(this)} 
          />
          }
          {isFocus && 
            <Text 
              className='search-cancel'
              onClick={this.onCancel.bind(this)}
            >
              取消
            </Text>
          }
        </View>
        {!isFocus &&
          <View 
            className='search-tag-box'
          >
            <View className='search-hot-word'>热门搜索</View>
            {isInit && 
              <View>
                <Text 
                  className='search-tag search-tag-specail'
                  onClick={this.showDialog.bind(this)}
                >
                  {hotWord.special_key}
                </Text>
                {tagList}
              </View>
            }
            {!isInit &&
              <Indicator mode='center' />
            }
        </View>
        }
        {isFocus && searchList.length === 0 && 
          <View className='history-list'>
            {historyList}
            <View className='clear-history'>
            {historyWords.length > 0 && 
              <Text 
                className=''
                onClick={this.clearHistory.bind(this)}
              >
                清除搜索历史
              </Text>
            }
            </View>
          </View>
        }
        {isFocus && searchList.length > 0 && 
          <View>
            {zhidaType}
            {searchListEl}
            <View 
              className='search-more'
              onClick={this.searchMore.bind(this)}
            >
              点击搜索更多结果
            </View>
          </View>
        }
        <Dialog 
          message='请下载QQ音乐APP' 
          show={showDialog}
          onCancel={this.closeDialog.bind(this)}
          onConfirm={this.closeDialog.bind(this)} 
        />
      </View>
    )
  }
}