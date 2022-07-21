import { network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deployFundraiser = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    await deploy("Fundraiser", {
        from: deployer,
        args: [],
        log: true,
    })
    if (["hardhat", "localhost"].includes(network.name)) {
        console.log(network.name)
    }
    log("-----------------------------------")
}
export default deployFundraiser

deployFundraiser.tags = ["all"]
