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
const hasCategoryAndPriorityProperties = requestQuery => {
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
    case hasPriorityAndStatusProperties(request.query):
      //PRIORITY AND STATUS
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}' AND priority='${priority}';`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => toDbObject(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatusAndCategoryProperties(request.query):
      //STATUS AND CATEGORY
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND status='${status}';`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => toDbObject(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryAndPriorityProperties(request.query):
      //CATEGORY AND PRIORITY
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
          getTodosQuery = `SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => toDbObject(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasPriorityProperty(request.query):
      //PRIORITY
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}';`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => toDbObject(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasStatusProperty(request.query):
      //STATUS
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}';`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => toDbObject(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasSearchProperty(request.query):
      //SEARCH_Q
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => toDbObject(eachItem)))
      break

    case hasCategoryProperty(request.query):
      //CATEGORY
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category='${category}';`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => toDbObject(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo;`
      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => toDbObject(eachItem)))
  }
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
  const {todoId} = request.params
  const requestBody = request.body
  console.log(requestBody)
  switch (true) {
    //update Status
    case requestBody.status !== undefined:
      const status = requestBody.status
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodoQuery = `
          UPDATE todo
          SET status='${status}'
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
      const priority = requestBody.priority
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodoQuery = `
          UPDATE todo
          SET priority='${priority}'
          WHERE id=${todoId};
          `
        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case requestBody.todo !== undefined:
      //update todo
      const todo = requestBody.todo
      updateTodoQuery = `
          UPDATE todo
          SET todo='${todo}'
          WHERE id=${todoId};
          `
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
    case requestBody.category !== undefined:
      //update category
      const category = requestBody.category
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `
          UPDATE todo
          SET category='${category}'
          WHERE id=${todoId};
          `
        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case requestBody.dueDate !== undefined:
      //update duedate
      const dueDate = requestBody.dueDate
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
