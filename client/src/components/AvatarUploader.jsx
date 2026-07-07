import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { ImageUp, Trash2 } from 'lucide-react'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxAvatarSize = 2 * 1024 * 1024

function AvatarUploader({ avatarSrc, uploading, removing, onUpload, onRemove }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0]
    setError('')
    if (!selected) return

    if (!allowedTypes.has(selected.type)) {
      setFile(null)
      setError('Please choose a JPG, PNG, or WEBP image.')
      event.target.value = ''
      return
    }

    if (selected.size > maxAvatarSize) {
      setFile(null)
      setError('Your image is greater than 2MB. Please use an image 2MB or smaller.')
      event.target.value = ''
      return
    }

    setFile(selected)
  }

  const upload = async () => {
    if (!file) return
    await onUpload(file)
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="profile-section profile-avatar-panel" aria-labelledby="avatar-title">
      <div className="section-heading-line">
        <div><p>Profile picture</p><h2 id="avatar-title">Avatar</h2></div>
      </div>
      <div className="avatar-uploader">
        <div className="avatar-uploader__preview">
          {(previewUrl || avatarSrc) ? <img src={previewUrl || avatarSrc} alt="Avatar preview" /> : <span>No image</span>}
        </div>
        <div className="avatar-uploader__actions">
          <label className="button button--secondary" htmlFor="avatar-file"><ImageUp size={16} /> Choose image</label>
          <input ref={inputRef} id="avatar-file" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleFileChange} />
          <button type="button" className="button button--primary" onClick={upload} disabled={!file || uploading}>
            <ImageUp size={16} /> {uploading ? 'Uploading...' : 'Upload Avatar'}
          </button>
          <button type="button" className="button button--danger" onClick={onRemove} disabled={removing || !avatarSrc}>
            <Trash2 size={16} /> {removing ? 'Removing...' : 'Remove Avatar'}
          </button>
        </div>
        <p>{error || 'JPG, JPEG, PNG, or WEBP. Maximum size 2MB.'}</p>
      </div>
    </section>
  )
}

export default memo(AvatarUploader)
