const axios = require('axios')

const url = 'http://api.weatherstack.com/current'

const params = {
    access_key: 'b2ecd0581854b1a6afd6f2a2f98f0ea3',
    query: '49.750,27.217'
  }
  
axios.get(url, { params })
.then(response => {
    console.log(response.data.current)
}).catch(error => {
    console.log(error)
})