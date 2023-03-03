import crypto from 'crypto'
import normalizeGraphQLQuery from '../src'
import { createTestServer } from './test-server'

const messUpQuery = (query: string, variables: Record<string, any>) => {
  const messedUpVariables = {} as Record<string, any>
  let messedUpQuery = query
  for (const k in variables) {
    const newKey = `_${crypto.randomBytes(8).toString('hex')}${k}`
    messedUpVariables[newKey] = variables[k]
    messedUpQuery = messedUpQuery.replaceAll(k, newKey)
  }
  return {
    query: messedUpQuery,
    variables: messedUpVariables,
  }
}

describe('normalizeGraphQLQuery', () => {
  const testServer = createTestServer()

  it('should return same value with original', async () => {
    const testQuery = `#graphql
      query Query(
        $__a: String
        $__b: String
        $__c: String
        $__d: Int
        $__e: Int
        $__f: Float
        $__g: Boolean
      ) {
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

    const messedUpReq = messUpQuery(testQuery, testVariables)
    const res = await testServer.executeOperation(messedUpReq)
    const { data: expected } = res
    const normalized = normalizeGraphQLQuery(messedUpReq)
    const { data: actual } = await testServer.executeOperation(normalized)
    expect(expected).toBeTruthy()
    expect(actual).toEqual(expected)
  })
})
