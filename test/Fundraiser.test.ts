import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { deployments, ethers } from "hardhat"
import { Fundraiser } from "../typechain-types"

describe("Fundraiser Test", () => {
    let fundraiser: Fundraiser
    let deployer: SignerWithAddress, user: SignerWithAddress, accounts: SignerWithAddress[]
    beforeEach(async () => {
        ;[deployer, user, ...accounts] = await ethers.getSigners()
        await deployments.fixture(["all"])
        fundraiser = await ethers.getContract("Fundraiser", deployer)
    })
    it("test all", async () => {
        console.log(deployer)
        console.log(user)
        console.log(fundraiser)
    })
})
