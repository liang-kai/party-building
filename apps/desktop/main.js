// Modules to control application life and create native browser window
// const { app, BrowserWindow } = require('electron')
// const path = require('node:path')

// function createWindow () {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js')
//     }
//   })

//   // and load the index.html of the app.
//   mainWindow.loadFile('dist/index.html')

//   // Open the DevTools.
//   // mainWindow.webContents.openDevTools()
// }

// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//   createWindow()

//   app.on('activate', function () {
//     // On macOS it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })
// })

// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on('window-all-closed', function () {
//   if (process.platform !== 'darwin') app.quit()
// })

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow
let nuxtProcess

async function startNuxtServer() {
  return new Promise((resolve, reject) => {
    // 在生产环境中，使用打包后的 admin 目录
    const adminPath = isDev 
      ? path.join(__dirname, '../../admin') 
      : path.join(process.resourcesPath, 'admin')

    nuxtProcess = spawn('node', ['.output/server/index.mjs'], {
      cwd: adminPath,
      env: {
        ...process.env,
        PORT: '3000'  // 设置 Nuxt 服务端口
      }
    })

    nuxtProcess.stdout.on('data', (data) => {
      console.log(`Nuxt stdout: ${data}`)
      if (data.toString().includes('Listening')) {
        resolve()
      }
    })

    nuxtProcess.stderr.on('data', (data) => {
      console.error(`Nuxt stderr: ${data}`)
    })

    nuxtProcess.on('error', (err) => {
      console.error('Failed to start Nuxt server:', err)
      reject(err)
    })
  })
}

async function createWindow() {
  try {
    // 先启动 Nuxt 服务
    await startNuxtServer()

    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })

    // 加载 Nuxt 应用
    await mainWindow.loadURL('dist/index.html')

    // 打开开发者工具（可选）
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  } catch (error) {
    console.error('Error starting application:', error)
    app.quit()
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  // 确保在应用退出前关闭 Nuxt 服务
  if (nuxtProcess) {
    nuxtProcess.kill()
  }
})