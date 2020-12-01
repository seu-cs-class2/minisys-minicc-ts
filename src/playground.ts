// Try something here.
import fs from 'fs'
const fcontent = fs.readFileSync('F:\\minisys-minicc-ts\\syntax\\MiniC-LALRParse.json').toString()
const j = JSON.parse(fcontent)
const states = j.dfa._states
const state = states[24]
console.log(state._items.length)
console.log(state._items)
