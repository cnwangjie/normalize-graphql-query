import { makeExecutableSchema } from '@graphql-tools/schema'
import { ApolloServer } from 'apollo-server'
import normalize from '../src/apollo-plugin'

const typeDefs = `#graphql
  input EchoInput {
    a: String
  }

  type EchoRes {
    a: String
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

export const createEchoServer = () => {
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const server = new ApolloServer({
    schema,
    logger: console,
    plugins: [normalize()],
    formatResponse(response, requestContext) {
      console.log('response', response)
      return response
    },
  })
  return { server, schema }
}

const { server } = createEchoServer()
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
