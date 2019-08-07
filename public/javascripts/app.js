class Todo {
  constructor(props) {
    this.id = props.id;
    this.title = props.title;
    this.day = props.day;
    this.month = props.month;
    this.year = props.year;
    this.completed = props.completed;
    this.description = props.description;
  }

  toggle() {
    this.completed = !this.completed;
  }

  complete() {
    this.completed = true;
  }

  update(props) {
    this.title = props.title;
    this.day = props.day;
    this.month = props.month;
    this.year = props.year;
    this.completed = props.completed;
    this.description = props.description;
  }

  groupString() {
    if (!this.month || !this.year) {
      return null;
    }

    return this.month + '/' + this.year;
  }
}

class TodoList {
  constructor(propsList) {
    this.todos = this.propsToTodos(propsList)
  }

  propsToTodos(propsList) {
    return propsList.map(props => new Todo(props));
  }

  add(props) {
    this.todos.push(new Todo(props));
  }

  fetchTodo(id) {
    return this.todos.filter(todo => todo.id === id)[0];
  }

  complete(id) {
    this.fetchTodo(id).complete();
  }

  toggle(id) {
    this.fetchTodo(id).toggle();
  }

  update(id, props) {
    this.fetchTodo(id).update(props);
  }

  remove(id) {
    this.todos = this.todos.filter(todo => todo.id !== id);
  }

  filter(groupString) {
    return this.todos.filter(todo => todo.groupString() === groupString);
  }
}

const props = { id: 1, title: 'todo item', day: '01', month: '04', year: '19',
  completed: false, description: '',
};

const props2 = { id: 2, title: 'todo item', day: '01', month: '04', year: '19',
  completed: false, description: '',
};

const props3 = { id: 3, title: 'todo item', day: '01', month: '05', year: '19',
  completed: false, description: '',
};

const todos = new TodoList([props]);