const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const { tmpdir } = require('os');
const path = require('path');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function toAudioCommand(sock, chatId, message) {
  const fkontak = createFakeContact(message);
  let inputPath = '';
  let outputPath = '';
  
  try {
    const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    let msg = null;
    
    if (quotedMsg) {
      msg = quotedMsg.videoMessage || quotedMsg.audioMessage || quotedMsg.documentMessage;
    } else {
      msg = message.message?.videoMessage || message.message?.audioMessage || message.message?.documentMessage;
    }

    if (!msg) {
      await sock.sendMessage(chatId, { 
        text: "Reply to a video or audio file to convert."
      }, { quoted: fkontak });
      return;
    }

    const mime = msg.mimetype || '';
    const isVideo = mime.startsWith('video/');
    const isAudio = mime.startsWith('audio/');
    const isDocument = msg.documentMessage && (
      mime.includes('video') || 
      mime.includes('audio') || 
      mime.includes('mp4') || 
      mime.includes('mpeg')
    );

    if (!isVideo && !isAudio && !isDocument) {
      await sock.sendMessage(chatId, { 
        text: "Works on video or audio only."
      }, { quoted: fkontak });
      return;
    }

    await sock.sendMessage(chatId, { text: "Converting..." }, { quoted: fkontak });

    const fileType = isVideo ? 'video' : 'audio';
    
    let stream;
    try {
      stream = await downloadContentFromMessage(msg, fileType);
    } catch (downloadErr) {
      console.error('Download error:', downloadErr);
      throw new Error(`Download failed: ${downloadErr.message}`);
    }

    const tempDir = tmpdir();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    const inputExt = mime.includes('mp4') ? 'mp4' : 
                     mime.includes('webm') ? 'webm' : 
                     mime.includes('ogg') ? 'ogg' : 
                     isVideo ? 'mp4' : 'temp';
    
    inputPath = path.join(tempDir, `input_${timestamp}_${random}.${inputExt}`);
    outputPath = path.join(tempDir, `output_${timestamp}_${random}.mp3`);
    
    const writeStream = require('fs').createWriteStream(inputPath);
    
    await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        writeStream.write(chunk);
      });
      
      stream.on('end', () => {
        writeStream.end();
        resolve();
      });
      
      stream.on('error', (err) => {
        writeStream.end();
        reject(err);
      });
      
      writeStream.on('error', reject);
    });

    const stats = await fs.stat(inputPath);
    if (stats.size === 0) {
      throw new Error('File empty');
    }

    // Convert using ffmpeg
    await new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .toFormat('mp3')
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .audioChannels(2)
        .audioFrequency(44100)
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err.message);
          reject(new Error(`Conversion failed`));
        })
        .save(outputPath);

      setTimeout(() => {
        if (command && command.ffmpegProc && !command.ffmpegProc.killed) {
          command.kill('SIGKILL');
          reject(new Error('Timeout'));
        }
      }, 60000);
    });

    const audioStats = await fs.stat(outputPath);
    if (audioStats.size === 0) {
      throw new Error('Output empty');
    }

    const audioBuffer = await fs.readFile(outputPath);
    
    const maxSize = 15 * 1024 * 1024;
    if (audioBuffer.length > maxSize) {
      console.warn(`File large: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    }

    // Send converted audio
    await sock.sendMessage(chatId, { 
      audio: audioBuffer, 
      mimetype: 'audio/mpeg',
      ptt: false,
      fileName: `audio_${timestamp}.mp3`
    }, { quoted: fkontak });

  } catch (err) {
    console.error("toAudio error:", err.message);
    
    let errorMessage = "Conversion failed.";
    
    if (err.message.includes('FFmpeg') || err.message.includes('conversion')) {
      errorMessage = "FFmpeg error. Check install.";
    } else if (err.message.includes('timeout')) {
      errorMessage = "Timeout. Try shorter video.";
    } else if (err.message.includes('empty')) {
      errorMessage = "File empty or invalid.";
    } else if (err.message.includes('download')) {
      errorMessage = "Download failed.";
    }
    
    await sock.sendMessage(chatId, { text: errorMessage }, { quoted: fkontak });
    
  } finally {
    const cleanupPromises = [];
    
    if (inputPath) {
      cleanupPromises.push(
        fs.unlink(inputPath).catch(err => 
          console.error(`Delete failed ${inputPath}:`, err.message)
        )
      );
    }
    
    if (outputPath) {
      cleanupPromises.push(
        fs.unlink(outputPath).catch(err => 
          console.error(`Delete failed ${outputPath}:`, err.message)
        )
      );
    }
    
    await Promise.allSettled(cleanupPromises);
  }
}

module.exports = toAudioCommand;