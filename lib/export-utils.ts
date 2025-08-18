// Export utilities for jadwal pertemuan
export const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;

  const headers = [
    'Nama Topik',
    'Hari', 
    'Tanggal',
    'Kelas',
    'Jam Mulai',
    'Jam Akhir',
    'Durasi',
    'Status',
    'Dibuat Oleh',
    'Tanggal Dibuat'
  ];

  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      `"${item.nama_topik}"`,
      `"${item.hari}"`,
      `"${new Date(item.tanggal).toLocaleDateString('id-ID')}"`,
      `"${item.kelas.replace('_', ' ')}"`,
      `"${item.jam_mulai.slice(0, 5)}"`,
      `"${item.jam_akhir.slice(0, 5)}"`,
      `"${item.jam_pertemuan}"`,
      `"${item.status.replace('_', ' ')}"`,
      `"${item.created_by_user?.nama_lengkap || 'System'}"`,
      `"${new Date(item.created_at).toLocaleDateString('id-ID')}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = async (data: any[], filename: string, periodeInfo: any) => {
  // This would require a PDF library like jsPDF
  // For now, we'll create a printable HTML version
  const printableContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Jadwal Pertemuan - ${periodeInfo?.semester?.toUpperCase()} ${periodeInfo?.tahun_akademik}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .period-info { background: #f5f5f5; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .status-belum_mulai { color: #666; }
        .status-berlangsung { color: #0066cc; font-weight: bold; }
        .status-selesai { color: #009900; }
        .status-dibatalkan { color: #cc0000; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>JADWAL PERTEMUAN</h1>
        <h2>UKM COSMIC E-SPORT</h2>
      </div>
      
      ${periodeInfo ? `
        <div class="period-info">
          <strong>Periode:</strong> ${periodeInfo.semester?.toUpperCase()} ${periodeInfo.tahun_akademik}
        </div>
      ` : ''}
      
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Topik</th>
            <th>Hari</th>
            <th>Tanggal</th>
            <th>Kelas</th>
            <th>Waktu</th>
            <th>Durasi</th>
            <th>Status</th>
            <th>Dibuat Oleh</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.nama_topik}</td>
              <td style="text-transform: capitalize;">${item.hari}</td>
              <td>${new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
              <td style="text-transform: capitalize;">${item.kelas.replace('_', ' ')}</td>
              <td>${item.jam_mulai.slice(0, 5)} - ${item.jam_akhir.slice(0, 5)}</td>
              <td>${item.jam_pertemuan}</td>
              <td class="status-${item.status}" style="text-transform: capitalize;">${item.status.replace('_', ' ')}</td>
              <td>${item.created_by_user?.nama_lengkap || 'System'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; font-size: 10px; color: #666;">
        <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        <p>Total: ${data.length} jadwal pertemuan</p>
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 1000);
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printableContent);
    printWindow.document.close();
  }
};
