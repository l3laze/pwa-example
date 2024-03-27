'use strict'

console.log('Hello, PWA')

const textArea = document.getElementById('editorArea')
const butOpenFile = document.getElementById('openFile')
const butSaveFile = document.getElementById('saveFile')

let fileHandle
let dirHandle

async function readFile (fileToOpen) {
  const file = await fileToOpen.getFile()
  const contents = await file.text()

  return contents
}

async function writeFile (fileToWrite, contents) {
  const writable = await fileToWrite.createWritable()
  await writable.write(contents)
  await writable.close()
}

async function getFiles (dir, path = dir.name) {
  const dirs = []
  const files = []

  for await (const entry of dir.values()) {
    const nestedPath = `${path}/${entry.name}`

    console.log('adding ', nestedPath)

    if (entry.kind === 'file') {
      files.push(
        entry.getFile().then((file) => {
          file.directoryHandle = dir
          file.handle = entry

          return Object.defineProperty(file, 'webkitRelativePath', {
            configurable: true,
            enumerable: true,
            get: () => nestedPath
          })
        })
      )
    } else if (entry.kind === 'directory') {
      dirs.push(await getFiles(entry, nestedPath))
    }
  }

  return [
    ...(await Promise.all(dirs)).flat(),
    ...(await Promise.all(files))
  ]
}

butOpenFile.addEventListener('click', async () => {
  [fileHandle] = await window.showOpenFilePicker()
  textArea.value = readFile(fileHandle)
})

butSaveFile.addEventListener('click', async () => {
  await writeFile(fileHandle, textArea.value)
})

document.getElementById('openFolder').addEventListener('click', async () => {
  dirHandle = await window.showDirectoryPicker()

  const filesInDirectory = await getFiles(dirHandle)

  if (!filesInDirectory) {
    return
  }

  textArea.value = ''

  Array.from(filesInDirectory).forEach((file) => {
    textArea.value += `${file.webkitRelativePath}\n`
  })
})

document.getElementById('readFolder').addEventListener('click', async () => {
  const filesInDirectory = await getFiles(dirHandle)

  if (!filesInDirectory) {
    return
  }

  textArea.value = ''

  for await (const file of Array.from(filesInDirectory)) {
    textArea.value += `${file.webkitRelativePath} = ${await readFile(file.handle)}\n`
  }
})

document.getElementById('swapData').addEventListener('click', async () => {
  const filesInDirectory = await getFiles(dirHandle)

  if (!filesInDirectory) {
    return
  }

  const fileList = Array.from(filesInDirectory)

  const temp1 = await readFile(fileList[0].handle)
  const temp2 = await readFile(fileList[1].handle)

  await writeFile(fileList[0].handle, temp2)
  await writeFile(fileList[1].handle, temp1)

  textArea.value = ''

  for await (const file of Array.from(fileList)) {
    textArea.value += `${file.webkitRelativePath} = ${await readFile(file.handle)}\n`
  }
})
