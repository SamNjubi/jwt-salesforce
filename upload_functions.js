import request from 'request';
import {config as config_env} from "dotenv";

config_env();

const version = process.env.VERSION;

export const uploadContentVersion = async (conn, metadata, file) => {
  return new Promise((resolve, reject) => {
    const connection = conn;
    request.post({
      url: connection.instanceUrl + `/services/data/${version}/sobjects/ContentVersion`,
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
      url: connection.instanceUrl + `/services/data/${version}/` + query,
      auth: { bearer: connection.accessToken}
    },
    (err, response) => {
      if (err)
        reject(err)

      resolve(JSON.parse(response.body).records? JSON.parse(response.body).records[0].ContentDocumentId: 'None')
    })
  })
} 
export const linkfileaccount = async(conn, metadata) => {
  return new Promise((resolve, reject) => {
    request.post({
      url: conn.instanceUrl + `/services/data/${version}/sobjects/ContentDocumentLink`,
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