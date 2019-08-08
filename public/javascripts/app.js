{
  const ALL_TODOS = 'All Todos';
  const COMPLETED = 'Completed';

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

      if (filterOptions.completed) {
        filtered = filtered.filter(todo => todo.completed);
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

  class App {
    constructor() {
      this.todosResource = '/api/todos';
      this.todoResource = function(id) { return '/api/todos/' + id; };
      this.registerTemplates();
      this.todoList = new TodoList([]);
      this.group = ALL_TODOS;
      this.render(); // pre-render while we wait on server for todos
      this.fetchTodos();
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
      const selected = this.group === ALL_TODOS ? 
        this.todoList.filter({date: this.subGroup}) :
        this.todoList.filter({date: this.subGroup, completed: true})
      ;
      
      return {
        todos: this.todoList.todos,
        todos_by_date: this.todoList.allDueDates(),
        done: this.todoList.completed(),
        done_todos_by_date: this.todoList.completedDueDates(),
        current_section: {
          title: title, 
          data: selected.length, 
        },
        selected: selected,
      };
    }

    setGroups(navClickEvent) {
      const group = navClickEvent.target.closest('section');
      const subGroup = navClickEvent.target.closest('dl');

      if (group && group.id === 'all') {
        this.group = ALL_TODOS;
      } else if (group && group.id === 'completed_items') {
        this.group = COMPLETED;
      }

      if (subGroup) {
        this.subGroup = subGroup.getAttribute('data-title');
      }
    }

    render() {
      document.body.innerHTML = this.mainTemplate(this.getState());

      const subGroups  = Array.from(
        document.querySelector(`section[data-group="${this.group}"]`)
        .querySelectorAll('dl')
      );

      if (this.subGroup) {
        const activeGroup = subGroups.filter(subGroup => {
          return subGroup.getAttribute('data-title') === this.subGroup;
        })[0];
        activeGroup.classList.add('active');
      } else {
        document
          .querySelector(`section[data-group="${this.group}"] header`)
          .classList.add('active');
      }
    }

    displayModal() {
      document.getElementById('modal_layer').classList.remove('hidden');
      document.getElementById('form_modal').classList.remove('hidden');
    }

    hideModal() {
      const formModal = document.getElementById('form_modal');

      document.getElementById('modal_layer').classList.add('hidden');
      formModal.classList.add('hidden');
      formModal.querySelector('form').reset();
    }

    populateForm(form, todo) {
      Array.from(form.elements).forEach(element => {
        const property = element.getAttribute('name');

        if (property) {            
          element.value = todo[property];
        }
      });
    }

    serializeForm(form) {
      return Array.from(form.elements).reduce((data, el) => {
        const name = el.getAttribute('name');

        if (name) {
          data[name] = el.value;
        }
        return data;
      }, {});
    }

    validateForm(form) {
      if (form.querySelector('[name="title"]').value.length < 3) {
        alert('Title must be at least 3 characters')
        return false;
      }
      return true;
    }

    fetchTodos() {
      fetch(this.todosResource)
        .then(statusCheck)
        .then(response => response.json())
        .then(todos => {
          this.todoList = new TodoList(todos);
          this.render();
          this.bindEvents();
        })
        .catch(error => {
          alert('Failed to get todos. Please try refreshing page.');
          console.log(error);
        }); 
    }

    sendTodoData(options) {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      options.data = JSON.stringify(options.data);

      console.log(options);

      fetch(options.route, {
        method: options.method, headers: headers, body: options.data})
        .then(statusCheck)
        .then(response => response.json())
        .then(options.successCallback)
        .catch(error => console.log(error));
    }

    saveTodo(data) {
      this.sendTodoData({
        route: this.todosResource, method: 'POST', data: data, 
        successCallback: (todo) => {
          this.todoList.add(todo);
          this.group = ALL_TODOS;
          this.subGroup = null;
          this.render();
          this.bindEvents();
        }
      });
    }

    updateTodo(id, data) {
      this.sendTodoData({
        route: this.todoResource(id),
        method: 'PUT',
        data: data,
        successCallback: todo => {
          this.todoList.update(id, todo);
          this.render();
          this.bindEvents();
        },
      });
    }

    toggleTodoStatus(id, status) {
      this.updateTodo(id, {completed: !status});
    }

    deleteTodo(id) {
      fetch(this.todoResource(id), {method: 'DELETE'})
      .then(statusCheck)
      .then(() => {
        this.todoList.remove(id);
        this.render();
        this.bindEvents();
      })
      .catch(error => console.log(error));
    }

    bindEvents() {
      const addTodoButton = document.querySelector('[for=new_item]');
      const modalLayer = document.getElementById('modal_layer');
      const formModal = document.getElementById('form_modal');
      const addTodoForm = formModal.querySelector('form');
      const todosList = document.getElementById('todosList');
      const navList = document.getElementById('sidebar');

      addTodoButton.onclick = () => {
        this.displayModal();
      };

      modalLayer.onclick = () => {
        this.hideModal();
      };

      // For clicking save in form modal
      addTodoForm.querySelector('[value=Save]').onclick = (event) => {
        event.preventDefault();

        if (!this.validateForm(addTodoForm)) { return; }
        
        const data = this.serializeForm(addTodoForm); 
        const todoId = Number(addTodoForm.getAttribute('data-id'));

        todoId ? this.updateTodo(todoId, data) : this.saveTodo(data);
      };

      // For clicking mark complete in form modal
      addTodoForm.querySelector('[id=complete]').onclick = event => {
        event.preventDefault();
        
        if (!addTodoForm.getAttribute('data-id')) {
          alert('You must save the todo first.');
          return;
        }
        
        const todoId = Number(addTodoForm.getAttribute('data-id'));
        const data = this.serializeForm(addTodoForm);
        data.completed = true;

        this.updateTodo(todoId, data);
      };

      // For clicking a todo title or container
      todosList.addEventListener('click', event => {
        event.preventDefault();

        const todoId = Number(event.target.closest('tr').getAttribute('data-id'));
        const parent = event.target.parentElement;
        const targetIsTodoTitle = event.target.tagName === 'LABEL';
        const targetIsTodoContainer = event.target.classList.contains('list_item') 
          || parent.classList.contains('list_item');

        if (targetIsTodoTitle) {
          event.stopPropagation();
          this.populateForm(addTodoForm, this.todoList.fetchTodo(todoId));
          addTodoForm.setAttribute('data-id', todoId);
          this.displayModal();
        } else if (targetIsTodoContainer) {
          const status = this.todoList.fetchTodo(todoId).completed;
          this.toggleTodoStatus(todoId, status)
        }
      });

      // For clicking a todo's delete button
      todosList.addEventListener('click', event => {
        event.preventDefault();
        const todoId = Number(event.target.closest('tr').getAttribute('data-id'));
        const parent = event.target.parentElement;
        const targetIsDeleteButton = event.target.classList.contains('delete')
          || parent.classList.contains('delete');

        if (targetIsDeleteButton) {
          this.deleteTodo(todoId);
        }
      });

      navList.onclick = event => {
        this.setGroups(event);
        this.render();
        this.bindEvents();
      }
    }
  }

  const app = new App();
}