import * as jwt from "./auth_functions.js";
import jsforce from "jsforce";

export const SalesforceConnection = async (args) => {
    return new Promise((resolve, reject) => {
        try {
            const issuer = args.issuer;
            const subject = args.subject;
            const audience = args.audience;
            const privateKey = args.privateKey;

            jwt.generateJWT({
                issuer,
                audience,
                subject,
                privateKey
            }).then(token => {
                const tokendata = jwt.accessTokenFromJWT({
                    token,
                    audience
                });
                tokendata.then(data => {
                    var conn = new jsforce.Connection({
                                instanceUrl : data.instance_url,
                                accessToken : data.access_token
                            });
                    resolve(conn)
                })
        })
    } catch (err) { reject(err)}
})
}