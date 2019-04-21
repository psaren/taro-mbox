// eslint-disable-next-line import/prefer-default-export
export const toFixed = (num, s) => {
  const times = Math.pow(10, s)
  let des = num * times + 0.5
  des = parseInt(des, 10) / times
  return des + ''
}

/**
 * 日期格式化函数
 * @param {date} datetime 
 * @param {string} formatStr 
 * @return {string}
 */
export const dateFormat = (datetime, formatStr) => {
  let dat = datetime
  let str = formatStr
  if(!(dat instanceof Date)) {
    dat = new Date(dat)
  }
  let Week = ['日', '一', '二', '三', '四', '五', '六']
  str = str.replace(/yyyy|YYYY/, dat.getFullYear())
  str = str.replace(/yy|YY/, (dat.getYear() % 100) > 9 ? (dat.getYear() % 100).toString() : '0' + (dat.getYear() % 100))
  str = str.replace(/MM/, dat.getMonth() >= 9 ? (dat.getMonth() + 1).toString() : '0' + (dat.getMonth() + 1))
  str = str.replace(/M/g, (dat.getMonth() + 1))
  str = str.replace(/w|W/g, Week[dat.getDay()])
  str = str.replace(/dd|DD/, dat.getDate() > 9 ? dat.getDate().toString() : '0' + dat.getDate())
  str = str.replace(/d|D/g, dat.getDate())
  str = str.replace(/hh|HH/, dat.getHours() > 9 ? dat.getHours().toString() : '0' + dat.getHours())
  str = str.replace(/h|H/g, dat.getHours())
  str = str.replace(/mm/, dat.getMinutes() > 9 ? dat.getMinutes().toString() : '0' + dat.getMinutes())
  str = str.replace(/m/g, dat.getMinutes())
  str = str.replace(/ss|SS/, dat.getSeconds() > 9 ? dat.getSeconds().toString() : '0' + dat.getSeconds())
  str = str.replace(/s|S/g, dat.getSeconds())
  return str
}

export const getUrlParams = (queryString) => {
  var url = queryString || window.location.href
  var theRequest = {}
  if (url.indexOf("?") > 0) {
     const str = url.substr(url.indexOf('?') + 1)
     let strs = str.split("&")
     for(var i = 0; i < strs.length; i ++) {
        theRequest[strs[i].split("=")[0]]=(strs[i].split("=")[1])
     }
  }
  return theRequest;
}

// 字符串转义HTML实体
export const decodeHTML = (encodedString) => {
	return encodedString.replace(/&#(\d+);/gi, (match, numStr) => {
		const num = parseInt(numStr, 10);
		return String.fromCharCode(num);
	}).replace(/&#x([a-z0-9]+);/gi, (match, hexStr) => {
		return String.fromCharCode(`0x${hexStr}`);
	});
};

/**
 * '01:01.24' => 61240
 * @param {string} str 
 * @return {number} millisecond 
 */
export const toMillisecond = str => {
  const a = str.split(':')
  return +a[0] * 60 * 1000 + a[1] * 1000
}
