const axios = require('axios')
const express = require('express')
const router = express.Router()

const convert = require('xml-js');
const { map, filter } = require('lodash')

const http = axios.create({
	baseURL: 'https://dsat.apigateway.data.gov.mo',
	headers: {
		'Authorization': process.env.API_TOKEN
	}
})

// 獲取停車場詳細資料
async function getCardParkDetails() {
	try {

		const { data } = await http.get('/car_park_detail')

		const json = convert.xml2json(data, {
			compact: true,
		});

		return JSON.parse(json).CarPark.Car_park_info
	} catch (e) {
		console.error(e);
	}
}

// 獲取停車場停車位資料
async function getCardParkSpaces() {
	try {

		const { data } = await http.get('/car_park_maintance')

		const json = convert.xml2json(data, {
			compact: true,
		});

		return JSON.parse(json).CarPark.Car_park_info
	} catch (e) {
		console.error(e);
	}
}

// 獲取以我為中心最近的停車場
async function getNearbyCardPark(lat, lng) {
	const details = await getCardParkDetails()
	const spaces = await getCardParkSpaces()

	// 根據經緯度尋找最近的停車場
	const result = filter(details, item => {
		const data = item._attributes
		const { X_coords: x, Y_coords: y } = data

		const distance = Math.sqrt(Math.pow(x - lat, 2) + Math.pow(y - lng, 2))
		return distance < 0.005 // 以我的位置為中心，半徑 0.5 公里
	})

	// 以我的位置為中心排序附近的停車場
	result.sort((a, b) => {
		const aData = a._attributes
		const bData = b._attributes

		const aDistance = Math.sqrt(Math.pow(aData.X_coords - lat, 2) + Math.pow(aData.Y_coords - lng, 2))
		const bDistance = Math.sqrt(Math.pow(bData.X_coords - lat, 2) + Math.pow(bData.Y_coords - lng, 2))

		return aDistance - bDistance
	})

	return map(result, item => {
		const data = item._attributes
		const space = spaces.find(space => space._attributes.ID === data.CP_ID)?._attributes


		return {
			id: data.CP_ID,
			name: data.NameC,
			Car_CNT: space?.Car_CNT, // 汽車位車位數量
			MB_CNT: space?.MB_CNT, // 摩托車車位數量
			last_update: space?.Time, // 最後更新時間
		}
	});
}



router.get('/v1', async (req, res) => {
	const { lat, lng } = req.query


	var message = '網絡不穩定，請重新嘗試一次'
	try {
		const result = await getNearbyCardPark(lat, lng)

		if (result.length === 0) {
			message = '附近沒有停車場'
		} else {
			message = ''
			result.forEach(item => {
				message += `${item.name}有${item.Car_CNT}個車位，`
			})
			// 最後一個逗號改成句號
			message = message.replace(/，([^，]*)$/, '。$1')
		}

	} catch (e) {
		console.error(e)
	}


	res.send({
		message,
	});
})


module.exports = router