const fs = require('fs')
const path = require('path')
const url = require('url')
const { createElement: h } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

const microicon = require('..')

const { Icon, keys } = microicon
const simpleKeys = Object.keys(microicon.simple)
const mdKeys = Object.keys(microicon.material)

const doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'

const iconsLength = keys.reline.length
  + keys.geomicons.length
  + keys.simple.length
  + keys.material.length

const num = v => !isNaN(parseFloat(v)) ? parseFloat(v) : v

const parseNumbers = obj => Object.keys(obj).reduce((a, key) => {
  const val = obj[key]
  const n = num(val)
  if (!isNaN(n)) {
    a[key] = n
  }
  return a
}, obj)

const isHex = val => {
  if (val.length !== 3 && val.length !== 6) return false
  return /[0-9a-fA-F]/.test(val)
}

const getParamKey = val => {
  const type = typeof val
  const n = num(val)
  if (!val.length) {
    return null
  } else if (isHex(val)) {
    return { color: '#' + val }
  } else if (!isNaN(n)) {
    return { size: n }
  } else if (type === 'string' && !/\-/.test(val)) {
    return { [val]: true }
  } else if (type === 'string' && /\-/.test(val)) {
    const [ key, v ] = val.split('-')
    return { [key]: num(v) }
  } else {
    console.log('could not parse', val)
    return null
  }
}

const parseUrl = url => {
  const [ name, ...args ] = url.split('/')
  const params = args.reduce((a, b) => {
    const obj = getParamKey(b)
    return Object.assign({}, a, obj)
  }, {})
  params.name = name
  return params
}

module.exports = (req, res) => {
  const { pathname, query } = url.parse(req.query.path, true)
  const [ , name ] = pathname.split('/')
  const params = Object.assign({
      size: 16
    },
    parseUrl(pathname),
    parseNumbers(query)
  )

  const svg = renderToStaticMarkup(
    h(Icon, Object.assign({
      name,
    }, params))
  )

  if (!svg.length) return 'No icon found for ' + name

  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 'max-age=0, s-maxage=604800')
  res.end(doctype + svg)
}
