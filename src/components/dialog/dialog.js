import Taro, { Component } from "@tarojs/taro"
import { View, Text } from "@tarojs/components"
import PropTypes from 'prop-types'
import { isFunction } from '@utils/common'
import './index.scss'

export default class Dialog extends Component {
  constructor(props) {
    super(...arguments)
    const { show } = props
    this.state = {
      open: show
    }
  }

  static defaultProps = {
    message: '',
    cancelText: '取消',
    confirmText: '确定',
    showButton: true,
    show: true,
    onCancel: () => {},
    onConfirm: () => {},
    onClose: () => {},
  }

  componentWillReceiveProps(nextProps) {
    const { show } = nextProps
    if(show !== this.state.open) {
      this.setState({
        open: show
      })
    } 
  }

  handleCancle() {
    isFunction(this.props.onCancel) && this.props.onCancel()
  }

  handleConfirm() {
    isFunction(this.props.onConfirm) && this.props.onConfirm()
  }

  handleClose() {
    isFunction(this.props.onClose) && this.props.onClose()
  }

  handleClickMask() {
    if(this.props.closeOnClickMask) {
      this.setState({
        open: false
      }, this.handleClose)
    }
  }

  render() { 
    const { title, message, cancelText, confirmText, showButton } = this.props
    return (
      <View className={'dialog' + (this.state.open ? ' dialog-show' : '')}>
        <View 
          className='dialog-mask'
          onClick={this.handleClickMask.bind(this)}
        >
          <View
            className='dialog-content'
          >
            {title &&
              <View
                className='dialog-title'
              >
                {title}
              </View>
            }
            <View className='dialog-message'>{message}</View>
            {showButton && 
              <View className='flex-box'>
                <Text 
                  className='dialog-btn cancel-btn'
                  onClick={this.handleCancle.bind(this)}
                >
                  {cancelText}
                </Text>
                <Text 
                  className='dialog-btn confirm-btn'
                  onClick={this.handleConfirm.bind(this)}
                >
                  {confirmText}
                </Text>
              </View>
            }
          </View>
        </View>
      </View>
    )
  }
}

Dialog.propTypes = {
  title: PropTypes.string,
  show: PropTypes.bool,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
  message: PropTypes.string,
  cancelText: PropTypes.string,
  confirmText: PropTypes.string,
  showButton: PropTypes.bool,
  closeOnClickMask: PropTypes.bool
}
