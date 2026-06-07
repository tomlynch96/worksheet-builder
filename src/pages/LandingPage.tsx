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
          Join the initial trial of The Worksheet Project — the AI worksheet platform where teachers take control.
        </p>
        <a className="landing-cta" href="/onboarding">
          Get started — free preview trial
        </a>
      </div>
    </div>
  )
}
