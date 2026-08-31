/**
 * 课号弹层：教学目标 / 简介 demo（按课号；缺省按 GE/ME 类型回退；中英双语）
 */

const FIELD_BY_CATEGORY = {
  humanities: { en: 'Arts', zh: '文科' },
  business: { en: 'Business', zh: '商科' },
  science: { en: 'Science', zh: '理科' },
}

/**
 * @param {string|{ en?: string, zh?: string }} value
 * @param {'en'|'zh'} locale
 */
export function pickLocale(value, locale) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return String(value[locale] || value.en || value.zh || '').trim()
  }
  return String(value)
}

/**
 * @param {string[]|{ en?: string[], zh?: string[] }} value
 * @param {'en'|'zh'} locale
 */
function pickLocaleList(value, locale) {
  if (!value) return []
  if (Array.isArray(value)) return value
  const list = value[locale] || value.en || value.zh || []
  return Array.isArray(list) ? list : []
}

/**
 * @param {{ method: string|object, weight: string }[]} rows
 * @param {'en'|'zh'} locale
 */
function pickAssessment(rows, locale) {
  return (rows || []).map((row) => ({
    method: pickLocale(row.method, locale),
    weight: row.weight,
  }))
}

/** @type {Record<string, object>} */
const BRIEFS_BY_CODE = {
  HUM201: {
    type: 'GE',
    code: 'HUM201',
    credits: 2,
    name: { en: 'Philosophy and Current Issues', zh: '哲学与当代议题' },
    field: { en: 'Arts', zh: '文科' },
    content: {
      en: 'This course explores major philosophical traditions and their relevance to contemporary social and ethical debates. Students examine argumentation, moral reasoning, and the relationship between theory and public life.',
      zh: '本课程探讨主要哲学传统及其与当代社会与伦理议题的关联，训练论证、道德推理，以及理论与公共生活之间的联系。',
    },
    outcomes: {
      en: [
        'Articulate informed positions on contemporary issues using philosophical tools.',
        'Compare major ethical frameworks and apply them to case discussions.',
        'Evaluate arguments for clarity, consistency, and evidence.',
        'Connect philosophical ideas to civic and cultural contexts.',
      ],
      zh: [
        '运用哲学工具对当代议题提出有依据的观点。',
        '比较主要伦理框架并应用于案例讨论。',
        '从清晰度、一致性与证据角度评价论证。',
        '将哲学思想与公民及文化语境相联系。',
      ],
    },
    assessment: [
      { method: { en: 'Assignment', zh: '作业' }, weight: '30%' },
      { method: { en: 'Mid-term tests', zh: '期中测验' }, weight: '20%' },
      { method: { en: 'Project', zh: '项目' }, weight: '50%' },
    ],
  },
  ENGL201: {
    type: 'GE',
    code: 'ENGL201',
    credits: 3,
    name: { en: 'Academic Writing', zh: '学术英语写作' },
    field: { en: 'Arts', zh: '文科' },
    content: {
      en: 'Develops academic writing skills including thesis development, evidence use, and revision for university-level essays and reports.',
      zh: '培养学术论文与报告所需的写作能力，包括论点构建、论据运用与修改润色。',
    },
    outcomes: {
      en: [
        'Plan and draft structured academic essays.',
        'Integrate sources with appropriate citation.',
        'Revise writing for clarity and coherence.',
      ],
      zh: ['规划并撰写结构清晰的学术论文。', '恰当引用并整合文献来源。', '修改文稿以提升清晰度与连贯性。'],
    },
    assessment: [
      { method: { en: 'Essays', zh: '论文' }, weight: '50%' },
      { method: { en: 'Quizzes', zh: '测验' }, weight: '20%' },
      { method: { en: 'Final paper', zh: '期末论文' }, weight: '30%' },
    ],
  },
  COMP201: {
    type: 'ME',
    code: 'COMP201',
    credits: 4,
    name: { en: 'Data Structures', zh: '数据结构' },
    field: { en: 'Computing', zh: '计算机' },
    content: {
      en: 'Study of fundamental data structures and algorithms, including lists, trees, graphs, and complexity analysis for software design.',
      zh: '学习列表、树、图等基本数据结构与算法，以及软件设计中的复杂度分析。',
    },
    outcomes: {
      en: [
        'Implement and analyse common data structures.',
        'Select appropriate structures for given problems.',
        'Reason about time and space complexity.',
      ],
      zh: ['实现并分析常见数据结构。', '针对问题选择合适的数据结构。', '分析时间与空间复杂度。'],
    },
    prerequisites: {
      en: 'COMP101 Introduction to Computing',
      zh: 'COMP101 计算机导论',
    },
    assessment: [
      { method: { en: 'Assignments', zh: '作业' }, weight: '40%' },
      { method: { en: 'Mid-term', zh: '期中' }, weight: '20%' },
      { method: { en: 'Final exam', zh: '期末考试' }, weight: '40%' },
    ],
  },
  NET110: {
    type: 'ME',
    code: 'NET110',
    credits: 4,
    name: { en: 'Computer Networks', zh: '计算机网络' },
    field: { en: 'Computing', zh: '计算机' },
    content: {
      en: 'Principles of computer networking: layered models, addressing, routing, and application protocols used in modern networks.',
      zh: '计算机网络原理：分层模型、寻址、路由及现代网络中的应用层协议。',
    },
    outcomes: {
      en: [
        'Explain layered network architectures.',
        'Configure and troubleshoot basic network scenarios in lab.',
        'Analyse common protocol behaviours.',
      ],
      zh: ['解释分层网络体系结构。', '在实验中配置并排查基本网络场景。', '分析常见协议行为。'],
    },
    prerequisites: {
      en: 'COMP101 Introduction to Computing',
      zh: 'COMP101 计算机导论',
    },
    assessment: [
      { method: { en: 'Labs', zh: '实验' }, weight: '30%' },
      { method: { en: 'Mid-term', zh: '期中' }, weight: '30%' },
      { method: { en: 'Final exam', zh: '期末考试' }, weight: '40%' },
    ],
  },
  G0106: {
    type: 'GE',
    code: 'G0106',
    credits: 3,
    name: { en: 'Film Appreciation: Introduction to Cinema', zh: '电影欣赏：电影入门' },
    field: { en: 'Arts', zh: '文科' },
    content: {
      en: 'This course introduces the art, technology, language, and appreciation of film, exploring cinematic techniques, production, and critical viewing. Film examples will be screened in class.',
      zh: '介绍电影的艺术、技术、语言与欣赏方法，探讨镜头语言、制作流程与批判性观影；课堂将放映影片示例。',
    },
    outcomes: {
      en: [
        'Develop an informed perspective on films using analytical tools.',
        'Understand how content, form, and context create meaning in film.',
        'Identify key concepts and models in film criticism.',
      ],
      zh: [
        '运用分析工具形成对影片的独立见解。',
        '理解内容、形式与语境如何共同构成电影意义。',
        '识别并运用电影批评中的核心概念与模型。',
      ],
    },
    assessment: [
      { method: { en: 'Assignment', zh: '作业' }, weight: '30%' },
      { method: { en: 'Mid-term tests', zh: '期中测验' }, weight: '20%' },
      { method: { en: 'Project', zh: '项目' }, weight: '50%' },
    ],
  },
}

/**
 * @param {object} raw
 * @param {'en'|'zh'} locale
 */
function resolveBrief(raw, locale) {
  return {
    type: raw.type === 'ME' ? 'ME' : 'GE',
    code: raw.code,
    name: pickLocale(raw.name, locale),
    credits: raw.credits ?? '—',
    field: pickLocale(raw.field, locale),
    content: pickLocale(raw.content, locale),
    outcomes: pickLocaleList(raw.outcomes, locale),
    assessment: pickAssessment(raw.assessment, locale),
    prerequisites: raw.prerequisites ? pickLocale(raw.prerequisites, locale) : '',
  }
}

/**
 * @param {string} code
 * @param {{ name?: string, credits?: number, type?: string, schoolElectiveCategory?: string, prerequisites?: string[] }} [course]
 * @param {'en'|'zh'} [locale]
 */
export function getCourseTeachingBrief(code, course = {}, locale = 'en') {
  const key = String(code || '').trim()
  const loc = locale === 'zh' ? 'zh' : 'en'
  if (BRIEFS_BY_CODE[key]) {
    return resolveBrief(BRIEFS_BY_CODE[key], loc)
  }

  const type = String(course.type || '').toUpperCase()
  const cat = course.schoolElectiveCategory
  const fieldPair = FIELD_BY_CATEGORY[cat] || {
    en: type === 'GE' ? 'General Elective' : type === 'ME' ? 'Major Elective' : '—',
    zh: type === 'GE' ? '公共选修' : type === 'ME' ? '专业选修' : '—',
  }
  const nameEn = course.name || course.courseName || key || '—'
  const nameZh = course.nameZh || nameEn
  const credits = course.credits ?? '—'
  const prereqCodes = (course.prerequisites || []).filter(Boolean)

  if (type === 'ME') {
    const prereqEn = prereqCodes.length ? prereqCodes.join(', ') : ''
    const prereqZh = prereqCodes.length ? prereqCodes.join('、') : ''
    return resolveBrief(
      {
        type: 'ME',
        code: key || '—',
        credits,
        name: { en: nameEn, zh: nameZh },
        field: fieldPair,
        content: {
          en: `${nameEn} develops core knowledge and skills for the major programme, combining theory with applied practice in coursework and assessments.`,
          zh: `${nameZh}面向本专业核心知识与技能，结合理论学习与课程实践及考核。`,
        },
        outcomes: {
          en: [
            'Apply disciplinary concepts to practical problems in the major.',
            'Demonstrate technical or analytical competence expected at this level.',
            'Communicate results clearly in written and/or oral form.',
          ],
          zh: [
            '将学科概念应用于本专业实际问题。',
            '达到本层次要求的技术或分析能力。',
            '以书面或口头形式清晰表达学习成果。',
          ],
        },
        prerequisites: prereqEn ? { en: prereqEn, zh: prereqZh || prereqEn } : undefined,
        assessment: [
          { method: { en: 'Assignments', zh: '作业' }, weight: '40%' },
          { method: { en: 'Project / labs', zh: '项目/实验' }, weight: '30%' },
          { method: { en: 'Exam', zh: '考试' }, weight: '30%' },
        ],
      },
      loc,
    )
  }

  return resolveBrief(
    {
      type: 'GE',
      code: key || '—',
      credits,
      name: { en: nameEn, zh: nameZh },
      field: fieldPair,
      content: {
        en: `${nameEn} introduces key ideas in the general elective curriculum, encouraging critical thinking, communication, and informed engagement with the subject area.`,
        zh: `${nameZh}介绍公共选修课程体系中的核心观念，培养批判性思维、表达能力与对学科领域的深入理解。`,
      },
      outcomes: {
        en: [
          'Explain central concepts covered in the course.',
          'Apply course frameworks to examples or cases.',
          'Reflect on personal learning through coursework.',
        ],
        zh: [
          '阐述课程涵盖的核心概念。',
          '将课程框架应用于实例或案例。',
          '通过课程作业反思个人学习收获。',
        ],
      },
      assessment: [
        { method: { en: 'Assignment', zh: '作业' }, weight: '30%' },
        { method: { en: 'Mid-term tests', zh: '期中测验' }, weight: '20%' },
        { method: { en: 'Project', zh: '项目' }, weight: '50%' },
      ],
    },
    loc,
  )
}
