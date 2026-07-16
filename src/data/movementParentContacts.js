import { normalizeFamilyContacts } from './students.js'

let nextParentContactId = 1

export function createParentContactId() {
  return nextParentContactId++
}

export function createEmptyParentContact(partial = {}) {
  return {
    id: partial.id ?? createParentContactId(),
    name: partial.name ?? '',
    relationship: partial.relationship ?? '',
    icPassport: partial.icPassport ?? '',
    mobilePhone: partial.mobilePhone ?? '',
    email: partial.email ?? '',
  }
}

export function isParentContactEmpty(contact) {
  if (!contact) return true
  return (
    !String(contact.name || '').trim()
    && !String(contact.relationship || '').trim()
    && !String(contact.icPassport || '').trim()
    && !String(contact.mobilePhone || '').trim()
    && !String(contact.email || '').trim()
  )
}

export function familyContactToParentContact(familyMember) {
  return createEmptyParentContact({
    id: familyMember.id,
    name: familyMember.name,
    relationship: familyMember.relationship,
    icPassport: familyMember.icPassport,
    mobilePhone: familyMember.mobilePhone,
    email: familyMember.email,
  })
}

/** 从所选学生的 family[] 映射全部非空关系人 */
export function buildParentContactsFromStudentFamily(student) {
  const family = normalizeFamilyContacts(student?.family)
  const contacts = family
    .map(familyContactToParentContact)
    .filter((contact) => !isParentContactEmpty(contact))
  return contacts.length ? contacts : [createEmptyParentContact()]
}

export function normalizeParentContacts(record) {
  if (Array.isArray(record?.parentContacts) && record.parentContacts.length) {
    return record.parentContacts.map((item) => createEmptyParentContact(item))
  }

  const legacy = createEmptyParentContact({
    name: record?.parentGuardianName,
    relationship: record?.parentRelationship,
    icPassport: record?.parentNricPassport,
    mobilePhone: record?.parentContactNo,
    email: record?.parentEmail,
  })

  if (!isParentContactEmpty(legacy)) {
    return [legacy]
  }

  return [createEmptyParentContact()]
}

export function resolveParentContacts(record) {
  return normalizeParentContacts(record).filter((contact) => !isParentContactEmpty(contact))
}

export function withSyncedLegacyParentFields(record) {
  const contacts = normalizeParentContacts(record)
  const primary = contacts[0] || createEmptyParentContact()
  return {
    ...record,
    parentContacts: contacts.map((item) => createEmptyParentContact(item)),
    parentGuardianName: primary.name,
    parentRelationship: primary.relationship,
    parentNricPassport: primary.icPassport,
    parentContactNo: primary.mobilePhone,
    parentEmail: primary.email,
  }
}

export function validateParentContacts(contacts, requireField, { mode = 'deferment' } = {}) {
  const list = Array.isArray(contacts) ? contacts : []
  const active = list
    .map((contact, index) => ({ contact, index }))
    .filter(({ contact }) => !isParentContactEmpty(contact))

  if (!active.length) {
    requireField(
      'parentContacts',
      'At least one parent/guardian contact is required in the student profile before submitting.',
    )
    return
  }

  active.forEach(({ contact, index }) => {
    const fieldKey = (field) => `parentContacts.${index}.${field}`

    if (!String(contact.name || '').trim()) {
      requireField(fieldKey('name'), 'Parent/Guardian Name is required.')
    }
    if (!String(contact.mobilePhone || '').trim()) {
      requireField(fieldKey('mobilePhone'), 'Contact No. is required.')
    }
    if (mode === 'withdrawal') {
      if (!String(contact.icPassport || '').trim()) {
        requireField(fieldKey('icPassport'), 'Parent/Guardian NRIC/Passport No. is required.')
      }
      if (!String(contact.relationship || '').trim()) {
        requireField(fieldKey('relationship'), 'Relationship is required.')
      }
      if (!String(contact.email || '').trim()) {
        requireField(fieldKey('email'), 'Parent/Guardian Email is required.')
      }
    }
  })
}
