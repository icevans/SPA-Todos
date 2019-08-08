const statusCheck = response => {
  return response.status < 400 ? response : new Error(response.statusText) 
};

class Todo {
  constructor(props) {
    this.id = props.id;
    this.title = props.title;
    this.day = props.day;
    this.month = props.month;
    this.year = props.year;
    this.due_date = this.dueDate(props.month, props.year);
    this.completed = props.completed;
    this.description = props.description;
  }

  dueDate(month, year) {
    if (month && year) {
      return month + '/' + year.slice(-2);
    } else {
      return 'No Due Date';
    }
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

  completed() {
    return this.todos.filter(todo => todo.completed);
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


// the app loop is basically, whenever something happens, update
// the state and re-render. changing groups is a natural time to refresh the
// list from the server and create a fresh state
class App {
  constructor() {
    this.registerTemplates();

    // Pre-render an empty list to improve perceived load time. This is mostly
    // necessary since Babel converts our code at runtime, which is a significant
    // performance hit. For production, we would transpile our code from a build
    // script in the dev environment, and only ship the transpiled asset. This
    // would also save us a network request for the Babel package. Another performance
    // hit is compiling our templates at run-time instead of during a pre-production
    // build step.
    this.todoList = new TodoList([]);
    this.group = {title: 'All Todos', todos: this.todoList};
    this.render();

    fetch('/api/todos')
      .then(statusCheck)
      .then(response => response.json())
      .then(todos => this.setInitialState(todos))
      .then(() => this.render())
      .then(() => this.bindEvents())
      .catch(error => {
        alert('Failed to get todos. Please try refreshing page.');
        console.log(error);
      }); 
  }

  registerTemplates() {
    const templates = Array.from(
      document.querySelectorAll('[type="text/x-handlebars"]')
    );

    templates.forEach(template => {
      const templateFunc = Handlebars.compile(template.innerHTML);
      Handlebars.registerPartial(template.id, templateFunc);

      if (template.id === 'main_template') {
        this.mainTemplate = templateFunc;
      }
    });
  }

  setInitialState(todos) {
    this.todoList = new TodoList(todos);
    this.group = {
      title: 'All Todos',
      todos: this.todoList.todos,
    };

    return Promise.resolve();
  }

  getState() {
    return {
      // Used by nav area
      todos: this.todoList.todos,
      todos_by_date: {'04/19': [/* todos */]},
      done: this.todoList.completed(),
      done_todos_by_date: {'04/19': [/* todos */]},

      // Used by main area
      current_section: {title: this.group.title, data: this.group.todos.length},
      selected: this.group.todos,
    };
  }

  render() {
    document.body.innerHTML = this.mainTemplate(this.getState());
  }

  bindEvents() {
    const addTodoButton = document.querySelector('[for=new_item]');
    const modalLayer = document.getElementById('modal_layer');
    const formModal = document.getElementById('form_modal');
    const addTodoForm = formModal.querySelector('form');

    addTodoButton.onclick = () => {
      modalLayer.classList.remove('hidden');
      formModal.classList.remove('hidden');
    };

    modalLayer.onclick = () => {
      modalLayer.classList.add('hidden');
      formModal.classList.add('hidden');
      addTodoForm.reset();
    };

    addTodoForm.querySelector('[value=Save]').onclick = (event) => {
      event.preventDefault();
      // serialize form data
      const data = Array.from(addTodoForm.elements).reduce((data, el) => {
        const name = el.getAttribute('name');

        if (name) {
          data[name] = el.value;
        }
        return data;
      }, {});
 
      console.log(data)

      if (data.title.length < 3) {
        alert('Title must be at least 3 characters long');
        return;
      }

      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      fetch('/api/todos', {method: 'POST', headers: headers, body: JSON.stringify(data)})
        .then(status)
        .then(response => response.json())
        .then(todo => {
          this.todoList.add(todo);
          this.render();
          this.bindEvents();
        })
        .catch(error => console.log(error));
    };

    addTodoForm.querySelector('[id=complete]').onclick = (event) => {
      event.preventDefault();
      // serialize
      console.log('hi');
    };
  }
}

const app = new App();