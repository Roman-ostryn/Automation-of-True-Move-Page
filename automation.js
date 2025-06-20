const express = require("express");
const cors = require("cors")
const puppeteer = require("puppeteer");

const app = express();
const port = 3000;

app.use(cors({origin: '*'}));

app.use(express.json());

// The function of UUID
// function fncUUIDGen() {
//   const now = new Date();
//   return now.getFullYear().toString()
//     + now.getMonth().toString()
//     + now.getDate().toString()
//     + now.getHours().toString()
//     + now.getMinutes().toString()
//     + now.getSeconds().toString()
//     + now.getMilliseconds().toString()
//     + (Math.floor((Math.random() * 100) + 1)).toString();
// }

app.get("/", async (req, res) => {
  res.send("hello form the server");
});

app.get("/trigger", async (req, res) => {
 
 const fetch = (await import('node-fetch')).default;

 const browser = await puppeteer.launch({
   executablePath: '/usr/bin/google-chrome', 
   headless: False,
   args: ['--no-sandbox',
     '--disable-setuid-sandbox',
     '--disable-dev-shm-usage',
     '--disable-web-security',
     '--proxy-server=http://127.0.0.1:9000',
     '--user-agent=Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.77 Mobile Safari/537.36'
   ]
 });

 const page = await browser.newPage();
 
 // Fetching UUID
 let extractedUUID = null; // Declare it globally so you can access it later

 page.on('request', request => {
 const url = request.url();
 const method = request.method();

 if ( url.includes('minsert.truecorp.co.th') && method === 'POST' ) {
   const postData = request.postData();
   console.log("Captured Payload:", postData);

   const match = postData.match(/<uuid>(.*?)<\/uuid>/);
   if (match && match[1]) {
     extractedUUID = match[1];
     console.log("✅ Extracted UUID:", extractedUUID);
   }
 }
 });

 await page.setViewport({
   width: 375,
   height: 812,
   isMobile: true,
   hasTouch: true
 });

// Fetching Request Headers
 const userAgent = req.headers["user-agent"] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
// const xNetwork = req.headers["x-network"] || "TrueMoveH";
// const acceptLang = req.headers["accept-language"] || "en-US,en;q=0.9";
// const contenttype = req.headers["Content-Type"] || 'application/x-www-form-urlencoded';
// const requesturl = req.headers["Request URL"] || 'https://minsert.truecorp.co.th/webapi/';


 await page.setExtraHTTPHeaders({
   'User-Agent': userAgent,
   'X-Network': 'TrueMoveH',
   'Referer': 'https://bigfunzones.com',
   'Accept-Language': 'en-US,en;q=0.9'
 });

 await page.evaluateOnNewDocument(() => {
   Object.defineProperty(navigator, 'platform', {
     get: () => 'Linux armv8l'
   });
   Object.defineProperty(navigator, 'maxTouchPoints', {
     get: () => 5
   });
   Object.defineProperty(navigator, 'hardwareConcurrency', {
     get: () => 4
   });
 });

 try {
    await page.goto('https://tracking.bigfunzones.com/api?svkey=4236006&telco_id=2&sub=01', {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({ path: 'step1-landing.png' });

    const { HttpsProxyAgent } = require('https-proxy-agent');
    const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:9000');

    const xmlBody = `<UpdateMobileRequest><uuid>${extractedUUID}</uuid></UpdateMobileRequest>`;
    const mformData = 'data=' + encodeURIComponent(xmlBody);

    // Get MSISDN 
    const mResponse = await fetch('https://minsert.truecorp.co.th/webapi/', {
      method: 'POST',
      headers: {
        'Accept': 'application/xml, text/xml',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://bigfunzones.com',
        'Referer': 'https://bigfunzones.com',
        'User-Agent': userAgent,
      },
      body: mformData,
      agent: proxyAgent
    });
    const mText = await mResponse.text();
    const formData = `<UpdateMobileRequest><uuid>${extractedUUID}</uuid></UpdateMobileRequest>`

    // Get Token
    const apiResponse = await fetch('https://minsert.truecorp.co.th/webapi/', {
      method: 'POST',
      headers: {
        'Accept' : 'application/xml', 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://bigfunzones.com',
        'Referer': 'https://bigfunzones.com',
        'User-Agent': userAgent,
      },
      body: formData,
      agent: proxyAgent
    });
    const tokenText = await apiResponse.text();
    const tokenMatch = tokenText.match(/<token-id>(.*?)<\/token-id>/i);
    const token = tokenMatch ? tokenMatch[1] : null;

    // Get MSISDN with username/password
    const getInsertionXML = `<GetInsertionRequest><token-id>${token}</token-id><x-params>X-msisdn</x-params></GetInsertionRequest>`;
    const insertionResponse = await fetch('https://insertion.truecorp.co.th', {
      method: 'POST',
      headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${process.env.API_USER}:${process.env.API_PASS}`).toString('base64')
               },
               body: 'data=' + encodeURIComponent(getInsertionXML),
              });         
    const insertionText = await insertionResponse.text();
    const msisdnMatch = insertionText.match(/<msisdn>(\d+)<\/msisdn>/i); 
    const msisdn = msisdnMatch ? msisdnMatch[1] : mText;

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log("\n👤 UserAgent:", userAgent);
    console.log("👤 User IP:",  ip);
    console.log("📞 MSISDN:", msisdn);
    console.log("✅ Extracted Token:", token);
    console.log("📦Extracted UUID:",extractedUUID);

// Sending Data
    await fetch('https://insertion.truecorp.co.th', {
      method: 'POST',
      headers: {
              'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          extractedUUID,
          token,
          msisdn,
          ip
      })
    });
    console.log("\n📤 Data sent to your server.");

    await page.waitForSelector("button.click-img", { timeout: 20000 });
    const btn = await page.$("button.click-img");
    const box = await btn.boundingBox();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2),
    ]);

    console.log("\n✅ Clicked first button");

// Fetching Params
    const url = page.url(); // get the full URL
    const urlParams = new URL(url).searchParams;
    const tranid = urlParams.get('tranid');
    const svkey = urlParams.get('svkey');
    const cpart = urlParams.get('cpart');
    const svname = urlParams.get('svname');
    const ptid = urlParams.get('ptid');
    const telco = urlParams.get('telco');
    const refflow = urlParams.get('refflow');
    const svdetail = urlParams.get('svdetail');

// Setting Cookie    
        await page.setCookie(
  {
    name: 'PHPSESSID',
    value: 'bioqsct98n9if6cpphb49e744q',
    domain: 'example.com',       // 🔁 Replace with the correct domain
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax'
  },
  {
    name: 'pixel',
    value: 'x223.328125y475.1015625',
    domain: 'example.com',
    path: '/'
  },
  {
    name: 'reload',
    value: '1',
    domain: 'example.com',
    path: '/'
  }
);

  //  console.log('tranid:', tranid);
  //  console.log('cpart:', cpart);
  //  console.log('svkey:', svkey);
  //  console.log('svname:', svname);
  //  console.log('ptid:', ptid);
  //  console.log('telco:', telco);
  //  console.log('refflow:', refflow);
  //  console.log('svdetail:', svdetail);

    await page.screenshot({ path: 'step2-after-click.png' });

//    const atoken = "03AFcWeA5oNunJ9ZXrwGaR-ZkojJ-02Emt3IcYrhkk130lTgKaL9rDznyQBz7tzpTwVVBu6BLzfQCkNuZPqfhooR0dUEKAZ5gvx738MYJOiClNmvAjXDR-XfpSKiOwKYfcde4ATyxUEQOfClj1L5o06V6NX7LHIZzvvtpP2BNTsHfp84IOi6QY3piSn5>
//    const ptoken = "c5022ab3de63dd4d66de115d71f4ea9511e3ebdb59927e8cda1b6f088652a5e5dcbe535b6ad208e9c584fb1b185ab5d5c966251c7bc371df8fc0b71d4626049f"
//    const aformData = `<GetInsertionRequest><token-id>${atoken}</token-id><p-token>${ptoken}</p-token></GetInsertionRequest>`

    const getHeaderLP = {
  "_USER_AGENT": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "_REMOTE_ADDR": "49.237.21.175",
  "_OS": "Windows 10",
  "_BROWSER": "Chrome",
  "_ClientIP": "49.237.21.175",
  "_SESSION_ID": "bioqsct98n9if6cpphb49e744q",
  "_HEADER": {
    "X-Stgw-Time": "1747311989.621",
    "Host": "bigfunzones.com",
    "X-Client-Proto": "https",
    "X-Forwarded-Proto": "https",
    "X-Client-Proto-Ver": "HTTP/2.0",
    "X-Real-IP": "49.237.21.175",
    "X-Forwarded-For": "49.237.21.175",
    "Connection": "keep-alive",
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "navigate",
    "sec-fetch-user": "?1",
    "sec-fetch-dest": "document",
    "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "referer": "https://bigfunzones.com/click-flow/lp?tranid=6825dd3c7200711f041d31fb&cpart=0&svname=Horo%20DDD5&svkey=00601&ptid=opra&telco=TRUEH&refflow=643f62bf720071334f58ca6e&svdetail=2-C1-2-R1",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-US,en;q=0.9",
    "priority": "u=0, i",
    "cookie": "REF_FLOW=643f62bf720071334f58ca6e; PHPSESSID=bioqsct98n9if6cpphb49e744q; pixel=x223.328125y475.1015625; reload=0"
  },
  "_GET_PARAM": {
    "reference": "GQWTB5J0GU",
    "tranid": "6825dd3c7200711f041d31fb",
    "cpart": "0",
    "svname": "Horo DDD5",
    "svkey": "00601",
    "ptid": "opra",
    "telco": "TRUEH",
    "svdetail": "2-C1-2-R1"
  }
};
// Sending data for Final Page
    const getHeaderLPString = JSON.stringify(getHeaderLP);  
    const aformData = new URLSearchParams({
      cmd: 'confirm_v3',
      'token-id': "03AFcWeA5oNunJ9ZXrwGaR-ZkojJ-02Emt3IcYrhkk130lTgKaL9rDznyQBz7tzpTwVVBu6BLzfQCkNuZPqfhooR0dUEKAZ5gvx738MYJOiClNmvAjXDR-XfpSKiOwKYfcde4ATyxUEQOfClj1L5o06V6NX7LHIZzvvtpP2BNTsHfp84IOi6QY3piSn5hHKSn5hHKZL-KjNlax20BD5p7gSaA3TOVrVxbJRHelgMyPL6WudakszEg6hHlCzadx9VdT4qJDoJHWiWqFFHkNG7P9gqu6DRN7lAJg8DPTYPzg5Cf0F1Td-a5lN_ypx2D3vsguUGNUn1dIDI2YGW5fHgtTJzCAgql-8IHYcDMOD5KJOumKoDY8DgedV5quSDVjSHr5e3waujnjEJUOOKEJUOOKu76uOBNVQzW-V4ANe1GFYI_VSU8CW12_IsoaLHkqSYF22Xkt_OFNZ4p8RCKlCT_Poxi6WohkxfdJxAUl_FMfnlPWCzxMmAAnznZ8RlD5eAZPDCzGSvmRoKcm8hIbjOUoE6I_WQEI0_TeFVfq0PtGbeDQWO8wmT1O2TVl1DL5kEjxfNsVVysUq5kyrpGTiENgmx-XXk7WlxSk7WlxSXTEQcIXnlC5jF_2bwNgNQjcsmfdQwAsYiOl27RsVbsHWtc2dHYrZD-xVWWNGUb7uazrZlYeX6oLuNV8gfczi5Apfk5C_EubNx7I3pFvTNQscqhTUYpV6XjR_jrPvWiKhYG6I6qEn2_LrLt7nPXfSYa3tTfLE4QgLdW45CGWWeQMocoxXNSZpF-Scat-CZpyqpIU4kNy6WThNy6WThqM5bolVhwUx3Nb4fB5k3uIDVvBh44pfLkQ0mtWhpT2m9xKS6dwiiIfSx_grZoblxE2q9ih2d1KN1Hz99sK18y4J-kj4qWbNN75mTEIxbmDFZLxtlfFdcBgVWYP4Wj4SuMXz_sXk0rHwfNVapsu1hPQ7CgexiLkH_toU4CilJzIGhL5JjCWCJNWJe4_Tbk2bpuR3BCRAfCEP<RAfCEPDRR2zffa6ds8Nt0q9jiO4dA1Ye7nGxAg64V4heJFM2nOXn5KpR9B21BApW7bdPVt1N67w-aFXIZjLcuo9cGduzij2M5abbNzoA9xwtsk4xsL_yX9DNx4CWL9EMww7Yed21eln87-hFJ4RAnQJXVNtm7x0csDgDdzNp3vNfgwtT5eDeXSkyId_UaIq4_9o6MuZLNp1uxf8h1uxf8h1zaP-wS-RVPXOvk3oy5OFVjninyjCnSJakDKvolJOOuYUobdndiop5DLsV7EbujJkzUGy9saY2GkUv-PvjfW-px8y1_xpJOu3wSuq9DYpxQYW2fTODSHtSw3Mrd7i0TUlfLhMPUYYN-wfg5-l9YGdyTvCBpWPy_ovC33LpzulMlDkCm5sUOGVZRYG7cPnNcJWHf09C-M0McD-M0McDMnY4K9eCXCK09homyX6ArdSoVLnDX5tU1aFSwJE3B-z-gbSjhRXcWta4UNqtBQhYarxGFdZOGT36hInxLeFYHdgsLs9Uoa2UBnBckx-jZMy_oS8Lh2BvnrVP0tOwx6jS6Yl2RGWPTwzpiBofMyA32kU6RaDZwtyPaChuGNs7QCWzOeb0N1O9bSYZHqhJajzaXuj_XBsu1BHBsu1BHwokIyeNaaTwEOT9mJZXjYTkTn_QHxbE3muJ2aK3udmbQPhNlrB7AVjqJfem96QMhluM9imG6g8z4jg0ArZf4FfGNUqSiMfH53I9FUKVJIJB8DUHt_E5RMkjcXVbDXtvfDzACBfs04xzDifuMiGuabcskpO1HF0wY2QpFptt0IBDZ-8veePntCMRN1f2vHhDS02_zf424xtC424xtCW785Fu3GHcV6o2wmUdmU1YvCeSzefJiVDvfa5CC_T8HDfRxrXrz72IVruf6neFK3DA6BExfoqUi2jW4tj168fXRkSK24Nw0l7-ibXE9HgtU4Zk8IzVtaxlIlDIAvneqm8_CPnrAeCk8sI-Vl8HvorQm4KGMPBGOfc8M66L1O6x9HbITpAMQmHRb3Ab4_CYr5egTMTQ4ByUFQ4ByUF1QE1aWdNZ5XPoE7M2QRZEgzGCPTf0VzypHz77jrW3k5n",
      'p-token': "c5022ab3de63dd4d66de115d71f4ea9511e3ebdb59927e8cda1b6f088652a5e5dcbe535b6ad208e9c584fb1b185ab5d5c966251c7bc371df8fc0b71d4626049f",
      ptid: 'opra',
      getHeaderLP: getHeaderLPString,
    });
    const aResponse = await fetch('https://bigfunzones.com/service/click-flow/aoc.php', {
      method: 'POST',
      headers: {
        'Accept' : 'application/xml, text/xml', 
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://bigfunzones.com',
        'Referer': 'https://bigfunzones.com/click-flow/aoc?reference=GQWTB5J0GU&tranid=6825dd3c7200711f041d31fb&cpart=0&svname=Horo%20DDD5&svkey=00601&ptid=opra&telco=TRUEH&svdetail=2-C1-2-R1',
        'User-Agent': userAgent,
      },
      body: aformData,
    });
    const aText = await aResponse.text();
    console.log("\n🔵 aRespnse:", aText);

    await page.waitForSelector("#submitOTP", { timeout: 20000, visible: true });
    await new Promise((res) => setTimeout(res, 500));

    const otpBtn = await page.$("#submitOTP");
    if (!otpBtn) {
        throw new Error("submitOTP button not found");
          }
    const otpBox = await otpBtn.boundingBox();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.touchscreen.tap(otpBox.x + otpBox.width / 2, otpBox.y + otpBox.height / 2),
    ]);  
    console.log("✅ Clicked second button");

    await page.goto('https://bigfunzones.com/click-flow/thankyou?reference=W5IHTFAB9W', {
    waitUntil: 'domcontentloaded',
    timeout: 120000
    });

// Final Sending Data
    const uuidPayload = `<UpdateMobileRequest><uuid>${extractedUUID}</uuid></UpdateMobileRequest>`;
    console.log(uuidPayload);
    const updateResponse = await fetch('https://bigfunzones.com/service/click-flow/update.php', {
      method: 'POST',
      headers: {
        'Accept' : 'application/xml, text/xml', 
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://bigfunzones.com',
        'Referer': 'https://bigfunzones.com/click-flow/aoc?reference=GQWTB5J0GU&tranid=6825dd3c7200711f041d31fb&cpart=0&svname=Horo%20DDD5&svkey=00601&ptid=opra&telco=TRUEH&svdetail=2-C1-2-R1',
        'User-Agent': userAgent,
      },
      body: uuidPayload,
    });

    const updateText = await updateResponse.text();
    console.log("\n✅ Final Response:", updateText);    

    await page.screenshot({ path: "step3-after-submit.png" });

    await page.waitForSelector("a.btn.btn-red.btn-square.mt-3.btn-lg.w-75", { visible: true });

    const fBtn = await page.$("a.btn.btn-red.btn-square.mt-3.btn-lg.w-75");
    if (!fBtn) {
      throw new Error("Final button not found");
    }
    const fBox = await fBtn.boundingBox();

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.touchscreen.tap(fBox.x + fBox.width / 2, fBox.y + fBox.height / 2),
    ]);

    console.log("✅ Clicked third button");

    await page.screenshot({ path: "step4-after-submit.png" });

    await page.waitForNavigation({ waitUntil: "networkidle0" });
    await page.screenshot({ path: "step4-third-page.png", fullPage: true });
    console.log("✅ Completed automation flow");

    res.send("success!");

  } catch (error) {
    console.error('⚠️ Error:', error.message);
  }
  finally {
    await browser.close()
  }

  // res.send("triggered");
});

app.listen(port, () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
//  console.log(`Server running on http://localhost:${port}`);
});

//ok
          
           
          