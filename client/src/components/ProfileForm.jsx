import { memo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Globe, MapPin, Save, Target, UserRound } from 'lucide-react'

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
    <form className="profile-form" onSubmit={handleSubmit(onSubmit)}>
      <section className="profile-section" aria-labelledby="basic-info-title">
        <div className="section-heading-line"><div><p>Basic information</p><h2 id="basic-info-title">Profile details</h2></div></div>
        <div className="form-grid">
          <div>
            <label className="field-label" htmlFor="profile-name">Name</label>
            <div className="field-control field-control--icon"><UserRound size={17} /><input id="profile-name" {...register('name', { required: 'Name is required', maxLength: { value: 100, message: 'Name must be 100 characters or less' } })} /></div>
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="profile-profession">Profession</label>
            <div className="field-control"><input id="profile-profession" {...register('profession', { maxLength: { value: 120, message: 'Profession must be 120 characters or less' } })} /></div>
          </div>
          <div>
            <label className="field-label" htmlFor="profile-location">Location</label>
            <div className="field-control field-control--icon"><MapPin size={17} /><input id="profile-location" {...register('location')} /></div>
          </div>
          <div>
            <label className="field-label" htmlFor="profile-timezone">Timezone</label>
            <div className="field-control"><input id="profile-timezone" placeholder="Asia/Calcutta" {...register('timezone')} /></div>
          </div>
          <div>
            <label className="field-label" htmlFor="profile-experience">Experience Level</label>
            <div className="field-control">
              <select id="profile-experience" {...register('experienceLevel')}>
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

      <section className="profile-section" aria-labelledby="bio-title">
        <div className="section-heading-line"><div><p>Bio</p><h2 id="bio-title">About you</h2></div></div>
        <div className="field-control"><textarea rows="5" {...register('bio', { maxLength: { value: 500, message: 'Bio must be 500 characters or less' } })} /></div>
        {errors.bio && <p className="field-error">{errors.bio.message}</p>}
      </section>

      <section className="profile-section" aria-labelledby="social-title">
        <div className="section-heading-line"><div><p>Social links</p><h2 id="social-title">Web presence</h2></div></div>
        <div className="form-grid">
          <div><label className="field-label" htmlFor="profile-website">Website</label><div className="field-control field-control--icon"><Globe size={17} /><input id="profile-website" {...register('website', urlRule)} /></div>{errors.website && <p className="field-error">{errors.website.message}</p>}</div>
          <div><label className="field-label" htmlFor="profile-github">GitHub</label><div className="field-control"><input id="profile-github" {...register('github', urlRule)} /></div>{errors.github && <p className="field-error">{errors.github.message}</p>}</div>
          <div><label className="field-label" htmlFor="profile-linkedin">LinkedIn</label><div className="field-control"><input id="profile-linkedin" {...register('linkedin', urlRule)} /></div>{errors.linkedin && <p className="field-error">{errors.linkedin.message}</p>}</div>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="goal-title">
        <div className="section-heading-line"><div><p>Learning goal</p><h2 id="goal-title">Current focus</h2></div></div>
        <div className="field-control"><textarea rows="5" {...register('learningGoal', { maxLength: { value: 800, message: 'Learning goal must be 800 characters or less' } })} /></div>
        {errors.learningGoal && <p className="field-error">{errors.learningGoal.message}</p>}
      </section>

      <div className="profile-actions">
        <button type="submit" disabled={saving} className="button button--primary"><Save size={17} /> {saving ? 'Saving...' : 'Save Profile'}</button>
        <button type="button" onClick={onPasswordClick} className="button button--secondary"><Target size={17} /> Change Password</button>
      </div>
    </form>
  )
}

export default memo(ProfileForm)
