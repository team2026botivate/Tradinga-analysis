// Google Apps Script: Web App backend for Trades


// 1) Configure these
const SHEET_ID = '1jfKHZypAhaJVzrQd76okmMipUr7luRFkF5N_q0TKJqo';
const DEFAULT_SHEET = 'All Record'; // default tab name holding your headers
// LoginMaster schema (A-F): Serial No | User ID | Name | Gmail | Password | OTP


// 2) doGet supports action=getTrades (used by the frontend)
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    // Debug: log incoming action and basic params (mask email)
    try {
      var emailStr = String(p.email || '');
      var maskedEmail = emailStr ? emailStr.replace(/(^.).*(@.*$)/, '$1***$2') : '';
      console.log('[doGet] action=', p.action, 'sheet=', p.sheet, 'email=', maskedEmail);
    } catch (logErr) { console.warn('[doGet] log failed', logErr); }

// ===== Password + OTP Login =====
// Flow:
// 1) loginWithPassword_(email, password) -> checks stored salted hash; on match, sends OTP
// 2) verifyLogin_(email, code) -> verifies OTP and returns session token from verifyOtp_

function readPasswordHashForEmail_(email) {
  var sh = getLoginMasterSheet_();
  var row = findEmailRow_(sh, email);
  if (row === -1) return null;
  var val = String(sh.getRange(row, 2).getValue() || ''); // Column B: Password
  return val || null;
}

function loginWithPassword_(email, password) {
  try {
    email = String(email || '').trim();
    password = String(password || '');
    try {
      var m = email ? email.replace(/(^.).*(@.*$)/, '$1***$2') : '';
      console.log('[loginWithPassword] Begin for', m);
    } catch {}
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      console.warn('[loginWithPassword] Invalid email');
      return { success: false, error: 'Invalid email or password' };
    }
    if (!password) {
      console.warn('[loginWithPassword] Empty password');
      return { success: false, error: 'Invalid email or password' };
    }

    var stored = readPasswordHashForEmail_(email);
    if (!stored) {
      console.warn('[loginWithPassword] User not found');
      return { success: false, error: 'Invalid email or password' };
    }
    var parsed = parseHash_(stored);
    if (!parsed || !parsed.salt) {
      console.warn('[loginWithPassword] Malformed stored hash');
      return { success: false, error: 'Account configuration error' };
    }
    var recomputed = hashPassword_(password, parsed.salt);
    if (recomputed !== stored) {
      console.warn('[loginWithPassword] Password mismatch');
      return { success: false, error: 'Invalid email or password' };
    }

    console.log('[loginWithPassword] Password OK, sending OTP');
    var otpRes = sendOtp_(email);
    if (!otpRes || otpRes.success !== true) {
      console.warn('[loginWithPassword] sendOtp_ failed:', otpRes && otpRes.error ? String(otpRes.error) : '(no error)');
      return { success: false, error: otpRes && otpRes.error ? otpRes.error : 'Failed to send OTP' };
    }
    return { success: true, message: 'OTP sent to your email for login.' };
  } catch (e) {
    console.error('[loginWithPassword] Exception:', String(e));
    return { success: false, error: String(e) };
  }
}

function verifyLogin_(email, code) {
  try {
    email = String(email || '').trim();
    code = String(code || '').trim();
    try {
      var m2 = email ? email.replace(/(^.).*(@.*$)/, '$1***$2') : '';
      console.log('[verifyLogin] Begin for', m2);
    } catch {}
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      console.warn('[verifyLogin] Invalid email');
      return { success: false, error: 'Invalid email' };
    }
    if (!/^\d{6}$/.test(code)) {
      console.warn('[verifyLogin] Invalid code format');
      return { success: false, error: 'Invalid code' };
    }

    var ver = verifyOtp_(email, code);
    if (!ver || ver.success !== true) {
      console.warn('[verifyLogin] OTP verification failed');
      return { success: false, error: ver && ver.error ? ver.error : 'OTP verification failed' };
    }
    // Pass through token if verifyOtp_ returns it
    return { success: true, email: email, token: ver.token, message: 'Login successful' };
  } catch (e) {
    console.error('[verifyLogin] Exception:', String(e));
    return { success: false, error: String(e) };
  }
}
    if (p.action === 'getTrades') {
      var sheetName = p.sheet || DEFAULT_SHEET;
      return getTrades_(sheetName);
    }
    if (p.action === 'getTopMovers') {
      var moversSheet = p.sheet || 'TopMovers';
      return getTopMovers_(moversSheet);
    }
    if (p.action === 'getTopProfit') {
      return json_({ data: getTopProfit_(p.sheet) });
    }
    if (p.action === 'getTradingDayStats') {
      return json_({ data: getTradingDayStats_(p.sheet) });
    }
    if (p.action === 'getPortfolioStats') {
      return json_({ data: getPortfolioStats_(p.sheet) });
    }
    if (p.action === 'sendOtp') {
      try {
        var emailStr2 = String(p.email || '');
        var masked2 = emailStr2 ? emailStr2.replace(/(^.).*(@.*$)/, '$1***$2') : '';
        console.log('[doGet] Routing to sendOtp for', masked2);
      } catch {}
      return json_(sendOtp_(String(p.email || '')));
    }
    if (p.action === 'verifyOtp') {
      try {
        var emailStr3 = String(p.email || '');
        var masked3 = emailStr3 ? emailStr3.replace(/(^.).*(@.*$)/, '$1***$2') : '';
        console.log('[doGet] Routing to verifyOtp for', masked3);
      } catch {}
      return json_(verifyOtp_(String(p.email || ''), String(p.code || '')));
    }
    if (p.action === 'getUserProfile') {
      try {
        var emailStr4 = String(p.email || '');
        var masked4 = emailStr4 ? emailStr4.replace(/(^.).*(@.*$)/, '$1***$2') : '';
        console.log('[doGet] Routing to getUserProfile for', masked4);
      } catch {}
      return json_(getUserProfile_(String(p.email || '')));
    }
    if (p.sheet && (p.action === 'fetch' || !p.action)) {
      // Optional legacy fetch you shared; returns 2D array
      return fetchSheetData(p.sheet);
    }
    return json_({ status: 'ready', message: 'Google Apps Script is running' });
  } catch (error) {
    return json_({ success: false, error: String(error) });
  }
}

// ===== Password + OTP Signup =====
// Flow:
// 1) startSignup_(email, password, name?) -> stages password securely and sends OTP
//    - Creates/ensures LoginMaster sheet with headers: Email | Password | Name | CreatedAt
//    - Checks for duplicate email
//    - Hashes password with per-user salt and stores in Cache for 10 minutes pending OTP verification
// 2) verifySignup_(email, code) -> verifies OTP and persists the user to LoginMaster

function getLoginMasterSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName('LoginMaster');
  if (!sh) {
    sh = ss.insertSheet('LoginMaster');
  }
  // Ensure we have at least 6 columns
  if (sh.getMaxColumns() < 6) {
    sh.insertColumnsAfter(sh.getMaxColumns(), 6 - sh.getMaxColumns());
  }
  // If empty, set headers: A-F
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 6).setValues([[
      'Serial No', 'User ID', 'Name', 'Gmail', 'Password', 'OTP'
    ]]);
  } else {
    // Ensure header names exist in row 1 (non-destructive where already set)
    var header = sh.getRange(1, 1, 1, Math.max(6, sh.getLastColumn())).getValues()[0];
    var desired = ['Serial No','User ID','Name','Gmail','Password','OTP'];
    for (var i = 0; i < 6; i++) {
      if (!header[i] || String(header[i]).trim() === '') {
        sh.getRange(1, i + 1).setValue(desired[i]);
      }
    }
  }
  return sh;
}

// Find row by Gmail in column D (4). Returns 1-indexed row or -1 if not found.
function findGmailRow_(sh, gmail) {
  var vals = sh.getDataRange().getValues();
  if (!vals || vals.length < 2) return -1;
  var target = String(gmail || '').trim().toLowerCase();
  for (var i = 1; i < vals.length; i++) {
    var g = String(vals[i][3] || '').trim().toLowerCase(); // Col D index 3 (0-based)
    if (g && g === target) return i + 1; // 1-indexed
  }
  return -1;
}

// Return profile by Gmail: Column B (User ID/Role), Column C (Name), Column D (Gmail)
function getUserProfile_(gmail) {
  try {
    var sh = getLoginMasterSheet_();
    var row = findGmailRow_(sh, gmail);
    if (row === -1) {
      return { success: false, error: 'User not found' };
    }
    // Sheet headers (A-F): Serial No | User ID | Name | Gmail | Password | OTP
    var userId = String(sh.getRange(row, 2).getValue() || ''); // Column B
    var name = String(sh.getRange(row, 3).getValue() || '');   // Column C
    var email = String(sh.getRange(row, 4).getValue() || '');  // Column D
    return { success: true, email: email, userId: userId, name: name };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

function findEmailRow_(sh, email) {
  var vals = sh.getDataRange().getValues();
  if (!vals || vals.length < 2) return -1;
  for (var i = 1; i < vals.length; i++) {
    var e = String(vals[i][0] || '').trim().toLowerCase();
    if (e && e === String(email).trim().toLowerCase()) return i + 1; // 1-indexed row
  }
  return -1;
}

function hashPassword_(password, salt) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  var b64 = Utilities.base64Encode(digest);
  return 'sha256$' + salt + '$' + b64; // format: algo$salt$hash
}

// Parse stored password hash format: algo$salt$hash
function parseHash_(stored) {
  try {
    var parts = String(stored || '').split('$');
    if (parts.length !== 3) return null;
    return { algo: parts[0], salt: parts[1], hash: parts[2] };
  } catch (e) {
    return null;
  }
}

function startSignup_(email, password, name) {
  try {
    email = String(email || '').trim();
    password = String(password || '');
    name = String(name || '').trim();
    try {
      var m1 = email ? email.replace(/(^.).*(@.*$)/, '$1***$2') : '';
      console.log('[startSignup] Begin for', m1);
    } catch {}

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      console.warn('[startSignup] Invalid email');
      return { success: false, error: 'Invalid email' };
    }
    if (password.length < 6) {
      console.warn('[startSignup] Password too short');
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    var sh = getLoginMasterSheet_();
    if (findEmailRow_(sh, email) !== -1) {
      console.warn('[startSignup] Duplicate email');
      return { success: false, error: 'Email already registered' };
    }

    // Stage hashed password + name (and plaintext if DEBUG) in cache for 10 minutes
    var cache = CacheService.getScriptCache();
    var salt = Utilities.getUuid();
    var pwdHash = hashPassword_(password, salt);
    var stageKey = 'signup:' + email.toLowerCase();
    var stagedPayload = { pwd: pwdHash, name: name, createdAt: Date.now() };
    if (DEBUG_STORE_PLAINTEXT) { stagedPayload.pwdPlain = String(password); }
    cache.put(stageKey, JSON.stringify(stagedPayload), 600);

    // Send OTP using existing flow
    console.log('[startSignup] Sending OTP...');
    var otpRes = sendOtp_(email);
    if (!otpRes || otpRes.success !== true) {
      console.warn('[startSignup] sendOtp_ failed:', otpRes && otpRes.error ? String(otpRes.error) : '(no error)');
      return { success: false, error: otpRes && otpRes.error ? otpRes.error : 'Failed to send OTP' };
    }
    console.log('[startSignup] Success: OTP sent');
    return { success: true, message: 'Signup initiated. OTP sent to your email.' };
  } catch (e) {
    console.error('[startSignup] Exception:', String(e));
    return { success: false, error: String(e) };
  }
}

function verifySignup_(email, code) {
  try {
    email = String(email || '').trim();
    code = String(code || '').trim();
    try {
      var m2 = email ? email.replace(/(^.).*(@.*$)/, '$1***$2') : '';
      console.log('[verifySignup] Begin for', m2);
    } catch {}
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      console.warn('[verifySignup] Invalid email');
      return { success: false, error: 'Invalid email' };
    }
    if (!/^\d{6}$/.test(code)) {
      console.warn('[verifySignup] Invalid code format');
      return { success: false, error: 'Invalid code' };
    }

    // Verify OTP using existing function (consumes the OTP)
    var ver = verifyOtp_(email, code);
    if (!ver || ver.success !== true) {
      console.warn('[verifySignup] OTP verification failed');
      return { success: false, error: ver && ver.error ? ver.error : 'OTP verification failed' };
    }

    // Retrieve staged data
    var cache = CacheService.getScriptCache();
    var stageKey = 'signup:' + email.toLowerCase();
    var stagedRaw = cache.get(stageKey);
    if (!stagedRaw) {
      console.warn('[verifySignup] No staged signup found');
      return { success: false, error: 'No signup in progress or expired' };
    }
    var staged;
    try { staged = JSON.parse(stagedRaw); } catch { staged = null; }
    if (!staged || !staged.pwd) {
      console.warn('[verifySignup] Invalid staged payload');
      return { success: false, error: 'Invalid signup data' };
    }

    var sh = getLoginMasterSheet_();
    if (findEmailRow_(sh, email) !== -1) {
      // Already registered in the interim
      cache.remove(stageKey);
      console.log('[verifySignup] Already registered');
      return { success: true, message: 'Email already registered', already: true };
    }

    // Append row: Email | Password(hash) | Name | CreatedAt (ISO) | PasswordPlain (DEBUG)
    var tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone() || 'Asia/Kolkata';
    var createdAt = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');
    if (DEBUG_STORE_PLAINTEXT) {
      // Ensure header exists
      var lastCol = sh.getLastColumn();
      if (lastCol < 5) {
        if (sh.getMaxColumns() < 5) sh.insertColumnAfter(4);
        sh.getRange(1, 5).setValue('PasswordPlain');
      }
      sh.appendRow([email, staged.pwd, staged.name || '', createdAt, String(staged.pwdPlain || '')]);
    } else {
      sh.appendRow([email, staged.pwd, staged.name || '', createdAt]);
    }

    cache.remove(stageKey);
    console.log('[verifySignup] Success: user persisted');
    return { success: true, message: 'Signup complete', email: email };
  } catch (e) {
    console.error('[verifySignup] Exception:', String(e));
    return { success: false, error: String(e) };
  }
}


// 3) Returns an array of trade objects based on your headers:
// "Entry date","Exit date","Instrument","side","Entry","Exit","Qty","P&L","Strategy",
// "Trading Result","Stoploss","takeprofit","Risk in rs","Risk in %","notes"
function getTrades_(sheetName) {
  console.log('[Trades] Processing sheet:', sheetName);
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(sheetName);
  
  if (!sh) {
    console.error('[Trades] Sheet not found:', sheetName);
    return json_([]);
  }

  var values = sh.getDataRange().getValues();
  console.log('[Trades] Found rows:', values.length);
  
  if (!values || values.length < 2) {
    console.warn('[Trades] Insufficient data - need at least 1 row after headers');
    return json_([]);
  }

  var headers = values[0].map(function(h){ return String(h).trim(); });
  console.log('[Trades] Headers:', headers.join(', '));
  
  var rows = values.slice(1);
  var idx = indexMap_(headers);
  // Resolve flexible indices for commonly varied headers
  var iEntryDate = findHeader(headers, ['entry date','entrydate','timestamp','date','time','datetime']);
  var iExitDate = findHeader(headers, ['exit date','exitdate','exit','close date','closing date']);
  var iInstrument = findHeader(headers, ['instrument','symbol','ticker','scrip','name']);
  var iSide = findHeader(headers, ['side','action','buy/sell']);
  var iEntry = findHeader(headers, ['entry','entry price','price','buy price']);
  var iExit = findHeader(headers, ['exit','exit price','sell price','close']);
  var iQty = findHeader(headers, ['qty','quantity','shares','contracts']);
  var iPnl = findHeader(headers, ['p&l','pnl','profit','profit/loss','net']);
  var iStrategy = findHeader(headers, ['strategy']);
  var iNotes = findHeader(headers, ['notes','note','remark','remarks']);
  var iStop = findHeader(headers, ['stoploss','stop loss','sl']);
  var iTp = findHeader(headers, ['takeprofit','take profit','tp']);
  var iRiskRs = findHeader(headers, ['risk in rs','risk (₹)','risk rs','risk amount']);
  var iRiskPct = findHeader(headers, ['risk in %','risk (%)','risk percent','risk %']);
  console.log('[Trades] Column mapping idx:', JSON.stringify(idx));
  console.log('[Trades] Resolved indices:', { iEntryDate, iExitDate, iInstrument, iSide, iEntry, iExit, iQty, iPnl, iStrategy, iNotes, iStop, iTp, iRiskRs, iRiskPct });

  var trades = rows
    .filter(nonEmptyRow_)
    .map(function (r, i) {
      console.log('[Trades] Processing row', i+2, ':', r.slice(0, 5).join(', '), '...');
      
      var entryDate = iso_(iEntryDate >= 0 ? r[iEntryDate] : (idx['Entry date'] != null ? r[idx['Entry date']] : ''));
      var exitDate  = iso_(iExitDate >= 0 ? r[iExitDate] : (idx['Exit date'] != null ? r[idx['Exit date']] : ''));
      var instrument = String((iInstrument >= 0 ? r[iInstrument] : (idx['Instrument'] != null ? r[idx['Instrument']] : '')) || '');
      var side = action_(iSide >= 0 ? r[iSide] : (idx['side'] != null ? r[idx['side']] : ''));
      var entry = num_(iEntry >= 0 ? r[iEntry] : (idx['Entry'] != null ? r[idx['Entry']] : 0));
      var exit  = num_(iExit >= 0 ? r[iExit] : (idx['Exit'] != null ? r[idx['Exit']] : 0));
      var qty   = num_(iQty >= 0 ? r[iQty] : (idx['Qty'] != null ? r[idx['Qty']] : 0));
      var pnl   = num_(iPnl >= 0 ? r[iPnl] : (idx['P&L'] != null ? r[idx['P&L']] : 0));
      var notes = String((iNotes >= 0 ? r[iNotes] : (idx['notes'] != null ? r[idx['notes']] : '')) || '');
      var strategy = String((iStrategy >= 0 ? r[iStrategy] : (idx['Strategy'] != null ? r[idx['Strategy']] : '')) || '');
      var stoploss = iStop >= 0 ? num_(r[iStop]) : (idx.hasOwnProperty('Stoploss') ? num_(r[idx['Stoploss']]) : 0);
      var takeprofit = iTp >= 0 ? num_(r[iTp]) : (idx.hasOwnProperty('takeprofit') ? num_(r[idx['takeprofit']]) : (idx.hasOwnProperty('Takeprofit') ? num_(r[idx['Takeprofit']]) : 0));
      var riskInRs = iRiskRs >= 0 ? num_(r[iRiskRs]) : (idx.hasOwnProperty('Risk in rs') ? num_(r[idx['Risk in rs']]) : 0);
      var riskInPct = iRiskPct >= 0 ? num_(r[iRiskPct]) : (idx.hasOwnProperty('Risk in %') ? num_(r[idx['Risk in %']]) : 0);

      console.log('[Trades] Row', i+2, 'processed:', {
        instrument,
        side,
        entry,
        exit,
        qty,
        pnl,
        strategy,
        exitDate
      });

      // Compute trading result based on P&L
      let tradingResult = '';
      if (pnl > 0) tradingResult = 'Win';
      else if (pnl < 0) tradingResult = 'Loss';
      else tradingResult = 'Breakeven';

      return {
        id: String(i + 2),
        symbol: instrument,
        action: side,
        quantity: qty,
        entryPrice: entry,
        exitPrice: exit,
        price: entry,
        timestamp: entryDate,
        exitDate: exitDate,
        notes,
        strategy,
        tradingResult,
        stopLoss: stoploss || undefined,
        takeProfit: takeprofit || undefined,
        riskAmount: riskInRs || undefined,
        riskPercent: riskInPct || undefined
      };
    });

  console.log('[Trades] Processed', trades.length, 'valid trades');
  return json_(trades);
}


// 4) Optional legacy 2D array fetch (kept for compatibility if you call it elsewhere)
function fetchSheetData(sheetName) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    var data = sheet.getDataRange().getValues();
    return json_({ success: true, data: data });
  } catch (error) {
    return json_({ success: false, error: String(error) });
  }
}


// 5) Insert/Update/Delete endpoints (compatible with your current usage)
function doPost(e) {
  const params = e.parameter;
  const action = params.action;
  const sheetName = params.sheetName || DEFAULT_SHEET;
  const rowData = JSON.parse(params.rowData);
  
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'insert') {
    // Ensure first two columns are auto-populated per new header order:
    // [A: Timestamp, B: Serial No]
    // Assume row 1 is headers; next data row is sheet.getLastRow() + 1
    // Serial No should equal (nextDataRow - 1)
    const nextRow = sheet.getLastRow() + 1;
    const nextSerial = Math.max(1, nextRow - 1);
    const serialStr = 'SN-' + ('000' + nextSerial).slice(-3);
    const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone() || 'Asia/Kolkata';
    const timestampStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');

    // If incoming values are blank/empty, fill them
    const a0 = rowData[0];
    const a1 = rowData[1];
    if (a0 === '' || a0 == null) {
      rowData[0] = timestampStr; // Column A: Timestamp
    }
    if (a1 === '' || a1 == null) {
      rowData[1] = serialStr; // Column B: Serial No (formatted)
    }

    // Append the row data
    sheet.appendRow(rowData);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}


// Returns top movers from a sheet (default: "TopMovers").
// Expected headers (case-sensitive in this simple map, but we try multiple fallbacks):
// Symbol | Name | Price | Change | Change % | Change% | Pct Change | 1D% | Trend | Updated At
function getTopMovers_(sheetName) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return json_([]);

  var values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return json_([]);

  var headers = values[0].map(function(h){ return String(h).trim(); });
  var rows = values.slice(1);
  var idx = indexMap_(headers);

  function pickIdx(keys) {
    for (var i = 0; i < keys.length; i++) {
      var k = String(keys[i]).trim();
      if (idx.hasOwnProperty(k)) return idx[k];
    }
    return -1;
  }

  var iSymbol = pickIdx(['Symbol', 'Ticker', 'Scrip']);
  var iName = pickIdx(['Name', 'Company']);
  var iPrice = pickIdx(['Price', 'Last', 'LTP', 'Close']);
  var iChange = pickIdx(['Change']);
  var iChangePct = pickIdx(['Change %', 'Change%', 'Pct Change', '1D%']);
  var iTrend = pickIdx(['Trend']);
  var iUpdated = pickIdx(['Updated At', 'UpdatedAt']);

  var movers = rows
    .filter(nonEmptyRow_)
    .map(function(r){
      var symbol = iSymbol >= 0 ? String(r[iSymbol] || '') : '';
      var name = iName >= 0 ? String(r[iName] || '') : '';
      var price = iPrice >= 0 ? num_(r[iPrice]) : 0;
      var changeStr = iChange >= 0 ? String(r[iChange] || '') : '';
      var changePct = iChangePct >= 0 ? num_(r[iChangePct]) : 0;

      // If change string isn't a percent, synthesize from numeric
      if (!(typeof changeStr === 'string' && changeStr.indexOf('%') >= 0)) {
        if (typeof changePct === 'number' && !isNaN(changePct)) {
          changeStr = (changePct >= 0 ? '+' : '') + changePct.toFixed(2) + '%';
        }
      }

      var trend = 'up';
      if (iTrend >= 0) {
        var t = String(r[iTrend] || '').toLowerCase();
        trend = (t === 'down' || t === 'bearish' || t === 'neg') ? 'down' : 'up';
      } else {
        trend = (Number(changePct) < 0 || (typeof changeStr === 'string' && changeStr.trim().charAt(0) === '-')) ? 'down' : 'up';
      }

      var upd = iUpdated >= 0 ? r[iUpdated] : '';
      var updatedAt = upd ? iso_(upd) : '';

      return {
        symbol: symbol,
        name: name,
        price: price,
        change: changeStr,
        changePercent: Number(changePct) || 0,
        trend: trend,
        updatedAt: updatedAt
      };
    })
    .slice(0, 20);

  return json_(movers);
}

function getTopProfit_(sheetName = 'TopProfit') {
  try {
    console.log('[TopProfit] Fetching from sheet:', sheetName);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
    console.log('[TopProfit] Using sheet:', sheet.getName());

    const [header, ...rows] = sheet.getDataRange().getValues();
    console.log('[TopProfit] Found rows:', rows.length);

    // Flexible header mapping
    const headerMap = {
      symbol: findHeader(header, ['symbol', 'ticker', 'instrument', 'scrip']),
      name: findHeader(header, ['name', 'company', 'company name']),
      profit: findHeader(header, ['profit', 'p&l', 'pnl', 'net', 'net profit', 'profit/loss']),
      profitPercent: findHeader(header, ['profit%', 'profit %', 'profitpercent', 'return%', 'return %', 'roi']),
      tradesCount: findHeader(header, ['trades', 'trade count', 'trades count', 'count', 'no of trades', 'number of trades', 'total trades', 'trades total', 'trades_num', 'trades-number']),
      avgWin: findHeader(header, ['avgwin', 'averagewin', 'avg pnl', 'average pnl', 'avg profit']),
      updatedAt: findHeader(header, ['updated', 'updated at', 'updatedat', 'timestamp', 'last updated'])
    };

    console.log('[TopProfit] Header indices:', headerMap);
    console.log(
      '[TopProfit] Trades count column:',
      headerMap.tradesCount !== -1 ? header[headerMap.tradesCount] : 'Not found',
      'at index',
      headerMap.tradesCount
    );

    // Debug first 5 rows' trades count values
    rows.slice(0, 5).forEach((row, i) => {
      const tradesVal = headerMap.tradesCount !== -1 ? row[headerMap.tradesCount] : undefined;
      console.log(`[TopProfit] Row ${i} trades count:`, tradesVal, typeof tradesVal);
    });

    // Aggregate by symbol (using canonicalized symbol to merge variants)
    const groups = {};
    rows.forEach((row, i) => {
      try {
        const sym = headerMap.symbol !== -1 ? String(row[headerMap.symbol] || '') : '';
        const symbolRaw = sym.trim();
        const symbol = canonicalSymbol_(symbolRaw);
        if (!symbol) return;

        const profit = headerMap.profit !== -1 ? num_(row[headerMap.profit]) : 0;
        const pct = headerMap.profitPercent !== -1 ? num_(row[headerMap.profitPercent]) : NaN;
        const tcount = headerMap.tradesCount !== -1 ? num_(row[headerMap.tradesCount]) : NaN;
        const avg = headerMap.avgWin !== -1 ? num_(row[headerMap.avgWin]) : NaN;
        const name = headerMap.name !== -1 ? String(row[headerMap.name] || '') : '';
        const updRaw = headerMap.updatedAt !== -1 ? row[headerMap.updatedAt] : '';
        const upd = updRaw ? iso_(updRaw) : '';

        if (!groups[symbol]) {
          groups[symbol] = {
            symbol,
            name: name || '',
            profitSum: 0,
            profitPercentSum: 0,
            profitPercentCount: 0,
            tradesSum: 0,
            tradesValueCount: 0,
            hasTradesCol: headerMap.tradesCount !== -1,
            avgWinSum: 0,
            avgWinCount: 0,
            updatedAt: upd || '',
            rowsCount: 0
          };
        }
        const g = groups[symbol];
        g.rowsCount += 1;
        if (typeof profit === 'number' && !isNaN(profit)) g.profitSum += profit;
        if (typeof pct === 'number' && !isNaN(pct)) { g.profitPercentSum += pct; g.profitPercentCount += 1; }
        if (typeof avg === 'number' && !isNaN(avg)) { g.avgWinSum += avg; g.avgWinCount += 1; }
        if (g.hasTradesCol && (typeof tcount === 'number' && !isNaN(tcount))) { g.tradesSum += tcount; g.tradesValueCount += 1; }
        if (name && !g.name) g.name = name;
        if (upd) {
          if (!g.updatedAt) g.updatedAt = upd;
          else if (new Date(upd).getTime() > new Date(g.updatedAt).getTime()) g.updatedAt = upd;
        }
      } catch (err) {
        console.warn('[TopProfit] Skipping row during aggregation', i + 2, err);
      }
    });

    const aggregated = Object.keys(groups).map(k => {
      const g = groups[k];
      const profitPercent = g.profitPercentCount > 0 ? (g.profitPercentSum / g.profitPercentCount) : 0;
      const avgWin = g.avgWinCount > 0 ? (g.avgWinSum / g.avgWinCount) : 0;
      // If trades column exists, use the summed value when at least one row had a value; otherwise, fallback to number of rows aggregated for that symbol
      const tradesCount = g.hasTradesCol ? (g.tradesValueCount > 0 ? g.tradesSum : g.rowsCount) : g.rowsCount;
      return {
        symbol: g.symbol,
        name: g.name || g.symbol,
        profit: g.profitSum,
        profitPercent,
        tradesCount,
        avgWin,
        updatedAt: g.updatedAt || new Date().toISOString()
      };
    })
    .sort((a, b) => Number(b.profit) - Number(a.profit))
    .slice(0, 20);

    console.log('[TopProfit] Aggregated unique symbols:', aggregated.length);

    if (aggregated.length === 0) {
      console.warn('[TopProfit] No data found - returning sample');
      return [
        { symbol: 'RELI', name: 'Reliance', profit: 50000, profitPercent: 12.5, tradesCount: 5 },
        { symbol: 'TCS', name: 'TCS', profit: 45000, profitPercent: 10.2, tradesCount: 3 }
      ];
    }

    return aggregated;
  } catch (e) {
    console.error('getTopProfit_ failed:', e);
    return [];
  }
}

function normalizeHeaderStr(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[%\s\-_]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findHeader(header, keys) {
  const normHeaders = header.map(h => normalizeHeaderStr(h));
  for (let i = 0; i < keys.length; i++) {
    const nk = normalizeHeaderStr(keys[i]);
    let index = normHeaders.indexOf(nk);
    if (index !== -1) return index;
    index = normHeaders.findIndex(h => h === nk || h.includes(nk) || nk.includes(h));
    if (index !== -1) return index;
  }
  return -1;
}

// Canonicalize symbols to merge variants (e.g., BANKNIFTY options/futures -> BANKNIFTY)
function canonicalSymbol_(raw) {
  if (!raw) return '';
  try {
    // Normalize spacing and case
    var s = String(raw || '').trim().toUpperCase();
    if (!s) return '';

    // Quick wins for common known indices and aliases
    var compact = s.replace(/[\s_\-]/g, '');
    if (compact.indexOf('NIFTYBANK') >= 0 || compact.indexOf('BANKNIFTY') >= 0) return 'BANKNIFTY';
    if (compact.indexOf('FINNIFTY') >= 0) return 'FINNIFTY';
    if (compact.indexOf('MIDCPNIFTY') >= 0 || compact.indexOf('MIDCAPNIFTY') >= 0) return 'MIDCPNIFTY';
    if (compact === 'NIFTY' || compact.indexOf('NIFTY50') >= 0) return 'NIFTY';

    // Remove option/futures suffixes if present (CE/PE/FUT etc.)
    // Many vendor symbols look like RELIANCE24JULFUT or BANKNIFTY24SEP49500CE
    // Strategy: take the alpha prefix up to the first digit as the root
    var m = compact.match(/^([A-Z]+?)(\d|$)/);
    if (m && m[1]) {
      return m[1];
    }

    // Fallback to the compact string as-is
    return compact;
  } catch (e) {
    try { return String(raw).toUpperCase(); } catch { return ''; }
  }
}

function getTradingDayStats_(sheetName = DEFAULT_SHEET) {
  console.log('Fetching trading stats from sheet:', sheetName);
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      console.error('Sheet not found:', sheetName);
      return {best: {date: '', pnl: 0}, worst: {date: '', pnl: 0}, monthlyPnl: 0, todayPnl: 0};
    }
    
    const [header, ...rows] = sheet.getDataRange().getValues();
    console.log('Headers:', header);

    const dateCol = findHeader(header, ['date', 'timestamp', 'time', 'datetime', 'entry date']);
    const pnlCol = findHeader(header, ['pnl', 'profit', 'net', 'p&l', 'profit/loss', 'return']);

    console.log('Found date column at index:', dateCol, 'PNL column at index:', pnlCol);
    try {
      console.log('Header preview:', header);
      // Log first 5 rows for the detected columns
      rows.slice(0, 5).forEach((r, i) => {
        const rawDate = dateCol !== -1 ? r[dateCol] : undefined;
        const rawPnl = pnlCol !== -1 ? r[pnlCol] : undefined;
        const parsedPnl = num_(rawPnl);
        let parsedDateStr = '';
        try {
          let d = new Date(rawDate);
          if (isNaN(d.getTime())) {
            d = new Date((rawDate - 25569) * 86400 * 1000);
          }
          parsedDateStr = isNaN(d.getTime()) ? '(invalid)' : d.toISOString();
        } catch (e) {
          parsedDateStr = '(invalid)';
        }
        console.log('[TradingStats Debug] Row', i + 2, 'rawDate=', rawDate, 'parsedDate=', parsedDateStr, 'rawPnl=', rawPnl, 'parsedPnl=', parsedPnl);
      });
    } catch (logErr) {
      console.warn('[TradingStats Debug] Failed to log preview rows', logErr);
    }

    if (dateCol === -1 || pnlCol === -1) {
      console.error('Missing required columns - need date and P&L columns');
      return {best: {date: '', pnl: 0}, worst: {date: '', pnl: 0}, monthlyPnl: 0, todayPnl: 0};
    }
    
    console.log('Found', rows.length, 'rows of trade data');
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const today = new Date().toLocaleDateString();
    
    let monthlyPnl = 0;
    let todayPnl = 0;
    const days = {};
    
    rows.forEach(row => {
      try {
        // Parse date - try multiple formats
        let date;
        try {
          date = new Date(row[dateCol]);
          if (isNaN(date.getTime())) throw new Error('Invalid date');
        } catch {
          // Try parsing as spreadsheet serial number
          date = new Date((row[dateCol] - 25569) * 86400 * 1000);
        }
        
        const pnl = num_(row[pnlCol]);
        
        if (!isNaN(date.getTime())) {
          const dateStr = date.toLocaleDateString();
          
          // Monthly calculation
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            monthlyPnl += pnl;
          }
          
          // Today calculation
          if (dateStr === today) {
            todayPnl += pnl;
          }
          
          // Track by day
          days[dateStr] = (days[dateStr] || 0) + pnl;
        }
      } catch (e) {
        console.warn('Skipping invalid row:', row, 'Error:', e);
      }
    });
    
    // Find best/worst
    let best = {date: '', pnl: -Infinity};
    let worst = {date: '', pnl: Infinity};
    
    Object.entries(days).forEach(([date, pnl]) => {
      if (pnl > best.pnl) best = {date, pnl};
      if (pnl < worst.pnl) worst = {date, pnl};
    });
    
    const result = {
      best,
      worst,
      monthlyPnl,
      todayPnl
    };
    
    console.log('Calculated stats:', JSON.stringify(result));
    return result;
  } catch (e) {
    console.error('getTradingDayStats_ failed:', e);
    return {
      best: {date: '', pnl: 0},
      worst: {date: '', pnl: 0},
      monthlyPnl: 0,
      todayPnl: 0
    };
  }
}

// Compute overall portfolio stats from the trades sheet
// - totalPositions: count of open positions (no Exit date or Exit price)
// - totalTrades: count of non-empty rows
// - totalRealizedPnl: sum of P&L across all rows
// - grossOpenExposure: sum of Entry * Qty for open positions (approximate)
// - totalPortfolioValue: optional, read from a 'Summary' or 'Dashboard' sheet if present
function getPortfolioStats_(sheetName = DEFAULT_SHEET) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return {
        totalPositions: 0,
        totalTrades: 0,
        totalRealizedPnl: 0,
        grossOpenExposure: 0,
        totalPortfolioValue: 0,
        openPositionsMarketValue: 0,
        netUnrealizedPnl: 0,
        uniqueStocksCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    const [header, ...rows] = sheet.getDataRange().getValues();
    const entryCol = findHeader(header, ['entry']);
    const exitCol = findHeader(header, ['exit']);
    const qtyCol = findHeader(header, ['qty', 'quantity']);
    const exitDateCol = findHeader(header, ['exit date', 'exitdate', 'exit_date']);
    const pnlCol = findHeader(header, ['p&l', 'pnl', 'profit', 'net']);
    const sideCol = findHeader(header, ['side', 'action', 'position', 'trade side']);
    const currentPriceCol = findHeader(header, ['current price', 'ltp', 'cmp', 'last', 'last price', 'price', 'close', 'market price', 'marketprice']);
    const instrumentCol = findHeader(header, ['instrument', 'symbol', 'ticker', 'scrip', 'stock', 'name']);

    let totalPositions = 0;
    let totalTrades = 0;
    let totalRealizedPnl = 0;
    let grossOpenExposure = 0;
    let openPositionsMarketValue = 0;
    let netUnrealizedPnl = 0;
    let uniqueInstruments = new Set(); // Track unique stocks/instruments

    rows.forEach(row => {
      if (!nonEmptyRow_(row)) return;
      totalTrades++;

      if (pnlCol !== -1) {
        const pnl = num_(row[pnlCol]);
        if (!isNaN(pnl)) totalRealizedPnl += pnl;
      }

      const exitDateVal = exitDateCol !== -1 ? row[exitDateCol] : null;
      const exitPriceVal = exitCol !== -1 ? row[exitCol] : null;
      const isOpen = exitDateCol !== -1
        ? (exitDateVal === '' || exitDateVal == null)
        : (exitCol !== -1 ? (exitPriceVal === '' || exitPriceVal == null || Number(exitPriceVal) === 0) : false);

      // Track all instruments (for total unique stocks count)
      const instrument = instrumentCol !== -1 ? String(row[instrumentCol] || '').trim() : '';
      if (instrument) {
        uniqueInstruments.add(instrument.toUpperCase());
      }

      if (isOpen) {
        totalPositions++;
        const entry = entryCol !== -1 ? num_(row[entryCol] || 0) : 0;
        const qty = qtyCol !== -1 ? num_(row[qtyCol] || 0) : 0;
        if (!isNaN(entry) && !isNaN(qty)) {
          grossOpenExposure += entry * qty;

          // Use current price if available to compute market value and unrealized P&L
          const curRaw = currentPriceCol !== -1 ? row[currentPriceCol] : null;
          const cur = curRaw != null ? num_(curRaw) : 0;
          const usePrice = (typeof cur === 'number' && !isNaN(cur) && cur > 0) ? cur : entry;
          openPositionsMarketValue += usePrice * qty;

          if (typeof cur === 'number' && !isNaN(cur) && cur > 0) {
            const sideNorm = sideCol !== -1 ? action_(row[sideCol]) : 'buy';
            const dir = sideNorm === 'sell' ? -1 : 1; // long=+1, short=-1
            netUnrealizedPnl += (cur - entry) * qty * dir;
          }
        }
      }
    });

    // Try to read portfolio value from a Summary-like sheet, if available
    let totalPortfolioValue = 0;
    const summary = ss.getSheetByName('Summary') || ss.getSheetByName('Dashboard');

    if (summary) {
      try {
        const vals = summary.getDataRange().getValues();
        
        if (vals && vals.length > 0) {
          const headers = vals[0].map(v => String(v || ''));
          const metricIdx = headers.findIndex(h => {
            const s = h.trim().toLowerCase();
            return s === 'metric' || s === 'key' || s === 'name';
          });
          const valueIdx = headers.findIndex(h => {
            const s = h.trim().toLowerCase();
            return s === 'value' || s === 'val' || s === 'amount';
          });
          
          if (metricIdx !== -1 && valueIdx !== -1) {
            for (let i = 1; i < vals.length; i++) {
              const metric = String(vals[i][metricIdx] || '').trim().toLowerCase();
              if (['total portfolio value','portfolio value','equity','net worth','networth'].includes(metric)) {
                const v = num_(vals[i][valueIdx]);
                if (!isNaN(v)) { totalPortfolioValue = v; break; }
              }
            }
          } else {
            // As a fallback, try a well-known cell
            const v = num_(summary.getRange('B1').getValue());
            if (!isNaN(v)) totalPortfolioValue = v;
          }
        }
      } catch (e) {
        console.warn('Reading portfolio value from Summary failed:', e);
      }
    } else {
      // Fallback when no Summary sheet exists
      totalPortfolioValue = 0; // Unknown without Summary
    }

    // If portfolio value still unknown, approximate using market value of open positions plus realized P&L
    if (!totalPortfolioValue) {
      const approx = (openPositionsMarketValue || 0) + (totalRealizedPnl || 0);
      if (approx > 0) totalPortfolioValue = approx;
    }

    return {
      totalPositions,
      totalTrades,
      totalRealizedPnl,
      grossOpenExposure,
      totalPortfolioValue,
      openPositionsMarketValue,
      netUnrealizedPnl,
      uniqueStocksCount: uniqueInstruments.size, // Number of unique stocks/instruments
      lastUpdated: new Date().toISOString()
    };
  } catch (e) {
    console.error('getPortfolioStats_ failed:', e);
    return {
      totalPositions: 0,
      totalTrades: 0,
      totalRealizedPnl: 0,
      grossOpenExposure: 0,
      totalPortfolioValue: 0,
      openPositionsMarketValue: 0,
      netUnrealizedPnl: 0,
      uniqueStocksCount: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Helpers
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function indexMap_(headers) {
  var map = {};
  headers.forEach(function (h, i) { map[String(h).trim()] = i; });
  return map;
}
function num_(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  var s = String(v).trim();
  // Normalize common unicode minus/dash characters to ASCII '-'
  // U+2212 (minus), U+2013 (en dash), U+2014 (em dash)
  s = s
    .replace(/\u2212|\u2013|\u2014|–|—/g, '-')
    .replace(/\u00A0/g, ' '); // NBSP -> space
  // Handle negatives in parentheses e.g. (1,234.56)
  var neg = false;
  if (/^\(.*\)$/.test(s)) {
    neg = true;
    s = s.replace(/^\((.*)\)$/, '$1');
  }
  // Remove currency symbols and any non numeric/sign/decimal/thousand chars
  s = s.replace(/[^0-9.,\-]/g, '');
  // If both comma and dot present, treat comma as thousand separator and strip it
  if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) {
    s = s.replace(/,/g, '');
  } else if (s.indexOf(',') >= 0 && s.indexOf('.') === -1) {
    // If only commas present, assume they are thousand separators for INR-style formatting
    s = s.replace(/,/g, '');
  }
  var n = Number(s);
  if (isNaN(n)) return 0;
  return neg ? -n : n;
}
function iso_(v) {
  if (v instanceof Date) return v.toISOString();
  var d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}
function action_(side) {
  var s = String(side || '').toLowerCase();
  if (s === 'buy' || s === 'long') return 'buy';
  if (s === 'sell' || s === 'short') return 'sell';
  return 'buy';
}
function nonEmptyRow_(r) {
  for (var i = 0; i < r.length; i++) {
    if (r[i] !== '' && r[i] != null) return true;
  }
  return false;
}

// ===== OTP Auth (Email-based) =====
// Sends a 6-digit OTP to the provided email and stores it in CacheService for 5 minutes.
// Adds basic rate limiting and attempt tracking.
function sendOtp_(email) {
  try {
    email = String(email || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return { success: false, error: 'Invalid email' };
    }

    // Log masked email and start of OTP flow
    try {
      var masked = email ? email.replace(/(^.).*(@.*$)/, '$1***$2') : '';
      console.log('[sendOtp_] Start for', masked);
    } catch {}

    var cache = CacheService.getScriptCache();
    var metaKey = 'otp_meta:' + email.toLowerCase();

    // Basic rate-limiting: at most 1 new code per 30 seconds
    var metaRaw = cache.get(metaKey);
    var meta = metaRaw ? JSON.parse(metaRaw) : { lastSentAt: 0, sendCount: 0 };
    var now = Date.now();
    if (now - (meta.lastSentAt || 0) < 30 * 1000) {
      try { console.warn('[sendOtp_] Rate limited for', email.replace(/(^.).*(@.*$)/, '$1***$2')); } catch {}
      return { success: false, error: 'Please wait before requesting another code' };
    }

    // Generate a 6-digit code
    var code = ('' + Math.floor(100000 + Math.random() * 900000));

    // Persist OTP to LoginMaster sheet (Column F) for the matching Gmail
    var sh = getLoginMasterSheet_();
    var row = findGmailRow_(sh, email);
    if (row === -1) {
      // Append new user with generated User ID and next Serial No
      var nextRow = sh.getLastRow() + 1;
      var serial = Math.max(1, nextRow - 1);
      var userId = Utilities.getUuid();
      // Columns: A Serial No | B User ID | C Name | D Gmail | E Password | F OTP
      sh.appendRow([serial, userId, '', email, '', code]);
    } else {
      sh.getRange(row, 6).setValue(code); // Col F: OTP
    }

    // Keep rate-limit meta in cache for 5 minutes
    cache.put(metaKey, JSON.stringify({ lastSentAt: now, sendCount: (meta.sendCount || 0) + 1 }), 300);

    // Send email (with colorful, labeled HTML and branded sender name)
    var subject = 'Your Trading Analysis OTP Code';
    var body = 'Your verification code is: ' + code + '\nThis code will expire in 5 minutes.'; // plaintext fallback
    var html =
      '<div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, \'Noto Sans\', sans-serif, \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Noto Color Emoji\'; background-color: #f8fafc; padding: 20px; color: #334155;">' +
        '<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; border: 1px solid #e2e8f0;">' +
          '<div style="background-color: #1a202c; padding: 24px; text-align: center;">' +
            '<h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">Trading Analysis</h1>' +
          '</div>' +
          '<div style="padding: 24px;">' +
            '<p style="font-size: 16px; line-height: 1.5; color: #334155; margin-bottom: 15px;">Hello,</p>' +
            '<p style="font-size: 16px; line-height: 1.5; color: #334155; margin-bottom: 15px;">Use the following One-Time Password (OTP) to log in to your Trading Analysis account:</p>' +
            '<div style="font-size: 32px; font-weight: 700; text-align: center; color: #1a202c; background-color: #f1f5f9; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; letter-spacing: 4px;">' + code + '</div>' +
            '<p style="font-size: 14px; line-height: 1.5; color: #64748b; margin-bottom: 15px;">This code is valid for 5 minutes. For your security, do not share this code with anyone.</p>' +
            '<p style="font-size: 14px; line-height: 1.5; color: #64748b; margin-bottom: 0;">If you did not request this OTP, please ignore this email or contact support.</p>' +
          '</div>' +
          '<div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">' +
            '<p style="font-size: 12px; color: #64748b; margin: 0;">&copy; ' + new Date().getFullYear() + ' Trading Analysis. All rights reserved.</p>' +
          '</div>' +
        '</div>' +
      '</div>';
    try {
      try { console.log('[sendOtp_] Attempting MailApp.sendEmail for', email.replace(/(^.).*(@.*$)/, '$1***$2')); } catch {}
      MailApp.sendEmail(email, subject, body, { name: 'Trading Analysis', htmlBody: html });
    } catch (mailErr) {
      // Even if email fails due to deployment perms, keep cache so dev can read logs and retry
      try { console.error('[sendOtp_] Mail send failed:', String(mailErr)); } catch {}
      return { success: false, error: 'Failed to send email: ' + String(mailErr) };
    }

    try { console.log('[sendOtp_] OTP email dispatched'); } catch {}
    return { success: true, message: 'OTP sent' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

function verifyOtp_(email, code) {
  try {
    email = String(email || '').trim();
    code = String(code || '').trim();
    try {
      var masked = email ? email.replace(/(^.).*(@.*$)/, '$1***$2') : '';
      console.log('[verifyOtp_] Start for', masked);
    } catch {}
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { success: false, error: 'Invalid email' };
    }
    if (!/^\d{6}$/.test(code)) {
      return { success: false, error: 'Invalid OTP format' };
    }
    // Look up OTP in LoginMaster sheet
    var sh = getLoginMasterSheet_();
    var row = findGmailRow_(sh, email); // Column D
    
    if (row === -1) {
      return { success: false, error: 'Email not found' };
    }
    
    // Get OTP from column F (index 5)
    var storedOtp = String(sh.getRange(row, 6).getValue() || '').trim();
    
    if (storedOtp === code) {
      // Clear OTP after successful verification
      sh.getRange(row, 6).setValue('');
      return { success: true, message: 'OTP verified' };
    } else {
      return { success: false, error: 'Invalid OTP' };
    }
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
