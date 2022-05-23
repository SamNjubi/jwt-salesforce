import {config as config_env} from "dotenv";
import * as fs from "fs";
import * as jwt from "./index.js";
import jsforce from "jsforce";
import request from 'request';

config_env();

const issuer = process.env.CLIENT_ID;
const subject = process.env.SUBJECT;
const audience = process.env.AUDIENCE;

// read keys
const privateKey = fs.readFileSync(process.env.PATH_PRIVATE_KEY, 'utf8');

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
    (async () => {
        if (process.env.CLIENT_ID && process.env.PATH_PRIVATE_KEY) {
            var conn = new jsforce.Connection({
            instanceUrl : data.instance_url,
            accessToken : data.access_token
          });
          ///// pdf files read and post in buffer /////
          // const uri = './AAP-Zone_03.pdf';
          const uri = './account2.csv';
          const filebuffer = fs.readFileSync(uri);
          const metadata = {
              "Title": "Accounts 2",
              "PathOnClient": "Account 2.csv",
              "ContentLocation": 'S',
              };
          let uploadfileresp = uploadContentVersion(conn, metadata, filebuffer);

          uploadfileresp.then(
            resp => {
              // console.log(resp);
              const query = `query?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id+=+'${resp.id}'`;
              const contentid = getContentId(conn, query)
              contentid.then(resp => {
                // console.log(resp);
                const accountmeta = {
                  "ContentDocumentId": `${resp}`,
                  "LinkedEntityId": "0010500000RMfGYAA1",
                  "Visibility": "AllUsers"
                }
                const filelink = linkfileaccount(conn, accountmeta)
                filelink.then(
                  resp => {
                    console.log(resp.body);
                  }
                )
                .catch(e => console.log(e))
              })
              .catch(e => console.log(e))
            }
          )
          .catch(e => console.log(e))
           
        } else {
            throw 'set environment variable with your orgs client id and private key path'
        }
    })();
})

const uploadContentVersion = (conn, metadata, file) =>
  new Promise((resolve, reject) => {
    const connection = conn;
    request.post({
      url: connection.instanceUrl + '/services/data/v54.0/sobjects/ContentVersion',
      auth: {
        bearer: connection.accessToken
      },
      formData: {
        entity_content: {
          value: JSON.stringify(metadata),
          options: {
            contentType: 'application/json'
          }
        },
        VersionData: {
          value: file,
          options: {
            filename: metadata.PathOnClient,
            contentType: 'application/octet-stream'
          }
        }
      }
    }, (err, response) => {
      if (err)
        reject(err)

      resolve(JSON.parse(response.body))
    })
  })
const getContentId = (conn, query) => 
  new Promise((resolve, reject) => {
    const connection = conn;
    request.get({
      url: connection.instanceUrl + '/services/data/v54.0/' + query,
      auth: { bearer: connection.accessToken}
    },
    (err, response) => {
      if (err)
        reject(err)

      resolve(JSON.parse(response.body).records[0].ContentDocumentId)
    })
  })
const linkfileaccount = (conn, metadata) => 
  new Promise((resolve, reject) => {
    request.post({
      url: conn.instanceUrl + '/services/data/v54.0/sobjects/ContentDocumentLink',
      auth: { bearer: conn.accessToken},
      body: metadata,
      json: true
    },
    (err, response) => {
      if (err)
        reject(err)

      resolve(response)
    })
  })