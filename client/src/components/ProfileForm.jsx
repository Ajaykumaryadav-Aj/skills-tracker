import { memo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Globe, MapPin, Save, Target, UserRound } from 'lucide-react'
import { cn, ui } from '../utils/tw'

const urlRule = {
  pattern: {
    value: /^https?:\/\/.+/i,
    message: 'Use a valid URL starting with http:// or https://',
  },
}

function ProfileForm({ user, saving, onSubmit, onPasswordClick }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: user })

  useEffect(() => {
    reset(user)
  }, [reset, user])

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <section className={`${ui.panel} scroll-mt-28`} aria-labelledby="basic-info-title">
        <div className="mb-5"><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Basic information</p><h2 id="basic-info-title" className="mt-1 text-xl font-black text-ink">Profile details</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={ui.field.label} htmlFor="profile-name">Name</label>
            <div className={ui.field.control}><UserRound size={17} className="text-ink-muted" /><input className={ui.field.input} id="profile-name" {...register('name', { required: 'Name is required', maxLength: { value: 100, message: 'Name must be 100 characters or less' } })} /></div>
            {errors.name && <p className={ui.field.error}>{errors.name.message}</p>}
          </div>
          <div>
            <label className={ui.field.label} htmlFor="profile-profession">Profession</label>
            <div className={ui.field.control}><input className={ui.field.input} id="profile-profession" {...register('profession', { maxLength: { value: 120, message: 'Profession must be 120 characters or less' } })} /></div>
          </div>
          <div>
            <label className={ui.field.label} htmlFor="profile-location">Location</label>
            <div className={ui.field.control}><MapPin size={17} className="text-ink-muted" /><input className={ui.field.input} id="profile-location" {...register('location')} /></div>
          </div>
          <div>
            <label className={ui.field.label} htmlFor="profile-timezone">Timezone</label>
            <div className={ui.field.control}><input className={ui.field.input} id="profile-timezone" placeholder="Asia/Calcutta" {...register('timezone')} /></div>
          </div>
          <div>
            <label className={ui.field.label} htmlFor="profile-experience">Experience Level</label>
            <div className={ui.field.control}>
              <select className={`${ui.field.input} cursor-pointer`} id="profile-experience" {...register('experienceLevel')}>
                <option value="">Select level</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className={`${ui.panel} scroll-mt-28`} aria-labelledby="bio-title">
        <div className="mb-5"><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Bio</p><h2 id="bio-title" className="mt-1 text-xl font-black text-ink">About you</h2></div>
        <div className={`${ui.field.control} items-start py-3`}><textarea className={`${ui.field.input} min-h-32 resize-y leading-6`} rows="5" {...register('bio', { maxLength: { value: 500, message: 'Bio must be 500 characters or less' } })} /></div>
        {errors.bio && <p className={ui.field.error}>{errors.bio.message}</p>}
      </section>

      <section className={`${ui.panel} scroll-mt-28`} aria-labelledby="social-title">
        <div className="mb-5"><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Social links</p><h2 id="social-title" className="mt-1 text-xl font-black text-ink">Web presence</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className={ui.field.label} htmlFor="profile-website">Website</label><div className={ui.field.control}><Globe size={17} className="text-ink-muted" /><input className={ui.field.input} id="profile-website" {...register('website', urlRule)} /></div>{errors.website && <p className={ui.field.error}>{errors.website.message}</p>}</div>
          <div><label className={ui.field.label} htmlFor="profile-github">GitHub</label><div className={ui.field.control}><input className={ui.field.input} id="profile-github" {...register('github', urlRule)} /></div>{errors.github && <p className={ui.field.error}>{errors.github.message}</p>}</div>
          <div><label className={ui.field.label} htmlFor="profile-linkedin">LinkedIn</label><div className={ui.field.control}><input className={ui.field.input} id="profile-linkedin" {...register('linkedin', urlRule)} /></div>{errors.linkedin && <p className={ui.field.error}>{errors.linkedin.message}</p>}</div>
        </div>
      </section>

      <section className={`${ui.panel} scroll-mt-28`} aria-labelledby="goal-title">
        <div className="mb-5"><p className="text-xs font-extrabold uppercase text-emerald-dark-brand">Learning goal</p><h2 id="goal-title" className="mt-1 text-xl font-black text-ink">Current focus</h2></div>
        <div className={`${ui.field.control} items-start py-3`}><textarea className={`${ui.field.input} min-h-32 resize-y leading-6`} rows="5" {...register('learningGoal', { maxLength: { value: 800, message: 'Learning goal must be 800 characters or less' } })} /></div>
        {errors.learningGoal && <p className={ui.field.error}>{errors.learningGoal.message}</p>}
      </section>

      <div className="flex flex-col gap-2 rounded-card border border-line bg-white p-3 shadow-card sm:flex-row sm:justify-end">
        <button type="button" onClick={onPasswordClick} className={cn(ui.button.base, ui.button.secondary, 'w-full sm:w-auto')}><Target size={17} /> Change Password</button>
        <button type="submit" disabled={saving} className={cn(ui.button.base, ui.button.primary, 'w-full sm:w-auto')}><Save size={17} /> {saving ? 'Saving...' : 'Save Profile'}</button>
      </div>
    </form>
  )
}

export default memo(ProfileForm)
