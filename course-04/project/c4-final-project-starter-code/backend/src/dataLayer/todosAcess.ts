import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk')
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE) { } 

  async getAllTodos(userId): Promise<TodoItem[]> {
    logger.info('Getting Todos')

    const res = await this.docClient.query({
        TableName: this.todosTable,
        KeyConditionExpression: '#userId = :userId',
        ExpressionAttributeNames: {
          '#userId': 'userId'
        },
        ExpressionAttributeValues: {
          ':userId': userId
        }
    }).promise()

    const todoItems = res.Items
    return todoItems as TodoItem[]
  }
    
  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todo
    }).promise()

    return todo
  }  
  
  async deleteTodo(todoId: string, userId: string): Promise<string> {
    logger.info('Deleting todo')

    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        }
      })
      .promise()
    
    return ''
  }

  
  async getTodoById(todoId): Promise<TodoItem> {
    const res = await this.docClient.get({
        TableName: this.todosTable,
        Key : {
            todoId
        }
    }).promise()

    const todoItem = res.Item
    return todoItem as TodoItem
}
  
  async updateTodo(
    todoId: string,
    userId: string,
    todoUpdate: TodoUpdate
  ): Promise<TodoUpdate> {
    logger.info('Updating todo item')

    const result = await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression:
          'set #name = :name, #dueDate = :dueDate, #done = :done',
        ExpressionAttributeValues: {
          ':name': todoUpdate.name,
          ':dueDate': todoUpdate.dueDate,
          ':done': todoUpdate.done
        },
        ExpressionAttributeNames: {
          '#name': 'todoItemName',
          '#dueDate': 'ItemDueDate',
          '#done': 'itemStatus'
        }

      })
      .promise()

    const attributes = result.Attributes

    return attributes as TodoUpdate
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }
  else {
    return new XAWS.DynamoDB.DocumentClient()
  }
}