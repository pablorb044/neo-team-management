import {
  Bell,
  CheckSquare,
  Users,
  ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import Button from '../components/ui/Button'

function Landing() {
  const navigate = useNavigate()

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-6xl space-y-24 py-8">

        {/* Hero */}

        <section className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center">

          <div className="space-y-7 text-center lg:text-left">

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
                NEO
              </p>

              <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Manage your Team.
                <span className="block bg-gradient-to-r from-violet-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                  Get work done.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg lg:mx-0">
                A simple team and task management platform built to keep
                work organized from assignment to completion.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">

              <Button
                type="button"
                onClick={() => navigate('/register')}
                className="sm:w-auto sm:min-w-40"
              >
                Create account
              </Button>

              <Button
                type="button"
                onClick={() => navigate('/login')}
                className="
                  bg-white/10
                  text-white
                  shadow-none
                  hover:bg-white/15
                  sm:w-auto
                  sm:min-w-32
                "
              >
                Login
              </Button>

            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/40 lg:justify-start">
              <span>React</span>
              <span>Node.js</span>
              <span>Express</span>
              <span>Prisma</span>
              <span>PostgreSQL</span>
              <span>Docker</span>
            </div>

          </div>


          {/* Dashboard preview */}

          <div className="relative">

            <div className="absolute -inset-8 rounded-[3rem] bg-violet-600/10 blur-3xl" />

            <div
              className="
                relative
                overflow-hidden
                rounded-3xl
                border
                border-white/10
                bg-[#0d0820]/90
                shadow-2xl
                shadow-violet-950/30
                backdrop-blur-xl
              "
            >

              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">

                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />

                <span className="ml-3 text-xs text-white/30">
                  NEO Dashboard
                </span>

              </div>

              <div className="space-y-5 p-5 sm:p-6">

                <div>
                  <p className="text-xs text-white/40">
                    Team Overview
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Engineering
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40">Sent</p>
                    <p className="mt-2 text-2xl font-semibold">3</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40">Working</p>
                    <p className="mt-2 text-2xl font-semibold">2</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40">Submitted</p>
                    <p className="mt-2 text-2xl font-semibold">1</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40">Done</p>
                    <p className="mt-2 text-2xl font-semibold">8</p>
                  </div>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        Prepare release notes
                      </p>

                      <p className="mt-1 text-xs text-white/40">
                        Assigned to Pablo
                      </p>
                    </div>

                    <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
                      Working
                    </span>
                  </div>

                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/10 to-blue-500/10 p-4">

                  <div>
                    <p className="text-sm font-medium">
                      Team activity
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      Notifications keep everyone updated.
                    </p>
                  </div>

                  <Bell
                    size={20}
                    className="text-violet-300"
                  />

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* Features */}

        <section className="space-y-8">

          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">
              Built for focused teams
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to keep work moving.
            </h2>

            <p className="mt-4 text-sm leading-6 text-white/50 sm:text-base">
              NEO keeps the core workflow simple: organize your team,
              assign work and stay informed.
            </p>
          </div>


          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:bg-white/[0.06]">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <CheckSquare size={21} />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Task workflow
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Assign tasks, track progress and move work from
                SENT to DONE with a simple workflow.
              </p>

            </div>


            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:bg-white/[0.06]">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                <Users size={21} />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Team management
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Manage members, handle join requests and keep
                everyone connected to the right Team.
              </p>

            </div>


            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:bg-white/[0.06]">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300">
                <Bell size={21} />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Notifications
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Stay informed about task and team activity with
                persistent notifications and unread tracking.
              </p>

            </div>

          </div>

        </section>


        {/* CTA */}

        <section>

          <div
            className="
              relative
              overflow-hidden
              rounded-3xl
              border
              border-violet-400/10
              bg-gradient-to-r
              from-violet-500/10
              via-purple-500/10
              to-blue-500/10
              px-6
              py-12
              text-center
              shadow-2xl
              shadow-violet-950/10
              sm:px-10
            "
          >

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12),transparent_60%)]" />

            <div className="relative mx-auto max-w-2xl">

              <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">
                NEO
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready to get your Team moving?
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/50 sm:text-base">
                Create your workspace, invite your Team and start
                managing work in one place.
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

                <Button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="sm:w-auto sm:min-w-40"
                >
                  Create account
                  <ArrowRight
                    size={17}
                    className="ml-2 inline-block"
                  />
                </Button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-5
                    py-3
                    text-sm
                    font-medium
                    text-white/80
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  Login
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* Footer */}

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/40 sm:flex-row">

          <div>
            <p className="font-semibold text-white/70">
              NEO
            </p>

            <p className="mt-1 text-xs">
              Team & Task Management Platform
            </p>
          </div>

          <a
            href="https://github.com/pablorb044/auth-api"
            target="_blank"
            rel="noreferrer"
            className="
              inline-flex
              items-center
              gap-2
              transition
              hover:text-white
            "
          >
            GitHub
          </a>

        </footer>

      </div>
    </AuthLayout>
  )
}

export default Landing