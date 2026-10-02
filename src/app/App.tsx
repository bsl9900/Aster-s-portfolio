import { About } from '../sections/About/About'
import { Contact } from '../sections/Contact/Contact'
import { Contents } from '../sections/Contents/Contents'
import { Experience } from '../sections/Experience/Experience'
import { Hero } from '../sections/Hero/Hero'
import { PersonalArchive } from '../sections/PersonalArchive/PersonalArchive'
import { Projects } from '../sections/Projects/Projects'
import { PortfolioJellyNav } from '../components/navigation/PortfolioJellyNav'
import { ContentZoom } from '../components/ContentZoom/ContentZoom'
import { usePortfolioScene } from '../components/SceneTransition/usePortfolioScene'
import '../components/SceneTransition/PortfolioScene.css'
import './portfolio-app.css'

function App() {
  const { scene, activeScene, stageRef } = usePortfolioScene()
  return <main className="portfolio-app" data-scene={scene}>
    <div ref={stageRef} className={`portfolio-scene portfolio-scene--${activeScene}`} aria-busy={scene === 'transitioning'}>
      <ContentZoom>{activeScene === 'cover'
        ? <Hero />
        : <><About /><Contents /><Experience /><Projects /><PersonalArchive /><Contact /></>}
      </ContentZoom>
    </div>
    {scene === 'content' && <PortfolioJellyNav />}
  </main>
}

export default App
