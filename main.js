#!/usr/bin/env node
const puppeteer = require("puppeteer");
const prompt = require('prompt-sync')({
    history: require('prompt-sync-history')(),
    sigint: false
  });
const fs = require("fs");

const config = require("./config");
require("dotenv").config();

var service = new Object();
if( !process.env.PROFILE ){
  process.env.IG_ACCOUNT = process.env.IG_ACCOUNT || prompt('Instagram: ');
  process.env.IG_PASSWORD = process.env.IG_PASSWORD || prompt.hide("Password: ");
  console.clear();
}else{
  console.log(`Using profile "${process.env.PROFILE}"`);
  config.args.push(`--user-data-dir="${process.env.PROFILE}"`);
  console.log( config )
}

(async function(){
  let cookies = fs.existsSync("cookies.json") 
      ? JSON.parse(fs.readFileSync("cookies.json"))
      : false;

  service.browser = await puppeteer.launch( config );
  service.page    = await service.browser.newPage( );
  service.target  = Object.keys( process.env ).filter( v=>/TARGET\S?/.test(v) ).map( key=>process['env'][key] );

  service.progress = [
    // async () => await service.page.goto( "https://www.instagram.com" ),
    // async () => (process.env.PROFILE ? "pass" : 0),
    // async () => await LOGIN( service, {
    //   account: process.env.IG_ACCOUNT,
    //   password: process.env.IG_PASSWORD
    // } ),
    // async () => await service.page.waitForTimeout( 5000 ),
    async () => await service.page.goto("https://www.instagram.com/direct/inbox/"),
    async () => await service.page.waitForTimeout( 3000 ),
    async () => await findTarget( service ),
  ]
  if( cookies ){
    await service.page.setCookie( ...cookies );
  }

  await main( service );
})();


async function main( service ){
  for( let i = 0 ; i < service.progress.length ; i++ ){
    let { progress } = service;
    let res = await progress[ i ]( );
    if( res && res.save == true ){
      console.log( res );
      // store data
    }
    if( res && res.action ){
      await res.action( service );
    }
    if( res == "pass" )
      i++;
  }
  service.browser.close();
}

async function LOGIN( service, info ){
  try{
    await page.waitForSelector('[name="username"]');

    await service.page.focus('[name="username"]');
    await service.page.keyboard.type( info.account );
    await service.page.focus('[name="password"]');
    await service.page.keyboard.type( info.password );
    await service.page.click('[type="submit"]');
    delete process.env.IG_PASSWORD;
    delete info.password;
    //fs.writeFileSync("cookies.json", JSON.stringify( cookies ));
    
  }catch( e ){
    console.log("Waiting for instagram");
    await service.page.waitForTimeout(1000);
    await LOGIN( service, info );
  }
}
async function findTarget( service ){
  let target = service.target.shift();
  console.log( "target", target );
  await service.page.click(`[href="/direct/t/${target}"]`);
  await sendImages( service );
  console.log("OK", target);
  return {
    action: async () => {
      console.log( service.target );
      if( service.target.length > 0 )
        service.progress.push( async () => await findTarget( service ) )
    }
  }
  // unfinish function, because im lazy.sssssss
}

async function sendImages( service ){
  await service.page.waitForSelector('input[type=file]');
  const inputUploadHandle = await service.page.$('input[type=file]');
  let fileToUpload = './images/test_to_upload.jpg';
  inputUploadHandle.uploadFile(fileToUpload);
}