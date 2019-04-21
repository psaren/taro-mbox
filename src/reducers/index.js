// src/reducers/index.js
import { combineReducers } from 'redux'
import counter from './counter'
import activeTab from './activeTab'

export default combineReducers({
  counter,
  activeTab
})
