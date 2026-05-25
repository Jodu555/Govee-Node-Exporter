const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
const Registry = client.Registry;
const register = new Registry();
const prefix = 'govee_node_exporter_';
collectDefaultMetrics({ prefix, register });

const logPath = '/var/log/goveebttemplogger';
let deviceReMapper = {};

// Load device mapper from file
const deviceMapperPath = path.join(__dirname, '..', 'deviceMapper.json');
try {
	const rawData = fs.readFileSync(deviceMapperPath, 'utf8');
	deviceReMapper = JSON.parse(rawData);
} catch (error) {
	console.error('Error loading device mapper:', error.message);
	fs.writeFileSync(deviceMapperPath, '{}');
}

app.get('/metrics', async (req, res) => {
	try {
		res.set('Content-Type', register.contentType);
		res.end(await register.metrics());
	} catch (ex) {
		console.log(ex);
		res.status(500).end(ex);
	}
});

const gaugeTemp = new client.Gauge({
	name: prefix + 'temperature',
	help: 'Device Temperature in C',
	labelNames: ['deviceName', 'deviceMac'],
	collect() {
		console.log('Called Collect');
		const deviceInfos = getDeviceInfos();
		console.log(deviceInfos);
		deviceInfos.forEach((d) => {
			this.set({ deviceName: d.deviceName, deviceMac: d.deviceMac }, parseFloat(d.values[1]));
		});
	},
});
const gaugeHumi = new client.Gauge({
	name: prefix + 'humidity',
	help: 'Device Humidity in Percent',
	labelNames: ['deviceName', 'deviceMac'],
	collect() {
		console.log('Called Collect');
		const deviceInfos = getDeviceInfos();
		console.log(deviceInfos);
		deviceInfos.forEach((d) => {
			this.set({ deviceName: d.deviceName, deviceMac: d.deviceMac }, parseFloat(d.values[2]));
		});
	},
});
const gaugeBat = new client.Gauge({
	name: prefix + 'battery',
	help: 'Device Battery Level in Percent',
	labelNames: ['deviceName', 'deviceMac'],
	collect() {
		console.log('Called Collect');
		const deviceInfos = getDeviceInfos();
		console.log(deviceInfos);
		deviceInfos.forEach((d) => {
			this.set({ deviceName: d.deviceName, deviceMac: d.deviceMac }, parseFloat(d.values[3]));
		});
	},
});

function getDeviceInfos() {
	const out = [];

	const dateStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
	const files = fs.readdirSync(logPath).filter((x) => x.includes(dateStr));

	files.forEach((file) => {
		const deviceMac = file.split('-')[1];
		const lines = fs.readFileSync(path.join(logPath, file), 'utf-8').split('\n');
		if (lines.length >= 500) {
			// Keep the last 500 lines
			fs.writeFileSync(path.join(logPath, file), [...lines].slice(-500).join('\n'));
		}
		const lastLine = lines.at(-2);
		const x = lastLine.split('\t').splice(0);
		out.push({
			deviceMac,
			deviceName: deviceReMapper[deviceMac],
			values: x,
		});
	});
	return out;
}

register.registerMetric(gaugeTemp);
register.registerMetric(gaugeHumi);
register.registerMetric(gaugeBat);

const port = process.env.PORT || 3600;
console.log(`Server listening to ${port}, metrics exposed on /metrics endpoint`);
app.listen(port);
