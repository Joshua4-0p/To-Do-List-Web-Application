import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTask } from '../context/TaskContext'
import { useNotification } from '../context/NotificationContext'
import { Plus, X, Save, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

const TaskForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tasks, createTask, updateTask } = useTask()
  const { addNotification } = useNotification()
  
  const isEditMode = !!id
  const existingTask = isEditMode ? tasks.find(t => t._id === id) : null

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    subtasks: []
  })
  const [newSubtask, setNewSubtask] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode && existingTask) {
      setFormData({
        title: existingTask.title || '',
        description: existingTask.description || '',
        due_date: existingTask.due_date ? 
          format(new Date(existingTask.due_date), "yyyy-MM-dd'T'HH:mm") : '',
        priority: existingTask.priority || 'medium',
        subtasks: existingTask.subtasks || []
      })
    }
  }, [isEditMode, existingTask])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required'
    }
    
    if (formData.due_date && new Date(formData.due_date) < new Date()) {
      newErrors.due_date = 'Due date cannot be in the past'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    const taskData = {
      ...formData,
      due_date: formData.due_date || null
    }
    
    const result = isEditMode 
      ? await updateTask(id, taskData)
      : await createTask(taskData)
    
    if (result.success) {
      addNotification({
        type: 'success',
        title: isEditMode ? 'Task Updated' : 'Task Created',
        message: `"${formData.title}" has been ${isEditMode ? 'updated' : 'created'} successfully.`
      })
      navigate('/')
    } else {
      addNotification({
        type: 'error',
        title: 'Error',
        message: result.error
      })
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [
          ...prev.subtasks,
          {
            _id: Date.now().toString(),
            title: newSubtask.trim(),
            is_completed: false
          }
        ]
      }))
      setNewSubtask('')
    }
  }

  const removeSubtask = (subtaskId) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st._id !== subtaskId)
    }))
  }

  const updateSubtask = (subtaskId, title) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => 
        st._id === subtaskId ? { ...st, title } : st
      )
    }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Task' : 'Create New Task'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditMode ? 'Update your task details' : 'Add a new task to your list'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Details</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input-field mt-1 ${errors.title ? 'border-red-300' : ''}`}
                placeholder="Enter task title..."
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="Add a description for your task..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className={`input-field mt-1 ${errors.due_date ? 'border-red-300' : ''}`}
                />
                {errors.due_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
                )}
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority Level
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="select-field mt-1"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Subtasks Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subtasks</h2>
          
          <div className="space-y-4">
            {/* Add New Subtask */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                className="input-field flex-1"
                placeholder="Add a subtask..."
              />
              <button
                type="button"
                onClick={addSubtask}
                className="btn-primary flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Existing Subtasks */}
            {formData.subtasks.length > 0 && (
              <div className="space-y-2">
                {formData.subtasks.map((subtask, index) => (
                  <div key={subtask._id} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={subtask.title}
                      onChange={(e) => updateSubtask(subtask._id, e.target.value)}
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeSubtask(subtask._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.subtasks.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No subtasks added yet. Break down your task into smaller steps above.
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isEditMode ? 'Update Task' : 'Create Task'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskForm