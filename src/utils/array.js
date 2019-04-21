/**
 * 数组切片
 * @param {array} arr 
 * @param {number} num 
 */
// eslint-disable-next-line import/prefer-default-export
export const chunk = (arr, num) => {
  let len = arr.length
  if(typeof num !== 'number' || len <= num ) {
    return arr
  }
  let ans = []
  for(let i = 0; i < len;i += num) {
    ans.push(arr.slice(i, i + num))
  }
  return ans
}
