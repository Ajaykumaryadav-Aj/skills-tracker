import { useEffect, useState } from 'react'
import { Activity, Award, BookOpenCheck, RotateCcw, Sparkles, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import * as collaborationService from '../services/collaborationService'
import { cn, ui } from '../utils/tw'

const icons = {
  'skill-created': BookOpenCheck,
  'topic-completed': Sparkles,
  'revision-completed': RotateCcw,
  'achievement-unlocked': Award,
  'xp-gained': TrendingUp,
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    collaborationService.getActivity({ limit: 30 })
      .then((response) => setActivities(response.data.data.activities || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Productivity" title="Activity Feed" description="A timeline of learning milestones, XP gains, revisions, and achievements." icon={Activity} />
      <section className={cn(ui.panel, 'grid gap-3')}>
        {loading ? Array.from({ length: 6 }).map((_, index) => <div className="skeleton-shimmer h-16 rounded-card" key={index} />) : activities.length === 0 ? (
          <div className={ui.empty}><Activity size={24} /><p>No activity recorded yet.</p></div>
        ) : activities.map((item) => {
          const Icon = icons[item.type] || Activity
          return (
            <article className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-card border border-line bg-white p-4" key={item._id}>
              <span className="grid size-10 place-items-center rounded-card bg-emerald-pale text-emerald-dark-brand"><Icon size={18} /></span>
              <div><h2 className="font-black text-ink">{item.title}</h2><p className="mt-1 text-sm leading-6 text-ink-soft">{item.description || item.type}</p></div>
              <time className="text-xs font-bold text-ink-muted">{new Date(item.createdAt).toLocaleDateString()}</time>
            </article>
          )
        })}
      </section>
    </div>
  )
}
