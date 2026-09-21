import { useId, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/http'
import { registerWorkspace } from '../api/workspaces'
import { validateWorkspaceName } from '../pages/workspace/workspaceValidation'

export function useCreateWorkspace() {
  const formId = useId()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value)
    setNameError('')
    setFormError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const error = validateWorkspaceName(name)
    setNameError(error ?? '')
    setFormError('')
    if (error) {
      document.getElementById(`${formId}-name`)?.focus()
      return
    }

    setSubmitting(true)
    try {
      const workspace = await registerWorkspace({ name: name.trim() })
      navigate(`/workspaces/${workspace.id}/invite`, {
        replace: true,
        state: { workspaceName: workspace.name },
      })
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : '워크스페이스를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    formId,
    name,
    nameError,
    formError,
    submitting,
    handleChange,
    handleSubmit,
  }
}
