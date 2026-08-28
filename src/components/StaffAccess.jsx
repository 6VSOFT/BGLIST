import { useState } from 'react'
import { LogIn, UserPlus } from 'lucide-react'

export default function StaffAccess({ onSignIn, onSignUp, busy, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const submit = async (event, action) => {
    event.preventDefault()
    await action(email.trim(), password)
  }
  return <section className="mb-5 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-slate-700">
    <p className="font-semibold text-teal-900">登录员工账号以同步共享库存</p>
    <p className="mt-1 text-slate-600">登录后，所有已授权员工会看到同一份桌游资料与图片。</p>
    <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={event => submit(event, onSignIn)}>
      <input aria-label="员工邮箱" className="bg-white" type="email" placeholder="员工邮箱" value={email} onChange={event => setEmail(event.target.value)} required />
      <input aria-label="密码" className="bg-white" type="password" minLength="6" placeholder="密码（至少 6 位）" value={password} onChange={event => setPassword(event.target.value)} required />
      <button disabled={busy} className="inline-flex items-center justify-center gap-1 rounded-lg bg-teal-700 px-3 py-2 font-medium text-white disabled:opacity-60"><LogIn size={16}/>登录</button>
      <button type="button" disabled={busy} onClick={event => submit(event, onSignUp)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-teal-700 px-3 py-2 font-medium text-teal-800 disabled:opacity-60"><UserPlus size={16}/>创建账号</button>
    </form>
    {error && <p className="mt-2 text-rose-700">{error}</p>}
  </section>
}
