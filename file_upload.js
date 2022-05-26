import {config as config_env} from "dotenv";
import * as fs from "fs";
import * as jwt from "./index.js";
import jsforce from "jsforce";
import request from 'request';

export const uploadfile = async (conn, metadata, filebuff, linkeentityid) => {
  console.log('conenction', conn);
  let uploadfileresp = uploadContentVersion(conn, metadata, filebuff);
  uploadfileresp.then(
    resp => {
      console.log('uploading file ', resp);
      const query = `query?q=SELECT+ContentDocumentId+FROM+ContentVersion+WHERE+Id+=+'${resp.id}'`;
      const contentid = getContentId(conn, query)
      contentid.then(resp => {
        console.log('file id ', resp);
        const accountmeta = {
          "ContentDocumentId": `${resp}`,
          "LinkedEntityId": linkeentityid,
          "Visibility": "AllUsers"
        }
        const filelink = linkfileaccount(conn, accountmeta)
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
}

export const uploadContentVersion = async (conn, metadata, file) => {
  return new Promise((resolve, reject) => {
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

}
export const getContentId = async (conn, query) => {
  return new Promise((resolve, reject) => {
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
} 
export const linkfileaccount = async(conn, metadata) => {
  return new Promise((resolve, reject) => {
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
} 