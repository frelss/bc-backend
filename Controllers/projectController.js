const Project = require("../Models/projectModel");
const User = require("../Models/userModel");

//creating project
exports.createProject = async (req, res) => {
  try {
    const newProject = await Project.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        project: newProject,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error,
    });
  }
};

//deleting project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        status: "fail",
        message: "No project found with the following ID",
      });
    }
    res.status(200).json({
      status: "success",
      message: "Project successfully deleted.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "An unexpected error occurred while deleting the project.",
    });
  }
};

//updating status
exports.updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { newStatus } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(400).json({ message: "Project not found" });
    }

    project.status = newStatus;
    const updatedProject = await project.save();

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({ message: "Error updating project status" });
  }
};

//update deadline
exports.updateProjectDeadline = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { newDeadline } = req.body;
    const parsedDeadline = new Date(newDeadline);

    const project = await Project.findByIdAndUpdate(
      projectId,
      { endDate: parsedDeadline },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (new Date(newDeadline) < new Date(project.startDate)) {
      return res
        .status(400)
        .json({ error: "Deadline cannot be earlier than the start date." });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Error updating project deadline:", error);
    res.status(500).json({ message: "Error updating project deadline" });
  }
};

//get all projects
exports.getallProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .select("title description status startDate endDate prManager")
      .populate("prManager", "name email");

    res.status(200).json({
      status: "success",
      results: projects.length,
      data: {
        projects,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

//uppdating project description
exports.updateProjectDescription = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { description } = req.body;

    const project = await Project.findByIdAndUpdate(
      projectId,
      { description },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

//project details
exports.getProjectDetails = async (req, res) => {
  try {
    const projects = await Project.findById(req.params.projectId);

    if (!projects) {
      return res.status(404).json({
        status: "fail",
        message: "Could not find a project with this ID",
      });
    }

    res.status(200).json({
      status: "success",
      results: projects.length,
      data: {
        projects,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

//getting project for each user sep
exports.getRelevantProjectsForUser = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);

  try {
    let projects;
    if (user.role === "admin") {
      projects = await Project.find(); // Admin az osszeset latja
    } else {
      projects = await Project.find({
        $or: [{ prManager: userId }, { "columns.tasks.assignedTo": userId }],
      })
        .populate("prManager", "name email")
        .populate({
          path: "columns",
          populate: {
            path: "tasks",
            populate: { path: "assignedTo", select: "name" },
          },
        });
    }

    res.status(200).json({
      status: "success",
      results: projects.length,
      data: { projects },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch projects for user: " + error.message,
    });
  }
};

//? getting columns
exports.getColumns = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).select("columns");

    if (!project) {
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        columns: project.columns,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

//? creating columnd
exports.createColumn = async (req, res) => {
  const { projectId } = req.params;
  const { title, position } = req.body;

  try {
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $push: { columns: { title, position, tasks: [] } } },
      { new: true }
    );

    if (!updatedProject) {
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });
    }

    res.status(200).json({
      status: "success",
      data: updatedProject,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

//? deleting column
exports.deleteColumn = async (req, res) => {
  const { projectId, columnId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });
    }

    project.columns.pull({ _id: columnId });

    project.columns.forEach((column, index) => {
      column.position = index;
    });

    await project.save();

    res.status(200).json({
      status: "success",
      data: {
        project: project,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error deleting column" });
  }
};

//? updating column title
exports.updateColumnTitle = async (req, res) => {
  const { projectId, columnId } = req.params;
  const { title } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ status: "fail", message: "Project not found" });
    }

    const column = project.columns.id(columnId);
    if (!column) {
      return res
        .status(404)
        .json({ status: "fail", message: "Column not found" });
    }

    column.title = title;
    await project.save();

    res.status(200).json({
      status: "success",
      data: {
        project,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Error updating column title" });
  }
};

//? updating column Position
exports.updateColumnPositions = async (req, res) => {
  const { projectId } = req.params;
  const { columnPositions } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    columnPositions.forEach((columnPosition) => {
      const column = project.columns.id(columnPosition.id);
      if (column) {
        column.position = columnPosition.position;
      }
    });

    project.columns.sort((a, b) => a.position - b.position);

    project.markModified("columns");
    await project.save();

    const updatedProject = await Project.findById(projectId).populate(
      "columns"
    );
    res.status(200).json({
      status: "success",
      data: { project: updatedProject },
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating column positions", error });
  }
};

//! Creating task
exports.createTask = async (req, res) => {
  const { projectId, columnId } = req.params;
  const { title, dueDate, description, assignedTo, isCompleted } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const column = project.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const newTask = {
      title,
      dueDate,
      description,
      assignedTo,
      isCompleted,
    };
    column.tasks.push(newTask);

    await project.save();

    res.status(201).json({
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating task", error });
  }
};

//!updating task completion
exports.updateTaskCompletedStatus = async (req, res) => {
  const { projectId, columnId, taskId } = req.params;
  const { isCompleted } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      console.log("Project not found with ID:", projectId);
      return res.status(404).send("Project not found");
    }

    const column = project.columns.id(columnId);
    if (!column) {
      console.log("Column not found with ID:", columnId);
      return res.status(404).send("Column not found");
    }

    const task = column.tasks.id(taskId);
    if (!task) {
      console.log("Task not found with ID:", taskId);
      return res.status(404).send("Task not found");
    }

    task.isCompleted = isCompleted;
    await project.save();

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).send("Server error");
  }
};

//! deleting task
exports.deleteTask = async (req, res) => {
  const { projectId, columnId, taskId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const column = project.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const taskIndex = column.tasks.findIndex(
      (task) => task._id.toString() === taskId
    );
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found" });
    }

    column.tasks.splice(taskIndex, 1);

    await project.save();

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Error deleting task", error });
  }
};

//! updating task title
exports.updateTaskTitle = async (req, res) => {
  const { projectId, columnId, taskId } = req.params;
  const { title } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const column = project.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const task = column.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.title = title;
    await project.save();

    res.status(200).json({
      message: "Task title updated successfully",
      task: task,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating task title", error });
  }
};

//! updating task date
exports.updateTaskDate = async (req, res) => {
  const { projectId, columnId, taskId } = req.params;
  const { date } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const column = project.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const task = column.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.dueDate = new Date(date);

    await project.save();

    res.status(200).json({
      status: "success",
      data: task,
    });
  } catch (error) {
    console.error("Failed to update task date:", error);
    res.status(500).json({ message: "Error updating task date" });
  }
};

//!assigning users to task
exports.assignUsersToTask = async (req, res) => {
  const { projectId, columnId, taskId } = req.params;
  const { userIds } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const column = project.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const task = column.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res
        .status(400)
        .json({ message: "One or more User IDs are invalid" });
    }

    task.assignedTo = userIds;
    await project.save();

    res.status(200).json({ message: "Users assigned successfully", task });
  } catch (error) {
    console.error("Error assigning users to task:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

//! updating task description
exports.updateTaskDescription = async (req, res) => {
  const { projectId, columnId, taskId } = req.params;
  const { description } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const column = project.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const task = column.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.description = description;
    await project.save();

    res.status(200).json({
      message: "Task description updated successfully",
      task: task,
    });
  } catch (error) {
    console.error("Error updating task description:", error);
    res.status(500).json({ message: "Error updating task description", error });
  }
};

//!getting subtasks
exports.getSubtasks = async (req, res) => {
  const { projectId, columnId, taskId } = req.params;
  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const column = project.columns.id(columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });

    const task = column.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json(task.sub_tasks);
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    res.status(500).json({ message: "Error fetching subtasks", error });
  }
};

//! creating subtasks
exports.createSubtask = async (req, res) => {
  const { projectId, columnId, taskId } = req.params;
  const { content } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const column = project.columns.id(columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });

    const task = column.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const newSubtask = { title: content };
    task.sub_tasks.push(newSubtask);
    await project.save();

    await project.save();
    const updatedTask = column.tasks.id(taskId);
    res.status(201).json({ task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Error creating subtask", error });
  }
};

//!updating subtask
exports.updateSubtaskTitle = async (req, res) => {
  const { projectId, columnId, taskId, subtaskId } = req.params;
  const { content } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const column = project.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const task = column.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const subtask = task.sub_tasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    subtask.title = content;
    await project.save();

    res
      .status(200)
      .json({ message: "Subtask title updated successfully", subtask });
  } catch (error) {
    res.status(500).json({ message: "Error updating subtask title", error });
  }
};

//! updating subtask completion
exports.updateSubtaskCompletion = async (req, res) => {
  const { projectId, columnId, taskId, subtaskId } = req.params;
  const { isCompleted } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const column = project.columns.id(columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });

    const task = column.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const subtask = task.sub_tasks.id(subtaskId);
    if (!subtask) return res.status(404).json({ message: "Subtask not found" });

    subtask.isCompleted = isCompleted;
    await project.save();

    res.status(200).json({
      message: "Subtask completion status updated successfully",
      subtask,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating subtask completion status", error });
  }
};

//!deleting subtask
exports.deleteSubtask = async (req, res) => {
  const { projectId, columnId, taskId, subtaskId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const column = project.columns.id(columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });

    const task = column.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const subtask = task.sub_tasks.id(subtaskId);
    if (!subtask) return res.status(404).json({ message: "Subtask not found" });

    task.sub_tasks.pull(subtaskId);
    await project.save();

    res.status(200).json({ message: "Subtask deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subtask", error });
  }
};

//! get assigned tasks
exports.getAssignedTasks = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const project = await Project.findById(projectId).populate({
      path: "columns",
      populate: {
        path: "tasks",
      },
    });
    const assignedTasks = [];

    project.columns.forEach((column) => {
      column.tasks.forEach((task) => {
        if (task.assignedTo.includes(userId)) {
          assignedTasks.push(task);
        }
      });
    });

    res.json(assignedTasks);
  } catch (error) {
    console.error("Error fetching assigned tasks:", error);
    res.status(500).json({ message: "Error fetching assigned tasks" });
  }
};

//!getting all tasks
exports.getAllTasksForProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findById(projectId).populate({
      path: "columns",
      populate: {
        path: "tasks",
        populate: { path: "assignedTo", select: "name" },
      },
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const allTasks = project.columns.flatMap((column) => column.tasks);
    res.json(allTasks);
  } catch (error) {
    console.error("Error fetching all tasks for project:", error);
    res.status(500).json({ message: "Error fetching all tasks for project" });
  }
};

//! auto assign
exports.autoAssignTasks = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findById(projectId).populate({
      path: "columns",
      populate: { path: "tasks" },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const totalTasks = project.columns.reduce(
      (acc, column) => acc + column.tasks.length,
      0
    );
    if (totalTasks === 0) {
      return res.status(400).json({
        message: "First, you need to create tasks to assign members to them.",
      });
    }

    const developers = await User.find({ role: "developer" });

    if (!developers.length) {
      return res.status(404).json({ message: "No developers found" });
    }

    // Iterating through each task in each column
    project.columns.forEach((column) => {
      column.tasks.forEach((task) => {
        // Only assign unassigned tasks
        if (!task.assignedTo.length) {
          // Assign task random
          const randomIndex = Math.floor(Math.random() * developers.length);
          task.assignedTo = [developers[randomIndex]._id];
        }
      });
    });

    await project.save();

    res.status(200).json({
      message: "Tasks have been auto-assigned. Please review the changes.",
    });
  } catch (error) {
    console.error("Error auto-assigning tasks:", error);
    res.status(500).json({ message: "Error auto-assigning tasks", error });
  }
};

//! task drag
exports.moveTask = async (req, res) => {
  const { projectId, fromColumnId, toColumnId, taskId } = req.params;
  const { newPosition } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await project.moveTask({
      fromColumnId,
      toColumnId,
      taskId,
      newPosition,
    });

    res.status(200).json({
      message: "Task moved successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error moving task:", error);
    res.status(500).json({ message: "Error moving task", error });
  }
};

//! reorder within column
exports.reorderTaskWithinColumn = async (req, res) => {
  const { projectId, columnId, taskId } = req.params;
  const { newPosition } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const column = project.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const taskIndex = column.tasks.findIndex(
      (task) => task._id.toString() === taskId
    );
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Removing the task and insert it at the new position
    const [task] = column.tasks.splice(taskIndex, 1);
    column.tasks.splice(newPosition, 0, task);

    await project.save();
    res.status(200).json({
      message: "Task reordered successfully within the column",
      data: project,
    });
  } catch (error) {
    console.error("Error reordering task within column:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

//! getting task details
exports.getTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    const project = await Project.findOne({
      "columns.tasks._id": taskId,
    }).populate({
      path: "columns.tasks.assignedTo",
      model: "User",
      select: "name _id",
    });

    if (!project) {
      return res.status(404).json({ message: "Task not found" });
    }

    let taskDetails = null;
    // Loop through columns and tasks to find the matching task
    project.columns.some((column) => {
      return column.tasks.some((task) => {
        if (task._id.toString() === taskId) {
          taskDetails = task;
          return true;
        }
        return false;
      });
    });

    if (!taskDetails) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(taskDetails);
  } catch (error) {
    console.error("Error fetching task details:", error);
    res.status(500).json({ message: "Error fetching task details", error });
  }
};

//?????????????????????????
exports.createMultipleColumns = async (req, res) => {
  const { projectId } = req.params;
  const { columns } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    columns.forEach((column) => {
      project.columns.push({ title: column.title, tasks: column.tasks });
    });

    await project.save();

    res.status(201).json({
      message: "Columns and tasks added successfully",
      data: project.columns,
    });
  } catch (error) {
    console.error("Error adding columns:", error);
    res.status(500).json({ message: "Error adding columns", error });
  }
};

// Updating project managers
exports.updateProjectManagers = async (req, res) => {
  const { projectId } = req.params;
  const { prManagerId } = req.body;

  try {
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { prManager: prManagerId } },
      { new: true }
    ).populate("prManager");

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating project", error: error.message });
  }
};

// REmove project managers
exports.removePrManager = async (req, res) => {
  const { projectId } = req.params;
  const { prManagerId } = req.body;

  try {
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.prManager = project.prManager.filter(
      (userId) => userId.toString() !== prManagerId
    );

    await project.save();

    res.status(200).json({
      message: "PR Manager removed successfully",
      project: project,
    });
  } catch (error) {
    console.error("Error removing PR Manager:", error);
    res
      .status(500)
      .json({ message: "Error removing PR Manager", error: error.message });
  }
};

//?templates
exports.saveTemplateToProject = async (req, res) => {
  const { projectId } = req.params;
  const { template } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.templates.push(template);
    await project.save();
    const addedTemplate = project.templates[project.templates.length - 1];
    res.status(201).json({
      message: "Template added successfully",
      template: addedTemplate,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add template", error: error.message });
  }
};

//?templates
exports.getTemplates = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findById(projectId).select("templates");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(project.templates);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving templates", error: error.message });
  }
};

//?templates
exports.addColumnToTemplate = async (req, res) => {
  const { projectId, templateId } = req.params;
  const { column } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const template = project.templates.id(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    template.columns.push(column);
    await project.save();

    const addedColumn = template.columns[template.columns.length - 1];
    res.status(201).json({
      message: "Column added successfully",
      column: addedColumn,
    });
  } catch (error) {
    console.error("Failed to add column:", error);
    res
      .status(500)
      .json({ message: "Failed to add column", error: error.toString() });
  }
};

//?templates
exports.updateTemplate = async (req, res) => {
  const { projectId, templateId } = req.params;
  const { title, columns } = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const template = project.templates.id(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (title) {
      template.title = title;
    }

    if (columns && Array.isArray(columns)) {
      template.columns = columns.map((column, index) => {
        if (template.columns[index]) {
          // Update existing columns
          return { ...template.columns[index].toObject(), ...column };
        }
        return column;
      });
    }

    await project.save();
    res.json({ message: "Template updated successfully", template });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update template", error: error.message });
  }
};

//?templates
exports.updateColumnTasks = async (req, res) => {
  const { projectId, templateId, columnId } = req.params;
  const { tasks } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).send("Project not found");
    }

    const template = project.templates.id(templateId);
    if (!template) {
      return res.status(404).send("Template not found");
    }

    const column = template.columns.id(columnId);
    if (!column) {
      return res.status(404).send("Column not found");
    }

    column.tasks = tasks;
    await project.save();
    res
      .status(200)
      .json({ message: "Tasks updated successfully", tasks: column.tasks });
  } catch (error) {
    console.error("Error in updateColumnTasks:", error);
    res
      .status(500)
      .json({ message: "Failed to update tasks", error: error.toString() });
  }
};

//?templates
exports.updateTaskInColumn = async (req, res) => {
  const { projectId, templateId, columnId, taskId } = req.params;
  const taskUpdates = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const template = project.templates.id(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const column = template.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    const task = column.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    Object.assign(task, taskUpdates);
    await project.save();

    res.status(200).json({
      message: "Task updated successfully",
      task: task,
    });
  } catch (error) {
    console.error("Failed to update task:", error);
    res.status(500).json({
      message: "Failed to update task",
      error: error.toString(),
    });
  }
};

//?templates
exports.updateFullTemplate = async (req, res) => {
  const { projectId, templateId } = req.params;
  const updatedTemplateData = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).send("Project not found");
    }

    const template = project.templates.id(templateId);
    if (!template) {
      return res.status(404).send("Template not found");
    }

    Object.assign(template, updatedTemplateData);

    await project.save();
    res
      .status(200)
      .json({ message: "Template updated successfully", template });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update template", error: error.toString() });
  }
};

//?templates
exports.deleteTemplate = async (req, res) => {
  const { projectId, templateId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    //filter the templates array
    project.templates = project.templates.filter(
      (t) => t._id.toString() !== templateId
    );

    await project.save();
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting template:", error);
    res
      .status(500)
      .json({ message: "Failed to delete template", error: error.message });
  }
};

//?templates
exports.addTaskToColumn = async (req, res) => {
  const { projectId, templateId, columnId } = req.params;
  const newTask = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const template = project.templates.id(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const column = template.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    column.tasks.push(newTask);
    await project.save();

    const addedTask = column.tasks[column.tasks.length - 1];
    res.status(201).json({
      message: "Task added successfully",
      task: addedTask,
    });
  } catch (error) {
    console.error("Failed to add task:", error);
    res
      .status(500)
      .json({ message: "Failed to add task", error: error.toString() });
  }
};

//?templates
exports.deleteColumnTemplate = async (req, res) => {
  const { projectId, templateId, columnId } = req.params;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      console.error("Project not found");
      return res.status(404).json({ message: "Project not found" });
    }

    const template = project.templates.id(templateId);
    if (!template) {
      console.error("Template not found");
      return res.status(404).json({ message: "Template not found" });
    }

    const column = template.columns.id(columnId);
    if (!column) {
      console.error("Column not found");
      return res.status(404).json({ message: "Column not found" });
    }

    template.columns.pull(columnId);
    await project.save();
    res.status(200).json({ message: "Column deleted successfully" });
  } catch (error) {
    console.error("Error deleting column:", error);
    res
      .status(500)
      .json({ message: "Failed to delete column", error: error.message });
  }
};

//!milestones
exports.createMilestone = async (req, res) => {
  const { projectId } = req.params;
  const { text, isCompleted, userId } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ success: false, error: "Text is required" });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    const newMilestone = {
      text,
      isCompleted: isCompleted || false,
      userId,
    };

    project.milestones.push(newMilestone);
    await project.save();
    // Gets the last milestone, which is the one just added
    const savedMilestone = project.milestones.slice(-1)[0];

    res.status(201).json({ success: true, data: savedMilestone });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMilestones = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.query;
    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    const milestones = project.milestones.filter(
      (milestone) => milestone.userId.toString() === userId
    );

    res.status(200).json({
      success: true,
      count: milestones.length,
      data: milestones,
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    res.status(404).json({ success: false, error: error.message });
  }
};

exports.updateMilestoneIsCompleted = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { isCompleted } = req.body;
    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, error: "Milestone not found" });
    }

    milestone.isCompleted = isCompleted;
    await project.save();

    res.status(200).json({
      success: true,
      data: milestone,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res
        .status(404)
        .json({ success: false, error: "Milestone not found" });
    }

    project.milestones.pull({ _id: milestoneId });
    await project.save();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error("Failed to delete milestone:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};
