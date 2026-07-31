const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Kredensial Proyek LAMA
const supabaseOld = createClient('https://lvsskfthwwadeavfwssg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2c3NrZnRod3dhZGVhdmZ3c3NnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU1NTA1MiwiZXhwIjoyMDg5MTMxMDUyfQ.EvMnKhnxheERbLAB_qs3b8VYLuJ_fTU2uEZ4xrD0moM');

// Kredensial Proyek BARU
const supabaseNew = createClient('https://chlzylkkkxauawrdrfyr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobHp5bGtra3hhdWF3cmRyZnlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc1ODk0MiwiZXhwIjoyMTAwMzM0OTQyfQ.V2GHcLV7hd6wjKclPlO0Hhv4jq-v4TqSVKDTSUx9ylY');

const BUCKET_NAME = 'payment-proofs'; // Sesuaikan jika namanya berbeda

async function migrateStorage() {
  console.log(`Memulai evakuasi dari bucket: ${BUCKET_NAME}...`);

  // 1. Ambil daftar semua file dari proyek lama
  const { data: files, error: listError } = await supabaseOld.storage.from(BUCKET_NAME).list();
  
  if (listError) {
    console.error('Gagal mengambil daftar file:', listError);
    return;
  }

  // Filter out folder kosong (jika ada)
  const validFiles = files.filter(file => file.id != null);
  console.log(`Ditemukan ${validFiles.length} file. Memulai transfer...`);

  // 2. Loop dan transfer masing-masing file
  for (const file of validFiles) {
    console.log(`Mentransfer: ${file.name}...`);
    
    // Download dari lama
    const { data: fileData, error: downloadError } = await supabaseOld.storage.from(BUCKET_NAME).download(file.name);
    
    if (downloadError) {
      console.error(`Gagal mengunduh ${file.name}:`, downloadError);
      continue;
    }

    // Convert Blob ke Buffer untuk Node.js
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Upload ke baru
    const { error: uploadError } = await supabaseNew.storage.from(BUCKET_NAME).upload(file.name, buffer, {
      contentType: file.metadata?.mimetype || 'image/jpeg',
      upsert: true
    });

    if (uploadError) {
      console.error(`Gagal mengunggah ${file.name}:`, uploadError);
    } else {
      console.log(`✅ ${file.name} berhasil diamankan!`);
    }
  }

  console.log('🎉 Evakuasi Storage Selesai!');
}

migrateStorage();