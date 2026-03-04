import Nav from '@/components/Nav'

export default function Policy() {
  return (
    <div className="min-h-screen bg-sky-gradient">
      <Nav />
      <div className="de-section max-w-3xl">
        <h1 className="text-4xl font-bold de-gradient-text mb-8">Privacy Policy</h1>
        <div className="de-card p-8 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-de-sky mb-3">Data We Collect</h2>
            <p className="text-slate-400">We collect only what is necessary to provide the DREAMengin platform. This includes your email, username, and content you choose to publish.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-de-sky mb-3">How We Use It</h2>
            <p className="text-slate-400">Your data is used solely to operate the platform. We do not sell personal information. Ever.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-de-sky mb-3">Your Rights</h2>
            <p className="text-slate-400">You can export, delete, or transfer your data at any time from Settings → Data.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
