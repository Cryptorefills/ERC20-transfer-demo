import { NETWORKS, NetworkInfo,ABI } from "./config"
import {ethers, Contract, providers, Signer, Wallet, utils, BigNumber } from 'ethers';


const DESTINATION_WALLET = '0x2Cba0B30F3A522c371B34BFF97924d100aC3ad32';
const TOKEN_AMOUNT = '1.05';
const TOKEN_NAME = 'USDC';
const NETWORKNAME = 'MUMBAI'; //MATIC or MUMBAI
const MNEMONIC =  'REPLACE WITH YOUR 12 WORDS';
const WALLET_ACCOUNT_ID = 15


const walletForCounter = (mnemonic: string, baseDerivationPath: string, provider:providers.Provider, i: number) => {
    const derivationPath = baseDerivationPath + "" + i;
    return ethers.Wallet.fromMnemonic(mnemonic, derivationPath)
        .connect(provider);
}

const getBalance = async (wallet_address:string, chainName:string, tokenName:string, provider:providers.Provider)=> {
    const networkInfo = NETWORKS[NETWORKNAME]
    const contractAddress = networkInfo.tokensInfo.find(x => x.name == TOKEN_NAME)?.contractAddress

    if(!contractAddress){
        throw 'no contractAddress found'
    }

    const contract = new Contract(contractAddress, ABI, provider);

    const balance = await contract.balanceOf(wallet_address);
    return balance;
  };

const sleep = (ms:number) =>{
    return new Promise(resolve => setTimeout(resolve, ms));
}



const robustExec =  async (functionToExecute:()=>{}, MAX_ATTEMPTS: number =2) =>{
    var attempts = 0
    var success = false;
    while(attempts < MAX_ATTEMPTS && success == false) {
        try {
            attempts++;
            console.log(`current attempt: ${attempts}`)
            await functionToExecute()
            success = true;
        } catch (error) {
            console.log(`in catch error: ${error}`)
            console.log("let's wait a bit and retry...")
            await sleep(1200)
        }
    }
}


const ERC20Transfer = async ()=>{

    const networkInfo = NETWORKS[NETWORKNAME]
    const baseDerivationPath = networkInfo.derivationPath

    const tokenInfo = networkInfo.tokensInfo.find(x => x.name == TOKEN_NAME);

    if (!tokenInfo) {
        throw 'no contractAddress found'
    } 

    const {contractAddress, decimals} = tokenInfo;

    const paymentWallet = walletForCounter(MNEMONIC, baseDerivationPath, networkInfo.provider(), WALLET_ACCOUNT_ID);
    const wallet_address = paymentWallet.address;

    console.log({wallet_address});

    const balance = await getBalance(wallet_address, NETWORKNAME, TOKEN_NAME, paymentWallet.provider);

    console.log({balance});
    if (balance.gt(ethers.constants.Zero) ) {
        console.log(`${TOKEN_NAME}: we have balance on account ${WALLET_ACCOUNT_ID} address ${paymentWallet.address} : ${ethers.utils.formatUnits(balance, decimals)}`);

        // ${utils.formatEther(balance)}

        const formattedValue = ethers.utils.formatUnits(balance, decimals);
        console.log({formattedValue});

        const contract = new Contract(contractAddress, ABI, paymentWallet.provider).connect(paymentWallet);

        // Make sure we are sweeping to an EOA, not a contract. The gas required
        // to send to a contract cannot be certain, so we may leave dust behind
        // or not set a high enough gas limit, in which case the transaction will
        // fail.

        const code = await paymentWallet.provider?.getCode(DESTINATION_WALLET);
     
        if (code !== '0x') { throw new Error('Cannot sweep to a contract'); }

        // // The amount to transfer is the full balance
        const gasLimit = networkInfo.erc20TransferGasLimit
        const gasPrice = await paymentWallet.getGasPrice()

      
        const amountToTransfer = ethers.utils.parseUnits(TOKEN_AMOUNT, decimals);


        if (balance.lt(amountToTransfer)) {
            throw "Balance lower than required"
        }
        
        const f = async () => {
            console.log(`preparing tx ${TOKEN_NAME} from: ${paymentWallet.address} to ${DESTINATION_WALLET}  amount: ${ethers.utils.formatUnits(amountToTransfer, decimals)}` );  
            console.log(`gasLimit: ${gasLimit}`)
            console.log(`gasPrice: ${utils.formatUnits(gasPrice,"gwei")} GWei`)

            const transactionResponse = await contract.transfer(DESTINATION_WALLET, amountToTransfer, {
                gasLimit: ethers.utils.hexlify(gasLimit),
                gasPrice: ethers.utils.hexlify(gasPrice),
                //nonce: 4 // force nonce here in case of old tx stuck for gas price too low
            });
            
            console.log(transactionResponse);  
            console.log(`txid: ${transactionResponse.hash}` );  
            console.log(`waiting for confirmations...` );  
            const transactionReceipt = await transactionResponse.wait(1);
            console.log("received transactionReceipt:");
            console.log(transactionReceipt);
            console.log('--------------------------------------------------------------------');
            console.log('transfer done, transaction: ' + transactionReceipt.transactionHash);
            console.log('--------------------------------------------------------------------');
        }

        await robustExec(f) 
    }
}


ERC20Transfer()