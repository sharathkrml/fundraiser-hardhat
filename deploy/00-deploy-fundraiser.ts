import verify from "../utils/verify"
import { network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployOptions } from "hardhat-deploy/dist/types"

const developmentChains = ["hardhat", "localhost"]

const deployFundraiser = async (hre: HardhatRuntimeEnvironment) => {
    let blockConfirmations = 0
    if (!developmentChains.includes(network.name)) {
        blockConfirmations = 6
    }
    const { deployments, getNamedAccounts } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const FundRaiser = await deploy("Fundraiser", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: blockConfirmations,
    })
    if (developmentChains.includes(network.name)) {
        console.log(network.name)
    } else {
        console.log("verifying........")
        await verify(FundRaiser.address, [])
    }
    log("-----------------------------------")
}
export default deployFundraiser

deployFundraiser.tags = ["all"]
