import { memo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, LockKeyhole, Save, X } from 'lucide-react'
import Modal from './Modal'
import { cn, ui } from '../utils/tw'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/

function ChangePasswordModal({ open, loading, onClose, onSubmit }) {
  const [visibleFields, setVisibleFields] = useState({})
  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const close = () => {
    reset()
    setVisibleFields({})
    onClose()
  }

  const submit = async (values) => {
    const success = await onSubmit(values)
    if (success) {
      reset()
      setVisibleFields({})
    }
  }

  const toggleVisible = (field) => {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }))
  }

  const passwordInputType = (field) => (visibleFields[field] ? 'text' : 'password')

  const visibilityButton = (field, label) => (
    <button
      type="button"
      className="grid size-8 place-items-center rounded-card text-ink-soft hover:bg-emerald-pale hover:text-emerald-dark-brand"
      onClick={() => toggleVisible(field)}
      aria-label={visibleFields[field] ? `Hide ${label}` : `Show ${label}`}
      title={visibleFields[field] ? `Hide ${label}` : `Show ${label}`}
    >
      {visibleFields[field] ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  )

  const passwordRules = {
    required: 'New password is required',
    pattern: {
      value: passwordPattern,
      message: 'Use 8+ chars with uppercase, lowercase, number, and special character',
    },
    validate: (value) => value !== getValues('currentPassword') || 'New password must be different from current password',
  }

  return (
    <Modal open={open} onClose={close} title="Change password">
      <form className="grid gap-4" onSubmit={handleSubmit(submit)}>
        <div>
          <label className={ui.field.label} htmlFor="current-password">Current password</label>
          <div className={ui.field.control}>
            <LockKeyhole size={17} className="text-ink-muted" />
            <input className={ui.field.input} id="current-password" type={passwordInputType('currentPassword')} autoComplete="current-password" {...register('currentPassword', { required: 'Current password is required' })} />
            {visibilityButton('currentPassword', 'current password')}
          </div>
          {errors.currentPassword && <p className={ui.field.error}>{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label className={ui.field.label} htmlFor="new-password">New password</label>
          <div className={ui.field.control}>
            <LockKeyhole size={17} className="text-ink-muted" />
            <input
              className={ui.field.input}
              id="new-password"
              type={passwordInputType('newPassword')}
              autoComplete="new-password"
              {...register('newPassword', passwordRules)}
            />
            {visibilityButton('newPassword', 'new password')}
          </div>
          {errors.newPassword && <p className={ui.field.error}>{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className={ui.field.label} htmlFor="confirm-password">Confirm password</label>
          <div className={ui.field.control}>
            <LockKeyhole size={17} className="text-ink-muted" />
            <input
              className={ui.field.input}
              id="confirm-password"
              type={passwordInputType('confirmPassword')}
              autoComplete="new-password"
              {...register('confirmPassword', {
                required: 'Confirm password is required',
                validate: (value) => value === getValues('newPassword') || 'Confirm password must match new password',
              })}
            />
            {visibilityButton('confirmPassword', 'confirm password')}
          </div>
          {errors.confirmPassword && <p className={ui.field.error}>{errors.confirmPassword.message}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={loading} className={cn(ui.button.base, ui.button.primary)}><Save size={16} /> {loading ? 'Saving...' : 'Change Password'}</button>
          <button type="button" onClick={close} className={cn(ui.button.base, ui.button.secondary)}><X size={16} /> Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

export default memo(ChangePasswordModal)
