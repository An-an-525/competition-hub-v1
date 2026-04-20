import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, MapPin, Globe, Edit3, Save, X, Briefcase, GraduationCap, Plus, Trash2 } from 'lucide-react';
import useStore from '../store/useStore'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function Profile() {
  const { profile, updateProfile } = useStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...profile })

  const handleSave = () => {
    updateProfile(form)
    setEditing(false)
  }

  const handleCancel = () => {
    setForm({ ...profile })
    setEditing(false)
  }

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const addTechStack = (tech) => {
    if (tech && !form.techStack.includes(tech)) {
      updateField('techStack', [...form.techStack, tech])
    }
  }

  const removeTechStack = (tech) => {
    updateField('techStack', form.techStack.filter(t => t !== tech))
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-4xl mx-auto">
      <motion.div variants={item} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">个人画像</h1>
        {!editing ? (
          <Button icon={Edit3} variant="secondary" onClick={() => setEditing(true)}>编辑</Button>
        ) : (
          <div className="flex gap-2">
            <Button icon={Save} onClick={handleSave}>保存</Button>
            <Button icon={X} variant="ghost" onClick={handleCancel}>取消</Button>
          </div>
        )}
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={item}>
        <Card hover={false}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar name={profile.name} size="xl" />
            <div className="flex-1 text-center sm:text-left">
              {editing ? (
                <div className="space-y-4">
                  <Input label="姓名" value={form.name} onChange={e => updateField('name', e.target.value)} icon={User} />
                  <Input label="角色" value={form.role} onChange={e => updateField('role', e.target.value)} icon={Briefcase} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">个人简介</label>
                    <textarea
                      value={form.bio}
                      onChange={e => updateField('bio', e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500/50 focus:shadow-[0_0_16px_rgba(99,102,241,0.15)] focus:outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="邮箱" value={form.email} onChange={e => updateField('email', e.target.value)} icon={Mail} />
                    <Input label="位置" value={form.location} onChange={e => updateField('location', e.target.value)} icon={MapPin} />
                  </div>
                  <Input label="GitHub" value={form.github} onChange={e => updateField('github', e.target.value)} icon={Globe} />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-100">{profile.name}</h2>
                  <p className="text-primary-400 text-sm font-medium">{profile.role}</p>
                  <p className="text-slate-400 text-sm mt-2 max-w-lg">{profile.bio}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-slate-500">
                    {profile.email && (
                      <span className="flex items-center gap-1"><Mail size={14} /> {profile.email}</span>
                    )}
                    {profile.location && (
                      <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>
                    )}
                    {profile.github && (
                      <span className="flex items-center gap-1"><Globe size={14} /> {profile.github}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tech Stack */}
      <motion.div variants={item}>
        <Card hover={false}>
          <h3 className="text-base font-semibold text-slate-100 mb-4">技术栈</h3>
          <div className="flex flex-wrap gap-2">
            {form.techStack.map(tech => (
              <motion.div
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative"
              >
                <Badge variant="primary">{tech}</Badge>
                {editing && (
                  <button
                    onClick={() => removeTechStack(tech)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                )}
              </motion.div>
            ))}
            {editing && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="添加技术..."
                  className="w-24 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      addTechStack(e.target.value)
                      e.target.value = ''
                    }
                  }}
                />
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
