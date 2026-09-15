import { LogIn } from 'lucide-react'

export default function StaffAccess({ onGoogleSignIn, busy, error }) {
  return <section className="rounded-2xl border border-teal-100 bg-teal-50 p-5 text-sm text-slate-700 shadow-sm">
    <p className="font-semibold text-teal-900">使用 Google 帐号登录</p>
    <p className="mt-1 text-slate-600">首次使用会自动建立帐号；登录后可使用云端同步与永久保存。</p>
    <button type="button" disabled={busy} onClick={onGoogleSignIn} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-medium text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60">
      <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-white font-bold text-[#4285F4] ring-1 ring-slate-200">G</span>
      <LogIn size={17}/>{busy ? '正在跳转到 Google…' : '使用 Google 帐号继续'}
    </button>
    {error && <p className="mt-2 text-rose-700">{error}</p>}
  </section>
}
