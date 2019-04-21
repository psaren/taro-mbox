
import Taro, { Component } from "@tarojs/taro"
import { View, Text, Image } from "@tarojs/components"
import { HOST } from "@utils/common"
import PropTypes from 'prop-types'

import './index.scss'

export default class NotFound extends Component {
  constructor() {
    super(...arguments)
    this.state = {
      count: 10,
      goHome: false
    }
    this.timer = null
  }
  static defaultProps = {
    message: ''
  }

  componentWillMount() {
    this.timer = setInterval(() => {
      const { count } = this.state
      if(count > 0) {
        const num = count - 1
        // 下面一行的写法在 H5无效
        // this.setState(prevState => ({ count: prevState.count + 1 }))
        this.setState({count: num}, () => {
          if(this.state.count === 0) {
            this.goToHome()
          }
        })
      } else {
        clearInterval(this.timer)
      }
    }, 1000)
  }

  goToHome() {
    if(!this.state.goHome) {
      this.setState({
        goHome: true
      })
      Taro.navigateTo({url: '/pages/index/index'})
    }
  }

  render() {
    const { message } = this.props
    const { count } = this.state
    return (
      <View className='not-found'>
        <View>
          <Image className='cry-img' src={`${HOST}/imgs/cry.svg`} />
        </View>
        <View>{message}</View>
        <View>去<Text className='text-active' onClick={this.goToHome.bind(this)}>音乐馆</Text>发现喜欢的音乐({count})</View>
      </View>  
    )
  }
}

NotFound.propTypes = {
  message: PropTypes.string
}
