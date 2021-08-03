const parse = require('./index')

/* @todo : add more tests to cover all exceptions and payload parsed results */

describe('GPGGA parser', () => {
  it('decode GPGGA string properly', () => {
    const values = parse('$GPGGA,134658.00,5106.9792,N,11402.3003,W,2,09,1.0,1048.47,M,-16.27,M,08,AAAA*60')

    expect(values.lat).toBe(51.11632)
    expect(values.lon).toBe(-114.03833833333333)
  })
})