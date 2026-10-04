const root = `${import.meta.env.BASE_URL}portfolio/contact/`

export const contactDetails = {
  wechat: 'ian4b_e4s_ong2l',
  email: '2738925636@qq.com',
  qr: `${root}wechat-qr.png`,
  resume: `${root}resume.jpg`,
  motion: `${root}motion.mp4`,
  title: `${root}contact-title.png`,
  plant: `${root}plant.png`,
}

export type ContactAction = 'resume' | 'contact' | 'motion' | 'reaction'
const easterEggReactions = ['♥', '♡', '★', '✦', ':)', 'THANK U', '2005!']
export const contactObjects: { id: string; src: string; ratio: number; action: ContactAction; label: string; tooltip?: string; reactions?: string[] }[] = [
  { id: 'rabbit', src: `${root}icon-rabbit.png`, ratio: 1, action: 'reaction', label: '兔子彩蛋', reactions: easterEggReactions },
  { id: 'computer', src: `${root}icon-computer.png`, ratio: 2245 / 1264, action: 'reaction', label: '电脑：留下一个回应', reactions: easterEggReactions },
  { id: 'resume', src: `${root}icon-resume.png`, ratio: 1054 / 1493, action: 'resume', label: '查看简历', tooltip: 'VIEW RESUME' },
  { id: 'phone', src: `${root}icon-phone.png`, ratio: 859 / 1549, action: 'contact', label: '打开联系方式', tooltip: 'CONTACT ME' },
  { id: 'player', src: `${root}icon-player.png`, ratio: 1186 / 1326, action: 'motion', label: '播放动效视频', tooltip: 'PLAY MOTION' },
  { id: 'year', src: `${root}icon-year.png`, ratio: 1, action: 'reaction', label: '2005 彩蛋', reactions: easterEggReactions },
]
