import Taro, { Component } from "@tarojs/taro"
import { View, Text, Icon } from "@tarojs/components"
import PropTypes from 'prop-types'
import './index.scss'

export default class UpdateIcon extends Component {
  constructor() {
    super(...arguments)
  }

  static defaultProps = {
    albumId: '4',
    item: {
      Franking_value: '',
      old_count: '0',
      in_cound: '0',
      cur_count: '0',
    }
  }
  
  render() { 
    const { item, albumId } = this.props
    const iconNew = item.Franking_value === '0'
    const iconDown = !iconNew && (+item.cur_count > +item.old_count)
    const iconUp = !iconNew && (+item.cur_count < +item.old_count)
    const count = Math.abs(+item.cur_count - (+item.old_count))
    return (
      <View className='update-icon'>
        { albumId !== '4' && 
          <View className='inline-box'>
            {iconNew && 
              <Icon className='icon-new' />
            }
            {iconUp && 
              <Icon className='icon-go-up' />
            }
            {iconDown && 
              <Icon className='icon-go-down' />
            }
            {(iconUp || iconDown) &&
              <Text className='count-num'>{ count }</Text>
            }
            {!(iconNew || iconUp || iconDown) &&
              <Icon className='icon-unchange' />
            }
          </View>
        }
        { albumId === '4' && 
          <View className='inline-box'>
            <Icon className='icon-curved-up' />
            {Math.floor(item.in_count * 100)}%
          </View>
        }
      </View>
    )
  }
}

UpdateIcon.propTypes = {
  albumId: PropTypes.string,
  item: PropTypes.object
}
