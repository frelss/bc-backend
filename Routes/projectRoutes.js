const express = require("express");
const projectController = require("../Controllers/projectController");

const router = express.Router();

//!project
router.post("/", projectController.createProject);
router.get("/getallprojects", projectController.getallProjects);
router.delete("/:projectId", projectController.deleteProject);
router.patch(
  "/updateProjectStatus/:projectId",
  projectController.updateProjectStatus
);
router.patch(
  "/updateProjectDeadline/:projectId",
  projectController.updateProjectDeadline
);
router.patch(
  "/:projectId/description",
  projectController.updateProjectDescription
);

//? columns
router.get("/:projectId/columns", projectController.getColumns);
router.post("/:projectId/newcolumn", projectController.createColumn);
router.delete("/:projectId/columns/:columnId", projectController.deleteColumn);
router.patch(
  "/:projectId/columns/:columnId",
  projectController.updateColumnTitle
);

router.patch(
  "/:projectId/updateColumnPositions",
  projectController.updateColumnPositions
);

//! task
router.post(
  "/:projectId/columns/:columnId/tasks",
  projectController.createTask
);
router.patch(
  "/:projectId/columns/:columnId/tasks/:taskId",
  projectController.updateTaskCompletedStatus
);

router.delete(
  "/:projectId/columns/:columnId/tasksDelete/:taskId",
  projectController.deleteTask
);

router.patch(
  "/:projectId/columns/:columnId/tasks/:taskId/title",
  projectController.updateTaskTitle
);

router.patch(
  "/:projectId/columns/:columnId/tasks/:taskId/date",
  projectController.updateTaskDate
);

router.patch(
  "/:projectId/columns/:columnId/tasks/:taskId/assign",
  projectController.assignUsersToTask
);

router.patch(
  "/:projectId/columns/:columnId/tasks/:taskId/description",
  projectController.updateTaskDescription
);

router.get(
  "/:projectId/columns/:columnId/tasks/:taskId/subtasks",
  projectController.getSubtasks
);

router.post(
  "/:projectId/columns/:columnId/tasks/:taskId/subtasks",
  projectController.createSubtask
);
router.patch(
  "/:projectId/columns/:columnId/tasks/:taskId/subtasks/:subtaskId/updateTitle",
  projectController.updateSubtaskTitle
);

router.patch(
  "/:projectId/columns/:columnId/tasks/:taskId/subtasks/:subtaskId/updateCompletion",
  projectController.updateSubtaskCompletion
);

router.delete(
  "/:projectId/columns/:columnId/tasks/:taskId/subtasks/:subtaskId/delete",
  projectController.deleteSubtask
);

router.get(
  "/:projectId/tasks/assigned/:userId",
  projectController.getAssignedTasks
);

router.get("/:projectId/allTasks", projectController.getAllTasksForProject);

router.post("/:projectId/autoAssignTasks", projectController.autoAssignTasks);

//?
router.post(
  "/:projectId/columns/multiple",
  projectController.createMultipleColumns
);

router.patch(
  "/updatePrManagers/:projectId",
  projectController.updateProjectManagers
);

router.patch("/removePrManager/:projectId", projectController.removePrManager);

router.get(
  "/user/:userId/projects",
  projectController.getRelevantProjectsForUser
);

router.post(
  "/:projectId/columns/:fromColumnId/tasks/:taskId/move/:toColumnId",
  projectController.moveTask
);

router.get("/tasks/:taskId", projectController.getTaskDetails);

router.post(
  "/:projectId/columns/:columnId/tasks/:taskId/reorder",
  projectController.reorderTaskWithinColumn
);

//? Templates
router.get("/:projectId/templates", projectController.getTemplates);

router.post("/:projectId/templates", projectController.saveTemplateToProject);

router.patch(
  "/:projectId/templates/:templateId",
  projectController.updateTemplate
);

router.post(
  "/:projectId/templates/:templateId/columns",
  projectController.addColumnToTemplate
);

router.post(
  "/:projectId/templates/:templateId/columns/:columnId/tasks",
  projectController.addTaskToColumn
);

router.patch(
  "/:projectId/templates/:templateId/columns/:columnId",
  projectController.updateColumnTasks
);

router.patch(
  "/:projectId/templates/:templateId/columns/:columnId/tasks/:taskId",
  projectController.updateTaskInColumn
);

router.patch(
  "/:projectId/templates/:templateId/full",
  projectController.updateFullTemplate
);

router.delete(
  "/:projectId/templates/:templateId/columns/:columnId",
  projectController.deleteColumnTemplate
);

router.delete(
  "/:projectId/templates/:templateId",
  projectController.deleteTemplate
);

router.post("/:projectId/milestones", projectController.createMilestone);

router.get("/:projectId/milestones", projectController.getMilestones);

router.patch(
  "/:projectId/milestones/:milestoneId",
  projectController.updateMilestoneIsCompleted
);

router.delete(
  "/:projectId/milestones/:milestoneId",
  projectController.deleteMilestone
);

module.exports = router;
