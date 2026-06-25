import pako from 'pako';

function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
}

class BluetoothPrintService {
  constructor() {
    this.device = { name: 'Android Intent / Open ESC' };
    this.onDisconnectCallback = null;
  }

  isConnected() {
    // In intent-based printing, the connection is handled by the OS/Intent application
    return true;
  }

  registerDisconnectCallback(callback) {
    this.onDisconnectCallback = callback;
  }

  unregisterDisconnectCallback() {
    this.onDisconnectCallback = null;
  }

  async connectPrinter(acceptAllDevices = false) {
    return 'Android Intent / Open ESC';
  }

  async disconnectPrinter() {
    // No-op for Android Intent
  }

  async printTicket(ticketData) {
    // 1. Format date and time
    const d = ticketData.time ? new Date(ticketData.time) : new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const formattedDate = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const formattedTime = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    
    // Swedish locale for vertical date format YYYY-MM-DD HH:mm:ss
    const now = d.toLocaleString("sv-SE").replace("T", " ");
    const branchName = ticketData.branchName || 'Cabang';

    // 2. Generate HTML Page template based on printController.txt reference
    const pageHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@page{
  margin:0;
}
body{
  margin:0;
  font-family: monospace;
}
.receipt{
  width:480px; /* 60mm @203dpi */
  padding:12px 12px 87px 50px;
  position:relative;
  box-sizing:border-box;
}
h2{
  font-size:24px;
  margin:0 0 4px 0;
  text-align:center;
}
.branch{
  font-size:16px;
  margin:0 0 12px 0;
  text-align:center;
  font-weight:bold;
}
.line{
  text-align:center;
  margin:8px 0;
  font-size:16px;
}
table{
  border-collapse:collapse;
  font-size:18px;
  width:100%;
}
td{
  padding:4px 0;
  vertical-align: middle;
}
.label{
  width:30%;
}
.separator{
  width:5%;
}
.value{
  font-weight:bold;
}
.queue-number{
  font-size:44px;
  font-weight:900;
}
.footer-text{
  font-size:16px;
  text-align:center;
  margin-top:20px;
  line-height:1.4;
}
.vertical-date{
  position:absolute;
  left:4px;
  top:45px;
  writing-mode: vertical-rl;
  font-size:16px;
  border-right:2px dotted #000;
  padding-right:4px;
}
</style>
</head>
<body>
<div class="receipt">
  <div class="vertical-date">
    ${now}
  </div>
  <div class="line">==================================</div>
  <h2>SUPER EMAS</h2>
  <div class="branch">${branchName}</div>
  <div class="line">==================================</div>
  <br/>
  <table>
    <tr>
      <td class="label">Nomor</td>
      <td class="separator">:</td>
      <td class="value queue-number">${ticketData.number}</td>
    </tr>
    <tr>
      <td class="label">Tanggal</td>
      <td class="separator">:</td>
      <td class="value">${formattedDate}</td>
    </tr>
    <tr>
      <td class="label">Jam</td>
      <td class="separator">:</td>
      <td class="value">${formattedTime}</td>
    </tr>
  </table>
  <br/>
  <div class="footer-text">
    Silakan menunggu hingga<br/>
    nomor dipanggil.
  </div>
  <br/>
  <div class="line">==================================</div>
</div>
</body>
</html>
`;

    try {
      // 3. Stringify the page array
      const pages = [pageHtml];
      const json = JSON.stringify(pages);

      // 4. Compress using pako.gzip
      const gzipped = pako.gzip(json);

      // 5. Encode output as base64
      const base64 = uint8ArrayToBase64(gzipped);

      // 6. Formulate Android Intent URL
      const intentUrl =
        'intent://#Intent;' +
        'scheme=print-intent;' +
        'S.content=' + encodeURIComponent(base64) + ';' +
        'end;';

      // 7. Open Intent
      window.location.href = intentUrl;
    } catch (err) {
      console.error('Failed to encode and send print intent', err);
      throw new Error('Gagal menyiapkan data cetak: ' + err.message);
    }
  }
}

const bluetoothPrintService = new BluetoothPrintService();
export default bluetoothPrintService;
