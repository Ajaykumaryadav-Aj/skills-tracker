import { memo, useEffect, useState } from 'react'
import { MessageSquare, Reply, Save, Trash2, X } from 'lucide-react'
import * as collaborationService from '../services/collaborationService'
import { cn, ui } from '../utils/tw'

function CommentItem({ comment, onReply, onDelete }) {
  return (
    <article className="grid gap-2 rounded-card border border-line bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong className="text-sm text-ink">{comment.userId?.name || 'Learner'}</strong>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{comment.body}</p>
        </div>
        <button type="button" className={ui.button.icon} onClick={() => onDelete(comment._id)} aria-label="Delete comment"><Trash2 size={15} /></button>
      </div>
      <button type="button" className="inline-flex w-fit items-center gap-1 text-xs font-extrabold text-emerald-dark-brand hover:underline" onClick={() => onReply(comment._id)}><Reply size={14} /> Reply</button>
      {comment.replies?.length > 0 && (
        <div className="ml-4 grid gap-2 border-l border-line pl-3">
          {comment.replies.map((reply) => <CommentItem key={reply._id} comment={reply} onReply={onReply} onDelete={onDelete} />)}
        </div>
      )}
    </article>
  )
}

function CommentsPanel({ targetType, targetId }) {
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [parentId, setParentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadComments = async () => {
    if (!targetId) return
    try {
      const response = await collaborationService.getComments(targetType, targetId)
      setComments(response.data.data.comments || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load comments')
    }
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      if (!targetId) return
      try {
        const response = await collaborationService.getComments(targetType, targetId)
        if (!ignore) {
          setComments(response.data.data.comments || [])
          setError('')
        }
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || 'Unable to load comments')
      }
    }
    load()
    return () => { ignore = true }
  }, [targetType, targetId])

  const submit = async (event) => {
    event.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    try {
      await collaborationService.addComment(targetType, targetId, { body, parentId: parentId || undefined })
      setBody('')
      setParentId('')
      await loadComments()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add comment')
    } finally {
      setLoading(false)
    }
  }

  const deleteComment = async (commentId) => {
    try {
      await collaborationService.deleteComment(commentId)
      await loadComments()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete comment')
    }
  }

  return (
    <section className="grid gap-3 rounded-card border border-line bg-surface-raised p-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="inline-flex items-center gap-2 text-sm font-black text-ink"><MessageSquare size={16} /> Comments</h4>
        {parentId && <button type="button" className="text-xs font-bold text-ink-soft hover:text-ink" onClick={() => setParentId('')}><X size={13} className="mr-1 inline" />Cancel reply</button>}
      </div>
      {error && <p className="rounded-card border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      <form className="grid gap-2" onSubmit={submit}>
        <textarea className={cn(ui.field.input, 'min-h-20 rounded-card border border-line bg-white px-3 py-2')} value={body} onChange={(event) => setBody(event.target.value)} placeholder={parentId ? 'Write a reply...' : 'Add a comment...'} maxLength={1200} />
        <button type="submit" disabled={loading || !body.trim()} className={cn(ui.button.base, ui.button.primary, 'w-fit')}><Save size={15} /> {loading ? 'Posting...' : parentId ? 'Reply' : 'Comment'}</button>
      </form>
      <div className="grid gap-2">
        {comments.length === 0 ? <p className="text-sm text-ink-soft">No comments yet.</p> : comments.map((comment) => (
          <CommentItem key={comment._id} comment={comment} onReply={setParentId} onDelete={deleteComment} />
        ))}
      </div>
    </section>
  )
}

export default memo(CommentsPanel)
