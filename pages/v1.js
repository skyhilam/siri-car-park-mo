const axios = require('axios')
const HTMLParser = require('node-html-parser')
const nearest = require('../nearest')
const express = require('express')
const router = express.Router()

const { map, find } = require('lodash')
const { msleep } = require('sleep')


async function fetch(myLocation, retrytimes) {

	const resp = await axios({
		method: 'get',
		url: 'https://www.dsat.gov.mo/dsat/carpark_realtime_core.aspx',
		headers: {
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			Cookie: 'ASP.NET_SessionId=1oshc1zfow1mzkuvotbn3mih',
			'Accept-Encoding': 'br, gzip, deflate',
			Host: 'www.dsat.gov.mo',
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Safari/605.1.15',
			'Accept-Language': 'en-us',
			Referer: 'https://www.dsat.gov.mo/dsat/carpark_realtime.aspx',
			Connection: 'keep-alive'
		}
	})


	const root = HTMLParser.parse(resp.data)

	const columns = root.querySelectorAll('.myTable tr')

	const data = []

	var item = {}
	var key = ''

	for (var i = 1; i < columns.length; i++) {
		const tds = columns[i].querySelectorAll('td')

		tds.forEach((td, idx) => {
			if (idx == 4) { 
				data.push(item) 
				return;
			}

			if (idx == 0) { key = 'name' }
			if (idx == 1) { key = 'car' }
			if (idx == 2) { key = 'motorcycle' }
			if (idx == 3) { key = 'date' }

			item[key] = (td.text).replace('      ', '').replace("     \r\n                ", '').replace("     \r                ", '')
		})

		item = {}

	}

	const places = nearest(myLocation)

	const result = map(places, p => {
		return find(data, { name: p.name })
	})

	try {
		var message = ''
		for (var i = 0; i < result.length; i++) {
			const item = result[i]
			message += `${item.name}有${item.car}個車位，`
		}
	} catch (e) {
		console.log(e)
		console.log('sleep 100ms, retry')
		await msleep(100)
		if (retrytimes < 3) {
			retrytimes++
			return fetch(myLocation, retrytimes)
		}
		return { message: '網絡不穩定，請重新嘗試一次' }
	}

	return { message }

}



router.get('/v1', async (req, res) => {
	const { lat, lng } = req.query

	var retrytimes = 0

	if (isNaN(lat) || isNaN(lng)) {
		res.send({ message: '格式錯誤' })
		return;
	}
	console.log({ lat: parseFloat(lat), lng: parseFloat(lng) });
	const data = await fetch({ lat: parseFloat(lat), lng: parseFloat(lng) }, retrytimes)

	res.send(data)
})


module.exports = router