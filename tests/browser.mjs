// Browser for the layout regressions. RHINE_BROWSER points at any Chromium
// executable; otherwise Windows uses the installed Edge and other systems use
// a browser installed with `npx playwright install chromium`.
import {chromium} from 'playwright';
export function launchBrowser(){
  if(process.env.RHINE_BROWSER)return chromium.launch({headless:true,executablePath:process.env.RHINE_BROWSER});
  return chromium.launch(process.platform==='win32'?{headless:true,channel:'msedge'}:{headless:true});
}
