const path = require('path');
const electron = require('electron');
const TimerTray = require('./app/timer_tray');
const MainWindow = require('./app/main_window');

const { app, ipcMain } = electron;

let mainWindow;
let tray;

app.on('ready', () => {
  process.platform === 'darwin' ? app.dock.hide() : null;

  const options = {
      height: 500,
      width: 300,
      frame: false,
      resizable: true,
      show: false,
      skipTaskbar: true, // Windows to hide in taskbar,
      webPreferences: { backgroundThrottling: false }
    };
  const url = `file://${__dirname}/src/index.html`
  
  mainWindow = new MainWindow(options, url);

  const iconName = process.platform === 'win32' ? 'windows-icon.png' : 'iconTemplate.png';
  const iconPath = path.join(__dirname, `./src/assets/${iconName}`)
  tray = new TimerTray(iconPath, mainWindow);
});

ipcMain.on('update-timer', (event, timeLeft) => {
  tray.setTitle(timeLeft);
});