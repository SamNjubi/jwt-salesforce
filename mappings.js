import fs from 'fs';
import * as csv from 'csvtojson';

// const fs = require('fs');
// const csv = require('csvtojson');
(async () => {
    const [ attachmentMappings, accountMappings, quotesMappings, opportunitiesMappings] = await Promise.all([
        csv().fromFile('../salesforce-org-docs/attachment_mappings.csv'),
        csv().fromFile('../salesforce-org-docs/accounts_extract.csv'),
        csv().fromFile('../salesforce-org-docs/all_quotes.csv'),
        csv().fromFile('../salesforce-org-docs/all_opportunities.csv')
    ]);

    const final = fs.openSync('./mappings.json', 'w')
    
    const temp = [];
    const missing = [];
    let count = 0;
    fs.readdirSync('../salesforce-org-docs/files/main_att_contracts').forEach(file =>{
        console.log(file);
        const attachmentName = file.split('_')[0]
        const mapping = attachmentMappings.find(map => map.ATTACHMENTID === attachmentName);
        if(!mapping) {
            missing.push(file);
        }
        const {ID: NEW_ACCOUNT_ID, A_NUMBER__C, LEGACY_SFDC_ID__C, NAME: ACCOUNT_NAME} = accountMappings.find(map => map.LEGACY_SFDC_ID__C === mapping.ACCOUNTID);
        let quote = null;
        if(mapping.Q_ID) {
            quotesMappings.find(map => map.LEGACY_QUOTE_SFID__C === mapping.Q_ID);
        }
        const opportunity = !!mapping.OP_ID &&opportunitiesMappings.find(map => map.LEGACY_OPPORTUNITY_ID__C === mapping.OPP_ID)
        const result = {
            FILE: file,
            ATTACHMENT_NAME: attachmentName,
            NEW_ACCOUNT_ID,
            A_NUMBER__C,
            LEGACY_SFDC_ID__C,
            ACCOUNT_NAME,
            mapping,
            quote,
            opportunity   
        };
        temp.push(result);        
        count++;
    });
    console.log('Missing:');
    console.log(missing);
    console.log('File count: ' + count);
    fs.writeFileSync('./mappings', JSON.stringify(temp))
    console.log('done');
})()

