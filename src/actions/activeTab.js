// src/actions/counter.js
import { CHANGE } from '../constants/activeTab'

// eslint-disable-next-line import/prefer-default-export
export const dispatchTabChange = (index) => {
  return {
    type: CHANGE,
    payload: {
      tabIndex: index
    }
  }
}
