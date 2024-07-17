# Instruction

Delete Wallet folder contents after running each time

## Steps to Follow

1. Start the network through blockchain-test-network/fabric-samples/test-network
2. Run command `sudo ./network.sh up -ca -s couchdb` to start the network; `sudo ./network.sh down -ca -s couchdb` to stop the network
3. Create a channel by running the command: `sudo ./network.sh createChannel -c testchannel`
4. Enter into the test network folder following this path [from another repo]: blockchain-chaincode/test-network
   Enter this command to copy the chaincode to the test network in blockchain-test-network
   `cp OssV1.tar.gz /home/mozasajidah/mzsjdh/fabric-samples/test-network`
5. Run this command to set permission before running the script `sudo chmod -R 777 .`
6. Run the chaincode lifecycle script `./chaincode_lifecycle.sh`

---------------------------------------------------------------------------------------------------------------------------------------

7. Enter into the api-service folder
8. Run `node enrolladmin.js` file
9. Run `node registerEnrollClientUser.js` file
10. Run `node server.js` file
