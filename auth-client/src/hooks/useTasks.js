import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import {
  getMyTasks,
  getTeamTasks,
  createTask as createTaskApi,
  updateTaskStatus,
  deleteTask as deleteTaskApi
} from '../services/task.api'

export function useTasks() {
  const { user } = useAuth()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTasks = useCallback(async () => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const data =
        user.role === 'manager' && user.teamId
          ? await getTeamTasks(user.teamId)
          : await getMyTasks()

      setTasks(data)
    } catch (error) {
      setError(
        error.response?.data?.error ||
        'Error al cargar las tareas'
      )
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user) {
        setTasks([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const data =
          user.role === 'manager' && user.teamId
            ? await getTeamTasks(user.teamId)
            : await getMyTasks()

        if (!cancelled) {
          setTasks(data)
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error.response?.data?.error ||
            'Error al cargar las tareas'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user])

  const changeTaskStatus = async (taskId, status) => {
    try {
      setError('')

      const updatedTask = await updateTaskStatus(
        taskId,
        status
      )

      setTasks(currentTasks =>
        currentTasks.map(task =>
          task.id === taskId
            ? { ...task, ...updatedTask }
            : task
        )
      )

      return updatedTask
    } catch (error) {
      setError(
        error.response?.data?.error ||
        'Error al actualizar la tarea'
      )

      throw error
    }
  }

  const removeTask = async (taskId) => {
    try {
      setError('')

      await deleteTaskApi(taskId)

      setTasks(currentTasks =>
        currentTasks.filter(task => task.id !== taskId)
      )
    } catch (error) {
      setError(
        error.response?.data?.error ||
        'Error al eliminar la tarea'
      )

      throw error
    }
  }

  const createNewTask = async (data) => {
  if (!user?.teamId) {
    throw new Error('User has no team')
  }

  try {
    setError('')

    const newTask = await createTaskApi(
      user.teamId,
      data
    )

    setTasks(currentTasks => [
      newTask,
      ...currentTasks
    ])

    return newTask
  } catch (error) {
    setError(
      error.response?.data?.error ||
      'Error al crear la tarea'
    )

    throw error
  }
  }

  return {
    tasks,
    loading,
    error,
    refreshTasks: loadTasks,
    createNewTask,
    changeTaskStatus,
    removeTask
  }
}