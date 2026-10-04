import { AmbientBackground } from '../../components/AmbientBackground/AmbientBackground'
import './Experience.css'

const workExperiences = [
  {
    number: '01',
    company: '广州酷旅旅行社有限公司',
    role: 'UX Designer',
    responsibilities: ['用户调研与竞品分析', '核心链路体验优化', '视觉规范与组件沉淀'],
    period: '2026.06 — Present',
  },
  {
    number: '02',
    company: '上海喜马拉雅总部',
    role: 'Visual Designer',
    responsibilities: ['直播活动视觉体系', '线上线下物料延展', '多尺寸视觉适配'],
    period: '2025.10 — 2026.02',
  },
  {
    number: '03',
    company: '北京酷我科技有限公司',
    role: 'UI Designer',
    responsibilities: ['活动 UI 视觉设计', '游戏化运营界面', 'AIGC 辅助视觉探索'],
    period: '2025.05 — 2025.08',
  },
]

export function Experience() {
  return <section className="experience-section" aria-labelledby="experience-title">
    <AmbientBackground variant="experience" />
    <div className="experience-section__inner">
      <header className="experience-section__heading" data-ambient-safe>
        <p className="experience-section__eyebrow">WORK EXPERIENCE / 2025—PRESENT</p>
        <h2 id="experience-title">EXPERIENCE</h2>
      </header>

      <div className="experience-section__grid" data-ambient-safe>
        {workExperiences.map((experience) => <article className="experience-section__card" key={experience.number}>
          <header className="experience-section__card-header">
            <span className="experience-section__number">{experience.number}</span>
            <span className="experience-section__type">WORK EXPERIENCE</span>
          </header>

          <div className="experience-section__card-body">
            <h3>{experience.company}</h3>
            <p className="experience-section__role">{experience.role}</p>
            <ul>
              {experience.responsibilities.map((responsibility) => <li key={responsibility}>{responsibility}</li>)}
            </ul>
          </div>

          <time className="experience-section__period">{experience.period}</time>
        </article>)}
      </div>
    </div>
  </section>
}
