import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import styles from './cssmodules/profile.module.css'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [preview, setPreview] = useState<string | null>(user?.avatarUrl || null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    setName(user?.name || '')
    setPreview(user?.avatarUrl || null)
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await api.put('/users/me', {
        name,
        avatarUrl: preview,
      })
      setUser(res.data.data)
      setIsSuccess(true)
      setMessage('Profile updated successfully!')
    } catch {
      setIsSuccess(false)
      setMessage('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>My Profile</h2>

      {message && (
        <p className={`${styles.message} ${isSuccess ? styles.success : styles.error}`}>
          {message}
        </p>
      )}

      <div className={styles.avatarSection}>
        <div className={styles.avatarCircle}>
          {preview ? (
            <img src={preview} alt="Avatar" />
          ) : (
            <span className={styles.avatarPlaceholder}>👤</span>
          )}
        </div>

        <label className={styles.uploadBtn}>
          Choose Avatar
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
        <p className={styles.hint}>Max 2MB. JPG, PNG supported.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className={`${styles.input} ${styles.inputDisabled}`}
          />
        </div>

        <button type="submit" disabled={saving} className={styles.saveBtn}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}