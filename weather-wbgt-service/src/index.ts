import getNextTTLForCurrentQuarterHour from './getNextTTLForCurrentQuarterHour';
import { Weather } from './weather.api';
import { TZDate } from '@date-fns/tz';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Check if there is data in the cache
		const cachedData = await env.WEATHER_CACHE.get('WGBT_DATA');

		if (cachedData) {
			console.log('Data in cache');
			const json = await JSON.parse(cachedData);
			return Response.json(json);
		}

		console.log("Cache expired or doesn't exist. Fetching new data");

		// Otherwise fetch new data and store in cache
		const expirationTtl = getNextTTLForCurrentQuarterHour(3 * 60);
		console.log(`Requesting with ${env.DATA_GOV_API_KEY}`);
		const readings = await Weather.retrieveWeatherDataForBot(env.DATA_GOV_API_KEY);

		const res = {
			cache_expiration: new TZDate(new Date(Date.now() + expirationTtl * 1000), 'Asia/Singapore'),
			cda: {
				wbgtStation: readings.cdaWBGT.station,
				airTempStation: readings.cdaAirTemp.station,
				heatStress: readings.cdaWBGT.heatStress,
				wbgt: readings.cdaWBGT.wbgt,
				airTemp: readings.cdaAirTemp.value,
				emoji: Weather.Parser.parseWBGTHeatStress(readings.cdaWBGT.heatStress),
				dateTime: readings.cdaWBGT.dateTime,
			},
			httc: {
				wbgtStation: readings.httcWBGT.station,
				airTempStation: readings.httcAirTemp.station,
				heatStress: readings.httcWBGT.heatStress,
				wbgt: readings.httcWBGT.wbgt,
				airTemp: readings.httcAirTemp.value,
				emoji: Weather.Parser.parseWBGTHeatStress(readings.httcWBGT.heatStress),
				dateTime: readings.httcWBGT.dateTime,
			},
		};

		console.log('Done fetching new data');

		await env.WEATHER_CACHE.put('WGBT_DATA', JSON.stringify(res), {
			expirationTtl,
		});

		console.log('Done storing in cache');

		return Response.json(res);
	},
} satisfies ExportedHandler<Env>;
