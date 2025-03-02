const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const port = 3000;

// Setup Multer for file upload
const upload = multer({ dest: 'uploads/' });

// Serve the HTML form to upload files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle the file upload and run the .iso with QEMU
app.post('/upload', upload.single('isoFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const isoPath = path.join(__dirname, 'uploads', req.file.filename);

  // Ensure the uploaded file is an ISO file
  if (!isoPath.endsWith('.iso')) {
    return res.status(400).json({ success: false, error: 'Only .iso files are allowed' });
  }

  // Run QEMU to boot the ISO
  runQEMU(isoPath)
    .then(() => {
      res.json({ success: true, message: 'ISO file is being processed with QEMU!' });
    })
    .catch((error) => {
      res.status(500).json({ success: false, error: error.message });
    });
});

// Run QEMU to boot the ISO file
function runQEMU(isoPath) {
  return new Promise((resolve, reject) => {
    const qemuCommand = `qemu-system-x86_64 -cdrom ${isoPath} -boot d -m 2G -enable-kvm -vga std`;

    exec(qemuCommand, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`QEMU failed: ${stderr || error.message}`));
      }
      resolve(stdout);
    });
  });
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
