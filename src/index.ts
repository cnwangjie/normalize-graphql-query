import { BREAK, DocumentNode, Kind, parse, print, visit } from 'graphql'
import { isPlainObject } from './is-plain-object'

export interface NormalizeGraphQLQueryArgs {
  query: string | DocumentNode
  variables?: Record<string, any>
}

export interface NormalizeGraphQLQueryResult {
  ast: DocumentNode
  query: string
  variables?: Record<string, any>
  argNameMap?: Map<string, string>
  fieldAliasMap?: Map<string, Map<string, string>>
}

export const normalizeFieldAccess = (ast: DocumentNode) => {
  const stack: string[] = []
  const fieldAccessMap: Map<string, Map<string, number>> = new Map()
  const fieldAliasMap: Map<string, Map<string, string>> = new Map()

  const normalizedAst = visit(ast, {
    enter(node) {
      if (node.kind === 'Field') {
        const fieldName = node.name.value
        const alias = node.alias?.value

        const path = [...stack].join('.')

        const accessCountMap =
          fieldAccessMap.get([...stack].join('.')) ?? new Map()
        const accessCount = accessCountMap.get(fieldName) || 0
        accessCountMap.set(fieldName, accessCount + 1)
        fieldAccessMap.set(path, accessCountMap)

        const newAlias = accessCount ? `${fieldName}${accessCount}` : fieldName

        const aliasMap = fieldAliasMap.get(path) ?? new Map()
        fieldAliasMap.set(path, aliasMap)
        aliasMap.set(newAlias, alias ?? '')

        stack.push(alias ?? fieldName)

        return {
          ...node,
          alias: accessCount
            ? {
                kind: Kind.NAME,
                value: newAlias,
              }
            : undefined,
        }
      }
    },

    leave(node) {
      if (node.kind === 'Field') {
        stack.pop()
      }
    },
  })

  return {
    ast: normalizedAst,
    fieldAliasMap,
  }
}

export const normalizeVariableName = (
  ast: DocumentNode,
  variables?: Record<string, any>,
) => {
  const oriNameMap: Map<string, string> = new Map()
  const varNameCountMap: Map<string, number> = new Map()
  const argNameMap: Map<string, string> = new Map()

  const registerVariable = (name: string, argName: string): void => {
    const varNameCount = varNameCountMap.get(argName) || 0

    varNameCountMap.set(argName, varNameCount + 1)

    const alias = varNameCount ? `${argName}${varNameCount}` : argName

    argNameMap.set(alias, argName)
    oriNameMap.set(name, alias)
  }

  const normalizeName = (name: string) => {
    const normalizedName = oriNameMap.get(name)
    if (!normalizedName) return name
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
    ast: normalizedAst,
    variables: normalizeVariables(variables),
    argNameMap,
  }
}

export const fillQueryOperationName = (ast: DocumentNode) => {
  let hasName = false
  let operationName = ''
  visit(ast, {
    OperationDefinition: {
      enter(node) {
        if (node.name) {
          hasName = true
          return BREAK
        }
      },
    },
    Field: {
      enter(node) {
        operationName = node.name.value
        return BREAK
      },
    },
  })

  if (hasName) return ast

  return visit(ast, {
    OperationDefinition: {
      enter(node) {
        return {
          ...node,
          name: {
            kind: Kind.NAME,
            value: operationName,
          },
        }
      },
      leave() {
        return BREAK
      },
    },
  })
}

export const normalizeGraphQLQuery = ({
  query,
  variables,
}: NormalizeGraphQLQueryArgs) => {
  const ast = typeof query === 'string' ? parse(query) : query

  const result: NormalizeGraphQLQueryResult = {
    ast,
    query: '',
  }

  {
    const { ast, fieldAliasMap } = normalizeFieldAccess(result.ast)
    result.ast = ast
    result.fieldAliasMap = fieldAliasMap
  }

  {
    const {
      ast,
      variables: normalizedVariables,
      argNameMap,
    } = normalizeVariableName(result.ast, variables)
    result.ast = ast
    result.variables = normalizedVariables
    result.argNameMap = argNameMap
  }

  {
    const ast = fillQueryOperationName(result.ast)
    result.ast = ast
  }

  result.query = print(result.ast)

  return result
}

const _transformGraphQLResponseData = (
  data: unknown,
  fieldAliasMap: Map<string, Map<string, string>>,
  path: ReadonlyArray<string> = [],
): any => {
  if (!data) return data
  if (Array.isArray(data)) {
    return data.map(item =>
      _transformGraphQLResponseData(item, fieldAliasMap, path),
    )
  }
  if (isPlainObject(data)) {
    const result: Record<string, any> = {}
    for (const [k, v] of Object.entries(data)) {
      const aliasMap = fieldAliasMap.get(path.join('.'))
      const alias = aliasMap?.get(k)
      result[alias || k] = _transformGraphQLResponseData(v, fieldAliasMap, [
        ...path,
        alias || k,
      ])
    }
    return result
  }
  return data
}

export const transformGraphQLResponse = (
  ctx: Partial<NormalizeGraphQLQueryResult>,
  data?: Record<string, unknown> | null,
) => {
  const { fieldAliasMap } = ctx
  if (fieldAliasMap) {
    return _transformGraphQLResponseData(data, fieldAliasMap, [])
  }
  return data
}

export { default as apolloPlugin } from './apollo-plugin'
