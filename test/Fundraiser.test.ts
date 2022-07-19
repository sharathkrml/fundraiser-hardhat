import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai"
import { deployments, ethers } from "hardhat"
import { Fundraiser } from "../typechain-types"

describe("Fundraiser Test", () => {
    let tokenURI = "https://www.google.com"
    let requiredAmt = ethers.utils.parseEther("10")
    let fundraiser: Fundraiser
    let deployer: SignerWithAddress, user: SignerWithAddress, accounts: SignerWithAddress[]
    let campaign: Fundraiser.CampaignStructOutput
    beforeEach(async () => {
        ;[deployer, user, ...accounts] = await ethers.getSigners()
        await deployments.fixture(["all"])
        fundraiser = await ethers.getContract("Fundraiser", deployer)
    })
    it("Constructor", async () => {
        assert.equal(await fundraiser.name(), "Fundraiser Collection")
        assert.equal(await fundraiser.symbol(), "FRC")
    })
    describe("startCampaign", () => {
        beforeEach(async () => {
            await fundraiser.startCampaign(tokenURI, requiredAmt)
        })
        it("check Ownership", async () => {
            assert.equal(await fundraiser.ownerOf(1), deployer.address)
        })
        it("check tokenURI", async () => {
            assert.equal(await fundraiser.tokenURI(1), tokenURI)
        })
        it("check requiredAmt", async () => {
            campaign = await fundraiser.getCampaign(1)
            assert.equal(campaign.requiredAmt, requiredAmt)
        })
        it("StartCampaign Event", async () => {
            await expect(fundraiser.startCampaign(tokenURI, requiredAmt))
                .to.emit(fundraiser, "StartCampaign")
                .withArgs(deployer.address, 2, requiredAmt)
        })
    })
    describe("extendCampaign", () => {
        let extendAmt = ethers.utils.parseEther("5")
        beforeEach(async () => {
            await fundraiser.startCampaign(tokenURI, requiredAmt)
        })
        it("check requiredAmt update", async () => {
            campaign = await fundraiser.getCampaign(1)
            let oldRequiredAmt = campaign.requiredAmt
            let tx = await fundraiser.extendCampaign(1, extendAmt)
            await tx.wait()
            campaign = await fundraiser.getCampaign(1)
            let newRequiredAmt = campaign.requiredAmt
            assert.equal(oldRequiredAmt.add(extendAmt).toString(), newRequiredAmt.toString())
        })
        it("check ExtendCampaign event", async () => {
            await expect(fundraiser.extendCampaign(1, extendAmt))
                .to.emit(fundraiser, "ExtendCampaign")
                .withArgs(deployer.address, 1, extendAmt)
        })
    })
})
