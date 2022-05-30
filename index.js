import {config as config_env} from "dotenv";
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
mappingsjson.map(file => {
  if (!file.uploadcvid) {
    const uri = `${filespath}/${file.FILE}`;
    const filebuffer = fs.readFileSync(uri);
    const metadata = {
        "Title": file.FILE,
        "PathOnClient": file.FILE,
        "ContentLocation": 'S',
        };
    let uploadresp = sfile.uploadContentVersion(authconn, metadata, filebuffer);
    uploadresp.then(
        resp => {
          file.uploadcvid = resp.id;
          fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
          const query = `query?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id+=+'${resp.id}'`;
          const contentid = sfile.getContentId(authconn, query)
          contentid.then(resp => {
            console.log('file id ', resp);
            file.uploadcdid = resp;
            fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
            const accountmeta = {
              "ContentDocumentId": `${resp}`,
              "LinkedEntityId": file.NEW_ACCOUNT_ID,
              "Visibility": "AllUsers"
            }
            const filelink = sfile.linkfileaccount(authconn, accountmeta)
            filelink.then(
              resp => {
                console.log('conection value ', resp.body.id);
                file.linkedid = resp.body.id;
                fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
              }
            )
            .catch(e => console.log(e))
          })
          .catch(e => console.log(e))
        }
      )
      .catch(e => console.log(e))
  }
  if (file.uploadcvid && !file.uploadcdid) {
    const query = `query?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id+=+'${file.uploadcvid}'`;
    const contentid = sfile.getContentId(authconn, query)
    contentid.then(resp => {
      console.log('file id ', resp);
      file.uploadcdid = resp;
      fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
      const accountmeta = {
        "ContentDocumentId": `${resp}`,
        "LinkedEntityId": file.NEW_ACCOUNT_ID,
        "Visibility": "AllUsers"
      }
      const filelink = sfile.linkfileaccount(authconn, accountmeta)
      filelink.then(
        resp => {
          console.log('conection value ', resp.body.id);
          file.linkedid = resp.body.id;
          fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
        }
      )
      .catch(e => console.log(e))
      })
  }
  if (file.uploadcvid && file.uploadcdid && !file.linkedid) {
    const accountmeta = {
      "ContentDocumentId": `${file.uploadcdid}`,
      "LinkedEntityId": file.NEW_ACCOUNT_ID,
      "Visibility": "AllUsers"
    }
    const filelink = sfile.linkfileaccount(authconn, accountmeta)
    filelink.then(
      resp => {
        console.log('conection value ', resp.body.id);
        file.linkedid = resp.body.id;
        fs.writeFileSync(mappings, JSON.stringify(mappingsjson));
      }
    )
    .catch(e => console.log(e))
  }
})