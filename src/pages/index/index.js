import Taro, { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { Topbar, Recommend, RankingList, Search } from '@components'
import { connect } from '@tarojs/redux'
import { getRankingData } from '@utils/request'

import './index.scss'

@connect(state => state.activeTab, {})
export default class Index extends Component {

  config = {
    navigationBarTitleText: '首页'
  }

  constructor() {
    super(...arguments)
    this.state = {
      topList: [],
      tabIndex: 0
    }
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      tabIndex: nextProps.tabIndex
    })
  }

  async componentWillMount () { 
    const resp = await getRankingData()
    const { topList } = resp.data
    this.setState({
      topList
    })
  }

  componentDidMount () { }

  componentWillUnmount () { }

  componentDidShow () { }

  componentDidHide () { }

  render () {
    const { tabIndex } = this.state
    return (
      <View className='index'>
        <Topbar active={0} />
        {tabIndex === 0 && <Recommend />}
        {tabIndex === 1 && <RankingList topList={this.state.topList} />}
        {tabIndex === 2 && <Search />}
      </View>
    )
  }
}
