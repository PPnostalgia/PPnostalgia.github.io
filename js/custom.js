<link rel="stylesheet" class="aplayer-secondary-style-marker" href="\assets\css\APlayer.min.css"><script src="\assets\js\APlayer.min.js" class="aplayer-secondary-script-marker"></script>/*
if (GLOBAL_CONFIG_SITE.title.replace('温泉', '') === '') {
  document.getElementById('page-name-text').style.display = 'none'
} else {
  document.getElementById('page-name-text').innerHTML = GLOBAL_CONFIG_SITE.title.replace('温泉', '')
}
*/
//if (!document.getElementById('post-comment') && document.getElementById('comment-button')) document.getElementById('comment-button').style.display = 'none'

/*
if (document.getElementById('post-cover-img')) {
  let list = []
  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      for (let k = 0; k <= 5; k++) {
        list.push(`rgb(${i},${j},${k})`)
        list.push(`rgb(${255 - i},${255 - j},${255 - k})`)
      }
    }
  }
  RGBaster.colors(document.getElementById('post-cover-img').getAttribute('src'), {
    paletteSize: 30,
    exclude: list,
    success: function (payload) {
      const c = payload.dominant.match(/\d+/g);
      const grayLevel = c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114;
      document.styleSheets[0].addRule(':root', '--main: ' + payload.dominant)
      document.styleSheets[0].addRule(':root', '--second: ' + (grayLevel >= 192 ? '#000' : '#fff'))
      document.styleSheets[0].addRule(':root', `--main-light: rgba(${c[0]}, ${c[1]}, ${c[2]}, .4)`)
      document.styleSheets[0].addRule(':root', `--main-shadow: 0 8px 12px -3px rgba(${c[0]}, ${c[1]}, ${c[2]}, .2)`)
      document.styleSheets[0].addRule(':root', '--cover-text: ' + (grayLevel >= 192 ? '#4c4948' : '#eee'))
      document.styleSheets[0].addRule(':root', `--cover-bg: rgba(${c[0]}, ${c[1]}, ${c[2]})`)
    }
  })
} else {
  document.styleSheets[0].addRule(':root', '--main: #49B1F5')
  document.styleSheets[0].addRule(':root', '--second: #fff')
  document.styleSheets[0].addRule(':root', `--main-light: rgba(73, 177, 245, .4)`)
  document.styleSheets[0].addRule(':root', '--main-shadow: 0 8px 12px -3px rgba(73, 177, 245, .2)')
}

/*
document.styleSheets[0].addRule('[data-theme="dark"]', '--main: #5c5c5c !important')
document.styleSheets[0].addRule('[data-theme="dark"]', '--second: #eee !important')
document.styleSheets[0].addRule('[data-theme="dark"]', `--main-light: rgba(92, 92, 92, .4) !important`)
document.styleSheets[0].addRule('[data-theme="dark"]', `--main-shadow: 0 8px 12px -3px rgba(92, 92, 92, .2) !important`)
*/
/*
function catalogActive (type) {
  let path = window.location.pathname;
  path = decodeURIComponent(path)
  let pattern = type == 'tags' ? /\/tags\/.*?\// : /\/categories\/.*?\//;
  if (pattern.test(path)) {
    if (document.querySelector('#catalog-list')) {
      document.getElementById(path.split("/")[2]).classList.add("selected")
      // 鼠标滚轮滚动
      let xscroll = document.getElementById("catalog-list")
      xscroll.addEventListener("mousewheel", function (e) {
        //计算鼠标滚轮滚动的距离
        let v = -e.wheelDelta / 2;
        xscroll.scrollLeft += v;
        //阻止浏览器默认方法
        e.preventDefault();
      }, false);
    }
  }
}
catalogActive('categories')
catalogActive('tags')
*/
function copyContentFn (ctx) {
  if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
    if (GLOBAL_CONFIG.Snackbar !== undefined) {
      btf.snackbarShow(GLOBAL_CONFIG.copy.success)
    } else {
      const prevEle = ctx.previousElementSibling
      prevEle.innerText = GLOBAL_CONFIG.copy.success
      prevEle.style.opacity = 1
      setTimeout(() => { prevEle.style.opacity = 0 }, 700)
    }
  } else {
    if (GLOBAL_CONFIG.Snackbar !== undefined) {
      btf.snackbarShow(GLOBAL_CONFIG.copy.noSupport)
    } else {
      ctx.previousElementSibling.innerText = GLOBAL_CONFIG.copy.noSupport
    }
  }
}

function copyClickFn (text, ctx) {
  if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
    document.execCommand('copy')
    if (GLOBAL_CONFIG.Snackbar !== undefined) {
      btf.snackbarShow(GLOBAL_CONFIG.copy.success)
    } else {
      const prevEle = ctx.previousElementSibling
      prevEle.innerText = GLOBAL_CONFIG.copy.success
      prevEle.style.opacity = 1
      setTimeout(() => { prevEle.style.opacity = 0 }, 700)
    }
  } else {
    if (GLOBAL_CONFIG.Snackbar !== undefined) {
      btf.snackbarShow(GLOBAL_CONFIG.copy.noSupport)
    } else {
      ctx.previousElementSibling.innerText = GLOBAL_CONFIG.copy.noSupport
    }
  }
}

function postUrlCopyFn (ele) {
  const $buttonParent = ele.parentNode
  $buttonParent.classList.add('copy-true')
  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents($buttonParent.querySelectorAll('#post-url')[0])
  selection.removeAllRanges()
  selection.addRange(range)
  const text = selection.toString()
  copyClickFn(text, ele.prevEle)
  selection.removeAllRanges()
  $buttonParent.classList.remove('copy-true')
}

function switchReadMode () { // read-mode
  const $body = document.body
  $body.classList.add('read-mode')
  const newEle = document.createElement('button')
  newEle.type = 'button'
  newEle.className = 'fas fa-sign-out-alt exit-readmode'
  $body.appendChild(newEle)

  function clickFn () {
    $body.classList.remove('read-mode')
    newEle.remove()
    newEle.removeEventListener('click', clickFn)
  }
  newEle.addEventListener('click', clickFn)
}

function switchDarkMode () { // Switch Between Light And Dark Mode
  const nowMode = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  if (nowMode === 'light') {
    activateDarkMode()
    saveToLocal.set('theme', 'dark', 2)
    GLOBAL_CONFIG.Snackbar !== undefined && btf.snackbarShow(GLOBAL_CONFIG.Snackbar.day_to_night)
  } else {
    activateLightMode()
    saveToLocal.set('theme', 'light', 2)
    GLOBAL_CONFIG.Snackbar !== undefined && btf.snackbarShow(GLOBAL_CONFIG.Snackbar.night_to_day)
  }
  // handle some cases
  typeof utterancesTheme === 'function' && utterancesTheme()
  typeof FB === 'object' && window.loadFBComment()
  window.DISQUS && document.getElementById('disqus_thread').children.length && setTimeout(() => window.disqusReset(), 200)
}

function showOrHideBtn () { // rightside 點擊設置 按鈕 展開
  document.getElementById('rightside-config-hide').classList.toggle('show')
}

function scrollToTop () { // Back to top
  btf.scrollToDest(0, 500)
}

function hideAsideBtn () { // Hide aside
  const $htmlDom = document.documentElement.classList
  $htmlDom.contains('hide-aside')
    ? saveToLocal.set('aside-status', 'show', 2)
    : saveToLocal.set('aside-status', 'hide', 2)
  $htmlDom.toggle('hide-aside')
}

function adjustFontSize (plus) {
  const fontSizeVal = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--global-font-size'))
  let newValue = ''
  if (plus) {
    if (fontSizeVal >= 20) return
    newValue = fontSizeVal + 1
    document.documentElement.style.setProperty('--global-font-size', newValue + 'px')
    !document.getElementById('nav').classList.contains('hide-menu') && adjustMenu(true)
  } else {
    if (fontSizeVal <= 10) return
    newValue = fontSizeVal - 1
    document.documentElement.style.setProperty('--global-font-size', newValue + 'px')
    document.getElementById('nav').classList.contains('hide-menu') && adjustMenu(true)
  }

  saveToLocal.set('global-font-size', newValue, 2)
  // document.getElementById('font-text').innerText = newValue
}

function switchPostChart () {
  // 这里为了统一颜色选取的是“明暗模式”下的两种字体颜色，也可以自己定义
  let color = document.documentElement.getAttribute('data-theme') === 'light' ? '#4c4948' : 'rgba(255,255,255,0.7)'
  if (document.getElementById('posts-chart') && postsOption) {
    try {
      let postsOptionNew = postsOption
      postsOptionNew.textStyle.color = color
      postsOptionNew.title.textStyle.color = color
      postsOptionNew.xAxis.axisLine.lineStyle.color = color
      postsOptionNew.yAxis.axisLine.lineStyle.color = color
      postsChart.setOption(postsOptionNew)
    } catch (e) {
      console.log(e)
    }
  }
  if (document.getElementById('tags-chart') && tagsOption) {
    try {
      let tagsOptionNew = tagsOption
      tagsOptionNew.textStyle.color = color
      tagsOptionNew.title.textStyle.color = color
      tagsOptionNew.xAxis.axisLine.lineStyle.color = color
      tagsOptionNew.yAxis.axisLine.lineStyle.color = color
      tagsChart.setOption(tagsOptionNew)
    } catch (e) {
      console.log(e)
    }
  }
  if (document.getElementById('categories-chart') && categoriesOption) {
    try {
      let categoriesOptionNew = categoriesOption
      categoriesOptionNew.textStyle.color = color
      categoriesOptionNew.title.textStyle.color = color
      categoriesOptionNew.legend.textStyle.color = color
      categoriesChart.setOption(categoriesOptionNew)
    } catch (e) {
      console.log(e)
    }
  }
}


function switchVisitChart () {
  // 这里为了统一颜色选取的是“明暗模式”下的两种字体颜色，也可以自己定义
  let color = document.documentElement.getAttribute('data-theme') === 'light' ? '#4c4948' : 'rgba(255,255,255,0.7)'
  if (document.getElementById('map-chart')) {
    try {
      let mapOptionNew = mapOption
      mapOptionNew.title.textStyle.color = color
      mapOptionNew.visualMap.textStyle.color = color
      mapChart.setOption(mapOptionNew)
    } catch (e) {
      console.log(e)
    }
  }
  if (document.getElementById('trends-chart')) {
    try {
      let trendsOptionNew = trendsOption
      trendsOptionNew.title.textStyle.color = color
      trendsOptionNew.xAxis.axisLine.lineStyle.color = color
      trendsOptionNew.yAxis.axisLine.lineStyle.color = color
      trendsOptionNew.textStyle.color = color
      trendsChart.setOption(trendsOptionNew)
    } catch (e) {
      console.log(e)
    }
  }
  if (document.getElementById('sources-chart')) {
    try {
      let sourcesOptionNew = sourcesOption
      sourcesOptionNew.title.textStyle.color = color
      sourcesOptionNew.legend.textStyle.color = color
      sourcesOptionNew.textStyle.color = color
      sourcesChart.setOption(sourcesOptionNew)
    } catch (e) {
      console.log(e)
    }
  }
}

/*
document.getElementById('mode-button').addEventListener('click', function () { setTimeout(switchPostChart, 100) })
document.getElementById('darkmode').addEventListener('click', function () { setTimeout(switchPostChart, 100) })
document.getElementById('mode-button').addEventListener('click', function () { setTimeout(switchVisitChart, 100) })
document.getElementById('darkmode').addEventListener('click', function () { setTimeout(switchVisitChart, 100) })
*/
// document.addEventListener('copy', function () { copyContentFn(this) })
document.getElementById('mode-button').addEventListener('click', function () { switchDarkMode() })
document.getElementById('top-button').addEventListener('click', function () { scrollToTop() })
// document.getElementById('page-name-text').addEventListener('click', function () { scrollToTop() })
// if (document.getElementById('post-url-copy')) document.getElementById('post-url-copy').addEventListener('click', function () { postUrlCopyFn(this) })