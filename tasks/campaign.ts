import { task } from "hardhat/config"
import { Fundraiser } from "../typechain-types"

// task("testtasks", "to try out that the hell it is!!")
//     .addParam("uri", "Add Nft Uri")
//     .addParam("amt", "Add requiredAmt")
//     .setAction(async (taskArgs) => {
//         console.log(taskArgs)
//     })

//  hh testtasks --uri "hii" --amt "hello"
// { uri: 'hii', amt: 'hello' }

task("startcampaign", "Starts a campaign")
    .addParam("uri", "Add Nft Uri")
    .addParam("amt", "Add requiredAmt")
    .setAction(async (taskArgs, hre) => {
        let fundRaiser: Fundraiser = await hre.ethers.getContract("Fundraiser")
        let tx = await fundRaiser.startCampaign(
            taskArgs.uri,
            hre.ethers.utils.parseEther(taskArgs.amt)
        )
        let res = await tx.wait(1)
        console.log(res)
    })

task("extendcampaign", "Extends a campaign")
    .addParam("id", "Add tokenId")
    .addParam("amt", "Add extendAmt")
    .setAction(async (taskArgs, hre) => {
        let fundRaiser: Fundraiser = await hre.ethers.getContract("Fundraiser")
        try {
            let tx = await fundRaiser.extendCampaign(
                taskArgs.id,
                hre.ethers.utils.parseEther(taskArgs.amt)
            )
            let res = await tx.wait(1)
            console.log(res)
        } catch (e: any) {
            console.log(e.message)
        }
    })
