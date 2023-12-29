import { Signer, ethers, Contract,providers } from 'ethers';


export interface NetworkInfo {
    name: string;
    baseToken: BaseToken;
    erc20TransferGasLimit: number;
    derivationPath: string;
    possibleRpcUrls: Array<string>;
    tokensInfo: Array<TokenInfo>;
    networkId: number;
    gasFeeEstimator:any,
    provider:any
} 

export interface BaseToken {
    name: string;
    forGasAmount: string;
    gasLimit: number;
}

export interface TokenInfo {
    name: string;
    contractAddress: string;
    decimals: number;
}

const defaultGasFeeEstimator = async (signer:Signer,  gasLimit:any, ) => { 
    if(!signer?.provider)return
    let gasPrice = await signer.provider.getGasPrice();
    return gasPrice.mul(gasLimit)
}

const MATIC:NetworkInfo = {
    name: "MATIC",
    baseToken : {name:"MATIC", forGasAmount: "0.2", gasLimit: 21000},
    erc20TransferGasLimit: 90000,
    derivationPath: "m/44'/60'/0'/0/",
    possibleRpcUrls: [
        "https://rpc-mainnet.maticvigil.com/",
        "https://polygon-rpc.com/",
        "https://rpc-mainnet.matic.quiknode.pro/",
    ],
    tokensInfo: [
        {name: 'USDT', contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6},
        {name: 'DAI',  contractAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18},
        {name: 'USDCE', contractAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6},
        {name: 'USDC', contractAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6},
        {name: 'FRAX', contractAddress: '0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89', decimals: 18},
    ],
    networkId: 137,
    gasFeeEstimator: defaultGasFeeEstimator,
    provider: () => new ethers.providers.JsonRpcProvider(rpcUrl(MATIC))
}

const MUMBAI: NetworkInfo = {
    name: "MUMBAI",
    baseToken: { name: "MATIC", forGasAmount: "0.2", gasLimit: 21000 },
    erc20TransferGasLimit: 90000,
    derivationPath: "m/44'/60'/0'/0/",
    possibleRpcUrls: [
        "https://rpc.ankr.com/polygon_mumbai"
    ],
    tokensInfo: [
        { name: 'USDC', contractAddress: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97', decimals: 6 },
    ],
    networkId: 80001, // Network ID for Mumbai
    gasFeeEstimator: defaultGasFeeEstimator,
    provider: () => new ethers.providers.JsonRpcProvider(rpcUrl(MUMBAI))
};


const NETWORKS = {
    MATIC, MUMBAI
}

const rpcUrl = (networkInfo:NetworkInfo) => {
    return networkInfo.possibleRpcUrls[Math.floor(Math.random() * networkInfo.possibleRpcUrls.length)];
}


const ABI = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",

    // Authenticated Functions
    "function transfer(address to, uint amount) returns (boolean)",
    "function approve(address spender, uint amount) returns (boolean)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint amount)"
];




export { NETWORKS, ABI }