//src/components/TaskCard.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTask } from '../context/TaskContext'
import { useNotification } from '../context/NotificationContext'
import { 
  Calendar, 
  Flag, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'

const TaskCard = ({ task }) => {
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [deletingSubtask, setDeletingSubtask] = useState(null)
  const { toggleTaskComplete, toggleSubtaskComplete, deleteTask } = useTask()
  const { addNotification } = useNotification()

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null
    
    const now = new Date()
    const due = new Date(dueDate)
    const tomorrow = addDays(now, 1)
    
    if (isBefore(due, now)) {
      return { status: 'overdue', color: 'text-red-600', label: 'Overdue' }
    } else if (isBefore(due, tomorrow)) {
      return { status: 'due-soon', color: 'text-orange-600', label: 'Due Today' }
    } else if (isBefore(due, addDays(now, 7))) {
      return { status: 'upcoming', color: 'text-blue-600', label: 'Due Soon' }
    }
    
    return { status: 'future', color: 'text-gray-600', label: 'Upcoming' }
  }

  const handleToggleTask = async () => {
    const result = await toggleTaskComplete(task._id, !task.is_completed)
    if (result.success) {
      addNotification({
        type: 'success',
        title: task.is_completed ? 'Task marked incomplete' : 'Task completed!',
        message: task.title
      })
    } else {
      addNotification({
        type: 'error',
        title: 'Error',
        message: result.error
      })
    }
  }

  const handleToggleSubtask = async (subtaskId, isCompleted) => {
    const result = await toggleSubtaskComplete(task._id, subtaskId, !isCompleted)
    if (result.success) {
      addNotification({
        type: 'success',
        title: isCompleted ? 'Subtask marked incomplete' : 'Subtask completed!'
      })
    } else {
      addNotification({
        type: 'error',
        title: 'Error',
        message: result.error
      })
    }
  }

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const result = await deleteTask(task._id)
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Task deleted',
          message: task.title
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error
        })
      }
    }
  }

  const dueDateInfo = getDueDateStatus(task.due_date)
  const completedSubtasks = task.subtasks?.filter(st => st.is_completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0

  return (
    <div className={`card p-4 transition-all duration-200 hover:shadow-lg ${
      task.is_completed ? 'opacity-75' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={handleToggleTask}
            className="mt-1 transition-colors duration-200"
          >
            {task.is_completed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 hover:text-primary-600" />
            )}
          </button>
          
          <div className="flex-1">
            <h3 className={`font-medium text-lg ${
              task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className={`text-sm mt-1 ${
                task.is_completed ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {task.description}
              </p>
            )}
            
            <div className="flex items-center flex-wrap gap-3 mt-3">
              {task.due_date && (
                <div className={`flex items-center space-x-1 text-sm ${
                  dueDateInfo?.color || 'text-gray-600'
                }`}>
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(task.due_date), 'MMM dd, yyyy')}
                  </span>
                  {dueDateInfo && (
                    <span className="text-xs">({dueDateInfo.label})</span>
                  )}
                </div>
              )}
              
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${
                getPriorityColor(task.priority)
              }`}>
                <Flag className="h-3 w-3 mr-1" />
                {task.priority || 'Low'}
              </div>
              
              {totalSubtasks > 0 && (
                <div className="text-sm text-gray-600">
                  {completedSubtasks}/{totalSubtasks} subtasks
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Link
            to={`/edit-task/${task._id}`}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
          >
            <Edit className="h-4 w-4" />
          </Link>
          
          <button
            onClick={handleDeleteTask}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {totalSubtasks > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showSubtasks ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>{totalSubtasks} subtask{totalSubtasks !== 1 ? 's' : ''}</span>
          </button>
          
          {showSubtasks && (
            <div className="mt-3 ml-6 space-y-2">
              {task.subtasks.map(subtask => (
                <div key={subtask._id} className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleSubtask(subtask._id, subtask.is_completed)}
                    className="transition-colors duration-200"
                  >
                    {subtask.is_completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400 hover:text-primary-600" />
                    )}
                  </button>
                  <span className={`text-sm ${
                    subtask.is_completed ? 'line-through text-gray-500' : 'text-gray-700'
                  }`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TaskCard