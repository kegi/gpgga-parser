# GPGGA data parser

## Install
```bash
yarn add gpgga-parser
```

## Usage
```javascript
const parse = require('gpgga-parser')

const { lat, lon } = parse('$GPGGA,134658.00,5106.9792,N,11402.3003,W,2,09,1.0,1048.47,M,-16.27,M,08,AAAA*60')
```

## Test
```bash
yarn install
yarn test
```