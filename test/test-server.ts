import { makeExecutableSchema } from '@graphql-tools/schema'
import { ApolloServer } from 'apollo-server'

const typeDefs = `#graphql
  input EchoInput {
    a: String
    b: String
    c: String
    d: Int
    e: Int
    f: Float
    g: Boolean
    h: [String]
    i: [Int!]
    j: [Float!]
    k: EchoInput
    l: [EchoInput]
    m: [[EchoInput]]
    n: [[EchoInput!]!]
    o: Date
  }

  type EchoRes {
    a: String
    b: String
    c: String
    d: Int
    e: Int
    f: Float
    g: Boolean
    h: [String]
    i: [Int!]
    j: [Float!]
    k: EchoRes
    l: [EchoRes]
    m: [[EchoRes]]
    n: [[EchoRes!]!]
    o: Date
  }

  type Query {
    echo(input: EchoInput): EchoRes
  }

  scalar Date

  schema {
    query: Query
  }
`

const resolvers = {
  Query: {
    echo: (_: any, { input }: any) => input,
  },
}

export const createEchoServer = () => {
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const server = new ApolloServer({
    schema,
  })
  return { server, schema }
}
