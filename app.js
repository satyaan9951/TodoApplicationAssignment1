const express = require('express')
const app = express()
app.use(express.json())

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityProperty = requestQuery => {
  let checkValue = requestQuery.priority !== undefined
  if (
    (checkValue === true && requestQuery.priority === 'HIGH') ||
    requestQuery.priority === 'MEDIUM' ||
    requestQuery.priority === 'LOW'
  ) {
    return checkValue
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
}
const hasStatusProperty = requestQuery => {
  let checkValue = requestQuery.status !== undefined
  if (
    (checkValue === true && requestQuery.status === 'TO DO') ||
    requestQuery.status === 'IN PROGRESS' ||
    requestQuery.status === 'DONE'
  ) {
    return checkValue
  } else {
    response.status(400)
    response.send('Invalid Todo Status')
  }
}
const hasCategoryProperty = requestQuery => {
  let checkValue = requestQuery.category !== undefined
  if (
    (checkValue === true && requestQuery.category === 'WORK') ||
    requestQuery.category === 'HOME' ||
    requestQuery.category === 'LEARNING'
  ) {
    return checkValue
  } else {
    response.status(400)
    response.send('Invalid Todo Category')
  }
}
const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}
const hasPriorityAndStatusProperties = requestQuery => {
  let checkValue1 = requestQuery.priority !== undefined
  let checkValue2 = requestQuery.status !== undefined
  let checkValue3 = checkValue1 && checkValue2
  if (
    (checkValue1 === true && requestQuery.priority === 'HIGH') ||
    requestQuery.priority === 'MEDIUM' ||
    requestQuery.priority === 'LOW'
  ) {
    if (
      (checkValue2 === true && requestQuery.status === 'TO DO') ||
      requestQuery.status === 'IN PROGRESS' ||
      requestQuery.status === 'DONE'
    ) {
      return checkValue3
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
}
const hasStatusAndCategoryProperties = requestQuery => {
  let checkValue1 = requestQuery.status !== undefined
  let checkValue2 = requestQuery.category !== undefined
  let checkValue3 = checkValue1 && checkValue2
  if (
    (checkValue1 === true && requestQuery.status === 'TO DO') ||
    requestQuery.status === 'IN PROGRESS' ||
    requestQuery.status === 'DONE'
  ) {
    if (
      (checkValue2 === true && requestQuery.category === 'WORK') ||
      requestQuery.category === 'HOME' ||
      requestQuery.category === 'LEARNING'
    ) {
      return checkValue3
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Status')
  }
}
const hasCategoryAndPriority = requestQuery => {
  let checkValue1 = requestQuery.category !== undefined
  let checkValue2 = requestQuery.priority !== undefined
  let checkValue3 = checkValue1 && checkValue2
  if (
    (checkValue1 === true && requestQuery.category === 'WORK') ||
    requestQuery.category === 'HOME' ||
    requestQuery.category === 'LEARNING'
  ) {
    if (
      (checkValue2 === true && requestQuery.priority === 'HIGH') ||
      requestQuery.priority === 'MEDIUM' ||
      requestQuery.priority === 'LOW'
    ) {
      return checkValue3
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Category')
  }
}

const toDbObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}
//api1
app.get('/todos/', async (request, response) => {
  const {search_q = '', priority, status, category} = request.query
  let getTodosQuery = ''
  let data = null
  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}';`
      break
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
          SELECT 
            *
          FROM 
            todo
          WHERE 
            todo LIKE '%${search_q}%'
            AND status='${status}'
            AND priority='${priority}';
            `
      break
    case hasSearchProperty(request.query):
      getTodosQuery = `
      SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
      break
    case hasStatusAndCategoryProperties(request.query):
      getTodosQuery = `
      SELECT * FROM todo WHERE category='${category}' AND status='${status}';`
      break
    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT * FROM todo WHERE category='${category}';`
      break
    case hasCategoryAndPriority(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND priority='${priority};`
      break
    default:
      getTodosQuery = `
          SELECT 
            *
          FROM 
            todo
          WHERE 
            todo LIKE '%${search_q}%';
            `
  }
  data = await db.all(getTodosQuery)
  response.send(data.map(eachItem => toDbObject(eachItem)))
})
//api2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
  SELECT *
  FROM todo
  WHERE id=${todoId};
  `
  const todo = await db.get(getTodoQuery)
  response.send(toDbObject(todo))
})
//api3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    const requestQuery = `
    SELECT * FROM todo WHERE due_date='${newDate}';`
    const result = await db.all(requestQuery)
    response.send(result.map(eachItem => toDbObject(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//api4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (hasPriorityProperty) {
    if (hasStatusProperty) {
      if (hasCategoryProperty) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodoQuery = `
          INSERT INTO
          todo(id,todo,category,priority,status,due_date)
          VALUES(${id},'${todo}','${category}','${priority}','${status}','${postNewDueDate}');
          `
          await db.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      }
    }
  }
})
//api5
app.put('/todos/:todoId/', async (request, response) => {
  let updateTodoQuery = ''
  const {todoId} = request.params
  const requestBody = request.body
  switch (true) {
    case hasStatusProperty(requestBody.status):
      const {status} = request.body
      updateTodoQuery = `
          UPDATE todo
          SET status='${status}'
          WHERE id=${todoId};
          `
      await db.run(updateTodoQuery)
      response.send('Status Updated')
      break
    case hasPriorityProperty(requestBody.priority):
      const {priority} = request.body
      updateTodoQuery = `
          UPDATE todo
          SET priority='${priority}'
          WHERE id=${todoId};
          `
      await db.run(updateTodoQuery)
      response.send('Priority Updated')
      break
    case request.body.todo !== undefined:
      const {todo} = request.body
      updateTodoQuery = `
          UPDATE todo
          SET todo='${todo}'
          WHERE id=${todoId};
          `
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
    case hasCategoryProperty(requestBody.category):
      const {category} = request.body
      updateTodoQuery = `
          UPDATE todo
          SET category='${category}'
          WHERE id=${todoId};
          `
      await db.run(updateTodoQuery)
      response.send('Category Updated')
      break
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        const updateTodoQuery = `
          UPDATE
          todo
          SET
          due_date='${newDueDate}'
          WHERE id=${todoId};`
        await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})
//api6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
      DELETE FROM 
      todo
      WHERE
      id=${todoId};
      `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})
module.exports = app
