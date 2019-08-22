const axios = require('axios')
const express = require('express')
const moment = require('moment-timezone')
const router = express.Router()


const {map, each} = require('lodash')

async function fetch(n) {
	const today = moment().tz('Asia/Hong_Kong')

	
	const {data} = await axios.get('http://mapa.sport.gov.mo/zh/calendarDispatch/mapa', {params: {
		tid: 641,
		from: today.format('YYYY-MM-DD H:mm:ss'),
		to: today.add(n, 'days').format('YYYY-MM-DD H:mm:ss')
	}})
	
	return map(data, i => ({
		event: i.title, 
		date: new moment(i.start).format('M月DD日'),
		time: `${new moment(i.start).format('H點mm分')}~${new moment(i.end).format('H點mm分')}`, 
	}))
}





router.get('/v2', async (req, res) => {
	const {n} = req.query

	if (isNaN(n)) {
		res.send({message: '格式錯誤'})
		return;
	}

	const data = await fetch(n)

	var message = ''

	each(data, i => 
		message += `${i.date} ${i.time} ${i.event}，`
	)

	res.send({message})
})



module.exports = router