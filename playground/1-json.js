// https://links.mead.io/json-sample
// {"title":"Ego is the Enemy","author":"Ryan Holiday"}
// {"name":"Andrew","planet":"Earth","age":27}

const fs = require('fs')

const dataBuffer = fs.readFileSync('1-json.json')
const dataJSON = dataBuffer.toString()
const user = JSON.parse(dataJSON)

user.name = 'Serhii'
user.age = 48

const userJSON = JSON.stringify(user)

console.log(userJSON)

fs.writeFileSync('1-json.json', userJSON)

// const book = {
//     title: 'Ego is the Enemy',
//     author: 'Ryan Holiday'
// }

// const bookJSON = JSON.stringify(book)
// fs.writeFileSync('1-json.json', bookJSON)
// console.log(bookJSON)

// const parsedData = JSON.parse(bookJSON)
// console.log(parsedData.author)

// const dataBuffer = fs.readFileSync('1-json.json')
// const dataJSON = dataBuffer.toString()
// const data = JSON.parse(dataJSON)
// console.log(dataBuffer)
// console.log(dataJSON)
// console.log(data.title)