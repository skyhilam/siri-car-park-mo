const distance = require('./src/distance')
const {orderBy, take} = require('lodash')
const maps = require('./maps.json')


function findNearestLocation (latLng) {
  for (let i = 0; i < maps.length; i++) {
    maps[i]['dis'] = distance(maps[ i ], latLng)
  }
  return maps
}




module.exports = (myLocation) => {
  return take(orderBy( findNearestLocation(myLocation), ['dis'], ['asc']),5)
}