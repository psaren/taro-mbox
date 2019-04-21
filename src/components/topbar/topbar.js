import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import * as actions from '@actions/activeTab'
import './index.scss'

@connect(state => state.activeTab, actions)

export default class Topbar extends Component {
  constructor() {
    super(...arguments)
    this.state = {
      activeIndex: 0
    }
  }

  static defaultProps = {
    active: 1,
    tabList: [
      {value: 0, label: '推荐'},
      {value: 1, label: '排行榜'},
      {value: 2, label: '搜索'}
    ]
  }

  componentWillMount() {
    this.setState({
      activeIndex: this.props.active 
    }, () => {
      this.props.dispatchTabChange(this.props.active)
    })
  }

  onClickTab (index) {
    this.setState({
      activeIndex: index
    }, () => {
      this.props.dispatchTabChange(index)
    })
  }

  getClsName (index) {
    return 'flex-1 tab-item' + (this.state.activeIndex === index ? ' active' : '')
  }

  render() {
    const tabs = this.props.tabList.map((tab, index) => {
      return (
        <Text 
          className={this.getClsName(index)}
          onClick={this.onClickTab.bind(this, index)}
          key={tab.value}
        >
        {tab.label}
        </Text>
      )
    })

    return (
      <View className='tab-box flex-box'>
        {tabs}
      </View>
    )
  }
}
