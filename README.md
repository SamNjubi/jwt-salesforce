// 2. loop through each mapping and proceed with file upload
      // uploadcdi - upload contentdocumentid
      // uploadcvid - upload contentversionid
      // linkedid - linked id reponse if successful

# repo contains
    1. Index js file which runs the application
         - Note: the mappings.json file should exist before this is run
    2. mappings.js file which creates mappings.json
    3. authenticate js - retrieves a signed jwt
    4. auth_functions js - containsauth functions used by authenticate.js
    5. upload_functions.js - a script with functions used in the uploading and linking process
    5. mappings.json - an already uploaded json mapping with edited uploadcvid, uploadcdid and linkedid
         - The NEW_ACCOUNT_ID has been edited for these files for testing purposes
    6. mappings copy.json - the original file created after running mappings.js