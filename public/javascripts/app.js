const statusCheck = response => {
  return response.status < 400 ? response : new Error(response.statusText) 
};

// TODO: Eliminate duplication between constructor and update
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
    this.due_date = this.dueDate(props.month, props.year);
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

  filter(filterOptions) {
    let filtered = this.todos;

    if (filterOptions.complete) {
      filtered = filtered.filter(todo => todo.complete);
    }

    if (filterOptions.date) {
      filtered = filtered.filter(todo => todo.due_date === filterOptions.date);
    }
    
    return filtered;
  }

  allDueDates() {
    return this.countByDueDate(this.todos);
  }
  
  completedDueDates() {
    return this.countByDueDate(this.completed());
  }

  countByDueDate(todos) {
    return todos.reduce((counts, todo) => {
      counts[todo.due_date] = counts[todo.due_date] ?
        counts[todo.due_date] + 1 :
        1
      ;

      return counts;
    }, {});
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
    this.group = 'All Todos';
    this.render();

    // TODO: Display spinning wheel until we have initial response

    fetch('/api/todos')
      .then(statusCheck)
      .then(response => response.json())
      .then(todos => this.todoList = new TodoList(todos))
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

  getState() {
    const title = this.subGroup ? this.subGroup : this.group;
    
    const selected = this.group === 'All Todos' ? 
      this.todoList.filter({date: this.subGroup}) :
      this.todoList.filter({date: this.subGroup, completed: true})
    ;

    return {
      // Used by nav area
      todos: this.todoList.todos,
      todos_by_date: this.todoList.allDueDates(),
      done: this.todoList.completed(),
      done_todos_by_date: this.todoList.completedDueDates(),

      // Used by main area
      current_section: {title: title, data: selected.length},
      selected: selected,
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
    const todosList = document.getElementById('todosList');

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
 
      if (data.title.length < 3) {
        alert('Title must be at least 3 characters long');
        return;
      }

      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      fetch('/api/todos', {method: 'POST', headers: headers, body: JSON.stringify(data)})
        .then(statusCheck)
        .then(response => response.json())
        .then(todo => {
          this.todoList.add(todo);
          this.render();
          this.bindEvents();
        })
        .catch(error => console.log(error));
    };

    addTodoForm.querySelector('[id=complete]').onclick = event => {
      event.preventDefault();
      // serialize
      console.log('hi');
    };

    todosList.onclick = event => {
      event.preventDefault();
      const target = event.target;
      const todoId = target.closest('tr').getAttribute('data-id');
      const parent = target.parentElement;

      // did they click on the todo or the delete button
      if (target.tagName === 'LABEL') {
        console.log('you clicked the thing that will open the modal for todo ' + todoId);
        return;
      }
      else if (target.classList.contains('list_item') 
        || parent.classList.contains('list_item')
      ) {
        console.log('you clicked todo' + todoId);
        return;
      } else if (target.classList.contains('delete') 
        || parent.classList.contains('delete')
      ) {
        fetch('/api/todos/' + todoId, {method: 'DELETE'})
        .then(statusCheck)
        .then(() => {
          this.todoList.remove(Number(todoId));
          this.render();
          this.bindEvents();
        })
        .catch(error => console.log(error));
        return;
      }
    }
  }
}

const app = new App();