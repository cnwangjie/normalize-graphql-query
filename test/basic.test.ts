import { createEchoServer } from './test-server'
import { generateVariables, shouldReturnSameValueWithOriginal } from './util'

describe('normalizeGraphQLQuery', () => {
  const { server: echoServer, schema: echoSchema } = createEchoServer()

  test('simple case', async () => {
    const testQuery = `#graphql
      query Query(
        $__a: String!
        $__b: String!
        $__c: String!
        $__d: Int!
        $__e: Int!
        $__f: Float!
        $__g: Boolean!
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

    const testVariables = generateVariables(echoSchema, testQuery)

    await shouldReturnSameValueWithOriginal(
      echoServer,
      testQuery,
      testVariables,
    )
  })

  test('same name variables', async () => {
    const testQuery = `#graphql
      query Query(
        $__a1: String!
        $__a2: String!
      ) {
        echo1: echo(input: {
          a: $__a1
        }) {
          a
        }

        echo2: echo(input: {
          a: $__a2
        }) {
          a
        }
      }
    `

    const testVariables = generateVariables(echoSchema, testQuery)

    await shouldReturnSameValueWithOriginal(
      echoServer,
      testQuery,
      testVariables,
    )
  })

  test('nested same name variables', async () => {
    const testQuery = `#graphql
      query (
        $__a1: String!
        $__a2: String!
        $__a3: String!
        $__a4: String!
      ) {
        echo1: echo(input: {
          k: {
            a: $__a1
          }
          a: $__a2
        }) {
          k {
            a
          }
          a
        }

        echo2: echo(input: {
          k: {
            a: $__a3
          }
          a: $__a4
        }) {
          k {
            a
          }
          a
        }
      }
    `

    const testVariables = generateVariables(echoSchema, testQuery)

    await shouldReturnSameValueWithOriginal(
      echoServer,
      testQuery,
      testVariables,
    )
  })
})
