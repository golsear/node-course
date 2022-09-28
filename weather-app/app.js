const axios = require('axios')

const url = 'http://api.weatherstack.com/current'

const params = {
    access_key: 'b2ecd0581854b1a6afd6f2a2f98f0ea3',
    query: '49.750,27.217',
    units: 'm'
}
  
axios.get(url, { params })
.then(response => {
    if (response.data.error) {
        console.log(response.data.error.info)
    } else {
        const current = response.data.current 
        console.log(`${current.weather_descriptions[0]}. It is currently ${current.temperature} degrees out. It feels like ${current.feelslike} degrees out.`)
    }
}).catch(error => {
    console.log('Unable to connect to location services!')
})