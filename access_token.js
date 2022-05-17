import {config as config_env} from "dotenv";
import * as fs from "fs";
import * as util from "util";
import * as jwt from "./index.js";
import sfbulk from "node-sf-bulk2";
import jsforce from "jsforce";

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
    console.log(`JWT\n${token}`);
    return jwt.accessTokenFromJWT({
        token,
        audience
    })
}).then(data => {
    console.log(`Access token\n${data.access_token}`);
    console.log(data.instance_url);

    (async () => {
        if (process.env.CLIENT_ID && process.env.PATH_PRIVATE_KEY) {
            var conn = new jsforce.Connection({
            instanceUrl : data.instance_url,
            accessToken : data.access_token
          });
            const bulkconnect = {
                'accessToken': conn.accessToken,
                'apiVersion': '54.0',
                'instanceUrl': conn.instanceUrl
            };
            try {
                // create a new BulkAPI2 class
                const bulkrequest = new sfbulk.BulkAPI2(bulkconnect);
                // create a bulk insert job
                const jobRequest = {
                    'object': 'Account',
                    'operation': 'insert'
                };
                const response = await bulkrequest.createDataUploadJob(jobRequest);
                console.log(response);
                if (response.id) {
                    // read csv data from the local file system
                    const data = await util.promisify(fs.readFile)(process.cwd() + "/account3.csv", "UTF-8");
                    const status = await bulkrequest.uploadJobData(response.contentUrl, data);
                    console.log(status);
                    if (status === 201) {
                        // close the job for processing
                        const closestatus = await bulkrequest.closeOrAbortJob(response.id, 'UploadComplete');
                        console.log(closestatus);
                    }
                }
            } catch (ex) {
                console.log(ex);
            }
        } else {
            throw 'set environment variable with your orgs client id and private key path'
        }
    })();
})
