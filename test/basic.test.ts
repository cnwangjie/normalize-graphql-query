import normalizeGraphQLQuery from '../src'
import { createTestServer } from './test-server'

describe('normalizeGraphQLQuery', () => {
  const testServer = createTestServer()

  it('should return same value with original', async () => {
    const testQuery = `#graphql
      query Query($__a: String, $__b: String, $__c: String, $__d: Int, $__e: Int, $__f: Float, $__g: Boolean) {
        echo(input: {
          a: $__a
          b: $__b
          c: $__c
          d: $__d
          e: $__e
          f: $__f
          g: $__g
        }) {
          a
          b
          c
          d
          e
          f
          g
        }
      }
    `

    const testVariables = {
      __a: Math.random() + '',
      __b: Math.random() + '',
      __c: Math.random() + '',
      __d: (Math.random() * 1e10) | 0,
      __e: (Math.random() * 1e10) | 0,
      __f: Math.random(),
      __g: Math.random() > 0.5,
    }

    const res = await testServer.executeOperation({
      query: testQuery,
      variables: testVariables,
    })
    const { data: expected } = res
    const normalized = normalizeGraphQLQuery({
      query: testQuery,
      variables: testVariables,
    })
    const { data: actual } = await testServer.executeOperation({
      query: normalized.query,
      variables: normalized.variables,
    })
    expect(expected).toBeTruthy()
    expect(actual).toEqual(expected)
  })
})
