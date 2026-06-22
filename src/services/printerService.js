/**
 * EscPosBuilder
 * Helper class to construct raw ESC/POS byte commands for thermal printers.
 */
class EscPosBuilder {
  constructor() {
    this.buffer = [];
  }

  // Initialize printer
  init() {
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  // Set alignment: 0 = Left, 1 = Center, 2 = Right
  align(alignType) {
    this.buffer.push(0x1B, 0x61, alignType);
    return this;
  }

  // Turn bold on/off
  bold(on = true) {
    this.buffer.push(0x1B, 0x45, on ? 0x01 : 0x00);
    return this;
  }

  // Set text size:
  // doubleWidth (boolean), doubleHeight (boolean)
  setSize(doubleWidth = false, doubleHeight = false) {
    let size = 0x00;
    if (doubleWidth) size |= 0x10;
    if (doubleHeight) size |= 0x01;
    this.buffer.push(0x1D, 0x21, size);
    return this;
  }

  // Write text
  text(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.buffer.push(...bytes);
    return this;
  }

  // Add line feeds
  lineFeed(count = 1) {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  // Feed and cut paper
  cut() {
    // GS V 66 0
    this.buffer.push(0x1D, 0x56, 0x42, 0x00);
    return this;
  }

  // Return the complete Uint8Array
  build() {
    return new Uint8Array(this.buffer);
  }
}

/**
 * PrinterService
 * Handles connections and print jobs for various thermal printers:
 * - Bluetooth Serial (Classic SPP)
 * - Sunmi built-in thermal printers
 * - USB thermal printers
 */
class PrinterService {
  constructor() {
    this.printerType = localStorage.getItem('selected_printer_type') || 'bluetooth';
    this.selectedDevice = localStorage.getItem('selected_printer_device') || null;
  }

  /**
   * Set the printer type ('bluetooth', 'sunmi', 'usb')
   */
  setPrinterType(type) {
    this.printerType = type;
    localStorage.setItem('selected_printer_type', type);
  }

  /**
   * Get the current active printer type
   */
  getPrinterType() {
    return this.printerType;
  }

  /**
   * Check if the printer is currently connected.
   */
  async isConnected() {
    if (this.printerType === 'bluetooth') {
      if (!window.bluetoothSerial) {
        return false;
      }
      return new Promise((resolve) => {
        window.bluetoothSerial.isConnected(
          () => resolve(true),
          () => resolve(false)
        );
      });
    }

    if (this.printerType === 'sunmi') {
      // Placeholder: check Sunmi printer status
      return typeof window !== 'undefined' && !!window.sunmiInnerPrinter;
    }

    if (this.printerType === 'usb') {
      // Placeholder: check USB status
      return false;
    }

    return false;
  }

  /**
   * List all paired Bluetooth devices.
   */
  async listBluetoothDevices() {
    if (!window.bluetoothSerial) {
      throw new Error('Bluetooth Serial plugin is not available. Make sure you are running on Android.');
    }
    return new Promise((resolve, reject) => {
      window.bluetoothSerial.list(
        (devices) => resolve(devices),
        (err) => reject(new Error(`Gagal list Bluetooth devices: ${err}`))
      );
    });
  }

  /**
   * Connect to the target printer.
   */
  async connect() {
    if (this.printerType === 'bluetooth') {
      if (!window.bluetoothSerial) {
        throw new Error('Bluetooth Serial plugin tidak tersedia.');
      }

      const connected = await this.isConnected();
      if (connected) {
        return true;
      }

      const devices = await this.listBluetoothDevices();
      if (!devices || devices.length === 0) {
        throw new Error('Tidak ada perangkat Bluetooth terpasang (paired).');
      }

      // 1. Check if user has pre-selected a printer MAC address
      let targetDevice = null;
      if (this.selectedDevice) {
        targetDevice = devices.find(d => d.address === this.selectedDevice || d.id === this.selectedDevice);
      }

      // 2. Auto-detect a thermal printer if no specific address is saved
      if (!targetDevice) {
        targetDevice = devices.find(d => {
          const name = (d.name || '').toLowerCase();
          return (
            name.includes('printer') ||
            name.includes('thermal') ||
            name.includes('mtp') ||
            name.includes('pos') ||
            name.includes('58') ||
            name.includes('80') ||
            name.includes('spp')
          );
        });
      }

      // 3. Fallback to the first paired device if nothing matches
      if (!targetDevice) {
        targetDevice = devices[0];
      }

      // Attempt to connect via RFCOMM channel
      return new Promise((resolve, reject) => {
        window.bluetoothSerial.connect(
          targetDevice.address || targetDevice.id,
          () => {
            console.log(`Successfully connected to Bluetooth printer: ${targetDevice.name}`);
            this.selectedDevice = targetDevice.address || targetDevice.id;
            localStorage.setItem('selected_printer_device', this.selectedDevice);
            resolve(true);
          },
          (err) => {
            reject(new Error(`Gagal menghubungkan ke printer: ${err.message || err}`));
          }
        );
      });
    }

    if (this.printerType === 'sunmi') {
      // Placeholder: Sunmi built-in printers are integrated and don't need connecting
      return true;
    }

    if (this.printerType === 'usb') {
      // Placeholder: USB printer connection
      return true;
    }

    throw new Error('Tipe printer tidak didukung.');
  }

  /**
   * Disconnect from the printer (mainly for Bluetooth).
   */
  async disconnect() {
    if (this.printerType === 'bluetooth' && window.bluetoothSerial) {
      return new Promise((resolve) => {
        window.bluetoothSerial.disconnect(
          () => resolve(true),
          () => resolve(false)
        );
      });
    }
    return true;
  }

  /**
   * Format the ticket data into ESC/POS bytes.
   * Format:
   * SUPER EMAS INDONESIA
   *
   * Cabang: {branch}
   *
   * Nomor Antrian
   *
   * A-005
   *
   * Tanggal:
   * 17-06-2026
   *
   * Jam:
   * 19:25
   *
   * Loket:
   * 1 dan 2
   *
   * Mohon menunggu
   * hingga nomor dipanggil
   */
  buildEscPosBytes(ticketData) {
    const builder = new EscPosBuilder();
    builder.init();

    // Center Alignment
    builder.align(1);
    
    // Header
    builder.bold(true);
    builder.text("SUPER EMAS INDONESIA\n\n");

    // Branch Name
    builder.bold(false);
    builder.text(`Cabang: ${ticketData.branch}\n\n`);

    // Label: Nomor Antrian
    builder.text("Nomor Antrian\n\n");

    // Queue Number (Double Width + Double Height, Bold)
    builder.setSize(true, true);
    builder.bold(true);
    builder.text(`${ticketData.number}\n\n`);

    // Reset layout styles to default
    builder.setSize(false, false);
    builder.bold(false);

    // Date
    builder.text("Tanggal:\n");
    builder.text(`${ticketData.date}\n\n`);

    // Time
    builder.text("Jam:\n");
    builder.text(`${ticketData.time}\n\n`);

    // Counter/Loket
    builder.text("Loket:\n");
    builder.text("1 dan 2\n\n");

    // Footer
    builder.text("Mohon menunggu\n");
    builder.text("hingga nomor dipanggil\n");

    // Feed and Cut
    builder.lineFeed(4);
    builder.cut();

    return builder.build();
  }

  /**
   * Main print method. Takes ticket data and triggers printing.
   */
  async print(ticketData) {
    // Attempt connection first
    await this.connect();

    const dataBytes = this.buildEscPosBytes(ticketData);

    if (this.printerType === 'bluetooth') {
      if (!window.bluetoothSerial) {
        throw new Error('Bluetooth Serial plugin tidak tersedia.');
      }
      return new Promise((resolve, reject) => {
        window.bluetoothSerial.write(
          dataBytes.buffer,
          () => resolve(true),
          (err) => reject(new Error(`Bluetooth write error: ${err}`))
        );
      });
    }

    if (this.printerType === 'sunmi') {
      // Stub: Sunmi SDK print invocation
      console.log('Sunmi Printer Stub: printing ticket data', ticketData);
      return true;
    }

    if (this.printerType === 'usb') {
      // Stub: USB print invocation
      console.log('USB Printer Stub: printing ticket data', ticketData);
      return true;
    }

    throw new Error('Tipe printer tidak didukung.');
  }
}

export const printerService = new PrinterService();
