const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const date = require("date-fns");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

//api--1
app.get("/todos/", async (request, response) => {
  let data = null;
  const getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `SELECT
                                *
                            FROM
                                todo 
                            WHERE
                                todo LIKE '%${search_q}%'
                                AND status = '${status}'
                                AND priority = '${priority}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodoQuery = `SELECT 
                                *
                            FROM 
                                todo
                            WHERE 
                                todo LIKE '%${search_q}%'
                                AND category = '${category}'
                                AND priority = '${priority}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = `SELECT * FROM todo 
                            WHERE todo LIKE '%${search_q}%'
                                  AND category = '${category}'
                                  AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `SELECT * FROM todo
                            WHERE todo LIKE '%${search_q}%'
                                  AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `SELECT * FROM todo 
                            WHERE todo LIKE '%${search_q}%'
                                  AND status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `SELECT * FROM todo
                            WHERE todo LIKE '%${search_q}%'
                                  AND category = '${category}';`;
      break;
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodoQuery);
  response.send(data);
});

//api-2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

//api--3
app.get("/agenda/", async (request, response) => {
  const dateFormat = format(new Date(2021, 2, 22), "yyyy-MM-dd");
  const newDate = isValid(dateFormat);
  if ((newDate = true)) {
    const getDateQuery = `SELECT * FROM todo WHERE due_date = '${dateFormat}';`;
    const dateQuery = await database.get(getDateQuery);
    response.send(dateQuery);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//api--4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, due_date } = request.body;
  const postTodoQuery = `
        INSERT INTO
            todo (id, todo, priority, status, category, due_date)
        VALUES
            (${id}, '${todo}', '${priority}', '${status}', '${category}', '${due_date}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//api--5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.due_date !== undefined:
      updateColumn = "Due Date";
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    due_date = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category = '${category}',
      due_date = '${due_date}' 
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//api--6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM
            todo
        WHERE
            id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
