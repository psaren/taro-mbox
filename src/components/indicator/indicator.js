import Taro, { Component } from "@tarojs/taro"
import { View } from "@tarojs/components"
import PropTypes from 'prop-types'
import './index.scss'

export default class Indicator extends Component {
  constructor() {
    super(...arguments)
  }

  static defaultProps = {
    mode: 'normal', // normal/center
    loadingText: '',
    size: 24,
    color: '#31c27c'
  }

  render() { 
    const { mode, size, color, loadingText } = this.props
    const style = {
      borderColor: `${color} transparent transparent`,
      padding: `${size}rpx`
    }
    return (
      <View 
        className={'indicator' + (mode === 'center' ? ' indicator-center' : '')}
      >
        <View 
          className='indicator-body'
        >
          <View
            className='loading'
          >
            <View 
              className='indicator-ring indicator-ring-1'
              style={style}
            />
            <View 
              className='indicator-ring indicator-ring-2'
              style={style}
            />
            <View 
              className='indicator-ring indicator-ring-3'
              style={style}
            />
          </View>
        </View>
        {loadingText &&
          <View 
            className='indicator-content'
          >
            {loadingText}
          </View>
        }
        
      </View>
    )
  }
}

Indicator.propTypes = {
  mode: PropTypes.string, 
  loadingText: PropTypes.string,
  size: PropTypes.number,
  color: PropTypes.string
}
