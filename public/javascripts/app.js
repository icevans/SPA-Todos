{
  const ALL_TODOS = 'All Todos';
  const COMPLETED = 'Completed';

  const statusCheck = response => {
    if (response.ok) {
      return response;
    } else {
      return new Error(response.statusText);
    }
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
      // sort todos first by month, then year
      todos.sort((a, b) => {
        if (a.year !== b.year) {
          if (a.year < b.year) { return -1; }
          if (a.year > b.year) { return 1; }
          if (a.year === b.year) { return 0; }
        } else {
          if (a.month < b.month) { return -1; }
          if (a.month > b.month) { return 1; }
          if (a.month === b.month) { return 0; }
        }
      });

      return todos.reduce((counts, todo) => {
        counts[todo.due_date] = counts[todo.due_date] ?
          counts[todo.due_date] + 1 :
          1
        ;

        return counts;
      }, {});
    }
  }

  class Display {
    constructor() {
      this.registerTemplates();
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

    render(context) {
      document.body.innerHTML = this.mainTemplate(context);
      this.highlightNavForCurrentGroup(context);
    }

    highlightNavForCurrentGroup(context) {
      if (!context) {
        return;
      }

      const selector = `[data-title="${context.current_section.title}"]`;
      const allSection = document.getElementById('all');
      const completedSection = document.getElementById('completed_items');
      let activeNav;

      if (context.mainGroup === ALL_TODOS) {
        activeNav = allSection.querySelector(selector);
      } else if (context.mainGroup === COMPLETED) {
        activeNav = completedSection.querySelector(selector);
      }

      // It's possible there is no active nav. This is the case when we delete
      // the last todo in a date group
      if (activeNav) {
        activeNav.classList.add('active');
      }
    }

    showFormModal() {
      document.getElementById('modal_layer').classList.remove('hidden');
      document.getElementById('form_modal').classList.remove('hidden');
    }

    hideFormModal() {
      const formModal = document.getElementById('form_modal');

      document.getElementById('modal_layer').classList.add('hidden');
      formModal.classList.add('hidden');
      formModal.querySelector('form').reset();
    }

    getModalLayer() {
      return document.getElementById('modal_layer');
    }
    getAddTodoButton() {
      return document.querySelector('[for=new_item]');
    }

    getAddTodoForm() {
      return document.querySelector('#form_modal form');
    }

    getTodoFormId() {
      return Number(this.getAddTodoForm().getAttribute('data-id'));
    }

    formIsForNewTodo() {
      return !this.getTodoFormId();
    }

    getTodosList() {
      return document.getElementById('todosList');
    }

    getNavList() {
      return document.getElementById('sidebar');
    }

    getSaveButton() {
      return this.getAddTodoForm().querySelector('[value=Save]');
    }

    getMarkCompleteButton() {
      return this.getAddTodoForm().querySelector('[id=complete]');
    }

    getContainingTodoId(target) {
      return Number(target.closest('tr').getAttribute('data-id'));
    }

    targetIsTodoTitle(target) {
      return target.tagName === 'LABEL';
    }

    targetIsTodoContainer(target) {
      return !this.targetIsTodoTitle(target) && (
        target.classList.contains('list_item') ||
        target.parentElement.classList.contains('list_item')
      );
    }

    targetIsDeleteButton(target) {
      return target.classList.contains('delete')
        || target.parentElement.classList.contains('delete');
    }

    getGroupTitle(target) {
      return target.closest('section').getAttribute('data-group');
    }

    getSubgroupTitle(target) {
      return target.closest('dl').getAttribute('data-title')
    }

    clickedMainGroup(target) {
      const group = target.closest('section').querySelector('div');
      const groupDescendents = Array.from(group.querySelectorAll("*"));

      return target === group || groupDescendents.includes(target);
    }

    clickedOutsideNav(target) {
      return !target.closest('section');
    }
  }

  class App {
    constructor(display) {
      this.todosResource = '/api/todos';
      this.todoResource = function(id) { return '/api/todos/' + id; };
      this.display = display;
      this.todoList = new TodoList([]);
      this.group = ALL_TODOS;
      this.display.render(); // pre-render while we wait on server for todos
      this.fetchTodos();

      setInterval(() => this.fetchTodos(), 60000);
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

    getContext() {
      const title = this.subGroup ? this.subGroup : this.group;
      const selected = this.group === ALL_TODOS ? 
        this.todoList.filter({date: this.subGroup}) :
        this.todoList.filter({date: this.subGroup, completed: true})
      ;
      
      return {
        mainGroup: this.group,
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

    setGroups(target) {
      if (this.display.clickedOutsideNav(target)) {
        return;
      }

      this.group = this.display.getGroupTitle(target);
      this.subGroup = this.display.clickedMainGroup(target)
        ? null
        : this.display.getSubgroupTitle(target)
      ;
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
      const month = String(form.querySelector('[name="month"').value);
      const year = String(form.querySelector('[name="year"').value);

      if (!/^\d{2}$/.test(month) && month !== '') {
        alert('Please enter valid month');
        return false;
      }
      return true;
    }

    fetchTodos() {
      fetch(this.todosResource)
        .then(statusCheck)
        .then(response => {
          if (response.headers.has('ETag')) {
            // cache the etag value for use in the next step
            this.newTodoListETag = response.headers.get('ETag');
          }
          return response.json();
        })
        .then(todos => {
          // We only need to update the app if the server sent back a new etag
          // If it did, we also need to update our etag cache.
          if (this.newTodoListETag !== this.todoListETag) {
            this.todoListETag = this.newTodoListETag;
            this.todoList = new TodoList(todos);
            this.display.render(this.getContext());
            this.bindEvents();
          }
        })
        .catch(error => {
          alert('Failed to get todos. Please try refreshing page.');
          console.log(error);
        });
    }

    updateETag() {
      fetch(this.todosResource, {method: 'HEAD'})
      .then(statusCheck)
      .then(response => this.todoListETag = response.headers.get('ETag'))
    }

    sendTodoData(options) {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      options.data = JSON.stringify(options.data);

      fetch(options.route, {
        method: options.method, headers: headers, body: options.data})
        .then(statusCheck)
        .then(response => response.json())
        .then(options.successCallback)
        .then(this.updateETag.bind(this))
        .catch(error => console.log(error));
    }

    saveTodo(data) {
      this.sendTodoData({
        route: this.todosResource, method: 'POST', data: data, 
        successCallback: (todo) => {
          this.todoList.add(todo);
          this.group = ALL_TODOS;
          this.subGroup = null;
          this.display.render(this.getContext());
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
          this.display.render(this.getContext());
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
        this.display.render(this.getContext());
        this.bindEvents();
      })
      .then(this.updateETag.bind(this))
      .catch(error => console.log(error));
    }

    bindEvents() {
      const addTodoForm = this.display.getAddTodoForm();

      this.display.getAddTodoButton().onclick = () => {
        this.display.showFormModal();
      };

      this.display.getModalLayer().onclick = () => {
        this.display.hideFormModal();
      };

      this.display.getSaveButton().onclick = (event) => {
        event.preventDefault();

        if (!this.validateForm(addTodoForm)) { return; }
        
        const data = this.serializeForm(addTodoForm);
        const todoId = Number(addTodoForm.getAttribute('data-id'));

        todoId ? this.updateTodo(todoId, data) : this.saveTodo(data);
      };

      this.display.getMarkCompleteButton().onclick = event => {
        event.preventDefault();

        if (this.display.formIsForNewTodo()) {
          alert('You must save the todo first.');
          return;
        }

        const todoId = this.display.getTodoFormId();
        const data = this.serializeForm(addTodoForm);
        data.completed = true;
        this.updateTodo(todoId, data);
      };

      this.display.getTodosList().addEventListener('click', event => {
        event.preventDefault();

        const todoId = this.display.getContainingTodoId(event.target);

        if (this.display.targetIsTodoTitle(event.target)) {
          this.populateForm(addTodoForm, this.todoList.fetchTodo(todoId));
          addTodoForm.setAttribute('data-id', todoId);
          this.display.showFormModal();
        }

        if (this.display.targetIsTodoContainer(event.target)) {
          const status = this.todoList.fetchTodo(todoId).completed;
          this.toggleTodoStatus(todoId, status)
        }

        if (this.display.targetIsDeleteButton(event.target)) {
          this.deleteTodo(todoId);
        }
      });

      this.display.getNavList().onclick = event => {
        this.setGroups(event.target);
        this.display.render(this.getContext());
        this.bindEvents();
      }
    }
  }

  const app = new App(new Display());
}