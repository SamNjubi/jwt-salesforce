import { config as config_env } from "dotenv";
import * as fs from "fs";
import { readFile } from 'fs/promises';
import * as sfile from "./upload_functions.js";
import * as auth from './authenticate.js';

config_env();

const issuer = process.env.CLIENT_ID;
const subject = process.env.SUBJECT;
const audience = process.env.AUDIENCE;
const filespath = process.env.FILES_PATH;
const mappings = process.env.MAPPINGS;
const privateKey = fs.readFileSync(process.env.PATH_PRIVATE_KEY, 'utf8');

const mappingsjson = JSON.parse(
  await readFile(
    new URL(mappings, import.meta.url)
  ));
// 1. Authenticate
// 2. Loop through each file
// for each check if the file contains uploadcvid, uploadcdid, linkedid
// if lacks uploadcvid - upload file, get the document id and link file with the account/entity it
// if has uploadcvid but lacks uploadcdid - get document id and link file
// if has uploadcvid and uploadcdid but lacks linkedid - link file.

const authconn = await auth.SalesforceConnection({ issuer, subject, audience, privateKey });
var mappingsUpload = mappingsjson.filter(value => (!value.uploadcdid || !value.linkedid));
console.log(mappingsUpload.length);
var i, j, tempArr;
var chunk = 10;

for (i = 0, j = mappingsUpload.length; i < j; i += chunk) {
  tempArr = mappingsUpload.slice(i, i + chunk);
  for (let index = 0; index < tempArr.length; index++) {
    const file = tempArr[index];
    console.log(file.ACCOUNT_NAME);
    if (!file.uploadcvid && !file.uploadcdid && !file.linkedid ) {
      try {
        const uri = `${filespath}/${file.FILE}`;
        const filebuffer = fs.readFileSync(uri);
        const metadata = {
          "Title": file.mapping.ATTACHMENTNAME,
          "PathOnClient": file.FILE,
          "ContentLocation": 'S',
        };
        let uploadcvidresp = await sfile.uploadContentVersion(authconn, metadata, filebuffer);
        console.log('Uploading cvid', uploadcvidresp);
        file.uploadcdid = uploadcvidresp;
        fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
        try {
          const query = `query?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id+=+'${uploadcvidresp.id}'`;
          const uploadcdidresp = await sfile.getContentId(authconn, query);
          console.log('Fetching cdid', uploadcdidresp);
          file.uploadcdid = uploadcdidresp;
          fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
          try {
            const accountmeta = {
              "ContentDocumentId": `${file.uploadcdid}`,
              "LinkedEntityId": file.NEW_ACCOUNT_ID,
              "Visibility": "AllUsers"
            }
            const filelinkresp = await sfile.linkfileaccount(authconn, accountmeta);
            console.log('File linked', filelinkresp.body.id);
            file.linkedid = filelinkresp.body.id;
            fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
          }
          catch (e) {
            sfile.errorLog(file, e)
          }
          finally {
            continue;
          }
        }
        catch (e) {
          sfile.errorLog(file, e)
        }
        finally {
          continue;
        }
      }
      catch (e) {
        sfile.errorLog(file, e)
      }
      finally {
        continue;
      }
    }
    if (file.uploadcvid && !file.uploadcdid) {
      try {
        const query = `query?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id+=+'${file.uploadcvid}'`;
        const uploadcdidresp = await sfile.getContentId(authconn, query);
        console.log('Fetching cdid', uploadcdidresp);
        file.uploadcdid = uploadcdidresp;
        fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
        try {
          console.log('Linking file id');
          const accountmeta = {
            "ContentDocumentId": `${file.uploadcdid}`,
            "LinkedEntityId": file.NEW_ACCOUNT_ID,
            "Visibility": "AllUsers"
          }
          const filelinkresp = await sfile.linkfileaccount(authconn, accountmeta);
          console.log('File linked', filelinkresp.body.id);
          file.linkedid = filelinkresp.body.id;
          fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
        }
        catch (e) {
          sfile.errorLog(file, e)
        }
        finally {
          continue;
        }
      }
      catch (e) {
        sfile.errorLog(file, e)
      }
      finally {
        continue;
      }
    }
    if (file.uploadcvid && file.uploadcdid && !file.linkedid) {
      try {
        console.log('Linking file id');
        const accountmeta = {
          "ContentDocumentId": `${file.uploadcdid}`,
          "LinkedEntityId": file.NEW_ACCOUNT_ID,
          "Visibility": "AllUsers"
        }
        const filelinkresp = await sfile.linkfileaccount(authconn, accountmeta);
        console.log('File linked', filelinkresp.body.id);
        file.linkedid = filelinkresp.body.id;
        fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
      }
      catch (e) {
        sfile.errorLog(file, e)
      }
      finally {
        continue;
      }
    }
    else {
      console.log('File is successfully linked');
    }
  }
}
