import './DigitalStage.css'

/**
 * Day 1 contains only the empty world stage. Gates, objects, navigation and
 * interactions belong to later, explicitly requested phases.
 */
export function DigitalStage() {
  return (
    <main className="digital-stage" aria-label="Personal Digital World">
      <div className="digital-stage__sky" aria-hidden="true" />
      <div className="digital-stage__horizon" aria-hidden="true" />
      <div className="digital-stage__ground" aria-hidden="true" />
    </main>
  )
}
