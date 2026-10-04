export type ProjectDetailSection = {
  id: string
  label: string
  startImageIndex: number
  anchorOffsetRatio?: number
}

export const projectSections: Record<string, ProjectDetailSection[]> = {
  '01': [
    { id: 'project-01-overview', label: '项目概况', startImageIndex: 0 },
    { id: 'project-01-order', label: '下单链路', startImageIndex: 2 },
    { id: 'project-01-custom-route', label: '定制路线', startImageIndex: 8 },
    { id: 'project-01-membership', label: '会员链路', startImageIndex: 13 },
    { id: 'project-01-visual', label: '视觉升级', startImageIndex: 17 },
  ],
  '02': [
    { id: 'overview', label: '项目概况', startImageIndex: 0 },
    { id: 'project-02-annual-ceremony', label: '线上视觉', startImageIndex: 1 },
    { id: 'offline', label: '线下视觉', startImageIndex: 4 },
  ],
  '03': [
    { id: 'project-03-overview', label: '项目概况', startImageIndex: 0 },
    { id: 'project-03-visual', label: '视觉打造', startImageIndex: 2 },
    { id: 'project-03-gameplay', label: '玩法吸引', startImageIndex: 6 },
  ],
  '04': [
    { id: 'project-04-ai-narrative', label: 'AI叙事探索', startImageIndex: 0 },
    { id: 'project-04-ai-interface', label: 'AI界面探索', startImageIndex: 1 },
    { id: 'project-04-photography', label: '审美摄影', startImageIndex: 2 },
    { id: 'project-04-life', label: '生活经验', startImageIndex: 5 },
  ],
}
