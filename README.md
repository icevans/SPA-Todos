# Todos app

A simple todo list app with a Node.js backend, and vanilla JavaScript for the
front-end. The front-end is a single-page app that interacts with the server
via an API (see /docs/ for API documentation).

## Design Considerations

The app divides responsibilities into three main components. There is a `TodoList`
that serves as an in-memory representation of the current-state of the todo list.
It is provides an interface for interacting with the list. There is a `Display`
module that is responsible for generating/updating the DOM, and provides an
interface for keeping the GUI in sync with the `TodoList`. Finally, there is an
`App` object, which serves as the main entry-point and coordinator. The `App` is
responsible for coordinating between the server, the `TodoList`, and the `Display`.
It is also responsible for registering all event handlers (here there is some
leakage between the `App` and the `Display`, but this seems acceptable in such
a simple application).

## Assumptions

- If a user opens the edit modal for a todo, makes some changes, and then hits 
'Mark as Complete', the todo will not only be marked as complete, it will have its
other values updated as per the form.
- Todos should be listed in the order they were added, which corresponds to the order
of their id.