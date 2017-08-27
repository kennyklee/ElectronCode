const electron = require('electron');
const ffmpeg = require('fluent-ffmpeg');
const _ = require('lodash');

const { app, BrowserWindow, ipcMain, shell } = electron;

let mainWindow = null;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    title: 'Video Converter',
    webPreferences: { backgroundThrottling: false },
    show: false
  });

  // Prevent FOUC
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Prevent garbabge collection
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(`file://${__dirname}/src/index.html`);
});

ipcMain.on('videos:added', (event, videos) => {
  const promises = _.map(videos, video => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(video.path, (err, metadata) => {
        video.duration = metadata.format.duration;
        video.format = 'avi';
        resolve(video);
      })
    })
  });

  Promise.all(promises)
    .then((results) => {
      mainWindow.webContents.send('metadata:complete', results);
    });

});

ipcMain.on('conversion:start', (event, videos) => {
  _.each(videos, video => {
    // const keyName = Object.keys(videos);
    // const video = videos[keyName];
    const outputDirectory = video.path.split(video.name)[0];
    const outputName = video.name.split('.')[0];
    const outputPath = `${outputDirectory}${outputName}.${video.format}`;

    ffmpeg(video.path)
      .output(outputPath)
      .on('progress', ({ timemark }) => 
        mainWindow.webContents.send('conversion:progress', { video, timemark })
      )
      .on('end', () => 
        mainWindow.webContents.send('conversion:end', {
          video: video,
          outputPath: outputPath
        })
      )
      .run();
  });
});

ipcMain.on('folder:open', (event, outputPath) => {
  shell.showItemInFolder(outputPath);
});