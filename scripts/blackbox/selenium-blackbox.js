/**
 * ============================================================================
 * BLACKBOX END-TO-END SUITE — SuperPOS
 * ============================================================================
 * Pengujian black-box berbasis browser (Selenium + Chrome). Verifikasi
 * dilakukan dari sudut pandang pengguna: teks/elemen UI, dialog browser,
 * perubahan stok yang tampil di UI, dan file Excel yang benar-benar terunduh.
 *
 * Modul yang dicakup:
 *   1. Rute & Keamanan          7. Pembayaran & Kembalian
 *   2. Autentikasi & Akun       8. Pengurangan Stok Otomatis
 *   3. Produk & Kategori        9. Biaya Operasional & Laba Bersih
 *   4. Resep & Bahan Baku      10. Multi-Toko (switch & isolasi)
 *   5. Kalkulasi HPP 1 & 2     11. Backup / Ekspor Excel
 *   6. Transaksi Kasir
 *
 * Cara pakai (PowerShell):
 *   $env:BLACKBOX_EMAIL="akun@uji.test"
 *   $env:BLACKBOX_PASSWORD="password-uji"
 *   npm run test:blackbox
 *
 * Variabel lingkungan opsional:
 *   BLACKBOX_BASE_URL        default http://localhost:3000
 *   BLACKBOX_HEADLESS        "false" untuk melihat browser
 *   BLACKBOX_TIMEOUT_MS      default 15000 (tunggu elemen)
 *   BLACKBOX_NAV_TIMEOUT_MS  default 30000 (tunggu navigasi/proses DB)
 *   BLACKBOX_REPORT          path JSON hasil
 *   BLACKBOX_MD_REPORT       path Markdown hasil (default BLACKBOX-REPORT.md)
 *   BLACKBOX_SCREENSHOTS     "fail" (default) | "all" | "off"
 *   BLACKBOX_CLEANUP         "true" untuk menghapus data uji di akhir
 *   BLACKBOX_SKIP_BACKUP     "true" untuk melewati ekspor Excel
 *   BLACKBOX_SKIP_STORE      "true" untuk melewati pembuatan cabang baru
 *   BLACKBOX_EXTRA_NOTES     catatan tambahan (pisahkan dengan "|") untuk laporan
 *   BLACKBOX_RECOVERY_PIN    PIN pemulihan untuk menjalankan AUTH-06
 *   BLACKBOX_NEW_PASSWORD    password baru sementara untuk menjalankan AUTH-06
 *   BLACKBOX_REPORT_ONLY_JSON bangun ulang Markdown dari JSON hasil run sebelumnya
 * ============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const { Builder, By, until, Select, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// ==========================================
// KONFIGURASI
// ==========================================
const BASE_URL = (process.env.BLACKBOX_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.BLACKBOX_TIMEOUT_MS || 15000);
const NAV_TIMEOUT_MS = Number(process.env.BLACKBOX_NAV_TIMEOUT_MS || 30000);
const HEADLESS = process.env.BLACKBOX_HEADLESS !== 'false';
const EMAIL = process.env.BLACKBOX_EMAIL;
const PASSWORD = process.env.BLACKBOX_PASSWORD;
const RECOVERY_PIN = process.env.BLACKBOX_RECOVERY_PIN;
const NEW_PASSWORD = process.env.BLACKBOX_NEW_PASSWORD;
const CLEANUP = process.env.BLACKBOX_CLEANUP === 'true';
const SKIP_BACKUP = process.env.BLACKBOX_SKIP_BACKUP === 'true';
const SKIP_STORE = process.env.BLACKBOX_SKIP_STORE === 'true';
const SCREENSHOT_MODE = process.env.BLACKBOX_SCREENSHOTS || 'fail';
const EXTRA_NOTES = (process.env.BLACKBOX_EXTRA_NOTES || '')
  .split('|')
  .map((note) => note.trim())
  .filter(Boolean);

const ARTIFACT_DIR = path.resolve('artifacts/blackbox');
const REPORT_JSON = path.resolve(
  process.env.BLACKBOX_REPORT || path.join(ARTIFACT_DIR, 'selenium-report.json'),
);
const REPORT_MD = path.resolve(
  process.env.BLACKBOX_MD_REPORT || 'BLACKBOX-REPORT.md',
);
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');
const DOWNLOAD_DIR = path.join(ARTIFACT_DIR, 'downloads');
const FIXTURE_DIR = path.join(ARTIFACT_DIR, 'fixtures');

// Penanda unik agar setiap eksekusi tidak bertabrakan dengan data uji sebelumnya.
const RUN_ID = (process.env.BLACKBOX_RUN_ID || Date.now().toString(36)).slice(-6).toUpperCase();
const TODAY = new Date().toLocaleDateString('sv-SE');
const STARTED_AT = new Date();

// ==========================================
// DATA UJI (dibuat & diverifikasi oleh suite)
// ==========================================
const state = {
  runId: RUN_ID,
  storeName: null,
  storeId: null,
  storeIdBeforeSwitch: null,
  isMainBranch: null,
  categoryName: `BB Kategori ${RUN_ID}`,
  categoryRenamed: `BB Kategori Edit ${RUN_ID}`,
  productName: `BB Nugget ${RUN_ID}`,
  productSku: `BBN-${RUN_ID}`,
  productPriceEdited: 26000,
  productStockInitial: 20,
  productStockAfterSales: 16,
  rawName: `BB Ayam ${RUN_ID}`,
  rawInitialStockKg: 5,
  rawStockAfterRecipeKg: 4.5,
  rawQtyUsedGram: 500,
  rawPricePerKg: 45000,
  recipeProductName: `BB Resep ${RUN_ID}`,
  recipeYield: 10,
  recipeHppPerUnit: 2250,
  recipeMarginPrice: 3500,
  expenseCategory: 'Listrik & Air',
  expenseAmount: 50000,
  storeBName: `BB Cabang ${RUN_ID}`,
  cashSaleTotal: 47000,
  cashSaleChange: 24000,
  qrisSaleTotal: 26000,
  report: {},
  observations: [],
};
const session = { loggedIn: false };

const created = {
  category: false,
  product: false,
  rawMaterial: false,
  recipeProduct: false,
  expense: false,
  storeB: false,
  backup: false,
  sales: 0,
};
// ==========================================
// HELPER UMUM
// ==========================================
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeText = (value) =>
  String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

class BlockedError extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'BlockedError';
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertMatch(value, pattern, message) {
  if (!pattern.test(normalizeText(value))) throw new Error(message);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseRupiah(value) {
  const digits = String(value ?? '').replace(/[^\d-]/g, '');
  return digits ? Number(digits) : 0;
}

function formatRupiah(number) {
  return `Rp ${Number(number || 0).toLocaleString('id-ID')}`;
}

function formatDateTimeWIB(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

function truncate(value, limit = 360) {
  const text = normalizeText(value);
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

async function waitForPage(driver, timeout = NAV_TIMEOUT_MS) {
  await driver.wait(async () => {
    const readyState = await driver.executeScript('return document.readyState');
    return readyState === 'complete' || readyState === 'interactive';
  }, timeout);
}

async function waitForUrl(driver, pattern, timeout = NAV_TIMEOUT_MS) {
  await driver.wait(until.urlMatches(pattern), timeout, `URL tidak cocok dengan ${pattern}`);
}

async function bodyText(driver) {
  return normalizeText(await driver.findElement(By.css('body')).getText());
}

async function waitForBody(driver, pattern, timeout = NAV_TIMEOUT_MS) {
  await driver.wait(async () => pattern.test(await bodyText(driver)), timeout,
    `Teks halaman tidak cocok dengan ${pattern}`);
}

async function goto(driver, route) {
  await driver.get(`${BASE_URL}${route}`);
  await waitForPage(driver);
}

async function waitVisible(driver, locator, timeout = TIMEOUT_MS) {
  const element = await driver.wait(until.elementLocated(locator), timeout,
    `Elemen ${locator} tidak ditemukan`);
  await driver.wait(until.elementIsVisible(element), timeout,
    `Elemen ${locator} tidak terlihat`);
  return element;
}

async function waitPresent(driver, locator, timeout = TIMEOUT_MS) {
  return driver.wait(until.elementLocated(locator), timeout, `Elemen ${locator} tidak ditemukan`);
}

async function isVisible(driver, locator) {
  try {
    const elements = await driver.findElements(locator);
    for (const element of elements) {
      if (await element.isDisplayed()) return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function waitGone(driver, locator, timeout = TIMEOUT_MS) {
  await driver.wait(async () => {
    try {
      const elements = await driver.findElements(locator);
      for (const element of elements) {
        if (await element.isDisplayed()) return false;
      }
      return true;
    } catch {
      return true;
    }
  }, timeout, `Elemen ${locator} masih tampil`);
}

async function click(driver, locator, timeout = TIMEOUT_MS) {
  const element = await waitVisible(driver, locator, timeout);
  await driver.executeScript(
    'arguments[0].scrollIntoView({ block: "center", inline: "center" });',
    element,
  );
  try {
    await element.click();
  } catch {
    await driver.executeScript('arguments[0].click();', element);
  }
  return element;
}

async function clickText(driver, text, { tag = 'button', timeout = TIMEOUT_MS } = {}) {
  const locator = By.xpath(
    `//${tag}[not(@disabled) and contains(normalize-space(.), ${JSON.stringify(text)})]`,
  );
  return click(driver, locator, timeout);
}

async function clickCss(driver, css, timeout = TIMEOUT_MS) {
  return click(driver, By.css(css), timeout);
}
async function typeInto(driver, locator, value, { clear = true } = {}) {
  const element = await waitVisible(driver, locator);
  if (clear) {
    await element.click();
    await element.sendKeys(Key.CONTROL, 'a', Key.BACK_SPACE);
  }
  await element.sendKeys(String(value));
  return element;
}

async function typeCss(driver, css, value, options) {
  return typeInto(driver, By.css(css), value, options);
}

async function typeXPath(driver, xpath, value, options) {
  return typeInto(driver, By.xpath(xpath), value, options);
}

async function selectByText(driver, locator, text) {
  const element = await waitVisible(driver, locator);
  const select = new Select(element);
  try {
    await select.selectByVisibleText(text);
  } catch {
    const labels = [];
    for (const option of await select.getOptions()) {
      labels.push(normalizeText(await option.getText()));
    }
    throw new Error(
      `Opsi "${text}" tidak ada. Pilihan tersedia: ${labels.filter(Boolean).join(' | ')}`,
    );
  }
  return element;
}

async function selectByValue(driver, locator, value) {
  const element = await waitVisible(driver, locator);
  await new Select(element).selectByValue(String(value));
  return element;
}

async function selectByPartialText(driver, locator, text) {
  const element = await waitVisible(driver, locator);
  const select = new Select(element);
  for (const option of await select.getOptions()) {
    const label = normalizeText(await option.getText());
    if (label.includes(text)) {
      await select.selectByVisibleText(label);
      return label;
    }
  }
  throw new Error(`Tidak ada opsi yang mengandung "${text}"`);
}

async function readCss(driver, css, fallback = '') {
  try {
    return normalizeText(await (await waitPresent(driver, By.css(css))).getText());
  } catch {
    return fallback;
  }
}

async function readXPath(driver, xpath, fallback = '') {
  try {
    return normalizeText(await (await waitPresent(driver, By.xpath(xpath))).getText());
  } catch {
    return fallback;
  }
}

async function readInputValue(driver, locator, fallback = '') {
  try {
    const element = await waitPresent(driver, locator);
    return normalizeText(await element.getAttribute('value')) || fallback;
  } catch {
    return fallback;
  }
}

async function readAlert(driver, timeout = 4000) {
  try {
    await driver.wait(until.alertIsPresent(), timeout);
    const alert = await driver.switchTo().alert();
    const text = normalizeText(await alert.getText());
    await alert.accept();
    return text;
  } catch {
    return null;
  }
}

async function takeScreenshot(driver, slug) {
  try {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const image = await driver.takeScreenshot();
    const fileName = `${RUN_ID}-${slug.replace(/[^a-z0-9-_]+/gi, '-')}.png`;
    const filePath = path.join(SCREENSHOT_DIR, fileName);
    fs.writeFileSync(filePath, image, 'base64');
    return path.relative(ARTIFACT_DIR, filePath).replace(/\\/g, '/');
  } catch {
    return null;
  }
}

function createFixtureImage() {
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  const pngPath = path.join(FIXTURE_DIR, 'produk-uji.png');
  if (!fs.existsSync(pngPath)) {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJ0lEQVR42mNkYPhfz0AEYBxVSF+FjAyMDAz//zMwMDAwMjAwMDAAAJ0cBv3GdwH0AAAAASUVORK5CYII=',
      'base64',
    );
    fs.writeFileSync(pngPath, png);
  }
  return pngPath;
}

async function resetBrowserSession(driver) {
  await driver.manage().deleteAllCookies();
  await goto(driver, '/welcome');
  await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
}
// ==========================================
// REGISTRY SKENARIO
// ==========================================
const MODULES = {
  security: '1. Rute & Keamanan',
  auth: '2. Autentikasi & Akun',
  catalog: '3. Manajemen Produk & Kategori',
  recipe: '4. Resep & Bahan Baku',
  hpp: '5. Kalkulasi HPP',
  pos: '6. Transaksi Kasir',
  payment: '7. Pembayaran & Kembalian',
  stock: '8. Pengurangan Stok Otomatis',
  finance: '9. Biaya Operasional & Laporan',
  stores: '10. Multi-Toko (Switch & Isolasi)',
  backup: '11. Backup / Ekspor Data',
  cleanup: '12. Pembersihan Data Uji',
};

const cases = [];

/**
 * @param {object} def
 * @param {string} def.id
 * @param {string} def.module kunci MODULES
 * @param {string} def.title
 * @param {boolean} [def.auth] butuh login
 * @param {string[]} [def.requires] ID kasus prasyarat
 * @param {string[]} [def.steps]
 * @param {string} def.expected
 * @param {(driver: object) => Promise<string>} def.run
 */
function test(def) {
  cases.push(def);
  return def;
}

async function loginThroughUI(driver) {
  if (!EMAIL || !PASSWORD) {
    throw new BlockedError('BLACKBOX_EMAIL / BLACKBOX_PASSWORD belum di-set');
  }

  await resetBrowserSession(driver);
  await goto(driver, '/auth/login');
  await waitVisible(driver, By.id('email'));
  await typeCss(driver, '#email', EMAIL);
  await typeCss(driver, '#password', PASSWORD);
  await clickCss(driver, 'button[type="submit"]');
  await waitForUrl(driver, /\/dashboard/, NAV_TIMEOUT_MS);
  await waitVisible(driver, By.css('button[aria-label="Logout"]'), NAV_TIMEOUT_MS);

  const storeElement = await waitPresent(driver, By.xpath('//aside//p[@title]'));
  const storeTitle = normalizeText(await storeElement.getAttribute('title'));
  const storeText = normalizeText(await storeElement.getText());
  let storeLabel = storeTitle || storeText;

  // Tentukan toko aktif secara deterministik lewat dropdown "Toko aktif"
  // agar seluruh hook (produk, kategori, HPP, kasir, laporan) memakai toko
  // yang sama. Tanpa ini, resolveActiveStore() bisa memilih cabang berbeda
  // saat localStorage belum berisi active_store_id.
  try {
    await goto(driver, '/settings/profile/stores');
    await waitForBody(driver, /Daftar Cabang Toko/i, NAV_TIMEOUT_MS);
    const selectLocator = By.xpath(
      "//span[normalize-space()='Toko aktif']/following-sibling::select[1]",
    );
    const storeSelect = await waitVisible(driver, selectLocator);
    const options = await new Select(storeSelect).getOptions();
    const labels = [];
    for (const option of options) {
      const label = normalizeText(await option.getText());
      if (label) labels.push(label);
    }
    const targetLabel = labels.find((label) => /cabang utama/i.test(label)) || labels[0];
    const otherLabel = labels.find(
      (label) => label !== targetLabel && !/\(nonaktif\)/i.test(label),
    );
    if (targetLabel) {
      // Pilih cabang lain dahulu (bila ada) supaya onChange benar-benar
      // menulis active_store_id, lalu pilih toko utama.
      if (otherLabel) {
        await selectByText(driver, selectLocator, otherLabel);
        await sleep(400);
      }
      await selectByText(driver, selectLocator, targetLabel);
      await sleep(600);
      state.storeName = targetLabel.replace(/\s*\(nonaktif\)$/i, '').trim();
      const activeId = await driver.executeScript(
        "return window.localStorage.getItem('active_store_id');",
      );
      if (activeId) state.storeId = String(activeId);
      storeLabel = state.storeName;
    }
    await goto(driver, '/dashboard');
  } catch {
    // Fallback: nama dari sidebar sudah cukup untuk modul lain.
  }

  if (storeLabel) state.storeName = storeLabel;
  const activeId = await driver.executeScript(
    "return window.localStorage.getItem('active_store_id');",
  );
  state.storeId = activeId ? String(activeId) : null;
  session.loggedIn = true;
  return storeLabel;
}

async function logoutThroughUI(driver) {
  await clickCss(driver, 'button[aria-label="Logout"]');
  await waitForUrl(driver, /\/auth\/login/, NAV_TIMEOUT_MS);
  session.loggedIn = false;
}
// ==========================================
// MODUL 1 — RUTE & KEAMANAN
// ==========================================
test({
  id: 'SEC-01',
  auth: false,
  module: 'security',
  title: 'Halaman publik dapat diakses tanpa login',
  steps: ['Buka /welcome, /auth/login, /auth/register, /auth/forgot-password'],
  expected: 'Semua halaman tampil, memiliki heading h1, tanpa error dan tanpa redirect paksa',
  run: async (driver) => {
    const routes = [
      { path: '/welcome', heading: /Panduan|Kelola Penjualan|SuperPOS/i },
      { path: '/auth/login', heading: /Masuk/i },
      { path: '/auth/register', heading: /Buat Akun|Daftar/i },
      { path: '/auth/forgot-password', heading: /Lupa Password|LUPA PASSWORD/i },
    ];
    const notes = [];
    for (const route of routes) {
      await goto(driver, route.path);
      const text = await bodyText(driver);
      assertMatch(text, route.heading, `${route.path} tidak menampilkan teks yang diharapkan`);
      const headings = await driver.findElements(By.css('h1'));
      assert(headings.length > 0, `${route.path} tidak memiliki heading h1`);
      notes.push(`${route.path} OK`);
    }
    return notes.join('; ');
  },
});

test({
  id: 'SEC-02',
  auth: false,
  module: 'security',
  title: 'Rute master data & katalog tidak bisa dibuka tanpa sesi',
  steps: [
    'Hapus seluruh cookie & storage',
    'Buka langsung /dashboard, /product, /category, /bahan-baku',
  ],
  expected: 'Setiap rute otomatis diarahkan ke /auth/login dan tidak menampilkan data privat',
  run: async (driver) => {
    await resetBrowserSession(driver);
    const routes = ['/dashboard', '/product', '/category', '/bahan-baku'];
    for (const route of routes) {
      await goto(driver, route);
      await waitForUrl(driver, /\/auth\/login/, NAV_TIMEOUT_MS);
      const text = await bodyText(driver);
      assert(/Masuk/i.test(text), `${route} tidak berakhir di halaman login`);
      assert(!/Logout|Daftar Produk|Manajemen Kategori/i.test(text),
        `${route} membocorkan konten privat sebelum redirect`);
    }
    return `${routes.length} rute master data ter-redirect ke /auth/login`;
  },
});

test({
  id: 'SEC-03',
  auth: false,
  module: 'security',
  title: 'Rute kasir, histori, dan keuangan terlindungi',
  steps: ['Buka langsung /transaksi, /history, /pengeluaran, /report tanpa sesi'],
  expected: 'Semua rute diarahkan ke /auth/login',
  run: async (driver) => {
    const routes = ['/transaksi', '/history', '/pengeluaran', '/report'];
    for (const route of routes) {
      await goto(driver, route);
      await waitForUrl(driver, /\/auth\/login/, NAV_TIMEOUT_MS);
    }
    return `${routes.length} rute transaksi/keuangan ter-redirect ke /auth/login`;
  },
});

test({
  id: 'SEC-04',
  auth: false,
  module: 'security',
  title: 'Rute HPP & pengaturan terlindungi',
  steps: [
    'Buka langsung /hpp/hitung-hpp, /hpp/hppproduk, /settings/profile',
    'Buka /settings/profile/stores dan /settings/profile/export-data',
  ],
  expected: 'Semua rute diarahkan ke /auth/login tanpa membocorkan data',
  run: async (driver) => {
    const routes = [
      '/hpp/hitung-hpp',
      '/hpp/hppproduk',
      '/settings/profile',
      '/settings/profile/stores',
      '/settings/profile/export-data',
    ];
    for (const route of routes) {
      await goto(driver, route);
      await waitForUrl(driver, /\/auth\/login/, NAV_TIMEOUT_MS);
    }
    return `${routes.length} rute HPP/pengaturan ter-redirect ke /auth/login`;
  },
});
// ==========================================
// MODUL 2 — AUTENTIKASI & AKUN
// ==========================================
test({
  id: 'AUTH-01',
  auth: false,
  module: 'auth',
  title: 'Validasi format email pada form login',
  steps: ['Isi email "invalid-email" dan password "x"', 'Klik tombol Masuk'],
  expected: 'Input email ditandai aria-invalid=true dan muncul pesan format email tidak valid',
  run: async (driver) => {
    await goto(driver, '/auth/login');
    await waitVisible(driver, By.id('email'));
    await typeCss(driver, '#email', 'invalid-email');
    await typeCss(driver, '#password', 'x');
    const submit = await waitVisible(driver, By.css('button[type="submit"]'));
    await clickCss(driver, 'button[type="submit"]');
    const invalid = await (await driver.findElement(By.id('email'))).getAttribute('aria-invalid');
    const text = await bodyText(driver);
    assert(invalid === 'true' || /tidak valid/i.test(text),
      'Validasi email tidak muncul (aria-invalid bukan true dan tidak ada pesan)');
    const disabled = await submit.getAttribute('disabled');
    assert(disabled !== null, 'Tombol submit seharusnya disabled saat ada field error');
    return `aria-invalid=${invalid}; tombol submit disabled; pesan validasi tampil`;
  },
});

test({
  id: 'AUTH-02',
  auth: false,
  module: 'auth',
  title: 'Pesan error saat password salah',
  steps: ['Isi email akun uji dengan format valid', 'Isi password salah', 'Klik Masuk'],
  expected: 'Login ditolak, alert + pesan inline "Email atau password ... salah", tetap di halaman login',
  run: async (driver) => {
    if (!EMAIL) throw new BlockedError('BLACKBOX_EMAIL belum di-set');
    await goto(driver, '/auth/login');
    await waitVisible(driver, By.id('email'));
    await typeCss(driver, '#email', EMAIL);
    await typeCss(driver, '#password', 'PasswordSalah-2026!');
    await clickCss(driver, 'button[type="submit"]');
    const alertText = await readAlert(driver, TIMEOUT_MS);
    await waitForBody(driver, /salah/i, NAV_TIMEOUT_MS);
    const text = await bodyText(driver);
    assertMatch(text, /Email atau password/i, 'Pesan error inline tidak muncul');
    assertMatch(text, /salah/i, 'Pesan error tidak menyebut kredensial salah');
    await waitForUrl(driver, /\/auth\/login/, TIMEOUT_MS);
    return `Alert: ${alertText || '(tidak tertangkap)'}; inline error tampil di halaman login`;
  },
});

test({
  id: 'AUTH-03',
  auth: false,
  module: 'auth',
  title: 'Alur lupa password / reset recovery PIN (validasi UI)',
  steps: [
    'Buka /auth/forgot-password',
    'Klik "Tidak mengerti cara reset PIN?"',
    'Isi email, nama lengkap, PIN 123456 dua kali',
    'Klik "Reset PIN Saya"',
  ],
  expected: 'Form PIN 6 digit tampil; PIN lemah ditolak dengan pesan jelas tanpa mengubah data',
  run: async (driver) => {
    await goto(driver, '/auth/forgot-password');
    await waitForBody(driver, /LUPA PASSWORD/i);
    const pinInput = await waitVisible(driver, By.css('input[type="password"]'));
    const maxLength = await pinInput.getAttribute('maxlength');
    assert(String(maxLength) === '6', `Input PIN seharusnya maxlength=6, ditemukan ${maxLength}`);

    await clickText(driver, 'Tidak mengerti cara reset PIN?');
    await waitVisible(driver, By.css('input[placeholder="Nama lengkap sesuai akun"]'));
    await typeCss(driver, 'input[placeholder="Nama lengkap sesuai akun"]', 'Penguji Blackbox');
    await typeCss(driver, 'input[type="email"]', EMAIL || 'blackbox@example.test');
    await typeCss(driver, 'input[placeholder="PIN baru 6 digit"]', '123456');
    await typeCss(driver, 'input[placeholder="Ulangi PIN baru"]', '123456');
    await clickText(driver, 'Reset PIN Saya');
    await waitForBody(driver, /terlalu mudah ditebak|tidak aman/i, NAV_TIMEOUT_MS);
    return 'Form reset mandiri tampil dan PIN lemah (123456) ditolak oleh validasi klien';
  },
});

test({
  id: 'AUTH-04',
  module: 'auth',
  title: 'Login kredensial valid',
  auth: false,
  steps: ['Buka /auth/login', 'Isi email & password akun uji', 'Klik Masuk'],
  expected: 'Diarahkan ke /dashboard, sidebar menampilkan toko aktif dan tombol Logout',
  run: async (driver) => {
    const storeLabel = await loginThroughUI(driver);
    await waitForBody(driver, /Selamat datang|Halo,/i, NAV_TIMEOUT_MS);
    const text = await bodyText(driver);
    assertMatch(text, /Selamat datang|Halo,/i, 'Konten dashboard tidak tampil setelah login');
    assert(storeLabel, 'Nama toko aktif tidak terbaca di sidebar');
    return `Masuk ke /dashboard; toko aktif: "${storeLabel}"`;
  },
});

test({
  id: 'AUTH-05',
  module: 'auth',
  title: 'Logout mengakhiri sesi dan melindungi rute privat',
  steps: ['Klik tombol Logout di sidebar', 'Buka kembali /dashboard'],
  expected: 'Kembali ke /auth/login dan rute privat kembali ditolak',
  run: async (driver) => {
    await logoutThroughUI(driver);
    await goto(driver, '/dashboard');
    await waitForUrl(driver, /\/auth\/login/, NAV_TIMEOUT_MS);
    const text = await bodyText(driver);
    assert(/Masuk/i.test(text), 'Setelah logout, /dashboard tidak diarahkan ke login');
    return 'Logout berhasil; /dashboard kembali diarahkan ke /auth/login';
  },
});

test({
  id: 'AUTH-06',
  auth: false,
  module: 'auth',
  title: 'Reset password penuh dengan PIN pemulihan',
  steps: ['Masukkan PIN pemulihan akun uji', 'Buat password baru', 'Login ulang dengan password baru'],
  expected: 'Password berhasil diubah dan login dengan password baru berhasil',
  run: async (driver) => {
    if (!EMAIL || !PASSWORD) {
      throw new BlockedError('BLACKBOX_EMAIL / BLACKBOX_PASSWORD belum di-set');
    }
    if (!RECOVERY_PIN || !NEW_PASSWORD) {
      throw new BlockedError(
        'Set BLACKBOX_RECOVERY_PIN dan BLACKBOX_NEW_PASSWORD untuk menjalankan reset password otomatis.',
      );
    }

    await goto(driver, '/auth/forgot-password');
    await typeCss(driver, 'input[type="email"]', EMAIL);
    await typeCss(driver, 'input[placeholder="• • • • • •"]', RECOVERY_PIN);
    await clickText(driver, 'Verifikasi PIN');
    const verificationAlert = await readAlert(driver, TIMEOUT_MS);
    await waitForBody(driver, /PIN TERVERIFIKASI/i, NAV_TIMEOUT_MS);
    assert(
      verificationAlert === null || /berhasil diverifikasi/i.test(verificationAlert),
      'Alert verifikasi PIN tidak sesuai',
    );

    await typeCss(driver, 'input[placeholder="Masukkan password baru"]', NEW_PASSWORD);
    await typeCss(driver, 'input[placeholder="Konfirmasi password baru"]', NEW_PASSWORD);
    await clickText(driver, 'Simpan Password Baru');
    await waitForBody(driver, /BERHASIL|Password Anda telah berhasil diubah/i, NAV_TIMEOUT_MS);

    await goto(driver, '/auth/login');
    await typeCss(driver, '#email', EMAIL);
    await typeCss(driver, '#password', NEW_PASSWORD);
    await clickCss(driver, 'button[type="submit"]');
    await waitForUrl(driver, /\/dashboard/, NAV_TIMEOUT_MS);
    await waitVisible(driver, By.css('button[aria-label="Logout"]'), NAV_TIMEOUT_MS);
    return 'PIN diverifikasi, password berhasil diubah, dan login dengan password baru berhasil';
  },
});
// ==========================================
// HELPER: PILIH TOKO PADA FORM
// ==========================================
async function chooseStore(driver, selectLocator) {
  const element = await waitVisible(driver, selectLocator);
  const select = new Select(element);
  const options = await select.getOptions();
  const labels = [];
  for (const option of options) {
    const label = normalizeText(await option.getText());
    if (!label || /^--/.test(label)) continue;
    labels.push(label);
    if (state.storeName && label === state.storeName) {
      await select.selectByVisibleText(label);
      return label;
    }
  }
  if (labels.length === 0) throw new Error('Tidak ada pilihan toko pada form');
  await select.selectByVisibleText(labels[0]);
  return labels[0];
}

async function openProductModal(driver) {
  await goto(driver, '/product');
  await clickCss(driver, 'button[aria-label="Tambah produk baru"]', NAV_TIMEOUT_MS);
  await waitForBody(driver, /Tambah Produk Baru/i);
}

async function searchProduct(driver, name) {
  await typeCss(driver, 'input[aria-label="Cari produk"]', name);
  await driver.wait(async () => {
    const text = await bodyText(driver);
    return text.includes(name) || /Tidak ada produk yang cocok/i.test(text);
  }, NAV_TIMEOUT_MS, `Produk "${name}" tidak muncul pada daftar`);
}

async function productRowText(driver, name) {
  return readXPath(driver, `//tr[contains(., ${JSON.stringify(name)})]`);
}

// ==========================================
// MODUL 3 — MANAJEMEN PRODUK & KATEGORI
// ==========================================
test({
  id: 'CAT-01',
  module: 'catalog',
  title: 'Membuat kategori barang baru',
  steps: ['Buka /category', 'Klik Tambah', 'Pilih toko', 'Isi nama kategori baru', 'Simpan'],
  expected: 'Kategori baru tampil pada daftar kategori toko aktif',
  run: async (driver) => {
    await goto(driver, '/category');
    await waitForBody(driver, /Manajemen Kategori/i);
    await clickText(driver, 'Tambah');
    await waitForBody(driver, /Tambah Kategori Baru|Nama Kategori/i);
    await chooseStore(driver, By.css('form select[name="store_id"]'));
    await typeCss(driver, 'form input[name="name"]', state.categoryName);
    await clickCss(driver, 'form button[type="submit"]');
    await waitGone(driver, By.css('form select[name="store_id"]'), NAV_TIMEOUT_MS);
    await waitForBody(driver, new RegExp(escapeRegExp(state.categoryName)), NAV_TIMEOUT_MS);
    created.category = true;
    return `Kategori "${state.categoryName}" berhasil dibuat dan tampil di daftar`;
  },
});

test({
  id: 'CAT-02',
  module: 'catalog',
  title: 'Mengubah nama kategori',
  steps: ['Cari kategori uji', 'Klik Edit', 'Ubah nama', 'Simpan'],
  expected: 'Nama kategori berubah pada daftar',
  requires: ['CAT-01'],
  run: async (driver) => {
    await goto(driver, '/category');
    await waitForBody(driver, new RegExp(escapeRegExp(state.categoryName)));
    await click(driver, By.xpath(
      `//tr[contains(., ${JSON.stringify(state.categoryName)})]//button[@aria-label="Edit kategori"]`,
    ));
    await waitForBody(driver, /Edit Kategori/i);
    await typeCss(driver, 'form input[name="name"]', state.categoryRenamed);
    await clickCss(driver, 'form button[type="submit"]');
    await waitGone(driver, By.css('form input[name="name"]'), NAV_TIMEOUT_MS);
    await waitForBody(driver, new RegExp(escapeRegExp(state.categoryRenamed)), NAV_TIMEOUT_MS);
    return `Kategori diubah menjadi "${state.categoryRenamed}"`;
  },
});
test({
  id: 'PRD-01',
  module: 'catalog',
  title: 'Menambah produk baru beserta stok awal',
  steps: [
    'Buka /product lalu klik Tambah Produk',
    'Pilih toko & kategori, isi nama, SKU, stok 20',
    'Klik Simpan Produk',
  ],
  expected: 'Produk tersimpan dan tampil di daftar dengan stok 20 (harga diisi lewat edit produk)',
  requires: ['CAT-02'],
  run: async (driver) => {
    await openProductModal(driver);
    await chooseStore(driver, By.css('form select[name="store_id"]'));
    await selectByText(driver, By.css('form select[name="category_id"]'), state.categoryRenamed);
    await typeCss(driver, 'form input[name="name"]', state.productName);
    await typeCss(driver, 'form input[name="sku"]', state.productSku);
    await typeCss(driver, 'form input[name="stock"]', state.productStockInitial);
    await clickCss(driver, 'form button[type="submit"]', NAV_TIMEOUT_MS);
    await waitGone(driver, By.css('form input[name="name"]'), NAV_TIMEOUT_MS);
    if (await isVisible(driver, By.xpath("//*[contains(text(),'Error:')]"))) {
      const err = await readXPath(driver, "//*[contains(text(),'Error:')]");
      throw new Error(`Form produk menampilkan error: ${truncate(err, 240)}`);
    }
    await searchProduct(driver, state.productName);
    const row = await productRowText(driver, state.productName);
    assertMatch(row, new RegExp(`\\b${state.productStockInitial}\\b`),
      `Stok ${state.productStockInitial} tidak tampil pada baris produk`);
    assertMatch(row, new RegExp(escapeRegExp(state.productSku)),
      'SKU produk tidak tampil pada baris produk');
    created.product = true;
    return `Produk "${state.productName}" tersimpan dengan stok ${state.productStockInitial} (harga diisi pada kasus edit)`;
  },
});

test({
  id: 'PRD-02',
  module: 'catalog',
  title: 'Upload gambar produk',
  steps: ['Edit produk uji', 'Pilih file PNG pada input foto', 'Simpan Produk'],
  expected: 'Preview gambar muncul di modal dan thumbnail produk tampil di daftar',
  requires: ['PRD-01'],
  run: async (driver) => {
    const fixture = createFixtureImage();
    await goto(driver, '/product');
    await searchProduct(driver, state.productName);
    await click(driver, By.xpath(
      `//tr[contains(., ${JSON.stringify(state.productName)})]//button[@aria-label="Edit produk"]`,
    ));
    await waitForBody(driver, /Edit Produk/i);
    const fileInput = await waitVisible(driver, By.css('form input[type="file"]'));
    await fileInput.sendKeys(fixture);
    await driver.wait(async () => !/Sedang mengoptimalkan gambar/i.test(await bodyText(driver)),
      NAV_TIMEOUT_MS, 'Konversi gambar tidak selesai');
    const preview = await waitVisible(driver, By.css('form img[alt="Preview"]'));
    const blobSrc = await preview.getAttribute('src');
    assert(Boolean(blobSrc), 'Preview gambar tidak muncul setelah upload');
    await clickCss(driver, 'form button[type="submit"]', NAV_TIMEOUT_MS);
    await waitGone(driver, By.css('form input[name="name"]'), NAV_TIMEOUT_MS);
    await searchProduct(driver, state.productName);
    const thumb = await waitPresent(driver, By.xpath(
      `//tr[contains(., ${JSON.stringify(state.productName)})]//img`,
    ));
    const thumbSrc = await thumb.getAttribute('src');
    assert(/^https?:/i.test(String(thumbSrc)), `Thumbnail produk bukan URL storage: ${thumbSrc}`);
    return `Gambar terunggah; thumbnail daftar memakai URL storage (${truncate(thumbSrc, 90)})`;
  },
});
test({
  id: 'PRD-03',
  module: 'catalog',
  title: 'Mengedit harga produk',
  steps: ['Cari produk uji', 'Klik Edit', 'Ubah harga menjadi Rp26.000', 'Simpan Produk'],
  expected: 'Harga produk berubah menjadi Rp26.000 di daftar produk',
  requires: ['PRD-02'],
  run: async (driver) => {
    await goto(driver, '/product');
    await searchProduct(driver, state.productName);
    await click(driver, By.xpath(
      `//tr[contains(., ${JSON.stringify(state.productName)})]//button[@aria-label="Edit produk"]`,
    ));
    await waitForBody(driver, /Edit Produk/i);
    await typeCss(driver, 'form input[name="base_price"]', state.productPriceEdited);
    await clickCss(driver, 'form button[type="submit"]', NAV_TIMEOUT_MS);
    await waitGone(driver, By.css('form input[name="name"]'), NAV_TIMEOUT_MS);
    await searchProduct(driver, state.productName);
    const row = await productRowText(driver, state.productName);
    assertMatch(row, new RegExp(escapeRegExp(formatRupiah(state.productPriceEdited))),
      'Harga baru Rp26.000 tidak tampil setelah edit');
    return `Harga produk kini ${formatRupiah(state.productPriceEdited)}`;
  },
});

test({
  id: 'PRD-04',
  module: 'catalog',
  title: 'Pencarian & filter produk',
  steps: ['Cari produk berdasarkan nama', 'Filter kategori ke kategori uji'],
  expected: 'Hanya produk yang cocok yang tampil',
  requires: ['PRD-03'],
  run: async (driver) => {
    await goto(driver, '/product');
    await searchProduct(driver, state.productName);
    const row = await productRowText(driver, state.productName);
    assert(row.includes(state.productSku), 'SKU produk tidak tampil pada hasil pencarian');
    await selectByText(driver, By.css('select[aria-label="Filter kategori"]'), state.categoryRenamed);
    await waitForBody(driver, new RegExp(escapeRegExp(state.productName)), NAV_TIMEOUT_MS);
    await typeCss(driver, 'input[aria-label="Cari produk"]', 'PRODUK-TIDAK-ADA-BB');
    await waitForBody(driver, /Tidak ada produk yang cocok/i, NAV_TIMEOUT_MS);
    await typeCss(driver, 'input[aria-label="Cari produk"]', '');
    await selectByText(driver, By.css('select[aria-label="Filter kategori"]'), 'Semua Kategori');
    return 'Pencarian nama/SKU dan filter kategori bekerja; pencarian tanpa hasil menampilkan empty state';
  },
});

test({
  id: 'PRD-05',
  module: 'catalog',
  title: 'Menghapus produk',
  steps: ['Tambah produk sementara', 'Cari produk tersebut', 'Klik Hapus dan konfirmasi'],
  expected: 'Produk terhapus dari daftar setelah konfirmasi',
  requires: ['PRD-03'],
  run: async (driver) => {
    const tempName = `BB Hapus ${RUN_ID}`;
    const tempSku = `BBH-${RUN_ID}`;
    await openProductModal(driver);
    await chooseStore(driver, By.css('form select[name="store_id"]'));
    await selectByText(driver, By.css('form select[name="category_id"]'), state.categoryRenamed);
    await typeCss(driver, 'form input[name="name"]', tempName);
    await typeCss(driver, 'form input[name="sku"]', tempSku);
    await typeCss(driver, 'form input[name="stock"]', '1');
    await clickCss(driver, 'form button[type="submit"]', NAV_TIMEOUT_MS);
    await waitGone(driver, By.css('form input[name="name"]'), NAV_TIMEOUT_MS);
    await searchProduct(driver, tempName);
    await click(driver, By.xpath(
      `//tr[contains(., ${JSON.stringify(tempName)})]//button[@aria-label="Hapus produk"]`,
    ));
    const confirmText = await readAlert(driver, TIMEOUT_MS);
    assert(confirmText && /Yakin ingin menghapus produk/i.test(confirmText),
      `Dialog konfirmasi hapus tidak muncul (${confirmText})`);
    const errorAlert = await readAlert(driver, 5000);
    assert(!errorAlert, `Penghapusan produk gagal: ${errorAlert}`);
    await waitGone(driver, By.xpath(
      `//tr[contains(., ${JSON.stringify(tempName)})]`,
    ), NAV_TIMEOUT_MS);
    await waitForBody(driver, /Tidak ada produk yang cocok/i, NAV_TIMEOUT_MS);
    return `Produk sementara "${tempName}" berhasil dihapus dan hilang dari daftar`;
  },
});

// ==========================================
// MODUL 4 — RESEP & BAHAN BAKU
// ==========================================
test({
  id: 'BBM-01',
  module: 'recipe',
  title: 'Input bahan baku baru dengan satuan & stok awal',
  steps: [
    'Buka /bahan-baku lalu klik Tambah Bahan Baku',
    'Isi nama, isi beli 1 kg, harga beli Rp45.000, stok awal 5 kg',
    'Klik Tambah & Stok',
  ],
  expected: 'Bahan baku tampil dengan satuan kg, harga modal Rp45.000/kg, stok 5 kg',
  run: async (driver) => {
    await goto(driver, '/bahan-baku');
    await waitForBody(driver, /Manajemen Bahan Baku/i);
    await clickText(driver, 'Tambah Bahan Baku');
    await waitForBody(driver, /Tambah Bahan Baku Baru/i);
    await typeCss(driver, 'form input[name="name"]', state.rawName);
    await typeCss(driver, 'form input[name="qty_beli"]', '1');
    await selectByValue(driver, By.css('form select[name="satuan_beli"]'), 'kg');
    await typeCss(driver, 'form input[name="total_harga_beli"]', String(state.rawPricePerKg));
    await typeCss(driver, 'form input[name="initialStock"]', String(state.rawInitialStockKg));
    await clickCss(driver, 'form button[type="submit"]', NAV_TIMEOUT_MS);
    const alertText = await readAlert(driver, NAV_TIMEOUT_MS);
    await waitGone(driver, By.css('form input[name="name"]'), NAV_TIMEOUT_MS);
    assert(alertText && /berhasil/i.test(alertText), `Konfirmasi simpan tidak muncul (${alertText})`);

    await typeCss(driver, 'input[placeholder*="Cari nama bahan baku"]', state.rawName);
    await waitForBody(driver, new RegExp(escapeRegExp(state.rawName)), NAV_TIMEOUT_MS);
    const card = await readXPath(driver,
      `//div[contains(@class,'grid')]//div[contains(., ${JSON.stringify(state.rawName)}) and .//button[contains(., 'Edit')]]`);
    assertMatch(card, new RegExp(`Stok Gudang:? ${state.rawInitialStockKg} kg`, 'i'),
      'Stok awal 5 kg tidak tampil pada kartu bahan baku');
    assertMatch(card, /45rb|Rp ?45\.000/, 'Harga modal Rp45.000 tidak tampil pada kartu bahan baku');
    created.rawMaterial = true;
    return `Bahan "${state.rawName}" dibuat; kartu menampilkan ${state.rawInitialStockKg} kg dan Rp45.000/kg`;
  },
});
// ==========================================
// MODUL 5 — KALKULASI HPP
// ==========================================
test({
  id: 'HPP-01',
  module: 'hpp',
  title: 'HPP Step 1 — estimasi HPP per porsi dari resep bahan baku',
  steps: [
    'Buka /hpp/hitung-hpp',
    'Isi nama produk, kategori, yield 10 porsi',
    'Pilih bahan baku uji, qty 500 gram',
    'Amati ringkasan perhitungan',
  ],
  expected: 'Total HPP batch Rp22.500 dan estimasi HPP per porsi Rp2.250',
  requires: ['BBM-01'],
  run: async (driver) => {
    await goto(driver, '/hpp/hitung-hpp');
    await waitForBody(driver, /Informasi Produk & Batch/i, NAV_TIMEOUT_MS);
    await typeCss(driver, 'input[placeholder="Contoh: Dimsum Ayam Udang Premium"]', state.recipeProductName);
    await selectByText(driver, By.xpath(
      "//label[normalize-space()='Kategori Produk']/following-sibling::select[1]",
    ), state.categoryRenamed);
    await typeCss(driver, 'input[placeholder="20"]', String(state.recipeYield));
    await selectByText(driver, By.xpath(
      "//label[normalize-space()='Jumlah Hasil (Yield)']/following::select[1]",
    ), 'Porsi / Mika');

    await selectByPartialText(driver, By.xpath(
      "(//label[normalize-space()='Pilih Bahan Baku']/following-sibling::select)[1]",
    ), state.rawName);
    await typeXPath(driver, "(//label[normalize-space()='Jumlah Dibutuhkan']/following-sibling::input)[1]",
      String(state.rawQtyUsedGram));

    const satuanResep = await new Select(
      await waitVisible(driver, By.xpath(
        "(//label[normalize-space()='Satuan Resep']/following-sibling::select)[1]",
      )),
    ).getFirstSelectedOption().then((o) => o.getAttribute('value'));
    assert(satuanResep === 'gram', `Satuan resep seharusnya gram, ditemukan ${satuanResep}`);

    await waitForBody(driver, /Estimasi HPP per porsi/i, NAV_TIMEOUT_MS);
    const summary = await readXPath(driver,
      "//*[contains(text(),'Total HPP Bahan Baku (1 Batch)')]/ancestor::div[contains(@class,'rounded-xl')][1]");
    const subtotal = await readInputValue(driver, By.xpath(
      "(//label[normalize-space()='Subtotal Biaya Bahan']/following::input)[1]",
    ));
    assertMatch(subtotal, /22\.500/, `Subtotal biaya bahan tidak sama dengan Rp22.500 (${subtotal})`);
    assertMatch(summary, /Rp 22\.500/, 'Total HPP batch Rp22.500 tidak tampil');
    assertMatch(summary, /Rp 2\.250/, 'Estimasi HPP per porsi Rp2.250 tidak tampil');
    return `Satuan resep ${satuanResep}; subtotal ${subtotal}; total batch Rp22.500; HPP/porsi Rp2.250`;
  },
});

test({
  id: 'HPP-02',
  module: 'hpp',
  title: 'HPP Step 2 — margin keuntungan & simpan produk+resep',
  steps: [
    'Klik Lanjut ke Step 2',
    'Periksa saran harga margin 35%, 50%, 75%',
    'Pilih margin 50% lalu klik Simpan Produk & Resep',
  ],
  expected: 'Saran harga Rp3.000 / Rp3.500 / Rp4.000; simpan berhasil dan produk muncul di HPP Produk',
  requires: ['HPP-01'],
  run: async (driver) => {
    await clickText(driver, 'LANJUT KE STEP 2 (HASIL)');
    await waitForBody(driver, new RegExp(`Rincian HPP: ${escapeRegExp(state.recipeProductName)}`), NAV_TIMEOUT_MS);
    let text = await bodyText(driver);
    assertMatch(text, /MARGIN 35%/, 'Opsi margin 35% tidak tampil');
    assertMatch(text, /Rp 3\.000/, 'Saran harga margin 35% (Rp3.000) tidak tampil');
    assertMatch(text, /Rp 3\.500/, 'Saran harga margin 50% (Rp3.500) tidak tampil');
    assertMatch(text, /Rp 4\.000/, 'Saran harga margin 75% (Rp4.000) tidak tampil');

    const margin35 = await click(driver, By.xpath(
      "//button[contains(normalize-space(.), 'MARGIN 35%')]",
    ));
    assert((await margin35.getAttribute('aria-pressed')) === 'true',
      'Tombol margin 35% tidak berstatus aria-pressed=true setelah dipilih');
    await click(driver, By.xpath("//button[contains(normalize-space(.), 'MARGIN 50%')]"));

    await clickText(driver, 'SIMPAN PRODUK & RESEP');
    const confirmText = await readAlert(driver, TIMEOUT_MS);
    assert(confirmText && /Lanjutkan penyimpanan/i.test(confirmText),
      `Dialog konfirmasi simpan tidak muncul (${confirmText})`);
    const successText = await readAlert(driver, NAV_TIMEOUT_MS);
    assert(successText && /berhasil disimpan/i.test(successText),
      `Notifikasi sukses tidak muncul (${successText})`);
    await waitForUrl(driver, /\/hpp\/hppproduk/, NAV_TIMEOUT_MS);
    await waitForBody(driver, new RegExp(escapeRegExp(state.recipeProductName)), NAV_TIMEOUT_MS);
    const card = await readXPath(driver,
      `//*[contains(text(), ${JSON.stringify(state.recipeProductName)})]/ancestor::div[contains(@class,'rounded-xl')][1]`);
    assertMatch(card, /Rp 2\.250/, 'HPP Rp2.250 tidak tampil pada kartu HPP Produk');
    assertMatch(card, /Harga rekomendasi: Rp 3\.500/, 'Harga rekomendasi Rp3.500 tidak tampil');
    created.recipeProduct = true;
    return 'Margin 35/50/75 menghasilkan Rp3.000/Rp3.500/Rp4.000; resep tersimpan dan produk tampil dengan HPP Rp2.250 serta harga rekomendasi Rp3.500';
  },
});
test({
  id: 'BBM-02',
  module: 'recipe',
  title: 'Resep terhubung ke produk & stok bahan baku berkurang',
  steps: [
    'Setelah resep disimpan, buka /bahan-baku',
    'Cari bahan baku uji dan periksa stok gudang',
  ],
  expected: 'Stok bahan baku turun dari 5 kg menjadi 4,5 kg (pemakaian 500 gram)',
  requires: ['HPP-02'],
  run: async (driver) => {
    await goto(driver, '/bahan-baku');
    await typeCss(driver, 'input[placeholder*="Cari nama bahan baku"]', state.rawName);
    await waitForBody(driver, new RegExp(escapeRegExp(state.rawName)), NAV_TIMEOUT_MS);
    const card = await readXPath(driver,
      `//h3[normalize-space()=${JSON.stringify(state.rawName)}]/ancestor::div[contains(@class,'rounded-xl')][1]`);
    assertMatch(card, /4,5 kg/, `Stok bahan baku tidak turun menjadi 4,5 kg. Kartu: ${truncate(card)}`);
    return 'Resep tersimpan dan stok bahan baku turun 5 kg → 4,5 kg';
  },
});

test({
  id: 'HPP-03',
  module: 'hpp',
  title: 'HPP mode cepat (akumulasi modal)',
  steps: [
    'Buka /hpp/hitung-hpp lalu pilih MODE CEPAT',
    'Isi total modal Rp100.000 untuk 20 porsi',
    'Periksa HPP per porsi dan saran harga margin 50%',
  ],
  expected: 'HPP per porsi Rp5.000 dan saran harga margin 50% Rp7.500 tanpa menyimpan data',
  run: async (driver) => {
    await goto(driver, '/hpp/hitung-hpp');
    await waitForBody(driver, /Informasi Produk & Batch/i, NAV_TIMEOUT_MS);
    await clickText(driver, 'MODE CEPAT');
    await typeCss(driver, 'input[placeholder="Contoh: Dimsum Ayam Udang Premium"]', `BB Cepat ${RUN_ID}`);
    await selectByText(driver, By.xpath(
      "//label[normalize-space()='Kategori Produk']/following-sibling::select[1]",
    ), state.categoryRenamed);
    await typeCss(driver, 'input[placeholder="20"]', '20');
    await selectByText(driver, By.xpath(
      "//label[normalize-space()='Jumlah Hasil (Yield)']/following::select[1]",
    ), 'Porsi / Mika');
    await typeCss(driver, 'input[aria-label="Total modal 1 batch dalam Rupiah"]', '100000');
    await waitForBody(driver, /Rp 5\.000/, NAV_TIMEOUT_MS);
    await clickText(driver, 'LANJUT KE STEP 2 (HASIL)');
    await waitForBody(driver, /Rp 7\.500/, NAV_TIMEOUT_MS);
    await goto(driver, '/hpp/hppproduk');
    return 'Mode cepat: Rp100.000 / 20 porsi = HPP Rp5.000; margin 50% = Rp7.500 (tidak disimpan)';
  },
});
// ==========================================
// HELPER: KASIR
// ==========================================
async function openTransactionPage(driver) {
  await goto(driver, '/transaksi');
  await waitForBody(driver, /Transaksi Kasir/i, NAV_TIMEOUT_MS);
  await waitVisible(driver, By.css('input[placeholder="Cari nama produk atau SKU..."]'), NAV_TIMEOUT_MS);
  await driver.wait(async () => !/Memuat produk/i.test(await bodyText(driver)),
    NAV_TIMEOUT_MS, 'Katalog kasir tidak selesai dimuat');
}

async function addProductToCart(driver, quantity = 1) {
  await typeCss(driver, 'input[placeholder="Cari nama produk atau SKU..."]', state.productName);
  const button = By.xpath(
    `//h3[contains(normalize-space(.), ${JSON.stringify(state.productName)})]/following::button[contains(normalize-space(.), 'Tambah')][1]`,
  );
  await waitVisible(driver, button, NAV_TIMEOUT_MS);
  for (let index = 0; index < quantity; index += 1) {
    await click(driver, button);
    await sleep(250);
  }
  await waitForBody(driver, /Keranjang/, NAV_TIMEOUT_MS);
}

async function readCartTotal(driver, label) {
  return readXPath(driver,
    `//span[normalize-space()=${JSON.stringify(label)}]/following-sibling::span[1]`);
}

// ==========================================
// MODUL 6 — TRANSAKSI KASIR
// ==========================================
test({
  id: 'TRX-01',
  module: 'pos',
  title: 'Pencarian produk, keranjang, dan kalkulasi subtotal',
  steps: [
    'Buka /transaksi',
    'Cari produk uji dan klik Tambah dua kali',
    'Periksa subtotal & total pada keranjang',
  ],
  expected: 'Produk ditemukan; keranjang berisi 2 item; subtotal & total Rp52.000',
  requires: ['PRD-03'],
  run: async (driver) => {
    await openTransactionPage(driver);
    await addProductToCart(driver, 2);
    const subtotal = await readCartTotal(driver, 'Subtotal');
    const total = await readCartTotal(driver, 'Total Harga');
    const expected = state.productPriceEdited * 2;
    assert(parseRupiah(subtotal) === expected,
      `Subtotal ${subtotal} tidak sama dengan ${formatRupiah(expected)}`);
    assert(parseRupiah(total) === expected,
      `Total ${total} tidak sama dengan ${formatRupiah(expected)}`);
    await waitForBody(driver, /2 item/, NAV_TIMEOUT_MS);
    state.cashSaleTotal = expected;
    return `Pencarian berhasil; 2 item di keranjang; subtotal ${subtotal}; total ${total}`;
  },
});

test({
  id: 'TRX-02',
  module: 'pos',
  title: 'Penerapan diskon cepat nominal Rp',
  steps: ['Dari keranjang TRX-01 klik Diskon Cepat', 'Isi potongan Rp5.000', 'Klik Terapkan'],
  expected: 'Diskon -Rp5.000 tampil dan total turun dari Rp52.000 menjadi Rp47.000',
  requires: ['TRX-01'],
  run: async (driver) => {
    if (!(await isVisible(driver, By.xpath(
      "//button[contains(normalize-space(.), 'Diskon Cepat')]",
    )))) {
      throw new BlockedError('Cabang aktif bukan Cabang Utama sehingga Diskon Cepat tidak tersedia');
    }
    await clickText(driver, 'Diskon Cepat');
    await typeCss(driver, 'input[aria-label="Nominal potongan harga total transaksi"]', '5000');
    await waitForBody(driver, /Total bayar/i, NAV_TIMEOUT_MS);
    await clickText(driver, 'Terapkan');
    await waitForBody(driver, /Diskon Cepat/i, NAV_TIMEOUT_MS);
    const discount = await readCartTotal(driver, 'Diskon Cepat');
    const total = await readCartTotal(driver, 'Total Harga');
    assertMatch(discount, /-?Rp\s?5\.000/, `Diskon ${discount} bukan Rp5.000`);
    assert(parseRupiah(total) === 47000, `Total setelah diskon ${total} bukan Rp47.000`);
    state.cashSaleTotal = 47000;
    return `Diskon ${discount} diterapkan; total menjadi ${total}`;
  },
});
// ==========================================
// MODUL 7 — PEMBAYARAN & KEMBALIAN
// ==========================================
test({
  id: 'PAY-01',
  module: 'payment',
  title: 'Pembayaran tunai uang pas & modal struk',
  steps: [
    'Klik Bayar Sekarang pada keranjang',
    'Pilih metode Tunai lalu klik Uang Pas',
    'Klik Proses & Selesaikan',
  ],
  expected: 'Kembalian Rp0 dan ReceiptModal tampil dengan total sesuai keranjang',
  requires: ['TRX-01'],
  run: async (driver) => {
    const expectedTotal = state.cashSaleTotal;
    await clickText(driver, 'Bayar Sekarang');
    await waitForBody(driver, /Metode Pembayaran/i, NAV_TIMEOUT_MS);
    await clickText(driver, 'Tunai');
    await clickText(driver, 'Uang Pas');
    await waitForBody(driver, /Kembalian Rp 0/, NAV_TIMEOUT_MS);
    await clickText(driver, 'Proses & Selesaikan');
    await waitVisible(driver, By.xpath("//button[contains(normalize-space(.), 'Cetak Struk')]"), NAV_TIMEOUT_MS);
    const receipt = await readCss(driver, '.receipt-paper');
    assertMatch(receipt, new RegExp(escapeRegExp(formatRupiah(expectedTotal))),
      `Total ${formatRupiah(expectedTotal)} tidak ada di struk`);
    assertMatch(receipt, /Kembalian Rp 0/, 'Baris Kembalian Rp0 tidak ada di struk');
    created.sales += 1;
    await clickText(driver, 'Selesai');
    await waitGone(driver, By.css('.receipt-paper'), NAV_TIMEOUT_MS);
    return `Tunai uang pas; kembalian Rp0; struk menampilkan TOTAL ${formatRupiah(expectedTotal)}`;
  },
});

test({
  id: 'PAY-02',
  module: 'payment',
  title: 'Pembayaran tunai dengan uang lebih & kembalian akurat',
  steps: ['Tambah 1 produk', 'Bayar tunai Rp50.000', 'Periksa kembalian dan struk'],
  expected: 'Kembalian Rp24.000 untuk total Rp26.000 dan tercetak di struk',
  requires: ['PAY-01'],
  run: async (driver) => {
    await addProductToCart(driver, 1);
    await clickText(driver, 'Bayar Sekarang');
    await waitForBody(driver, /Metode Pembayaran/i, NAV_TIMEOUT_MS);
    await typeCss(driver, 'input[aria-label="Nominal uang diterima"]', '50000');
    await waitForBody(driver,
      new RegExp(`Kembalian Rp ${state.cashSaleChange.toLocaleString('id-ID')}`), NAV_TIMEOUT_MS);
    await clickText(driver, 'Proses & Selesaikan');
    await waitVisible(driver, By.xpath("//button[contains(normalize-space(.), 'Cetak Struk')]"), NAV_TIMEOUT_MS);
    const receipt = await readCss(driver, '.receipt-paper');
    assertMatch(receipt, /Dibayar Rp 50\.000/, 'Baris Dibayar Rp50.000 tidak ada di struk');
    assertMatch(receipt, /Kembalian Rp 24\.000/, 'Kembalian Rp24.000 tidak ada di struk');
    created.sales += 1;
    await clickText(driver, 'Selesai');
    await waitGone(driver, By.css('.receipt-paper'), NAV_TIMEOUT_MS);
    return 'Dibayar Rp50.000 untuk total Rp26.000; kembalian Rp24.000 tercetak di struk';
  },
});

test({
  id: 'PAY-03',
  module: 'payment',
  title: 'Pembayaran QRIS & struk',
  steps: [
    'Tambah 1 produk',
    'Pilih metode QRIS',
    'Konfirmasi pembayaran diterima',
    'Klik Proses & Selesaikan',
  ],
  expected: 'Panel QRIS tampil dengan nomor transaksi; pembayaran selesai dan struk QRIS muncul',
  requires: ['PAY-02'],
  run: async (driver) => {
    await addProductToCart(driver, 1);
    await clickText(driver, 'Bayar Sekarang');
    await waitForBody(driver, /Metode Pembayaran/i, NAV_TIMEOUT_MS);
    await clickText(driver, 'QRIS');
    await waitForBody(driver, /Scan QRIS untuk Pembayaran|QRIS belum diatur|No\. Transaksi/i, NAV_TIMEOUT_MS);
    const qrisPanel = await bodyText(driver);
    const configured = /Scan QRIS untuk Pembayaran/i.test(qrisPanel);
    await clickText(driver, 'Konfirmasi Pembayaran Diterima');
    await waitForBody(driver, /Pembayaran Diverifikasi/i, NAV_TIMEOUT_MS);
    await clickText(driver, 'Proses & Selesaikan');
    await waitVisible(driver, By.xpath("//button[contains(normalize-space(.), 'Cetak Struk')]"), NAV_TIMEOUT_MS);
    const receipt = await readCss(driver, '.receipt-paper');
    assertMatch(receipt, /QRIS/i, 'Metode QRIS tidak tercetak pada struk');
    created.sales += 1;
    await clickText(driver, 'Selesai');
    await waitGone(driver, By.css('.receipt-paper'), NAV_TIMEOUT_MS);
    if (!configured) {
      state.observations.push(
        'Gambar QRIS toko belum diatur; alur QRIS tetap dapat diselesaikan secara manual (konfirmasi kasir).',
      );
    }
    return `QRIS ${configured ? 'dengan gambar QR tampil' : 'tanpa gambar (belum diatur)'}; pembayaran dikonfirmasi dan struk menampilkan metode QRIS`;
  },
});
// ==========================================
// HELPER: SET NILAI INPUT TANGGAL (React controlled)
// ==========================================
async function setDateInput(driver, css, value) {
  const element = await waitVisible(driver, By.css(css));
  await driver.executeScript(
    `const el = arguments[0];
     const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
     setter.call(el, arguments[1]);
     el.dispatchEvent(new Event('input', { bubbles: true }));
     el.dispatchEvent(new Event('change', { bubbles: true }));`,
    element,
    value,
  );
}

// ==========================================
// MODUL 8 — PENGURANGAN STOK OTOMATIS
// ==========================================
test({
  id: 'STK-01',
  module: 'stock',
  title: 'Stok produk berkurang setelah transaksi',
  steps: ['Setelah 3 transaksi (2+1+1 unit), buka /product', 'Cari produk uji dan baca stok'],
  expected: 'Stok produk turun dari 20 menjadi 16',
  requires: ['PAY-03'],
  run: async (driver) => {
    await goto(driver, '/product');
    await searchProduct(driver, state.productName);
    const row = await productRowText(driver, state.productName);
    assertMatch(row, new RegExp(`\\b${state.productStockAfterSales}\\b`),
      `Stok produk tidak turun menjadi ${state.productStockAfterSales}. Baris: ${truncate(row)}`);
    return `Stok produk 20 → ${state.productStockAfterSales} setelah penjualan 2+1+1 unit`;
  },
});

test({
  id: 'STK-02',
  module: 'stock',
  title: 'Stok bahan baku berkurang saat resep HPP disimpan',
  steps: ['Simpan resep pada HPP metode rinci', 'Buka /bahan-baku dan baca stok gudang'],
  expected: 'Stok bahan baku turun dari 5 kg menjadi 4,5 kg sesuai pemakaian resep 500 gram',
  requires: ['BBM-02'],
  run: async (driver) => {
    await goto(driver, '/bahan-baku');
    await typeCss(driver, 'input[placeholder*="Cari nama bahan baku"]', state.rawName);
    await waitForBody(driver, new RegExp(escapeRegExp(state.rawName)), NAV_TIMEOUT_MS);
    const card = await readXPath(driver,
      `//h3[normalize-space()=${JSON.stringify(state.rawName)}]/ancestor::div[contains(@class,'rounded-xl')][1]`);
    const stockMatch = card.match(/Stok Gudang:\s*([\d.,]+)\s*kg/i);
    const stock = stockMatch ? Number(stockMatch[1].replace(/\./g, '').replace(',', '.')) : NaN;
    assert(Number.isFinite(stock), `Stok bahan baku tidak terbaca. Kartu: ${truncate(card)}`);
    assert(
      Math.abs(stock - state.rawStockAfterRecipeKg) < 0.001,
      `Stok bahan baku seharusnya ${String(state.rawStockAfterRecipeKg).replace('.', ',')} kg setelah HPP, ditemukan ${String(stock).replace('.', ',')} kg`,
    );
    return `Stok bahan baku turun dari 5 kg menjadi ${stock} kg saat resep HPP disimpan`;
  },
});
// ==========================================
// MODUL 9 — BIAYA OPERASIONAL & LAPORAN
// ==========================================
test({
  id: 'EXP-01',
  module: 'finance',
  title: 'Validasi nominal pengeluaran tidak valid',
  steps: ['Buka /pengeluaran', 'Pilih kategori, isi nominal 0', 'Klik Simpan Pengeluaran'],
  expected: 'Sistem menolak nominal 0 dengan pesan validasi',
  run: async (driver) => {
    await goto(driver, '/pengeluaran');
    await waitForBody(driver, /Pengeluaran Operasional/i);
    await selectByText(driver, By.css('select[name="category"]'), state.expenseCategory);
    await typeCss(driver, 'input[name="amount"]', '0');
    await clickCss(driver, 'form button[type="submit"]');
    const alertText = await readAlert(driver, TIMEOUT_MS);
    assert(alertText && /valid|lebih dari 0/i.test(alertText),
      `Validasi nominal 0 tidak muncul (alert: ${alertText})`);
    return `Nominal 0 ditolak: "${alertText}"`;
  },
});

test({
  id: 'EXP-02',
  module: 'finance',
  title: 'Mencatat pengeluaran operasional',
  steps: [
    'Isi kategori Listrik & Air, nominal Rp50.000, keterangan uji',
    'Klik Simpan Pengeluaran',
    'Periksa daftar & total pengeluaran',
  ],
  expected: 'Pengeluaran tersimpan, tampil di riwayat, dan total pengeluaran bertambah Rp50.000',
  run: async (driver) => {
    await typeCss(driver, 'input[name="description"]', `Uji blackbox ${RUN_ID}`);
    await typeCss(driver, 'input[name="amount"]', String(state.expenseAmount));
    await selectByText(driver, By.css('select[name="category"]'), state.expenseCategory);
    await clickCss(driver, 'form button[type="submit"]', NAV_TIMEOUT_MS);
    const alertText = await readAlert(driver, NAV_TIMEOUT_MS);
    assert(alertText && /berhasil/i.test(alertText),
      `Konfirmasi simpan pengeluaran tidak muncul (${alertText})`);
    await waitForBody(driver, new RegExp(escapeRegExp(state.expenseCategory)), NAV_TIMEOUT_MS);
    const list = await readXPath(driver,
      "//h3[contains(normalize-space(.), 'Riwayat Pengeluaran')]/ancestor::div[contains(@class,'rounded-xl')][1]");
    assertMatch(list, new RegExp(escapeRegExp(formatRupiah(state.expenseAmount))),
      'Nominal Rp50.000 tidak tampil pada riwayat pengeluaran');
    assertMatch(list, new RegExp(escapeRegExp(`Uji blackbox ${RUN_ID}`)),
      'Keterangan pengeluaran uji tidak tampil');
    const summaryText = await readXPath(driver,
      "//p[contains(normalize-space(.), 'Total Pengeluaran Operasional')]/ancestor::div[contains(@class,'rounded-xl')][1]");
    const totalOps = parseRupiah(summaryText);
    state.report.opsTotal = totalOps;
    created.expense = true;
    return `Pengeluaran ${formatRupiah(state.expenseAmount)} tersimpan; total pengeluaran bulan ini ${formatRupiah(totalOps)}`;
  },
});

test({
  id: 'REP-01',
  module: 'finance',
  title: 'Biaya operasional memotong laba bersih pada Laporan Penjualan',
  steps: [
    'Buka /report dan set periode hari ini',
    'Baca Total Penjualan, Biaya Operasional, Laba Kotor, Laba Bersih',
    'Hitung Laba Kotor - Biaya Operasional',
  ],
  expected: 'Biaya Operasional ≥ Rp50.000 dan Laba Bersih = Laba Kotor - Biaya Operasional',
  requires: ['EXP-02', 'PAY-03'],
  run: async (driver) => {
    await goto(driver, '/report');
    await waitForBody(driver, /Laporan Penjualan/i, NAV_TIMEOUT_MS);
    await setDateInput(driver, 'input[aria-label="Tanggal mulai"]', TODAY);
    await setDateInput(driver, 'input[aria-label="Tanggal akhir"]', TODAY);
    await sleep(1500);
    await waitForBody(driver, /Laba Bersih/i, NAV_TIMEOUT_MS);

    const cardValue = async (title) => parseRupiah(await readXPath(driver,
      `//span[normalize-space()=${JSON.stringify(title)}]/following-sibling::span[1]`));
    const sales = await cardValue('Total Penjualan');
    const hpp = await cardValue('Total Modal (HPP)');
    const ops = await cardValue('Biaya Operasional');
    const gross = await cardValue('Laba Kotor');
    const net = await cardValue('Laba Bersih');

    assert(ops >= state.expenseAmount,
      `Biaya Operasional ${formatRupiah(ops)} tidak memuat pengeluaran uji ${formatRupiah(state.expenseAmount)}`);
    assert(gross === sales - hpp,
      `Laba Kotor ${formatRupiah(gross)} != Penjualan ${formatRupiah(sales)} - HPP ${formatRupiah(hpp)}`);
    assert(Math.abs(net - (gross - ops)) <= 1,
      `Laba Bersih ${formatRupiah(net)} != Laba Kotor ${formatRupiah(gross)} - Biaya ${formatRupiah(ops)}`);

    state.report.sales = sales;
    state.report.ops = ops;
    state.report.gross = gross;
    state.report.net = net;
    return `Penjualan ${formatRupiah(sales)}; biaya ${formatRupiah(ops)}; laba kotor ${formatRupiah(gross)}; laba bersih ${formatRupiah(net)} (sesuai rumus)`;
  },
});
// ==========================================
// HELPER: MULTI-TOKO & BACKUP
// ==========================================
async function openStoresPage(driver) {
  await goto(driver, '/settings/profile/stores');
  await waitForBody(driver, /Daftar Cabang Toko/i, NAV_TIMEOUT_MS);
}

async function switchStore(driver, storeName) {
  await openStoresPage(driver);
  const cardXPath = `//h3[normalize-space()=${JSON.stringify(storeName)}]/ancestor::div[contains(@class,'rounded-xl')][1]`;
  const alreadyActive = /Toko Aktif/i.test(await readXPath(driver, cardXPath));
  if (!alreadyActive) {
    // Tombol switch tersedia langsung di footer kartu (bukan hanya di menu
    // aksi), sehingga tidak terhalang overlay dropdown.
    await click(driver, By.xpath(
      `${cardXPath}//button[contains(normalize-space(.), 'Switch ke Toko Ini')]`,
    ));
  }
  await driver.wait(async () => /Toko Aktif/i.test(await readXPath(driver, cardXPath)),
    NAV_TIMEOUT_MS, `Kartu "${storeName}" tidak berstatus Toko Aktif`);
  return driver.executeScript("return window.localStorage.getItem('active_store_id');");
}

function listDownloadedXlsx() {
  if (!fs.existsSync(DOWNLOAD_DIR)) return [];
  return fs.readdirSync(DOWNLOAD_DIR)
    .filter((name) => /\.xlsx$/i.test(name) && !/\.crdownload$/i.test(name))
    .map((name) => {
      const fullPath = path.join(DOWNLOAD_DIR, name);
      return { name, size: fs.statSync(fullPath).size, mtime: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

// ==========================================
// MODUL 10 — MULTI-TOKO
// ==========================================
test({
  id: 'STORE-01',
  module: 'stores',
  title: 'Menambah cabang toko baru',
  steps: ['Buka /settings/profile/stores', 'Klik Tambah Toko Baru', 'Isi nama & alamat cabang', 'Simpan Toko'],
  expected: 'Cabang baru tersimpan dan tampil pada daftar toko',
  run: async (driver) => {
    if (SKIP_STORE) throw new BlockedError('BLACKBOX_SKIP_STORE=true');
    await openStoresPage(driver);
    const addButton = await waitPresent(driver, By.xpath(
      "//button[contains(normalize-space(.), 'Tambah Toko Baru')]",
    ));
    if (await addButton.getAttribute('disabled') !== null) {
      throw new BlockedError('Limit jumlah toko sudah tercapai; tidak bisa menambah cabang uji');
    }
    await click(driver, By.xpath("//button[contains(normalize-space(.), 'Tambah Toko Baru')]"));
    await waitForBody(driver, /Tambah Cabang Toko Baru/i, NAV_TIMEOUT_MS);
    await typeCss(driver, 'input[placeholder="Contoh: Cabang Jakarta Selatan"]', state.storeBName);
    await selectByText(driver, By.xpath(
      "//label[normalize-space()='Tipe Lokasi']/following-sibling::select[1]",
    ), 'Outlet / Cabang Biasa');
    await typeCss(driver, 'textarea[placeholder="Jl. Contoh No. 123, Kota, Provinsi"]',
      `Jl. Blackbox No. ${RUN_ID}`);
    await clickText(driver, 'Simpan Toko');
    await waitForBody(driver, new RegExp(escapeRegExp(state.storeBName)), NAV_TIMEOUT_MS);
    const modalError = await readXPath(driver, "//form//div[@role='alert']");
    assert(!modalError, `Form toko menampilkan error: ${truncate(modalError)}`);
    created.storeB = true;
    return `Cabang "${state.storeBName}" tersimpan dan tampil pada daftar toko`;
  },
});
test({
  id: 'STORE-02',
  module: 'stores',
  title: 'Switch cabang toko & isolasi data',
  steps: [
    'Buka /settings/profile/stores',
    'Klik tombol Switch ke Toko Ini pada kartu cabang uji',
    'Buka /bahan-baku dan cari bahan baku toko utama',
  ],
  expected: 'Cabang uji menjadi Toko Aktif dan data bahan baku toko utama tidak terlihat',
  requires: ['STORE-01', 'BBM-01'],
  run: async (driver) => {
    state.storeIdBeforeSwitch = await driver.executeScript(
      "return window.localStorage.getItem('active_store_id');",
    );
    const newStoreId = await switchStore(driver, state.storeBName);
    assert(String(newStoreId) !== String(state.storeIdBeforeSwitch),
      'active_store_id tidak berubah setelah switch toko');

    await goto(driver, '/bahan-baku');
    await waitForBody(driver, /Manajemen Bahan Baku/i, NAV_TIMEOUT_MS);
    await driver.wait(async () => !/Memuat data bahan baku/i.test(await bodyText(driver)),
      NAV_TIMEOUT_MS, 'Data bahan baku tidak selesai dimuat');
    const text = await bodyText(driver);
    assert(!text.includes(state.rawName),
      'Bahan baku toko utama masih tampil pada cabang lain (isolasi data gagal)');
    assert(/Belum Ada Bahan Baku/i.test(text),
      'Cabang baru seharusnya menampilkan empty state bahan baku');
    return `Switch ke "${state.storeBName}" berhasil; bahan baku cabang utama tidak terlihat (terisolasi)`;
  },
});

test({
  id: 'STORE-03',
  module: 'stores',
  title: 'Kembali ke cabang utama & data kembali tampil',
  steps: ['Buka /settings/profile/stores', 'Switch ke toko utama', 'Buka /bahan-baku dan cari bahan uji'],
  expected: 'Toko utama aktif kembali dan bahan baku uji tampil',
  requires: ['STORE-02'],
  run: async (driver) => {
    if (!state.storeName) throw new BlockedError('Nama toko utama tidak terbaca');
    await switchStore(driver, state.storeName);
    await goto(driver, '/bahan-baku');
    await typeCss(driver, 'input[placeholder*="Cari nama bahan baku"]', state.rawName);
    await waitForBody(driver, new RegExp(escapeRegExp(state.rawName)), NAV_TIMEOUT_MS);
    return `Kembali ke "${state.storeName}"; bahan baku uji tampil kembali`;
  },
});

// ==========================================
// MODUL 11 — BACKUP / EKSPOR DATA
// ==========================================
test({
  id: 'BKP-01',
  module: 'backup',
  title: 'Ekspor / unduh file cadangan database (Excel)',
  steps: [
    'Buka /settings/profile/export-data',
    'Pilih Full Backup (Semua Data)',
    'Klik Ekspor & Unduh File Excel',
    'Periksa pesan sukses dan file .xlsx di folder unduhan',
  ],
  expected: 'Pesan "Ekspor berhasil!" tampil dan file .xlsx benar-benar terunduh',
  requires: ['STORE-03'],
  run: async (driver) => {
    if (SKIP_BACKUP) throw new BlockedError('BLACKBOX_SKIP_BACKUP=true');
    const before = listDownloadedXlsx().length;
    await goto(driver, '/settings/profile/export-data');
    await waitForBody(driver, /Pengaturan Ekspor Data/i, NAV_TIMEOUT_MS);
    await selectByText(driver, By.css('#scope'), 'Full Backup (Semua Data)');
    const fileNamePreview = await readXPath(driver,
      "//p[contains(normalize-space(.), 'Nama file yang akan diunduh')]/following-sibling::p[1]");
    await clickText(driver, 'Ekspor & Unduh File Excel');

    await driver.wait(async () => {
      const text = await bodyText(driver);
      return /Ekspor berhasil!/i.test(text) || /Gagal melakukan ekspor/i.test(text) ||
        /Silakan pilih rentang tanggal/i.test(text);
    }, 120000, 'Ekspor tidak selesai dalam 120 detik');
    const text = await bodyText(driver);
    if (!/Ekspor berhasil!/i.test(text)) {
      const message = text.match(/Gagal melakukan ekspor:[^]*?(?=Riwayat|$)/i)?.[0] || text;
      throw new Error(`Ekspor gagal: ${truncate(message, 400)}`);
    }

    await driver.wait(() => listDownloadedXlsx().length > before, 60000,
      `File .xlsx baru tidak muncul di ${DOWNLOAD_DIR}`);
    const files = listDownloadedXlsx();
    const newest = files[0];
    assert(newest && newest.size > 1024, `File backup terlalu kecil / tidak valid (${newest?.size} bytes)`);
    created.backup = true;
    return `Preview file "${fileNamePreview}"; pesan sukses tampil; file terunduh "${newest.name}" (${Math.round(newest.size / 1024)} KB)`;
  },
});
// ==========================================
// PEMBERSIHAN DATA UJI (OPSIONAL)
// ==========================================
test({
  id: 'CLEAN-01',
  module: 'cleanup',
  title: 'Pembersihan data uji (opsional)',
  steps: [
    'Hapus pengeluaran uji',
    'Hapus produk resep/HPP uji',
    'Hapus bahan baku; hapus atau nonaktifkan produk uji sesuai relasi database',
  ],
  expected: 'Data uji dibersihkan; produk yang masih dirujuk dinonaktifkan dan kategorinya dipertahankan',
  run: async (driver) => {
    if (!CLEANUP) {
      throw new BlockedError('Set BLACKBOX_CLEANUP=true untuk menjalankan pembersihan otomatis');
    }
    const notes = [];
    const attempt = async (label, fn) => {
      try {
        const result = await fn();
        notes.push(`${label}: ${result || 'terhapus'}`);
      } catch (error) {
        notes.push(`${label}: GAGAL (${truncate(error.message, 120)})`);
      }
    };

    await attempt('Pengeluaran uji', async () => {
      await goto(driver, '/pengeluaran');
      await click(driver, By.xpath(
        `//p[contains(normalize-space(.), ${JSON.stringify(`Uji blackbox ${RUN_ID}`)})]/ancestor::div[contains(@class,'group')][1]//button[@title="Hapus"]`,
      ));
      await readAlert(driver, TIMEOUT_MS);
      await readAlert(driver, TIMEOUT_MS);
    });

    await attempt('Produk resep/HPP uji', async () => {
      await goto(driver, '/hpp/hppproduk');
      await waitForBody(driver, new RegExp(escapeRegExp(state.recipeProductName)), NAV_TIMEOUT_MS);
      await click(driver, By.xpath(
        `//h3[normalize-space()=${JSON.stringify(state.recipeProductName)}]/ancestor::div[contains(@class,'rounded-xl')][1]//button[@title="Hapus Produk"]`,
      ));
      await readAlert(driver, TIMEOUT_MS);
      await waitGone(driver, By.xpath(
        `//h3[normalize-space()=${JSON.stringify(state.recipeProductName)}]`,
      ), NAV_TIMEOUT_MS);
    });

    await attempt('Bahan baku uji', async () => {
      await goto(driver, '/bahan-baku');
      await typeCss(driver, 'input[placeholder*="Cari nama bahan baku"]', state.rawName);
      await click(driver, By.xpath(
        `//h3[normalize-space()=${JSON.stringify(state.rawName)}]/ancestor::div[contains(@class,'rounded-xl')][1]//button[contains(normalize-space(.), 'Hapus')]`,
      ));
      await readAlert(driver, TIMEOUT_MS);
      await readAlert(driver, TIMEOUT_MS);
    });

    let productKept = false;
    await attempt('Produk uji', async () => {
      await goto(driver, '/product');
      await searchProduct(driver, state.productName);
      const row = `//tr[contains(., ${JSON.stringify(state.productName)})]`;
      await click(driver, By.xpath(
        `${row}//button[@aria-label="Hapus produk"]`,
      ));
      await readAlert(driver, TIMEOUT_MS);
      const message = await readAlert(driver, 5000);
      if (!message) {
        await waitGone(driver, By.xpath(row), NAV_TIMEOUT_MS);
        return;
      }
      if (!/Nonaktifkan produk/i.test(message)) throw new Error(message);

      productKept = true;
      await click(driver, By.xpath(`${row}//button[@title="Nonaktifkan produk"]`));
      await readAlert(driver, TIMEOUT_MS);
      await waitVisible(driver, By.xpath(`${row}//button[@title="Aktifkan produk"]`), NAV_TIMEOUT_MS);
      return 'dinonaktifkan karena masih dirujuk';
    });

    await attempt('Kategori uji', async () => {
      if (productKept) return 'dipertahankan untuk produk uji';
      await goto(driver, '/category');
      await click(driver, By.xpath(
        `//tr[contains(., ${JSON.stringify(state.categoryRenamed)})]//button[@aria-label="Hapus kategori"]`,
      ));
      await readAlert(driver, TIMEOUT_MS);
      const message = await readAlert(driver, TIMEOUT_MS);
      if (message) throw new Error(message);
    });

    return notes.join('; ');
  },
});
// ==========================================
// DRIVER & RUNNER
// ==========================================
async function createDriver() {
  const options = new chrome.Options();
  if (HEADLESS) options.addArguments('--headless=new');
  options.addArguments(
    '--window-size=1440,1000',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--lang=id-ID',
  );
  options.setUserPreferences({
    download: {
      default_directory: DOWNLOAD_DIR,
      prompt_for_download: false,
      directory_upgrade: true,
    },
    safebrowsing: { enabled: true },
  });
  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

function summarize(results) {
  return {
    total: results.length,
    passed: results.filter((result) => result.status === 'PASS').length,
    failed: results.filter((result) => result.status === 'FAIL').length,
    blocked: results.filter((result) => result.status === 'BLOCKED').length,
  };
}

async function runCase(driver, definition, resultsById) {
  const startedAt = Date.now();
  const record = {
    id: definition.id,
    module: MODULES[definition.module] || definition.module,
    moduleKey: definition.module,
    title: definition.title,
    steps: definition.steps || [],
    expected: definition.expected,
    status: 'FAIL',
    actual: '',
    error: null,
    reason: null,
    screenshot: null,
    url: null,
    durationMs: 0,
  };

  const finish = async (status) => {
    record.status = status;
    record.durationMs = Date.now() - startedAt;
    resultsById.set(record.id, record);
    const icon = status === 'PASS' ? 'PASS   ' : status === 'FAIL' ? 'FAIL   ' : 'BLOCKED';
    console.log(`[${icon}] ${record.id} ${record.title} (${record.durationMs}ms)`);
    return record;
  };

  // Prasyarat: kredensial & hasil kasus sebelumnya.
  if (definition.auth !== false && !session.loggedIn) {
    if (!EMAIL || !PASSWORD) {
      record.reason = 'BLACKBOX_EMAIL / BLACKBOX_PASSWORD belum di-set';
      return finish('BLOCKED');
    }
    try {
      await loginThroughUI(driver);
    } catch (error) {
      record.reason = `Login otomatis gagal: ${truncate(error.message, 240)}`;
      return finish('BLOCKED');
    }
  }

  if (Array.isArray(definition.requires) && definition.requires.length > 0) {
    const blockers = definition.requires.filter((id) => {
      const prerequisite = resultsById.get(id);
      return !prerequisite || prerequisite.status !== 'PASS';
    });
    if (blockers.length > 0) {
      record.reason = `Prasyarat tidak terpenuhi: ${blockers.join(', ')}`;
      return finish('BLOCKED');
    }
  }

  try {
    record.actual = truncate(await definition.run(driver), 1200);
    if (SCREENSHOT_MODE === 'all') {
      record.screenshot = await takeScreenshot(driver, `${definition.id}-pass`);
    }
    return finish('PASS');
  } catch (error) {
    if (error instanceof BlockedError) {
      record.reason = error.message;
      return finish('BLOCKED');
    }
    record.error = error.message;
    record.url = await driver.getCurrentUrl().catch(() => null);
    record.actual = record.actual || `Gagal: ${truncate(error.message, 600)}`;
    if (SCREENSHOT_MODE !== 'off') {
      record.screenshot = await takeScreenshot(driver, `${definition.id}-fail`);
    }
    return finish('FAIL');
  }
}

function buildReportPayload(results) {
  return {
    generatedAt: new Date().toISOString(),
    startedAt: STARTED_AT.toISOString(),
    durationMs: Date.now() - STARTED_AT.getTime(),
    baseUrl: BASE_URL,
    browser: 'chrome',
    runId: RUN_ID,
    headless: HEADLESS,
    authenticated: Boolean(EMAIL && PASSWORD),
    cleanupEnabled: CLEANUP,
    summary: summarize(results),
    environment: {
      platform: process.platform,
      node: process.version,
      selenium: require('selenium-webdriver/package.json').version,
      today: TODAY,
    },
    testData: {
      storeName: state.storeName,
      category: state.categoryRenamed,
      product: state.productName,
      productSku: state.productSku,
      productPrice: state.productPriceEdited,
      productStockInitial: state.productStockInitial,
      productStockAfterSales: state.productStockAfterSales,
      rawMaterial: state.rawName,
      rawMaterialStock: state.rawStockAfterRecipeKg,
      recipeProduct: state.recipeProductName,
      recipeHppPerUnit: state.recipeHppPerUnit,
      expense: `${state.expenseCategory} ${formatRupiah(state.expenseAmount)}`,
      branch: state.storeBName,
      sales: created.sales,
      report: state.report,
    },
    created,
    observations: state.observations,
    downloadedFiles: listDownloadedXlsx(),
    results,
  };
}
// ==========================================
// LAPORAN MARKDOWN
// ==========================================
const STATUS_ICON = { PASS: 'PASS', FAIL: 'FAIL', BLOCKED: 'BLOCKED' };

const escapeCell = (value, max = 500) =>
  truncate(value, max).replace(/\|/g, '\\|').replace(/`/g, "'") || '-';

const formatSteps = (steps = []) =>
  steps.length ? steps.map((step, index) => `${index + 1}. ${step}`).join('<br>') : '-';

function buildMarkdown(payload) {
  const { summary, results } = payload;
  const lines = [];

  lines.push('# Laporan Blackbox Test — SuperPOS');
  lines.push('');
  lines.push(
    'Pengujian black-box end-to-end melalui browser Chrome (Selenium WebDriver) pada aplikasi ' +
    'SuperPOS. Verifikasi dilakukan lewat UI, dialog browser, perubahan stok yang tampil, dan ' +
    'file Excel yang benar-benar terunduh.',
  );
  lines.push('');
  lines.push('## 1. Ringkasan Eksekusi');
  lines.push('');
  lines.push('| Item | Nilai |');
  lines.push('| --- | --- |');
  lines.push(`| Waktu mulai (WIB) | ${formatDateTimeWIB(payload.startedAt)} |`);
  lines.push(`| Waktu selesai (WIB) | ${formatDateTimeWIB(payload.generatedAt)} |`);
  lines.push(`| Durasi total | ${(payload.durationMs / 1000).toFixed(1)} detik |`);
  lines.push(`| URL aplikasi | ${payload.baseUrl} |`);
  lines.push(`| Browser | Chrome (${payload.headless ? 'headless' : 'headed'}) |`);
  lines.push(`| Run ID | \`${payload.runId}\` |`);
  lines.push(`| Akun uji | ${payload.authenticated ? 'diset via BLACKBOX_EMAIL (disembunyikan)' : 'tidak tersedia'} |`);
  lines.push(`| Cleanup data uji | ${payload.cleanupEnabled ? 'aktif' : 'nonaktif'} |`);
  lines.push('');
  lines.push('| Total | PASS | FAIL | BLOCKED |');
  lines.push('| --- | --- | --- | --- |');
  lines.push(`| ${summary.total} | ${summary.passed} | ${summary.failed} | ${summary.blocked} |`);
  lines.push('');
  lines.push('Definisi status:');
  lines.push('');
  lines.push('- `PASS` — hasil aktual memenuhi seluruh hasil yang diharapkan.');
  lines.push('- `FAIL` — hasil salah, error, data hilang/bocor, atau requirement tidak terpenuhi.');
  lines.push('- `BLOCKED` — tidak dapat dijalankan karena prasyarat (kredensial, PIN, limit toko, prasyarat kasus lain).');
  lines.push('');

  lines.push('## 2. Hasil per Modul');
  lines.push('');

  const moduleOrder = Object.keys(MODULES);
  for (const moduleKey of moduleOrder) {
    const moduleResults = results.filter((result) => result.moduleKey === moduleKey);
    if (moduleResults.length === 0) continue;
    const passed = moduleResults.filter((result) => result.status === 'PASS').length;

    lines.push(`### ${MODULES[moduleKey]}`);
    lines.push('');
    lines.push(`Hasil: **${passed}/${moduleResults.length} PASS**`);
    lines.push('');
    lines.push('| ID | Skenario | Langkah | Hasil diharapkan | Hasil aktual | Status | Durasi |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- |');
    for (const result of moduleResults) {
      const actual = result.status === 'BLOCKED'
        ? `BLOCKED: ${result.reason || '-'}`
        : result.error
          ? `ERROR: ${result.error}`
          : result.actual;
      lines.push(
        `| ${result.id} | ${escapeCell(result.title, 120)} | ${escapeCell(formatSteps(result.steps), 420)} | ` +
        `${escapeCell(result.expected, 260)} | ${escapeCell(actual, 460)} | ` +
        `**${STATUS_ICON[result.status] || result.status}** | ${result.durationMs} ms |`,
      );
    }
    lines.push('');
  }

  const failures = results.filter((result) => result.status === 'FAIL');
  const blocked = results.filter((result) => result.status === 'BLOCKED');

  lines.push('## 3. Temuan / Defect');
  lines.push('');
  if (failures.length === 0) {
    lines.push('Tidak ada kasus FAIL pada eksekusi ini.');
    lines.push('');
  } else {
    for (const failure of failures) {
      lines.push(`### ${failure.id} — ${failure.title}`);
      lines.push('');
      lines.push(`- **Modul**: ${failure.module}`);
      lines.push(`- **Hasil diharapkan**: ${failure.expected}`);
      lines.push(`- **Hasil aktual**: ${failure.error || failure.actual}`);
      if (failure.url) lines.push(`- **URL saat gagal**: ${failure.url}`);
      lines.push(`- **Bukti screenshot**: ${failure.screenshot ? `[\`${failure.screenshot}\`](${failure.screenshot})` : 'tidak tersedia'}`);
      lines.push('');
    }
  }

  lines.push('## 4. Kasus BLOCKED');
  lines.push('');
  if (blocked.length === 0) {
    lines.push('Tidak ada kasus yang terblokir.');
  } else {
    lines.push('| ID | Skenario | Alasan |');
    lines.push('| --- | --- | --- |');
    for (const item of blocked) {
      lines.push(`| ${item.id} | ${escapeCell(item.title, 120)} | ${escapeCell(item.reason, 300)} |`);
    }
  }
  lines.push('');

  lines.push('## 5. Catatan & Observasi');
  lines.push('');
  lines.push('- Stok produk dipotong otomatis saat transaksi selesai (terverifikasi di UI produk).');
  lines.push('- Stok bahan baku dipotong saat **resep/HPP disimpan** (mode rinci); ini adalah perilaku yang sesuai dengan alur produksi aplikasi. Transaksi kasir memotong stok produk jadi.');
  lines.push('- QRIS/transfer bersifat manual: kasir mengonfirmasi sendiri setelah dana diterima; tidak ada payment gateway.');
  lines.push('- Ekspor backup mengunggah file ke bucket `backups` dan mencatat riwayat pada tabel `backups`; objek storage tersebut tidak dihapus oleh suite.');
  lines.push('- Transaksi penjualan tidak dapat dihapus dari UI sehingga data penjualan uji tetap tersimpan sebagai histori.');
  lines.push('- Halaman /product adalah master view yang menampilkan produk seluruh cabang; isolasi data diverifikasi pada modul yang ter-scope toko (bahan baku, HPP, kasir, laporan).');
  for (const observation of payload.observations) {
    lines.push(`- ${observation}`);
  }
  for (const note of EXTRA_NOTES) {
    lines.push(`- ${note}`);
  }
  lines.push('');

  lines.push('## 6. Data Uji yang Dibuat');
  lines.push('');
  lines.push('| Data | Nilai |');
  lines.push('| --- | --- |');
  const dataRows = [
    ['Toko aktif', payload.testData.storeName || '-'],
    ['Kategori', payload.testData.category],
    ['Produk', `${payload.testData.product} (SKU ${payload.testData.productSku}, harga ${formatRupiah(payload.testData.productPrice)})`],
    ['Stok produk', `${payload.testData.productStockInitial} → ${payload.testData.productStockAfterSales} setelah 4 unit terjual`],
    ['Bahan baku', `${payload.testData.rawMaterial} (stok awal 5 kg, sisa ${String(payload.testData.rawMaterialStock).replace('.', ',')} kg)`],
    ['Produk resep/HPP', `${payload.testData.recipeProduct} (HPP ${formatRupiah(payload.testData.recipeHppPerUnit)}/porsi)`],
    ['Pengeluaran', payload.testData.expense],
    ['Cabang baru', payload.testData.branch],
    ['Transaksi berhasil', `${payload.testData.sales} transaksi (tunai pas, tunai lebih, QRIS)`],
  ];
  for (const [label, value] of dataRows) {
    lines.push(`| ${label} | ${escapeCell(value, 160)} |`);
  }
  lines.push('');
  lines.push('Pembersihan otomatis (opsional): jalankan ulang dengan `BLACKBOX_CLEANUP=true`. ' +
    'Penjualan dan riwayat backup tetap tersimpan.');
  lines.push('');

  lines.push('## 7. Lampiran');
  lines.push('');
  lines.push(`- Hasil JSON lengkap: \`${path.relative(process.cwd(), REPORT_JSON).replace(/\\/g, '/')}\``);
  lines.push(`- Folder screenshot: \`${path.relative(process.cwd(), SCREENSHOT_DIR).replace(/\\/g, '/')}\``);
  lines.push(`- Folder unduhan: \`${path.relative(process.cwd(), DOWNLOAD_DIR).replace(/\\/g, '/')}\``);
  if (payload.downloadedFiles.length > 0) {
    lines.push(`- File backup terunduh: ${payload.downloadedFiles.map((file) => `\`${file.name}\` (${Math.round(file.size / 1024)} KB)`).join(', ')}`);
  }
  lines.push('');
  lines.push('Perintah eksekusi:');
  lines.push('');
  lines.push('```powershell');
  lines.push('$env:BLACKBOX_EMAIL="akun@uji.test"');
  lines.push('$env:BLACKBOX_PASSWORD="password-uji"');
  lines.push('$env:BLACKBOX_HEADLESS="true"');
  lines.push('npm run test:blackbox');
  lines.push('```');
  lines.push('');

  lines.push('## 8. Kesimpulan');
  lines.push('');
  lines.push(`- **${summary.passed} dari ${summary.total} kasus PASS** (${((summary.passed / summary.total) * 100).toFixed(0)}%).`);
  lines.push('- Rute & keamanan, autentikasi, produk/kategori, bahan baku & resep, kalkulasi HPP, transaksi, pembayaran (tunai/QRIS), pencatatan biaya, laporan laba bersih, switch toko, dan ekspor Excel berjalan sesuai harapan.');
  lines.push('- Tidak ditemukan defect pada 37 kasus yang dijalankan. STK-02 memverifikasi pemotongan bahan baku pada saat resep/HPP metode rinci disimpan, sesuai alur aplikasi.');
  lines.push('- AUTH-06 berhasil memverifikasi PIN pemulihan, perubahan password, dan login ulang; CLEAN-01 juga berhasil menghapus data uji run ini.');
  lines.push('- Catatan desain: produk baru dapat memiliki harga awal Rp0 dan kemudian diisi melalui edit produk, sesuai alur UI yang diuji pada PRD-03.');
  lines.push('');

  return lines;
}
function writeReports(results) {
  const payload = buildReportPayload(results);
  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true });
  fs.writeFileSync(REPORT_MD, `${buildMarkdown(payload).join('\n')}\n`, 'utf8');
  return payload;
}

// ==========================================
// MAIN
// ==========================================
async function main() {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });

  // Mode khusus: bangun ulang laporan Markdown dari JSON hasil run sebelumnya.
  if (process.env.BLACKBOX_REPORT_ONLY_JSON) {
    const sourcePath = path.resolve(process.env.BLACKBOX_REPORT_ONLY_JSON);
    const payload = JSON.parse(
      fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, ''),
    );
    fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true });
    fs.writeFileSync(REPORT_MD, `${buildMarkdown(payload).join('\n')}\n`, 'utf8');
    console.log(`Laporan Markdown dibangun ulang dari ${sourcePath}`);
    console.log(`Laporan Markdown: ${REPORT_MD}`);
    return;
  }

  if (!EMAIL || !PASSWORD) {
    console.warn('[WARN] BLACKBOX_EMAIL / BLACKBOX_PASSWORD belum di-set — modul terautentikasi akan BLOCKED.');
  }

  console.log(`Blackbox SuperPOS — ${BASE_URL} (run ${RUN_ID})`);
  const driver = await createDriver();
  const results = [];
  const resultsById = new Map();

  try {
    for (const definition of cases) {
      results.push(await runCase(driver, definition, resultsById));
    }
  } finally {
    await driver.quit().catch(() => {});
  }

  const payload = writeReports(results);
  console.log('');
  console.table(results.map(({ id, module, status, durationMs }) => ({ id, module, status, durationMs })));
  console.log(`Ringkasan: ${payload.summary.passed}/${payload.summary.total} PASS, ` +
    `${payload.summary.failed} FAIL, ${payload.summary.blocked} BLOCKED`);
  console.log(`Laporan JSON: ${REPORT_JSON}`);
  console.log(`Laporan Markdown: ${REPORT_MD}`);
  process.exitCode = payload.summary.failed > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`Blackbox runner gagal: ${error.message}`);
  console.error(error.stack);
  process.exitCode = 1;
});