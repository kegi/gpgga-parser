const QUALITY_DESCRIPTION = {
  '0': 'Invalid',
  '1': 'GPS fix (single point)',
  '2': 'DGPS fix',
  '3': 'PPS fix',
  '4': 'Real Time Kinematic',
  '5': 'Float RTK',
  '6': 'Dead reckoning mode',
  '7': 'Manual input mode',
  '8': 'Simulation mode',
  '9': 'WAAS',
}

const FAAMODE = {
  A: 'Autonomous',
  D: 'Differential',
  E: 'Estimated',
  M: 'Manual input',
  S: 'Simulated',
  N: 'Not Valid',
  P: 'Precise'
}

const parseGpgga = data => {
  const gpggaRegex = /(\d{2})(\d{2})(\d{2})\.?(\d+)?,(\d{2})(\d{2}\.\d+),([NS]),(\d{3})(\d{2}\.\d+),([EW]),([0-8]),(\d{1,2}),(\d{1,3}(?:\.\d+)?),(-?|-?\d+(?:\.\d+)?),[M-]?,(-?|-?\d+(?:\.\d+)?),[M-]?,(-?|\d+(?:\.\d+)?),(\d{4}|\w{4})?,?([ADEMSNP])?/
  
  const groups = gpggaRegex.exec(parseNmea(data))

  if(!groups){
    throw new Error('Unable to parse GPGGA data')
  }

  const timeData = groups.slice(1, 5)
  const latData = groups.slice(5, 8)
  const lonData = groups.slice(8, 11)
  const qualityData = groups.slice(11, 12)[0]
  const nbSatellites = Number(groups.slice(12, 13)[0])
  const hdop = Number(groups[13]) // Horizontal dilution of precision
  const altitude = Number(groups[14])
  const undulation = Number(groups[15])
  const age = groups[16] ? Number(groups[16]) : undefined
  const stationId = groups[17] || undefined
  const faaModeValue = groups[18]

  return {
    date: getDateFromTime(...timeData),
    lat: getLat(...latData),
    lon: getLon(...lonData),
    quality: getQuality(qualityData),
    nbSatellites,
    hdop,
    altitude,
    undulation,
    age,
    stationId,
    faaMode: getFaaMode(faaModeValue),
  }
}

/**
 * Parse NMEA string
 * Only accept GGA format
 * Validate the checksum and return the payload
 * 
 * @param {String} data
 * 
 * @returns {String}
 * @throws {Error}
 */
const parseNmea = data => {
  const nmeaRegex = /[!$]((GP|GN|GL|HE|P|AI)(\w{3}),(.+)+)\*([0-9A-F]{2})/

  const parsed = nmeaRegex.exec(data)

  if(!parsed){
    throw new Error('Unable to parse NMEA data')
  }

  const payload = parsed[1]
  const format = parsed[3].toString()
  const checksum = parseInt(parsed[parsed.length - 1], 16)
  const expectedChecksum = calculateChecksum(payload)

  if(!payload){
    throw new Error('Unable to extract the payload from NMEA')
  }

  if(format.toUpperCase() !== 'GGA'){
    throw new Error(`Invalid format, expecting GGA, received ${format}`)
  }

  if(checksum !== expectedChecksum){
    throw new Error(`Invalid checksum, expecting ${expectedChecksum}, received ${checksum}`)
  }

  return payload
}

/**
 * Calculate the expected checksum of the payload
 * 
 * @param {String} string
 * 
 * @returns {Number}
 */
const calculateChecksum = string => string.split('').reduce((y, x) => y ^ x.charCodeAt(0), 0)

/**
 * Return a UTC date from the time values
 * 
 * @param {Number} h
 * @param {Number} m
 * @param {Number} s
 * @param {Number|undefined} ms
 * 
 * @returns {Date}
 */
const getDateFromTime = (h, m, s, ms = 0) => {
  const now = new Date()

  const utcDate = [
    now.getUTCFullYear(),
    (now.getUTCMonth() + 1).toString().padStart(2, '0'),
    (now.getUTCDay() + 1).toString().padStart(2, '0'),
  ].join('-')

  const utcTime = `${h}:${m}:${s}.${ms}`

  const date = new Date(`${utcDate}T${utcTime}Z`)
  if(!isFinite(date)){
    throw new Error('Invalid UTC date')
  }
  return date
}

/**
 * Convert latitude day/minute into degrees
 * 
 * @param {Number} d
 * @param {Number} m
 * @param {String} dir
 * 
 * @returns {Number}
 */
const getLat = (d, m, dir) => (Number(d) + (m / 60)) * (dir === 'N' ? 1 : -1)

/**
 * Convert longitude day/minute into degrees
 * 
 * @param {Number} d
 * @param {Number} m
 * @param {String} dir
 * 
 * @returns {Number}
 */
const getLon = (d, m, dir) => (Number(d) + (m / 60)) * (dir === 'E' ? 1 : -1)

/**
 * Returns the quality of the GPS signal
 * 
 * @param {String} quality
 * 
 * @returns {Object}
 * @throws {Error}
 */
const getQuality = quality => {
  if(!QUALITY_DESCRIPTION[quality]){
    throw new Error('Invalid GPS quality')
  }
  return {
    value: Number(quality),
    description: QUALITY_DESCRIPTION[quality],
  }
}

/**
 * Returns the FAA mode
 * 
 * @param {String} faaMode
 * 
 * @returns {Object|undefined}
 */
const getFaaMode = faaMode => {
  if(!faaMode || !FAAMODE[faaMode]){
    return undefined
  }
  return {
    value: faaMode,
    description: FAAMODE[faaMode],
  }
}

module.exports = parseGpgga
