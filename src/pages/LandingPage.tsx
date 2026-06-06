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
        <p className="landing-tagline">
          A free preview trial AI worksheet platform for secondary science teachers.
        </p>
        <a className="landing-cta" href="/onboarding">
          Get started — free preview trial
        </a>
      </div>
    </div>
  )
}
