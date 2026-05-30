export const floorOptions = ['LGF', 'GF', '1F', '2F', '3F', '4F', '5F', '6F']

export const initialBlocks = [
  { id: 1, blockNo: 'A1', blockName: 'A1 Teaching Building', floors: ['LGF', 'GF', '1F', '2F'] },
  { id: 2, blockNo: 'A2', blockName: 'A2 Teaching Building', floors: ['LGF', 'GF', '1F', '2F', '3F', '4F'] },
  { id: 3, blockNo: 'A3', blockName: 'A3 Teaching Building', floors: ['LGF', 'GF', '1F', '2F', '3F'] },
  { id: 4, blockNo: 'A4', blockName: 'A4 Teaching Building', floors: ['LGF', 'GF', '1F', '2F'] },
  { id: 5, blockNo: 'A5', blockName: 'A5 Teaching Building', floors: ['LGF', 'GF', '1F'] },
  { id: 6, blockNo: 'B1', blockName: 'B1 Teaching Building', floors: ['LGF', 'GF', '1F', '2F'] },
  { id: 7, blockNo: 'B2', blockName: 'B2 Teaching Building', floors: ['LGF', 'GF', '1F', '2F', '3F'] },
  { id: 8, blockNo: 'C1', blockName: 'C1 Teaching Building', floors: ['GF', '1F', '2F'] },
  { id: 9, blockNo: 'C2', blockName: 'C2 Teaching Building', floors: ['GF', '1F', '2F', '3F', '4F'] },
  { id: 10, blockNo: 'D1', blockName: 'D1 Teaching Building', floors: ['LGF', 'GF', '1F'] },
]

let nextId = 11

export function createBlockId() {
  return nextId++
}

export function resetBlockIdCounter(maxId) {
  nextId = maxId + 1
}
