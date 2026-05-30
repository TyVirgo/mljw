export const universityOperatorOptions = [
  'Public',
  'Private',
  'Cooperative Education',
  'Joint Venture',
  'Other',
]

function svgPlaceholder(label, width, height, bg = '#dbeafe', color = '#2563eb') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${color}" font-size="14" font-family="Arial,sans-serif">${label}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const defaultImages = {
  adminPortalLogo: svgPlaceholder('Default Logo', 200, 200),
  loginPageBackground: svgPlaceholder('Login BG', 320, 180, '#bfdbfe', '#1d4ed8'),
  dashboardBackground: svgPlaceholder('Dashboard BG', 160, 144, '#e0e7ff', '#4338ca'),
  homepageBackground: svgPlaceholder('Homepage BG', 320, 180, '#93c5fd', '#1e40af'),
  browserIcon: svgPlaceholder('Icon', 80, 80, '#eff6ff', '#2563eb'),
  mobilePortalLogo: svgPlaceholder('Mobile Logo', 200, 40, '#f1f5f9', '#64748b'),
}

export function createDefaultUniversityInfo() {
  return {
    id: 1,
    moheRegistrationNo: '',
    universityOperator: '',
    universityName: '',
    universityNameMal: '',
    companyNo: '',
    universityNameChinese: '',
    contactNo: '',
    postCode: '',
    faxNo: '',
    email: '',
    website: '',
    establishedMonthYear: '',
    universityAddress: '',
    adminPortalLogo: defaultImages.adminPortalLogo,
    loginPageBackground: defaultImages.loginPageBackground,
    dashboardBackground: defaultImages.dashboardBackground,
    loginPageTitle: '',
    loginPageTitleUserPortal: '',
    browserTitle: '',
    homepageBackground: defaultImages.homepageBackground,
    browserIcon: defaultImages.browserIcon,
    mobilePortalLogo: defaultImages.mobilePortalLogo,
    mobilePortalTitle: '',
    mottoLeft: '',
    mottoRight: '',
    updatedAt: null,
  }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const urlPattern = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i
const mohePattern = /^[A-Za-z0-9-]{3,50}$/
const companyNoPattern = /^[A-Za-z0-9-]{3,50}$/
const phonePattern = /^[+]?[\d\s()-]{6,20}$/
const postCodePattern = /^[A-Za-z0-9\s-]{3,12}$/
const monthYearPattern = /^(0[1-9]|1[0-2])\/\d{4}$/

/** MM/YYYY → YYYY-MM（供 type="month" 使用） */
export function toMonthInputValue(value) {
  if (!value?.trim()) return ''
  const match = value.trim().match(/^(0[1-9]|1[0-2])\/(\d{4})$/)
  if (!match) return ''
  return `${match[2]}-${match[1]}`
}

/** YYYY-MM → MM/YYYY */
export function fromMonthInputValue(value) {
  if (!value?.trim()) return ''
  const match = value.trim().match(/^(\d{4})-(0[1-9]|1[0-2])$/)
  if (!match) return ''
  return `${match[2]}/${match[1]}`
}

/** 图示1 可见字段校验 */
export function validateSection1(data) {
  const errors = {}

  if (!data.moheRegistrationNo?.trim()) {
    errors.moheRegistrationNo = 'MOHE Registration Certificate No. is required'
  } else if (!mohePattern.test(data.moheRegistrationNo.trim())) {
    errors.moheRegistrationNo = 'Invalid MOHE Registration Certificate No. format'
  }

  if (!data.universityName?.trim()) {
    errors.universityName = 'University Name is required'
  } else if (data.universityName.trim().length > 200) {
    errors.universityName = 'Maximum 200 characters'
  }

  if (data.companyNo?.trim() && !companyNoPattern.test(data.companyNo.trim())) {
    errors.companyNo = 'Invalid Company No. format'
  }

  if (!data.universityNameChinese?.trim()) {
    errors.universityNameChinese = 'University Name (Chinese) is required'
  } else if (data.universityNameChinese.trim().length > 200) {
    errors.universityNameChinese = 'Maximum 200 characters'
  }

  if (!data.universityNameMal?.trim()) {
    errors.universityNameMal = 'University Name (MAL) is required'
  } else if (data.universityNameMal.trim().length > 200) {
    errors.universityNameMal = 'Maximum 200 characters'
  }

  if (data.contactNo?.trim() && !phonePattern.test(data.contactNo.trim())) {
    errors.contactNo = 'Invalid Contact No. format'
  }

  if (data.postCode?.trim() && !postCodePattern.test(data.postCode.trim())) {
    errors.postCode = 'Invalid Post Code format'
  }

  if (data.faxNo?.trim() && !phonePattern.test(data.faxNo.trim())) {
    errors.faxNo = 'Invalid Fax No. format'
  }

  if (data.email?.trim() && !emailPattern.test(data.email.trim())) {
    errors.email = 'Invalid Email format'
  }

  if (data.website?.trim() && !urlPattern.test(data.website.trim())) {
    errors.website = 'Invalid Website URL format'
  }

  if (data.establishedMonthYear?.trim() && !monthYearPattern.test(data.establishedMonthYear.trim())) {
    errors.establishedMonthYear = 'Format must be MM/YYYY'
  }

  if (!data.universityAddress?.trim()) {
    errors.universityAddress = 'University Address is required'
  } else if (data.universityAddress.trim().length > 300) {
    errors.universityAddress = 'Maximum 300 characters'
  }

  return errors
}

/** 图示2 字段校验 */
export function validateSection2(data) {
  const errors = {}

  if (data.loginPageTitle?.trim() && data.loginPageTitle.trim().length > 100) {
    errors.loginPageTitle = 'Maximum 100 characters'
  }

  if (data.loginPageTitleUserPortal?.trim() && data.loginPageTitleUserPortal.trim().length > 100) {
    errors.loginPageTitleUserPortal = 'Maximum 100 characters'
  }

  if (data.browserTitle?.trim() && data.browserTitle.trim().length > 50) {
    errors.browserTitle = 'Maximum 50 characters'
  }

  return errors
}

/** 图示3 字段校验 */
export function validateSection3(data) {
  const errors = {}

  if (data.mobilePortalTitle?.trim() && data.mobilePortalTitle.trim().length > 50) {
    errors.mobilePortalTitle = 'Maximum 50 characters'
  }

  if (data.mottoLeft?.trim() && data.mottoLeft.trim().length > 50) {
    errors.mottoLeft = 'Maximum 50 characters'
  }

  if (data.mottoRight?.trim() && data.mottoRight.trim().length > 50) {
    errors.mottoRight = 'Maximum 50 characters'
  }

  return errors
}

export function validateUniversityForm(data) {
  return {
    ...validateSection1(data),
    ...validateSection2(data),
    ...validateSection3(data),
  }
}

export const section2ImageFields = [
  {
    key: 'loginPageBackground',
    label: 'Login Page Background:',
    hint: 'Displayed on the login page. Recommended image size: 1440px (width) × 900px (height).',
    previewClass: 'preview-wide',
  },
  {
    key: 'dashboardBackground',
    label: 'Dashboard Background:',
    hint: 'Display on the inner page of the login page, Recommended image size: 481px (width) × 432px (height).',
    previewClass: 'preview-medium',
  },
  {
    key: 'homepageBackground',
    label: 'Homepage Background:',
    hint: 'Displayed on the home page. Recommended image size: 1440px (width) × 900px (height).',
    previewClass: 'preview-wide',
  },
]

export const section3ImageFields = [
  {
    key: 'browserIcon',
    label: 'Browser Icon:',
    hint: 'Display the icon when accessed via the browser, Recommended image size: 432px (width) × 432px (height).',
    previewClass: 'preview-icon',
  },
  {
    key: 'mobilePortalLogo',
    label: 'Mobile Portal Logo:',
    hint: "Display on the mobile app's home page, Recommended image size: 335px (width) × 35px (height).",
    previewClass: 'preview-mobile',
  },
]

export const imageFieldLabels = {
  adminPortalLogo: 'Admin Portal Logo',
  loginPageBackground: 'Login Page Background',
  dashboardBackground: 'Dashboard Background',
  homepageBackground: 'Homepage Background',
  browserIcon: 'Browser Icon',
  mobilePortalLogo: 'Mobile Portal Logo',
}

const STORAGE_KEY = 'jw-university-info'

export function loadUniversityInfo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...createDefaultUniversityInfo(), ...JSON.parse(raw) }
    }
  } catch {
    // ignore
  }
  return createDefaultUniversityInfo()
}

export function saveUniversityInfo(data) {
  const payload = { ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  return payload
}

export function isCustomImage(key, value) {
  return value && value !== defaultImages[key]
}

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
