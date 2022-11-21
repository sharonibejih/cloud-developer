import { TodosAccess } from '../dataLayer/todosAcess'
import { createAttachmentPresignedUrl } from '../helpers/attachmentUtils'
// import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { TodoUpdate } from '../models/TodoUpdate';
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
import { getUserId } from '../lambda/utils'
import { APIGatewayProxyEvent } from 'aws-lambda';

// TODO: Implement businessLogic
const todoAccess = new TodosAccess()
const logger = createLogger('Todos')

// get all todos
export async function getTodosForUser(event: APIGatewayProxyEvent): Promise<TodoItem[]> {
    const userId = getUserId(event)
    return todoAccess.getAllTodos(userId)
}

//  create todo
export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  event: APIGatewayProxyEvent
): Promise<TodoItem> {

    try {
        const todoId = uuid.v4()
        const userId = getUserId(event)
        const bucketName = process.env.ATTACHMENT_S3_BUCKET

        return await todoAccess.createTodo({
        todoId: todoId,
        userId: userId,
        name: createTodoRequest.name,
        createdAt: new Date().toISOString(),
        dueDate: createTodoRequest.dueDate,
        done: false,
        attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
  })
    } catch (e) {
        logger.error({ error: e.message })
    }  
}

//  delete todo
export async function deleteTodo(todoId, event: APIGatewayProxyEvent): Promise<any> {
    const userId = getUserId(event)
    return await todoAccess.deleteTodo(todoId, userId)
}

// update todo
export function updateTodo(updateTodoRequest: UpdateTodoRequest, todoId: string, event: APIGatewayProxyEvent): Promise<any> {
    const userId = getUserId(event)
    return todoAccess.updateTodo(todoId, userId, updateTodoRequest)
}

// export async function getTodoById(todoId): Promise<TodoItem>{
//     return getTodoById(todoId)
// }

export function getUploadUrl(todoId: string): Promise<string> {
    return createAttachmentPresignedUrl(todoId)
}



