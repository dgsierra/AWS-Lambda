/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})

const dynamo = DynamoDBDocumentClient.from(client)

const tableName = 'http-crud-tutorial-items'
const tableUsers = 'histori-users-table'
const tableOrders = 'histori-orders'
const date = new Date().toString()

const uniqueId = () => {
  const s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  // return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
}

export const handler = async (event, context) => {
  let body
  let statusCode = 200
  const headers = {
    'Content-Type': 'application/json'
  }

  try {
    switch (event.routeKey) {
      //  * =============MENU ITEMS - DELETE ITEM BY ID================
      case 'DELETE /items/{id}':
        await dynamo.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              id: event.pathParameters.id
            }
          })
        )
        body = `Deleted item ${event.pathParameters.id}`
        break
        // * =============MENU ITEMS GET ALL ITEMS================
      case 'GET /items':
        body = await dynamo.send(
          new ScanCommand({ TableName: tableName })
        )
        body = body.Items
        break
      // * =============MENU ITEMS GET ONE ITEM BY ID ================
      case 'GET /items/{id}':
        body = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              id: event.pathParameters.id
            }
          })
        )
        body = body.Item
        break
        // * =============MENU ITEMS PUT ITEM ================
      case 'PUT /items':
        const requestJSON = JSON.parse(event.body)
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              id: uniqueId(),
              role: requestJSON.role,
              dish: requestJSON.dish
            }
          })
        )
        body = `Agregado el platillo ${requestJSON.dish} para la posición de ${requestJSON.role}`
        break
        // * ============= USERS ================

      // * ============= GET USER BY ID ================
      case 'GET /users/{id}':
        body = await dynamo.send(
          new GetCommand({
            TableName: tableUsers,
            Key: {
              id: event.pathParameters.id
            }
          })
        )
        body = body.Item
        break
        // * ============= ADD NEW USER ================
      case 'PUT /users':
        const requestJSONUser = JSON.parse(event.body)
        await dynamo.send(
          new PutCommand({
            TableName: tableUsers,
            Item: {
              id: requestJSONUser.id,
              role: requestJSONUser.role,
              name: requestJSONUser.name
            }
          })
        )
        body = `User saves with the ID: ${requestJSONUser.id} name: ${requestJSONUser.name} and role: ${requestJSONUser.role}`
        break
        // * ============= ORDERS ================
        //  * ============= PUT ORDERS BY USER ================
      case 'PUT /orders':
        const requestJSONOrder = JSON.parse(event.body)
        await dynamo.send(
          new PutCommand({
            TableName: tableOrders,
            Item: {
              '{id}': requestJSONOrder.id,
              items: requestJSONOrder.items,
              user: requestJSONOrder.user,
              date: date
            }
          })
        )
        body = `Hola ${requestJSONOrder.user.name} tu orden ha sido recibida, con ${requestJSONOrder.items.length} articulos a las ${date}`
        break
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`)
    }
  } catch (err) {
    statusCode = 400
    body = err.message
  } finally {
    body = JSON.stringify(body)
  }

  return {
    statusCode,
    body,
    headers
  }
}
