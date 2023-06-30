import type { ApolloServerPlugin } from 'apollo-server-plugin-base'
import { normalizeGraphQLQuery, transformGraphQLResponse } from '.'

const normalize = (): ApolloServerPlugin => {
  return {
    async requestDidStart({ request }) {
      if (request.query == null) return
      const normalized = normalizeGraphQLQuery({
        ...request,
        query: request.query,
      })
      request.query = normalized.query
      request.variables = normalized.variables
      return {
        async willSendResponse({ response }) {
          response.data = transformGraphQLResponse(normalized, response.data)
        },
      }
    },
  }
}

export default normalize
