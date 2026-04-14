Teste les flows critiques du site Irekiak via dev-browser.

Argument optionnel : nom du flow a tester (`home`, `booking`, `map`, `admin`, `all`). Par defaut : `all`.

Prerequis : le dev server tourne sur http://localhost:3000 et Chrome est lance en mode debug (`open -a "Google Chrome" --args --remote-debugging-port=9222`).

## Flows a tester

### home : Homepage + navigation
```bash
dev-browser --connect <<'EOF'
const page = await browser.getPage("irekiak-test");
const logs = [];
page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
const title = await page.title();
console.log("Title:", title);

// Verifier ticker
const tickerPresent = await page.locator('[class*="ticker"]').count() > 0;
console.log("Ticker present:", tickerPresent);

// Verifier galeries
const galleryCount = await page.locator('a[href*="/galleries/"]').count();
console.log("Gallery links:", galleryCount);

// Cliquer sur galleries
await page.click('a[href*="galleries"]:first-of-type');
await page.waitForLoadState('networkidle');
console.log("After click:", page.url());

if (logs.length) console.error("Errors:", logs.join('\n'));
else console.log("Home OK");
EOF
```

### booking : Flow complet de reservation
```bash
dev-browser --connect <<'EOF'
const page = await browser.getPage("irekiak-test");
await page.goto("http://localhost:3000/visites/route-a", { waitUntil: "domcontentloaded" });

// Step 1 : select a date in calendar
const availDates = await page.locator('button[aria-selected][data-available="true"], button:not([disabled])[role="gridcell"]');
const count = await availDates.count();
console.log("Available dates:", count);
if (count > 0) await availDates.first().click();

// Step 2 : select a slot
await page.waitForTimeout(500);
const slots = page.locator('[class*="slot"]');
if (await slots.count() > 0) {
  await slots.first().click();
  console.log("Selected slot");
}

// Step 3 : fill form
await page.waitForTimeout(500);
await page.fill('input[name="firstName"], input#firstName', "Test");
await page.fill('input[name="lastName"], input#lastName', "User");
await page.fill('input[name="email"], input[type="email"]', "test@irekiak.eus");

// Submit
await page.click('button[type="submit"]');
await page.waitForTimeout(2000);
console.log("URL after submit:", page.url());

// Take screenshot of result
const buf = await page.screenshot({ fullPage: true });
const path = await saveScreenshot(buf, "booking-result.png");
console.log("Screenshot:", path);
EOF
```

### map : Page carte Leaflet
```bash
dev-browser --connect <<'EOF'
const page = await browser.getPage("irekiak-test");
const logs = [];
page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

await page.goto("http://localhost:3000/carte", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

// Leaflet should create a .leaflet-container
const mapExists = await page.locator('.leaflet-container').count() > 0;
const markerCount = await page.locator('.leaflet-marker-icon').count();
const tilesLoaded = await page.locator('.leaflet-tile-loaded').count();

console.log({ mapExists, markerCount, tilesLoaded });

if (logs.length) console.error("Errors:", logs.join('\n'));

const buf = await page.screenshot({ fullPage: false });
const path = await saveScreenshot(buf, "map.png");
console.log("Screenshot:", path);
EOF
```

### admin : Dashboard admin
```bash
dev-browser --connect <<'EOF'
const page = await browser.getPage("irekiak-test");
await page.goto("http://localhost:3000/admin/bookings", { waitUntil: "domcontentloaded" });

// Login form should be there
const hasLogin = await page.locator('input[type="password"], input[name="token"]').count() > 0;
console.log("Login form present:", hasLogin);

const buf = await page.screenshot({ fullPage: true });
const path = await saveScreenshot(buf, "admin-login.png");
console.log("Screenshot:", path);
EOF
```

## Quand l'utilisateur dit "teste X"
- `home` ou `accueil` -> lancer le flow home
- `booking` ou `reservation` -> lancer le flow booking
- `map` ou `carte` -> lancer le flow map
- `admin` -> lancer le flow admin
- `all` ou defaut -> lancer tous les flows sequentiellement

## Apres chaque test
1. Rapporter le resultat (OK/erreurs)
2. Afficher le chemin du screenshot et utiliser l'outil Read pour le visualiser
3. Si erreurs JS dans la console : les signaler clairement
