const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 832,
    minWidth: 1024,
    minHeight: 768,
    title: "Wheyo - The Protein Kitchen",
    // Use our ultra-lightweight SVG icon
    icon: path.join(__dirname, 'wheyoicon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    backgroundColor: '#050505',
    autoHideMenuBar: true, // Hides native menu bar for clean brutalist app cockpit aesthetic
  });

  // Automatically detect if development server is running on port 3000
  const distPath = path.join(__dirname, 'dist', 'index.html');
  const isPackaged = app.isPackaged;

  if (!isPackaged && fs.existsSync(path.join(__dirname, 'vite.config.ts'))) {
    // In local development, attempt to load the Vite dev server first
    console.log('Running in local development mode...');
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      console.log('Failed to connect to Vite dev server, falling back to local files.');
      if (fs.existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      } else {
        mainWindow.loadURL('https://wheyo.vercel.app'); // Production fallback
      }
    });
    // Open DevTools automatically in dev
    mainWindow.webContents.openDevTools();
  } else {
    // Production/Built mode - load the built static HTML assets
    console.log('Running in production mode...');
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      // Fallback if built assets are missing
      mainWindow.loadURL('https://wheyo.vercel.app');
    }
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// App Name configuration for Windows shortcut/title
app.name = 'Wheyo';

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
