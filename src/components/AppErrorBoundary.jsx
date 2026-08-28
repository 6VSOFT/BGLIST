import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  componentDidCatch(error) { console.error('界面渲染失败：', error) }
  render() {
    if (!this.state.error) return this.props.children
    return <main className="mx-auto max-w-lg p-8"><section className="rounded-2xl bg-white p-6 shadow-sm"><h1 className="text-xl font-bold">页面暂时无法显示</h1><p className="mt-2 text-sm text-slate-600">已保留你的本地资料。请刷新页面；若问题持续，请升级到最新版本后再试。</p><button className="mt-5 rounded-lg bg-teal-700 px-4 py-2 text-white" onClick={() => window.location.reload()}>刷新页面</button></section></main>
  }
}
