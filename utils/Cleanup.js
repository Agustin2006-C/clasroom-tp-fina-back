const fs = require('fs');
const path = require('path');

// Limpiar archivos antiguos (más de 24 horas)
const cleanOldFiles = () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    return;
  }
  
  const files = fs.readdirSync(uploadsDir);
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
  
  files.forEach(file => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    
    // Si el archivo tiene más de 24 horas, eliminarlo
    if (now - stats.mtime.getTime() > oneDay) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Archivo antiguo eliminado: ${file}`);
    }
  });
};

// Ejecutar limpieza cada 24 horas
setInterval(cleanOldFiles, 24 * 60 * 60 * 1000);

// Ejecutar al iniciar el servidor
cleanOldFiles();

module.exports = { cleanOldFiles };