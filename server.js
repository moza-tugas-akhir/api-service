'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import { createHelia } from 'helia';
import { strings } from '@helia/strings';
import { CID } from 'multiformats/cid';
import { Gateway, Wallets } from 'fabric-network';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initializing the express app
const app = express();
app.use(bodyParser.json());
app.use(fileUpload());

// Asynchronous initialization of Helia
let ipfs;
(async () => {
    const helia = await createHelia({ host: 'localhost', port: 5001, protocol: 'http' });
    ipfs = strings(helia);
})();

// load the network configuration
const ccpPath = path.resolve(__dirname, '..', 'blockchain-test-network', 'fabric-samples','test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

async function storeDocument(documentBuffer) {
    const result = await ipfs.add(documentBuffer);
    return result;
}

async function getDocument(hash) {
	console.log(hash);
	const cid = CID.parse(hash)
    console.log(cid);	
    const file = await ipfs.get(cid);
	console.log(file);
    return file;
}

// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'wallet');

// Utility function to create a new gateway and connect to the network
async function connectToGateway() {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if user is already enrolled
    const identity = await wallet.get('appUser');

    if (!identity) {
        throw new Error('An identity for the user "appUser" does not exist in the wallet. Run the registerUser.js application before retrying.');
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    return gateway;
}

// Utility function to get the contract
async function getContract(gateway) {
     // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('testchannel');
    // Get the contract from the network.
    return network.getContract('OssV1');
}

// Create Doc
app.post('/api/createdoc/', async function (req, res) { 
    let gateway;
    console.log('Request Body:', req.body);
    console.log('Files received:', req.files);
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    try {
        const documentBuffer = req.files.file.data;  // Access the file using the correct key
        const ipfshash = await storeDocument(documentBuffer);
	    console.log(ipfshash)

        gateway = await connectToGateway();
        const contract = await getContract(gateway);

        // docHash is ipfsHash
        // Creating a new document - requires 6 argument, ex: ("CreateDoc", "user123", "doc456","Example Document","pdf","2023-07-06T12:34:56Z", "QmTzQ1N4aVx7Mh3Uq7P8L2V9Rz1Q4uQ8Wz1F1R2P3S4T5")
        await contract.submitTransaction('CreateDoc', req.body.userid, req.body.docid, req.body.docname, req.body.doctype, req.body.timestamp, ipfshash);
        
        // send the res just once -- TBD
        res.status(201).send({ msg: 'Transaction has been submitted', docId: req.body.docid, ipfshash}); 
        console.log('Transaction has been submitted');
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Failed to submit transaction: ${error}`);
    } finally {
        if (gateway) {
            // Disconnect from the gateway.
            gateway.disconnect();
        }
    }        
});

// Query by user ID
app.get('/api/querydocbyuserid/:userId', async function (req, res) {
    let gateway;
    try {
        gateway = await connectToGateway();
        const contract = await getContract(gateway);
    
        // QueryDocByUserId transaction - requires one argument ex: ('QueryDocByUserId', '1')
        const result = await contract.evaluateTransaction('QueryDocByUserId', req.params.userId);
        const docs = JSON.parse(result.toString());
 
        const docWithHash = docs.find(doc => doc.ipfshash);
        if (!docWithHash) {
            return res.status(404).send('No documents found with an IPFS hash.');
        }

        const document = await getDocument(docWithHash.ipfshash);
        res.status(200).send({ docId: docWithHash.docid, document });

        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Failed to submit transaction: ${error}`);
    } finally {
        if (gateway) {
            // Disconnect from the gateway.
            gateway.disconnect();
        }
    }
});

// Query by doc ID
app.get('/api/querydocbydocid/:userId/:docId', async function (req, res) {
    let gateway;
    try {
        gateway = await connectToGateway();
        const contract = await getContract(gateway);

        // QueryDocByDocId transaction - requires two arguments
        const result = await contract.evaluateTransaction('QueryDocByDocId', req.params.userId, req.params.docId);
        const doc = JSON.parse(result.toString());

        res.status(200).json({response: doc});
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Failed to submit transaction: ${error}`);
    } finally {
        if (gateway) {
            // Disconnect from the gateway.
            gateway.disconnect();
        }
    }
});


// Query by doc name
app.get('/api/querydocbyname/:docName', async function (req, res) {
    let gateway;
    try {
        gateway = await connectToGateway();
        const contract = await getContract(gateway);

        // QueryDocByName transaction - requires one argument
        const result = await contract.evaluateTransaction('QueryDocByName', req.params.docName);
        const docs = JSON.parse(result.toString());

        res.status(200).json({response: docs});
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).send(`Failed to submit transaction: ${error}`);
    } finally {
        if (gateway) {
            // Disconnect from the gateway.
            gateway.disconnect();
        }
    }
});

// Download file from IPFS using CID
app.get('/api/download/:cid', async function (req, res) {
    const cid = req.params.cid;

    try {
        const file = await getDocument(cid);
        if (file && file.length > 0) {
            res.setHeader('Content-Disposition', `attachment; filename="${cid}.pdf"`);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', file.length);
            res.send(file);
        } else {
            res.status(404).send('File not found on IPFS or file is empty');
        }
    } catch (error) {
        console.error(`Error fetching document from IPFS: ${error}`);
        res.status(500).send(`Error fetching document from IPFS: ${error.message}`);
    }
});

app.listen(8080, 'localhost');
console.log('Running on http://localhost:8080');