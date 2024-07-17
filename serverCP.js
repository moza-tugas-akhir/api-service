'use strict';
 
var express = require('express');
var bodyParser = require('body-parser');
 
var app = express();
app.use(bodyParser.json());
 
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// load the network configuration
const ccpPath = path.resolve(__dirname, '..', 'fabric-samples','test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

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

app.post('/api/createdoc/', async function (req, res) { 
    let gateway;
    // console.log('Files received:', req.files);
    // if (!req.files || Object.keys(req.files).length === 0) {
    //     return res.status(400).send('No files were uploaded.');
    // }
    try {
        // const documentBuffer = req.files.file.name;  // Access the file using the correct key
        // const docHash = await storeDocument(documentBuffer);
	    // console.log(docHash)

        gateway = await connectToGateway();
        const contract = await getContract(gateway);

        // Creating a new document - requires 6 argument, ex: ("CreateDoc", "user123", "doc456","Example Document","pdf","2023-07-06T12:34:56Z", "QmTzQ1N4aVx7Mh3Uq7P8L2V9Rz1Q4uQ8Wz1F1R2P3S4T5")
        await contract.submitTransaction('CreateDoc',req.body.userid,req.body.docid,req.body.docname,req.body.doctype, req.body.timestamp, req.body.ipfshash);
        console.log('Transaction has been submitted');
        res.send('Transaction has been submitted');
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

app.get('/api/querydocbyuserid/:userId', async function (req, res) {
    let gateway;
    try {
        gateway = await connectToGateway();
        const contract = await getContract(gateway);
    
        // QueryDocByUserId transaction - requires one argument ex: ('QueryDocByUserId', '1')
        const result = await contract.evaluateTransaction('QueryDocByUserId',req.params.userId);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        res.status(200).json({response: result.toString()});
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

app.get('/api/queryalldocs', async function (req, res) {
    let gateway;
    try {
        gateway = await connectToGateway();
        const contract = await getContract(gateway);

        // QueryAllDocs transaction - requires no arguments
        const result = await contract.evaluateTransaction('QueryAllDocs');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        res.status(200).json({response: result.toString()});
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).send(`Failed to evaluate transaction: ${error}`);
    } finally {
        if (gateway) {
            // Disconnect from the gateway.
            gateway.disconnect();
        }
    }
});

app.listen(8080, 'localhost');
console.log('Running on http://localhost:8080');
