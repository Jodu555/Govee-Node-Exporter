# Govee Node Exporter

A simple Prometheus exporter for Govee temperature and humidity sensors.

## Features

- Exposes temperature, humidity, and battery level metrics
- Reads sensor data from log files
- Provides `/metrics` endpoint for Prometheus scraping
- Maps device MAC addresses to friendly names

## Prerequisites

- [GoveeBTTempLogger](https://github.com/wcbonner/GoveeBTTempLogger) - Required to generate the log files that this exporter reads
- Node.js (v12 or higher)
- Log files in `/var/log/goveebttemplogger` with naming pattern: `*-<MAC_ADDRESS>-*.log`
- Log files must contain tab-separated values where:
  - Position 1: Timestamp (unused)
  - Position 2: Temperature (°C)
  - Position 3: Humidity (%)
  - Position 4: Battery level (%)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

The exporter can be configured by modifying the following constants in `src/index.js`:

- `deviceReMapper`: Object mapping MAC addresses to device names (default: `{'A4C1384BEE9A': 'Zimmer'}`)
- `logPath`: Directory containing log files (default: `/var/log/goveebttemplogger`)
- `port`: Port to listen on (default: `3600` or from `PORT` environment variable)

## Usage

Start the exporter:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

The metrics will be available at `http://localhost:3600/metrics`

## Metrics Exported

- `govee_node_exporter_temperature`: Device temperature in Celsius
  - Labels: `deviceName`, `deviceMac`
- `govee_node_exporter_humidity`: Device humidity percentage
  - Labels: `deviceName`, `deviceMac`
- `govee_node_exporter_battery`: Device battery level percentage
  - Labels: `deviceName`, `deviceMac`

## Example Prometheus Configuration

```yaml
scrape_configs:
  - job_name: 'govee_exporter'
    static_configs:
      - targets: ['localhost:3600']
```

## License

MIT
