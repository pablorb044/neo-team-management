import { TeamModel } from '../models/team.model.js'
import { UserModel } from '../models/user.model.js'
import { TaskModel } from '../models/task.model.js'
import { NotificationModel } from '../models/notification.model.js'
import { createTaskSchema } from '../schemas/create-task.schema.js'
import { uuidParamSchema } from '../schemas/uuid-param.schema.js'

export class TaskController {

  static async create(req, res) {
    try {
      const { teamId } = req.params
      const { title, description, assignedToId } =
        createTaskSchema.parse(req.body)

      uuidParamSchema.parse({
        id: teamId
      })

      const managerId = req.user.id

      const team = await TeamModel.getById(teamId)

      if (!team) {
        return res.status(404).json({
          error: 'Team not found'
        })
      }

      if (team.managerId !== managerId) {
        return res.status(403).json({
          error: 'Only the team manager can create tasks'
        })
      }

      const assignedUser = await UserModel.getById(assignedToId)

      if (!assignedUser) {
        return res.status(404).json({
          error: 'Assigned user not found'
        })
      }

      if (assignedUser.teamId !== teamId) {
        return res.status(400).json({
          error: 'Assigned user does not belong to this team'
        })
      }

      if (assignedUser.role !== 'MEMBER') {
        return res.status(400).json({
          error: 'Tasks can only be assigned to team members with MEMBER role'
        })
      }

      const task = await TaskModel.create({
        title,
        description,
        teamId,
        assignedToId
      })

      await NotificationModel.create({
        userId: assignedToId,
        type: 'TASK_ASSIGNED',
        message: `You have been assigned a new task: "${task.title}"`,
        taskId: task.id
      })

      return res.status(201).json(task)

    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          errors: err.issues
        })
      }

      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async getMyTasks(req, res) {
    try {
      const tasks = await TaskModel.getByAssignee(req.user.id)

      return res.status(200).json(tasks)

    } catch (err) {
      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async updateStatus(req, res) {
    try {
      const { taskId } = req.params
      const { status } = req.body

      uuidParamSchema.parse({
        id: taskId
      })

      const task = await TaskModel.getById(taskId)

      if (!task) {
        return res.status(404).json({
          error: 'Task not found'
        })
      }

      const userId = req.user.id
      const isManager = task.team.managerId === userId

      if (isManager) {
        if (
          task.status !== 'SUBMITTED' ||
          status !== 'DONE'
        ) {
          return res.status(400).json({
            error: 'Invalid task status transition'
          })
        }

        const updatedTask = await TaskModel.updateStatus(
          taskId,
          status
        )

        await NotificationModel.create({
          userId: task.assignedToId,
          type: 'TASK_COMPLETED',
          message: `Your task has been completed: "${task.title}"`,
          taskId: task.id
        })

        return res.status(200).json(updatedTask)
      }

      if (task.assignedToId !== userId) {
        return res.status(403).json({
          error: 'Only the assigned user can update the task status'
        })
      }

      if (
        task.status === 'SENT' &&
        status === 'WORKING'
      ) {
        const updatedTask = await TaskModel.updateStatus(
          taskId,
          status
        )

        return res.status(200).json(updatedTask)
      }

      if (
        task.status === 'WORKING' &&
        status === 'SUBMITTED'
      ) {
        const updatedTask = await TaskModel.updateStatus(
          taskId,
          status
        )

        await NotificationModel.create({
          userId: task.team.managerId,
          type: 'TASK_SUBMITTED',
          message: `${task.assignedTo.username} submitted "${task.title}"`,
          taskId: task.id
        })

        return res.status(200).json(updatedTask)
      }

      return res.status(400).json({
        error: 'Invalid task status transition'
      })

    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          errors: err.issues
        })
      }

      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async delete(req, res) {
    try {
      const { taskId } = req.params

      uuidParamSchema.parse({
        id: taskId
      })

      const task = await TaskModel.getById(taskId)

      if (!task) {
        return res.status(404).json({
          error: 'Task not found'
        })
      }

      if (task.team.managerId !== req.user.id) {
        return res.status(403).json({
          error: 'Only the team manager can delete tasks'
        })
      }

      if (task.status === 'DONE') {
        return res.status(400).json({
          error: 'Completed tasks cannot be deleted'
        })
      }

      await TaskModel.delete(taskId)

      return res.status(204).send()

    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          errors: err.issues
        })
      }

      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async getTeamTasks(req, res) {
    try {
      const { teamId } = req.params

      uuidParamSchema.parse({
        id: teamId
      })

      const managerId = req.user.id

      const team = await TeamModel.getById(teamId)

      if (!team) {
        return res.status(404).json({
          error: 'Team not found'
        })
      }

      if (team.managerId !== managerId) {
        return res.status(403).json({
          error: 'Only the team manager can view team tasks'
        })
      }

      const tasks = await TaskModel.getByTeam(teamId)

      return res.status(200).json(tasks)

    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          errors: err.issues
        })
      }

      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

}