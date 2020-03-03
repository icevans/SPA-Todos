# Todos app

A simple todo list app with a Node.js backend, and vanilla JavaScript for the
front-end. The front-end is a single-page app that interacts with the server
via an API (see /docs/ for API documentation).

## Setup

To run the app locally:

1. Create a sqlite database in the `db/` directory
1. Import `reset.sql` into this database
1. Run `npm install`
1. Run `npm start` and view the app in your browser at `http://localhost:3000`
1. API documentation can be viewed at `http://localhost:3000/docs`

## Design Considerations

The app divides responsibilities into three main components. There is a `TodoList`
that serves as an in-memory representation of the current-state of the todo list.
It is provides an interface for interacting with the list. There is a `Display`
module that is responsible for generating/updating the DOM, and provides an
interface for keeping the GUI in sync with the `TodoList`. Finally, there is an
`App` object, which serves as the main entry-point and coordinator. The `App` is
responsible for coordinating between the server, the `TodoList`, and the `Display`.
It is also responsible for registering all event handlers.

In order to keep in sync with the server and support the user interacting with
their todo list from different browser windows/devices, the app polls the server
periodically and checks whether the todo list has change (using the ETag header).
If the data has changed, the app re-renders its display. It ensures that its own
data transformations don't later trigger an unnecessary re-render by sending a 
HEAD request after every data transformation to keep its local copy of the ETag
up to date.

We're using Babel Standalone, which transpiles the main script client-side. This
is a somewhat slow operation, and the page can't show anything until it's done
becaues the script is responsible for rendering. Additionally, we're compiling
Handlebars templates at runtime, which further slows us down. For prodcution, we'd
handle both of these tasks in a build step before deploying. But to improve
perceived performance on this dev version, as soon as the app initializes we
pre-render the main-template before getting the main template. This way, something
shows up as soon as possible. Additionally, in the HTML we inline a script that
pre-fetches image assets that we will need in our template -- this way the 
browser can download these while Babel is transpiling our script.

## Assumptions

- If a user opens the edit modal for a todo, makes some changes, and then hits 
'Mark as Complete', the todo will not only be marked as complete, it will have its
other values updated as per the form.
- Todos should be listed in the order they were added, which corresponds to the order
of their id.
- Incomplete due dates are allowed, but show up as "No Due Date"
- If you update a todo's date, the current group stays the same, even if the
todo was the last in that group.
- If you close a modal without saving or marking complete, any data you had
entered is lost
- You cannot clear due date parts from a todo by moving them back to the placeholder
value in the update form. This is actually a limitation of the API -- doing this
correctly submits the date part with an empty string for a value, but line 30 of
`routes/api.js` strips any properties with empty string values before constructing
the update query.
- Todo list groups are sorted first by year, then by month, starting from the
earliest date group.
