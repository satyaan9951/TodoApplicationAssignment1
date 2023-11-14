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
  return requestQuery.priority !== undefined
}
const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}
const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}
const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasStatusAndCategoryProperties = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  )
}
const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
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
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}';`
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasPriorityProperty(request.query):
      if (
        requestQuery.priority === 'HIGH' ||
        requestQuery.priority === 'MEDIUM' ||
        requestQuery.priority === 'LOW'
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}';`
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}' AND priority='${priority}';`
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
      break
    case hasStatusAndCategoryProperties(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        if (
          category === 'WORK' ||
          category === 'HOME' ||
          category === 'LEARNING'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND status='${status}';`
        } else {
          response.status(400)
          response.send('Invalid Todo Category')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category='${category}';`
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND priority='${priority};`
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
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
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
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
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})
//api5
app.put('/todos/:todoId/', async (request, response) => {
  let updateTodoQuery = ''
  let updateColumn = ''
  const {todoId} = request.params
  const requestBody = request.body
  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`
  const previousTodo = await db.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    priority = previousTodo.priority,
    status = previousTodo.status,
    dueDate = previousTodo.dueDate,
  } = request.body
  switch (true) {
    //update Status
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodoQuery = `
          UPDATE todo
          SET todo='${todo}',priority='${priority}',status='${status},category='${category}',due_date='${dueDate}'
          WHERE id=${todoId};
          `
        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case requestBody.priority !== undefined:
      //update priority
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodoQuery = `
          UPDATE todo
          SET todo='${todo}',priority='${priority}',status='${status},category='${category}',due_date='${dueDate}'
          WHERE id=${todoId};
          `
        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case request.body.todo !== undefined:
      //update todo
      updateTodoQuery = `
          UPDATE todo
          SET todo='${todo}',priority='${priority}',status='${status},category='${category}',due_date='${dueDate}'
          WHERE id=${todoId};
          `
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
    case hasCategoryProperty(requestBody.category):
      //update category
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `
          UPDATE todo
          SET todo='${todo}',priority='${priority}',status='${status},category='${category}',due_date='${dueDate}'
          WHERE id=${todoId};
          `
        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case requestBody.dueDate !== undefined:
      //update duedate 
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        const updateTodoQuery = `
          UPDATE
          todo
          SET
          todo='${todo}',priority='${priority}',status='${status},category='${category}',due_date='${dueDate}'
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
