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
  }

  type EchoRes {
    a: String
    b: String
    c: String
    d: Int
    e: Int
    f: Float
    g: Boolean
  }

  type Query {
    echo(input: EchoInput): EchoRes
  }
`

const resolvers = {
  Query: {
    echo: (_: any, { input }: any) => input,
  },
}

export const createTestServer = () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })
  return server
}
