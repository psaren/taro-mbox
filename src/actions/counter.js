// src/actions/counter.js
import {
  ADD,
  MINUS
} from '../constants/counter'

export const dispatchAdd = (index) => {
  return {
    type: ADD
  }
}
export const dispatchMinus = () => {
  return {
    type: MINUS
  }
}

// 异步的 action
export function dispatchAsyncAdd () {
  return dispatch => {
    setTimeout(() => {
      dispatch(dispatchAdd())
    }, 2000)
  }
}
