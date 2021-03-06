
/**
 * CLIENT_ENV 是在 config 中通过 defineConstants 配置的
 */
/* eslint-disable */
export const CLIENT_ENV = clientEnv
/* eslint-disable */

// 资源请求域名
export const HOST = CLIENT_ENV === 'h5' ? '' : 'https://mbox.fontend.com'
export const getType = o => {
  return Object.prototype.toString.call(o).slice(8, -1).toLowerCase()
}
export const isFunction = (o) => {
  return getType(o) === 'function'
}
export const isArray = (o) => {
  return getType(o) === 'array'
}
export const isObject = (o) => {
  return getType(o) === 'object'
}
