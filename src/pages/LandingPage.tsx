import './LandingPage.css'

export function LandingPage() {
  return (
    <div className="landing">
      <video
        className="landing-video"
        autoPlay
        muted
        loop
        playsInline
        src="/intro.mp4"
      />
      <div className="landing-overlay">
        <img src="/logo.svg" className="landing-logo" alt="The Worksheet Project" />
        <p className="landing-tagline">
          A free AI worksheet platform for secondary science teachers.
        </p>
        <a className="landing-cta" href="/onboarding">
          Get started — it's free
        </a>
      </div>
    </div>
  )
}
