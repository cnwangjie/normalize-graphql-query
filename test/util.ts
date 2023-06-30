import { ApolloServer } from 'apollo-server'
import assert from 'assert'
import crypto from 'crypto'
import {
  FieldNode,
  GraphQLSchema,
  Kind,
  TypeNode,
  isInputObjectType,
  parse,
  print,
  visit,
} from 'graphql'
import { normalizeGraphQLQuery, transformGraphQLResponse } from '../src'

export const messUpVariables = (
  query: string,
  variables: Record<string, any>,
) => {
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

export const messUpAccessFields = (query: string) => {
  const ast = parse(query)

  const messedUpAst = visit(ast, {
    Field(node) {
      const newField: FieldNode = {
        ...node,
        alias: {
          kind: Kind.NAME,
          value: `${node.name.value}_${crypto.randomBytes(8).toString('hex')}`,
        },
      }
      return newField
    },
  })

  return print(messedUpAst)
}

const NullPercent = 0.1

const genVariableForType = (
  schema: GraphQLSchema,
  typeName: string,
  nonNullable = false,
) => {
  const type = schema.getType(typeName)
  assert(type, `Type ${typeName} not found`)
  if (!nonNullable && Math.random() < NullPercent) return null
  if (isInputObjectType(type)) {
    const o: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(type.getFields())) {
      if (!v.astNode) continue
      o[k] = genVariable(schema, v.astNode.type)
    }
    return o
  }
}

const genVariable = (
  schema: GraphQLSchema,
  type: TypeNode,
  nonNullable = false,
): any => {
  if (type.kind === Kind.NAMED_TYPE) {
    if (!nonNullable && Math.random() < NullPercent) return null
    const t = type.name.value
    if (t === 'String') return Math.random() + ''
    if (t === 'Int') return (Math.random() * 1e10) | 0
    if (t === 'Float') return Math.random()
    if (t === 'Boolean') return Math.random() > 0.5
    return genVariableForType(schema, t, nonNullable)
  }

  if (type.kind === Kind.NON_NULL_TYPE) {
    return genVariable(schema, type.type, true)
  }

  if (type.kind === Kind.LIST_TYPE) {
    return [genVariable(schema, type.type)]
  }
}

export const generateVariables = (schema: GraphQLSchema, query: string) => {
  const ast = parse(query)
  const variables: Record<string, any> = {}
  visit(ast, {
    VariableDefinition(node) {
      const varName = node.variable.name.value
      variables[varName] = genVariable(schema, node.type)
    },
  })
  return variables
}

export const shouldReturnSameValueWithOriginal = async (
  server: ApolloServer,
  query: string,
  variables: Record<string, any>,
) => {
  const messedUpReq = messUpVariables(messUpAccessFields(query), variables)
  const res = await server.executeOperation(messedUpReq)
  expect(res.errors).toBeFalsy()
  const { data: expected } = res
  const normalized = normalizeGraphQLQuery(messedUpReq)
  const { data } = await server.executeOperation(normalized)
  const actual = transformGraphQLResponse(normalized, data)

  expect(expected).toBeTruthy()
  expect(actual).toEqual(expected)
}
