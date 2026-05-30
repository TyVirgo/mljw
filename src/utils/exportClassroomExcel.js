import * as XLSX from 'xlsx'

export const classroomExportColumns = [
  { key: 'no', header: 'No.', width: 8 },
  { key: 'block', header: 'Block', width: 10 },
  { key: 'floor', header: 'Floor', width: 10 },
  { key: 'classroomNo', header: 'Classroom No.', width: 16 },
  { key: 'classroom', header: 'Classroom', width: 14 },
  { key: 'classroomName', header: 'Classroom Name', width: 22 },
  { key: 'classroomNameEn', header: 'Classroom Name (Chinese)', width: 22 },
  { key: 'classroomNameMal', header: 'Classroom Name (MAL)', width: 22 },
  { key: 'classroomType', header: 'Classroom Type', width: 18 },
  { key: 'deskChairType', header: 'Desk/Chair Type', width: 20 },
  { key: 'capacity', header: 'Capacity', width: 10 },
  { key: 'availableSeats', header: 'Available Seats', width: 16 },
  { key: 'examSeats', header: 'Exam Seats', width: 12 },
  { key: 'classroomEquipment', header: 'Classroom Equipment', width: 22 },
  { key: 'software', header: 'Software', width: 16 },
  { key: 'activation', header: 'Activation', width: 12 },
  { key: 'commonArea', header: 'Common Area', width: 14 },
  { key: 'borrowingAvailability', header: 'Borrowing Availability', width: 22 },
]

function formatRow(item, index) {
  return {
    no: index + 1,
    block: item.block,
    floor: item.floor,
    classroomNo: item.classroomNo,
    classroom: item.classroom,
    classroomName: item.classroomName,
    classroomNameEn: item.classroomNameEn,
    classroomNameMal: item.classroomNameMal,
    classroomType: item.classroomType,
    deskChairType: item.deskChairType,
    capacity: item.capacity,
    availableSeats: item.availableSeats,
    examSeats: item.examSeats,
    classroomEquipment: item.classroomEquipment || '',
    software: item.software || '',
    activation: item.activation ? 'Yes' : 'No',
    commonArea: item.commonArea ? 'Yes' : 'No',
    borrowingAvailability: item.borrowingAvailability ? 'Yes' : 'No',
  }
}

/**
 * Export classroom list to Excel (.xlsx)
 * @param {Array} classrooms
 * @param {string} filename
 * @param {string[]} selectedFieldKeys
 */
export function exportClassroomsToExcel(
  classrooms,
  filename = 'classroom-info.xlsx',
  selectedFieldKeys = classroomExportColumns.map((col) => col.key),
) {
  const columns = classroomExportColumns.filter((col) => selectedFieldKeys.includes(col.key))
  if (!columns.length) return

  const rows = classrooms.map((item, index) => {
    const formatted = formatRow(item, index)
    const row = {}
    columns.forEach((col) => {
      row[col.header] = formatted[col.key]
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Classroom Info')
  XLSX.writeFile(workbook, filename)
}

export const classroomExportFields = classroomExportColumns.map((col) => ({
  key: col.key,
  label: col.header,
}))
