// src/reducers/counter.js
import { CHANGE } from '../constants/activeTab'

const INITIAL_STATE = {
  tabIndex: 0
}

export default function activeTab (state = INITIAL_STATE, action) {
  switch (action.type) {
    case CHANGE:
      return {
        ...state,
        tabIndex: action.payload.tabIndex
      }
    default:
      return state
  }
}