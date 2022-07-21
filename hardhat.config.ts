import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"
import "dotenv/config"
import "./tasks/balance"
import "./tasks/campaign"
const getEnv = (name: string) => {
    return process.env[name] || ""
}

const config: HardhatUserConfig = {
    solidity: "0.8.9",
    namedAccounts: {
        deployer: 0,
        user: 1,
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        rinkeby: {
            chainId: 4,
            url: getEnv("RINKEBY_URL"),
            accounts: [getEnv("PRIVATE_KEY")],
        },
    },
    etherscan: {
        apiKey: {
            rinkeby: getEnv("ETHERSCAN_KEY"),
        },
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "INR",
        coinmarketcap: getEnv("COINMARKETCAP_KEY"),
        token: "MATIC",
    },
}

export default config
