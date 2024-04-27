const mongoose = require("mongoose");

//?SubTask schema
const subTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

//!task schema
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "Task",
  },
  assignedTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  dueDate: {
    type: Date,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: "",
  },
  sub_tasks: [subTaskSchema],
});

//!column schema
const columnSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "",
  },
  position: {
    type: Number,
    default: 0,
  },
  tasks: [taskSchema],
});

//templates
const templateTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "New Task",
  },
  description: {
    type: String,
    default: "",
  },
});

// Column Schema used in Templates
const templateColumnSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "New Column",
  },
  tasks: [templateTaskSchema],
});

// Template Schema
const templateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "New Template",
  },
  columns: [templateColumnSchema],
});

const milestoneSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  text: {
    type: String,
    required: [true, "Milestone text is required"],
  },
  isCompleted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

//?project schema
const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Project name is required!"],
  },
  description: {
    type: String,
    required: [true, "description is required"],
  },
  status: {
    type: String,
    required: [true, "status is required"],
  },
  startDate: {
    type: Date,
    required: [true, "start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "end date is required"],
  },
  prManager: [
    { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  ],

  milestones: [milestoneSchema],
  columns: [columnSchema],
  templates: [templateSchema],
});

projectSchema.methods.moveTask = async function ({
  fromColumnId,
  toColumnId,
  taskId,
  newPosition,
}) {
  const fromColumn = this.columns.find((column) => column.id === fromColumnId);
  const toColumn = this.columns.find((column) => column.id === toColumnId);

  if (!fromColumn || !toColumn) {
    throw new Error("Column not found");
  }

  const taskIndex = fromColumn.tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) {
    throw new Error("Task not found");
  }
  const [task] = fromColumn.tasks.splice(taskIndex, 1);

  if (newPosition < toColumn.tasks.length) {
    toColumn.tasks.splice(newPosition, 0, task);
  } else {
    toColumn.tasks.push(task);
  }

  await this.save();
};

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
