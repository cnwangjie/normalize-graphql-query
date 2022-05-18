import { add } from './index'

describe('add', () => {
  it('should return the sum of two number', () => {
    expect(add(1, 2)).toBe(3)
  })
})
