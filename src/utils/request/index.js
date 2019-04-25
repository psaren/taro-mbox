import Taro from '@tarojs/taro'
import { HOST } from '@utils/common'
import { decodeHTML } from '@utils/format'
import getTrackData from './getTrackData'
import getVkeyData from './getVkeyData'

// 封装request
const doRequest = ({url, method = 'GET', config = {}, data, header, success, fail}) => {
  header = header || {}
  if(method === 'POST') {
    header = Object.assign({
      'content-type': 'application/json'
    }, header)
  }
  return new Promise((resolve, reject) => {
    Taro.request({
      url,
      method,
      data, 
      header,
      ...config
    })
    .then(res => {
      if(success && typeof success === 'function') {
        success(res.data)
      }
      resolve(res.data)
    })
    .catch(err => {
      if(fail && typeof fail === 'function') {
        fail(err)
      } else {
        reject()
      }
    })
  })
}

/**
 * 根据songlist获取歌曲id,请求排行榜数据
 * @param {array} list 
 */
export const getTracks = async (list, type) => {
  type = type || 'toplist'
  const t = Date.now()
  const url = `${HOST}/cgi-bin/musicu.fcg?_=${t}`
  const ids = []
  const types = []
  list.forEach(item => {
    ids.push(type === 'toplist' ? item.data.songid : item.songid)
    types.push(0)
  })
  getTrackData.req_1.param = {
    ids, 
    types
  }
  return await doRequest({url, data: getTrackData, method: 'POST'})
}
/**
 * 根据songlist获取歌曲id,请求播放信息数据
 * @param {array} list 
 */
export const getVkey = async (list) => {
  const t = Date.now()
  const url = `${HOST}/cgi-bin/musicu.fcg?_=${t}`
  const songmids = []
  const mp3songmid = []
  const mp3songType = []
  const mp3fileName = []
  list.forEach(item => {
    if(item.data.tryPlay) {
      mp3songmid.push(item.data.songmid)
      mp3songType.push(0)
      mp3fileName.push('RS20' + item.data.strMediaMid + '.mp3')
    } else {
      songmids.push(item.data.songmid)
    }
  })
  getVkeyData.req_0.param.songmid = songmids
  getVkeyData.req_1.param.filename = mp3fileName
  getVkeyData.req_1.param.songmid = mp3songmid
  getVkeyData.req_1.param.songType = mp3songType
  return await doRequest({url, data: getVkeyData, method: 'POST'})
}
/**
 * 根据songlist获取歌曲id,请求播放信息数据
 * @param {array} list 
 */
export const getTaogeVkey = async (list) => {
  const t = Date.now()
  const url = `${HOST}/cgi-bin/musicu.fcg?_=${t}`
  const songmids = []
  list.forEach(item => {
    songmids.push(item.songmid)
  })
  getVkeyData.req_0.param.songmid = songmids
  return await doRequest({url, data: getVkeyData, method: 'POST'})
}

// 获取推荐页面数据
export const getIndexData = async () => {
  const url = `${HOST}/musichall/fcgi-bin/fcg_yqqhomepagerecommend.fcg`
  const params = {
    _: Date.now(),
    g_tk: 1807418829,
    uin: 448544717,
    format: 'json',
    inCharset: 'utf-8',
    notice: 0,
    platform: 'h5',
    needNewCode: 1
  }
  return await doRequest({url, data: params})
}

// 获取排行榜页面数据
export const getRankingData = async () => {
  const url = `${HOST}/v8/fcg-bin/fcg_myqq_toplist.fcg`
  const params = {
    _: Date.now(),
    g_tk: 1807418829,
    uin: 448544717,
    format: 'json',
    inCharset: 'utf-8',
    notice: 0,
    platform: 'h5',
    needNewCode: 1
  }
  return await doRequest({
    url,
    data: params
  })
}
// 获取搜索热词
export const getHotKey = async () => {
  const url = `${HOST}/splcloud/fcgi-bin/gethotkey.fcg`
  const params = {
    _: Date.now(),
    g_tk: 1807418829,
    uin: 448544717,
    format: 'json',
    inCharset: 'utf-8',
    notice: 0,
    platform: 'h5',
    needNewCode: 1
  }
  return await doRequest({
    url,
    data: params
  })
}

// 搜索
export const search = async (keyword) => {
  const url = `${HOST}/soso/fcgi-bin/search_for_qq_cp`
  const params = {
    _: Date.now(),
    g_tk: 5381,
    uin: 0,
    format: 'json',
    inCharset: 'utf-8',
    outCharset: 'utf-8',
    notice: 0,
    platform: 'h5',
    needNewCode: 1,
    w: keyword,
    zhidaqu: 1,
    catZhida: 1,
    t: 0,
    flag: 1,
    ie: 'utf-8',
    sem: 1,
    aggr: 0,
    perpage: 20,
    n: 20,
    p: 1,
    remoteplace: 'txt.mqq.all'
  }
  return await doRequest({
    url,
    data: params
  })
}

 
/**
 * 根据id请求页面，解析后返回 topList info
 * @param {string} id 
 * @return {object} 包含{songList, toplistInfo}
 */
export const getTopListInfo = async (id, type) => {
  type = type || 'toplist'
  const url = `${HOST}/n/m/detail/${type}/index.html`
  const params = {
    ADTAG: 'myqq',
    from: 'myqq',
    channel: 10007100,
    id: id
  }
  const resp = await doRequest({
    url,
    data: params,
    config: {
      dataType: 'text',
      responseType: 'text'
    }
  })
  const reg = /album__desc\"\>((.)+)\<\/p\>/g
  const regIntro = /(\<p(\s)class=\"intro__para(\s)js_intro_para\"\>)((\s)+)?((.)+)((\s)+)?(\<\/p\>)/

  const matchedIntro = resp.match(regIntro)
  const albumDesc = []
  let intro = ''
  resp.replace(reg, function() {
    albumDesc.push(decodeHTML(arguments[1]))
  })
  if(matchedIntro && matchedIntro.length > 5) {
    intro = matchedIntro[6].split('<br>')
  }
  const songList = resp.match(/window\.songList\s=(.)+((\s)+)?\<\//)[0].replace('window.songList = ', '').replace('</', '')
  const info = resp.match(new RegExp(`window\.${type}Info(.)+}`))[0].replace(`window.${type}Info = `, '').replace('</', '')
  return {
    songList: JSON.parse(songList),
    toplistInfo: JSON.parse(info),
    albumDesc,
    intro
  }
}


/**
 * 获取歌词
 * @param {number} mid 
 * @param {number} type 
 */
export const getLrc = async (mid, type) => {
  const url = `${HOST}/lyric/fcgi-bin/fcg_query_lyric.fcg`
  const params = {
    format: "jsonp",
    nobase64: 1,
    musicid: mid,
    songtype: type || 0,
    g_tk: 841783719,
    uin: 448544717,
    inCharset: 'utf-8',
    outCharset: 'utf-8',
    notice: 0,
    platform: 'h5',
    needNewCode: 1,
    nobase64: 1,
    _: Date.now(),
    // jsonpCallback: 'jsonp21'
  }
  return await doRequest({
    url,
    data: params,
    config: {
      dataType: 'text',
      responseType: 'text'
    }
  })
}
