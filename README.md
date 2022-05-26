# salesforce-jwt

Using the JWT OAuth Flow requires you to:

- Generate a public/private key pair
- Create a Connected App
- Generate a JWT signing it with the private key
- Exchange the JWT for an access token
- Use the access token as a Bearer token

Below there is a section for each of the above steps.

## Generate public/private key pair

Generate a public/private keypair using openssl and fill in the required info when you generate the certificate.

```
openssl req -newkey rsa:2048 -nodes -keyout private_key.pem -x509 -days 365 -out certificate.pem
openssl x509 -outform der -in certificate.pem -out public_key.der
openssl x509 -in certificate.pem -pubkey > public_key.pem
```

## Create a Connected App

In Salesforce create a Connected App through the App Manager in Setup and upload the public key (public_key.cer from the above steps) to the app. Be sure to select the offline_access scope as well as other required scopes. For testing the `openid` scope is always good. Save the Connected App and make a note of the consumer key (client_id).

**Please note**: If you plan on using the JWT to issue an access token the user must have authorized the Connected App _or_ it must be marked admin approved and the Connected App added to the user profile or assigned with a permission set. You must also ensure that the `refresh_token, offline_access` scope gets assigned.

## Generate a JWT

Use the node.js app in this repo to create a JWT. Once you've cloned the repo create a `.env` file with the following
keys:

- SUBJECT (the username of the user to impersonate)
- CLIENT_ID (the consumer key (client_id) of the Connected App you created)
- **optional** AUDIENCE (https://login.salesforce.com or https://test.salesforce.com as appropriate)
- PATH_PRIVATE_KEY (path to the pem-file with the private key (`private_key.pem`from above))
- PATH_PUBLIC_KEY (path to the pem-file with the public key (`public_key.pem`from above))

**Please note:** The JWT expires in 5 minutes so be quick about exchanging it for an access token!

```
npm install
node access_token.js --- run this to add records to salesforce objects i.e. add accounts to account object
node file_upload.js --- run this to upload files and connect them with the specific record i.e a specific account, in this scenario Axios Account 3 is used with its linkedEntityId hardcoded.
```
// Requires node v18+ 
## Exchange the JWT for an access token

Using Postman or similar post to the OAuth token-endpoint of Salesforce specifying a `grant_type`-parameter of `urn:ietf:params:oauth:grant-type:jwt-bearer` and specify the JWT in the `assertion` parameter.

```
POST /services/oauth2/token HTTP/1.1
Host: test.salesforce.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 731
Connection: close

grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1NzQzNDQzNDcsImV4cCI6MTU3NDM0NDY0NywiYXVkIjoiaHR0cHM6Ly9sb2dpbi5zYWxlc2ZvcmNlLmNvbSIsImlzcyI6Inh5ejEyMyIsInN1YiI6Impkb2VAZm9vLmRlbW8ifQ.jpEPDj_9DEhzvCUGwvEefZvd63IPvtBAZCSJ_-RJ-nlAqktbwoMoCrUFb_S1u0xRuWKBhwY7Mg58claQN2UTyxhjjDYzchIRsTbrRB-KNxzd6J_ew0of8IpB8NWN_1245KuO9clfo_Yoq8wwZUTBSSt55jh4-TyjpRg4UjIikus76GZL0xvWBWfGD2zxgshOgWMk-sewJE5REGP8FPz-SqV6L_o_ua82FbBvpchwRavFmK-y0E8kDNtoOhJyW-P8jvTMfZog1hslqPQBF6-z9EBUGFb482DrEh1vspwIGV-ioLHTmJo5kBhsJXrDG6hwODVVe2G_1eSl-52k4gOvTw
```

## Use the access token as a Bearer token

```
GET /id/00D3X000002KFdlUAG/0053X00000AdY37QAF HTTP/1.1
Host: test.salesforce.com
Authorization: Bearer 00D3X0000...zLwRJ3AzGgXa
Connection: close
```

Send a get request with the response id as the request url

## credit

"author": "Mikkel Flindt Heisterberg (mheisterberg@salesforce.com)",

## Resources
1. https://www.pjgalbraith.com/uploading-files-to-salesforce-using-jsforce/
2. https://www.kindacode.com/article/reading-content-from-pdf-and-csv-files-using-node-js/


## Single file upload - file_upload.js

// 1. Authenticate
         // generate JWT - generateJWT() -
            // - inputs: issuer, audience, subject, privateKey path
            // - outputs: signedjwt
         // generate access Token from the signed JWT - accessTokenFromJWT() 
            // - inputs: signed JWT token, audience
            // - outputs: instance_url, access_token

    // Loop through this 4 processes below for batch upload

// 2. Read file from local directory - readFileSync()
        // inputs: - file uri
        // outputs: - file buffer

// 3. Upload file with content version and get response with id - uploadContentVersion()
        // inputs are 
            // - connection from jsforce with instance_url and accessToken
            // - file buffer
            // - file metadata including: - title, pathonclient, contentlocation
        // outputs are:
            // - upload id

// 4. Get response id of uploaded file and query to get contentdocumentid - getContentId()
        // inputs are:
            // - upload id
            // - select query formed using the upload id
        // outputs are:
            // - contentdocumentid

// 5. Link uploaded file i.e contentdocumentid with the id of the linkedentity  - linkfileaccount()
        // inputs are:
            // - contentdocumentid
            // - linkedentityid
            // - visibility status
        // outputs are:
            // - success upload
            // - operation id

## Batch fileupload - batch-upload.js
// 1. get xlsx path and extract files to array
// 2. create a connection via jsforce
// 3. loop through the files array and carry out the same procedure as the single file upload


 - loop through the mapped csv file containing 
    1. file uri
    2. title
    3. path on client
    4. contentlocation
    5. linked entity id