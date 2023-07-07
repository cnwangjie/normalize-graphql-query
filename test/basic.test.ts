import { randomBytes } from 'crypto'
import { createEchoServer } from './test-server'
import { generateVariables, shouldReturnSameValueWithOriginal } from './util'

describe('normalizeGraphQLQuery', () => {
  const { server: echoServer, schema: echoSchema } = createEchoServer()

  test('simple case', async () => {
    const testQuery = /* GraphQL */ `
      query Query(
        $__a: String!
        $__b: String!
        $__c: String!
        $__d: Int!
        $__e: Int!
        $__f: Float!
        $__g: Boolean!
      ) {
        echo(
          input: {
            a: $__a
            b: $__b
            c: $__c
            d: $__d
            e: $__e
            f: $__f
            g: $__g
          }
        ) {
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
    const testQuery = /* GraphQL */ `
      query Query($__a1: String!, $__a2: String!) {
        echo1: echo(input: { a: $__a1 }) {
          a
        }

        echo2: echo(input: { a: $__a2 }) {
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

  test('fixture#1 - unused variables', async () => {
    const testQuery = /* GraphQL */ `
      query Query($a: String!, $b: String!) {
        echo(input: { a: $a, b: $b }) {
          a
          b
        }
      }
    `

    const testVariables = {
      ...generateVariables(echoSchema, testQuery),
      [randomBytes(8).toString('hex')]: 'unused',
    }

    await shouldReturnSameValueWithOriginal(
      echoServer,
      testQuery,
      testVariables,
    )
  })

  test('fixture#2 - date scalar type', async () => {
    const testQuery = /* GraphQL */ `
      query Query($a: String!, $o: Date!) {
        echo(input: { a: $a, o: $o }) {
          a
          o
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

  test('fixture#3 - fragment', async () => {
    const testQuery = /* GraphQL */ `
      query Query($a1: String!, $a2: String!, $b: String!) {
        echo(input: { a: $a1, k: { a: $a2, b: $b } }) {
          ...a
        }
      }

      fragment a on EchoRes {
        a
        k {
          ...k
        }
      }

      fragment k on EchoRes {
        a
        b
      }
    `

    const testVariables = generateVariables(echoSchema, testQuery)

    await shouldReturnSameValueWithOriginal(
      echoServer,
      testQuery,
      testVariables,
    )
  })

  test('fixture#4 - fill operation name when fragment before operation', async () => {
    const testQuery = /* GraphQL */ `
      fragment a on EchoRes {
        a
        b
      }

      query ($a1: String!, $a2: String!, $b: String!) {
        echo(input: { a: $a1, k: { a: $a2, b: $b } }) {
          ...a

          k {
            ...a
          }
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
