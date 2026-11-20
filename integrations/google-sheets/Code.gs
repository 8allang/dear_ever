/** Run setup once, then deploy as a Web app: Execute as Me / Access Anyone.
 * Never share the resulting spreadsheet publicly. Only this script appends rows.
 */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  var book = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('청첩장 참석 응답');
  props.setProperty('SPREADSHEET_ID', book.getId());
  var sheet = book.getSheetByName('참석 응답') || book.insertSheet('참석 응답');
  if (sheet.getLastRow() === 0) sheet.appendRow(['접수 시간', '성함', '초대측', '참석 여부', '본인 포함 인원', '식사 여부', '요청 ID']);
  console.log('응답 확인용 시트: ' + book.getUrl());
}
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Form')
    .setTitle('참석 의사 전달')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function submitRsvp(input) {
  if (!input || typeof input !== 'object' || input.website || input.consent !== true) throw new Error('동의 항목과 입력 내용을 확인해주세요.');
  var name = String(input.name || '').trim();
  if (!name || name.length > 40 || !/^(groom|bride)$/.test(input.side) || !/^(yes|no)$/.test(input.attending) || !/^(yes|no)$/.test(input.meal)) throw new Error('입력 형식이 올바르지 않습니다.');
  var guests = input.attending === 'yes' ? Number(input.guests) : 0;
  if (!Number.isInteger(guests) || guests < 0 || guests > 10 || (input.attending === 'yes' && guests < 1)) throw new Error('참석 인원을 확인해주세요.');
  if (typeof input.requestId !== 'string' || !/^[a-zA-Z0-9-]{20,80}$/.test(input.requestId)) throw new Error('새로 열어 다시 시도해주세요.');
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('아직 접수 준비 중입니다. 초대자에게 문의해주세요.');
  var lock = LockService.getScriptLock();lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.openById(id).getSheetByName('참석 응답');
    var duplicate = sheet.getRange('G:G').createTextFinder(input.requestId).matchEntireCell(true).findNext();
    if (duplicate) return {ok:true};
    // Force strings that could be interpreted as spreadsheet formulas to text.
    if (/^[=+@\-\t\r\n]/.test(name)) name = "'" + name;
    sheet.appendRow([new Date(), name, input.side === 'groom' ? '신랑측' : '신부측', input.attending === 'yes' ? '참석' : '불참', guests, input.attending === 'yes' && input.meal === 'yes' ? '식사 예정' : '식사 안 함', input.requestId]);
    return {ok:true};
  } finally { lock.releaseLock(); }
}
