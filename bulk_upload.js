import exceljs from 'exceljs';
import {config as config_env} from "dotenv";
import * as fs from "fs";
import * as jwt from "./index.js";
import * as sfile from "./file_upload.js";
import jsforce from "jsforce";
import request from 'request';

config_env();

const path = process.env.PATH_XSLX_FILE;
const issuer = process.env.CLIENT_ID;
const subject = process.env.SUBJECT;
const audience = process.env.AUDIENCE;

// read keys
const privateKey = fs.readFileSync(process.env.PATH_PRIVATE_KEY, 'utf8');
var files = [];

// get xlsx file and loop through to extract the files
const workbook = new exceljs.Workbook();

workbook.xlsx.readFile(path)
    .then(function(book) {
        const sheet = book.getWorksheet(1);
        for (let index = 2; index <= sheet.actualRowCount; index++) {
            if (sheet.getRow(index).hasValues) {
                const fileextractvalues = sheet.getRow(index).values.filter(val => val);
                const fileextractkeys = sheet.getRow(1).values.filter(val => val);
                var fileobj = {}
                for (let index = 0; index < fileextractkeys.length; index++) {
                    fileobj[`${fileextractkeys[index]}`]=fileextractvalues[index];
                }
                files = [...files, fileobj]
            }
    }
    jwt.generateJWT({
        issuer,
        audience,
        subject,
        privateKey
    }).then(token => {
        return jwt.accessTokenFromJWT({
            token,
            audience
        })
    }).then(data => {
            if (process.env.CLIENT_ID && process.env.PATH_PRIVATE_KEY) {
                var conn = new jsforce.Connection({
                instanceUrl : data.instance_url,
                accessToken : data.access_token
              });
              files.map(file => {
                  console.log(file);
                    const uri = `${file.fileuri}/${file.pathonclient}`;
                    const filebuffer = fs.readFileSync(uri);
                    const metadata = {
                        "Title": file.title,
                        "PathOnClient": file.pathonclient,
                        "ContentLocation": file.contentlocation,
                        };
                    let uploadresp = sfile.uploadContentVersion(conn, metadata, filebuffer);
                    uploadresp.then(
                        resp => {
                          console.log('uploading file ', resp);
                          const query = `query?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id+=+'${resp.id}'`;
                          const contentid = sfile.getContentId(conn, query)
                          contentid.then(resp => {
                            console.log('file id ', resp);
                            const accountmeta = {
                              "ContentDocumentId": `${resp}`,
                              "LinkedEntityId": file.linkedentityid,
                              "Visibility": "AllUsers"
                            }
                            const filelink = sfile.linkfileaccount(conn, accountmeta)
                            filelink.then(
                              resp => {
                                console.log('conecction value ', resp.body);
                              }
                            )
                            .catch(e => console.log(e))
                          })
                          .catch(e => console.log(e))
                        }
                      )
                      .catch(e => console.log(e))
              })
        }}
    );
    });

