const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
// check query priority and status
const havePriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
// check query only priority
const havePriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
//check query only status
const haveStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
//get all searched todo
app.get("/todos/", async (request, response) => {
  let dbData = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case havePriorityAndStatus(request.query):
      getTodoQuery = `
            SELECT
            *
            FROM 
            todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';
            `;
      break;
    case havePriority(request.query):
      getTodoQuery = `
            SELECT
            *
            FROM
            todo
            WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';
            `;
      break;
    case haveStatus(request.query):
      getTodoQuery = `
            SELECT 
            * 
            FROM
            todo
            WHERE
            todo LIKE '%${search_q}%' 
            AND status = '${status}';
            `;
      break;
    default:
      getTodoQuery = `
            SELECT 
            * 
            FROM
            todo
            WHERE
            todo LIKE '%${search_q}%';
            `;
  }
  dbData = await db.all(getTodoQuery);
  response.send(dbData);
});
// get specific todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT 
    *
    FROM
    todo
    WHERE
    id = '${todoId}';
    `;
  const dbData = await db.get(getTodoQuery);
  response.send(dbData);
});
// Add a todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status)
  VALUES
    ('${id}', '${todo}', '${priority}', '${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

// Update todo

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedTodoColumn = "";
  const requestBody = request.body;
  console.log(requestBody);
  switch (true) {
    case requestBody.status !== undefined:
      updatedTodoColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedTodoColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedTodoColumn = "Todo";
      break;
  }
  const prevTodoQuery = `
    SELECT
    *
    FROM
    todo
    WHERE 
    id = '${todoId}';
    `;
  const prevTodo = await db.get(prevTodoQuery);

  const {
    todo = prevTodo.todo,
    priority = prevTodo.priority,
    status = prevTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
    todo
    SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
    WHERE 
    id = '${todoId}';
    `;
  await db.run(updateTodoQuery);
  response.send(`${updatedTodoColumn} Updated`);
});

// Delete a todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE
    FROM
    todo
    WHERE
    id = '${todoId}';
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
