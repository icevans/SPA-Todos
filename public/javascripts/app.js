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

  groupString() {
    if (!this.month || !this.year) {
      return null;
    }

    return this.month + '/' + this.year;
  }
}