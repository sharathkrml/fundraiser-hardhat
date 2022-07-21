import { task } from "hardhat/config"

task("balance", "Prints an account's balance")
    .addParam("account", "The account's address") // hh help balance
    .setAction(async (taskArgs, hre) => {
        const balance = await hre.ethers.provider.getBalance(taskArgs.account)

        console.log(hre.ethers.utils.formatEther(balance), "ETH")
    })
