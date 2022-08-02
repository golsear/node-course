const validator = require('validator')
const getNotes = require('./notes.js')

const msg = getNotes()

console.log(msg)

console.log(validator.isEmail('serhii@test.com'))
console.log(validator.isURL('test.com'))

// const add = require('./utils.js')
// const sum = add(4, -2)
// console.log(sum)