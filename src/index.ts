import { DocumentNode, Kind, parse, print, visit } from 'graphql'

const debug = require('debug')('normalize-graphql-query')

interface NormalizeGraphQLQueryArgs {
  query: string | DocumentNode
  variables?: Record<string, any>
}

interface NormalizeGraphQLResult {
  query: string
  variables?: Record<string, any>
  argNameMap: Map<string, string>
}

export const normalizeGraphQLQuery = ({
  query,
  variables,
}: NormalizeGraphQLQueryArgs): NormalizeGraphQLResult => {
  const ast = typeof query === 'string' ? parse(query) : query

  const map: Map<string, string> = new Map()
  const argNameMap: Map<string, string> = new Map()

  const registerVariable = (name: string, argName: string): void => {
    debug('%o %o', name, argName)
    const existVarName = argNameMap.get(argName)
    if (!existVarName) {
      argNameMap.set(argName, name)
      map.set(name, argName)
      return
    }
    if (existVarName === name) return
    const match = name.match(/\d+$/)
    if (!match) return registerVariable(name, argName + '1')
    const { 0: num, index } = match
    registerVariable(name, argName.slice(0, index) + (+num + 1))
  }

  const normalizeName = (name: string) => {
    const normalizedName = map.get(name)
    if (!normalizedName)
      throw new Error(
        `Failed to normalize query. Unresolved variable name: '${name}'.`,
      )
    return normalizedName
  }

  const normalizeVariables = (variables: any) => {
    if (!variables) return variables
    const newVariables: any = {}
    for (const [k, v] of Object.entries(variables)) {
      newVariables[normalizeName(k)] = v
    }
    return newVariables
  }

  visit(ast, {
    Argument(node) {
      const value = node.value
      if (value.kind === Kind.VARIABLE) {
        registerVariable(value.name.value, node.name.value)
      }
    },
    ObjectField(node) {
      const value = node.value
      if (value.kind === Kind.VARIABLE) {
        registerVariable(value.name.value, node.name.value)
      }
    },
  })

  const normalizedAst = visit(ast, {
    Variable(node) {
      return {
        ...node,
        name: {
          ...node.name,
          value: normalizeName(node.name.value),
        },
      }
    },
  })

  return {
    query: print(normalizedAst),
    variables: normalizeVariables(variables),
    argNameMap,
  }
}

export default normalizeGraphQLQuery
