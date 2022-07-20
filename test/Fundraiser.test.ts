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
    it("get last token id", async () => {
        assert(await fundraiser.getLastTokenId(), "0")
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
            assert.equal(campaign.requiredAmt.toString(), requiredAmt.toString())
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
        it("check onlyOwnerOfNFT modifier - only owner can extend campaign", async () => {
            await expect(
                fundraiser.connect(user).extendCampaign(1, extendAmt)
            ).to.be.revertedWithCustomError(fundraiser, "Fundraiser__NotOwner")
        })
        it("check notCompleted modifier - can only extend campaigns that not completed", async () => {
            let tx = await fundraiser.endCampaign(1)
            await tx.wait()
            await expect(fundraiser.extendCampaign(1, extendAmt)).to.be.revertedWithCustomError(
                fundraiser,
                "Fundraiser__Completed"
            )
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
        it("ExtendCampaign event", async () => {
            await expect(fundraiser.extendCampaign(1, extendAmt))
                .to.emit(fundraiser, "ExtendCampaign")
                .withArgs(deployer.address, 1, extendAmt)
        })
    })
    describe("donate", () => {
        let oneEth = ethers.utils.parseEther("1")
        beforeEach(async () => {
            await fundraiser.startCampaign(tokenURI, requiredAmt)
        })
        it("check notCompleted modifier - can only donate to campaigns that not completed", async () => {
            let tx = await fundraiser.endCampaign(1)
            await tx.wait()
            await expect(fundraiser.connect(user).donate(1)).to.be.revertedWithCustomError(
                fundraiser,
                "Fundraiser__Completed"
            )
        })
        it("check Fundraiser__DonatedZero Error", async () => {
            await expect(fundraiser.connect(user).donate(1)).to.be.revertedWithCustomError(
                fundraiser,
                "Fundraiser__DonatedZero"
            )
        })
        it("check Fundraiser__DoesNotExist error", async () => {
            await expect(
                fundraiser.connect(user).donate(2, { value: oneEth })
            ).to.be.revertedWithCustomError(fundraiser, "Fundraiser__DoesNotExist")
        })
        it("check Fundraiser__OverPayment error", async () => {
            await expect(
                fundraiser.connect(user).donate(1, { value: oneEth.mul(11) })
            ).to.be.revertedWithCustomError(fundraiser, "Fundraiser__OverPayment")
        })
        it("check Donation event ", async () => {
            await expect(fundraiser.connect(user).donate(1, { value: oneEth.mul(5) }))
                .to.emit(fundraiser, "Donation")
                .withArgs(user.address, 1, oneEth.mul(5))
            let { currAmt } = await fundraiser.getCampaign(1)
            assert.equal(currAmt.toString(), oneEth.mul(5).toString())
        })
    })
    describe("withdraw", () => {
        let donateAmt = ethers.utils.parseEther("5")
        let withdrawAmt = ethers.utils.parseEther("2")
        beforeEach(async () => {
            let tx = await fundraiser.startCampaign(tokenURI, requiredAmt)
            await tx.wait()
            await fundraiser.connect(user).donate(1, { value: donateAmt })
        })
        it("check onlyOwnerOfNFT modifier - only owner can withdraw", async () => {
            await expect(
                fundraiser.connect(user).withdraw(1, withdrawAmt)
            ).to.be.revertedWithCustomError(fundraiser, "Fundraiser__NotOwner")
        })
        it("check notCompleted modifier - campaign is already completed", async () => {
            let tx = await fundraiser.endCampaign(1)
            await tx.wait()
            await expect(fundraiser.withdraw(1, withdrawAmt)).to.be.revertedWithCustomError(
                fundraiser,
                "Fundraiser__Completed"
            )
        })
        it("check Fundraiser__NotEnoughBalance ", async () => {
            await expect(
                fundraiser.withdraw(1, donateAmt.add(withdrawAmt))
            ).to.be.revertedWithCustomError(fundraiser, "Fundraiser__NotEnoughBalance")
        })
        it("check campaign struct change", async () => {
            let oldCampaign = await fundraiser.getCampaign(1)
            // withdraw transaction
            let tx = await fundraiser.withdraw(1, withdrawAmt)
            await tx.wait()
            let newCampaign = await fundraiser.getCampaign(1)
            assert.equal(
                newCampaign.currAmt.toString(),
                oldCampaign.currAmt.sub(withdrawAmt).toString()
            )
            assert.equal(
                newCampaign.requiredAmt.toString(),
                oldCampaign.requiredAmt.sub(withdrawAmt).toString()
            )
        })
        it("check balance change", async () => {
            let oldBalance = await ethers.provider.getBalance(deployer.address)
            // withdraw transaction
            let tx = await fundraiser.withdraw(1, withdrawAmt)
            let res = await tx.wait()
            let newBalance = await ethers.provider.getBalance(deployer.address)
            let { gasUsed } = res
            let { gasPrice } = tx
            if (gasPrice) {
                let transactionFee = gasUsed.mul(gasPrice)
                let calculatedBalance = oldBalance.add(withdrawAmt).sub(transactionFee)
                assert.equal(calculatedBalance.toString(), newBalance.toString())
            }
        })
        it("check Withdraw event", async () => {
            await expect(fundraiser.withdraw(1, withdrawAmt))
                .to.emit(fundraiser, "Withdraw")
                .withArgs(1, withdrawAmt)
        })
    })
    describe("endCampaign", () => {
        let donateAmt = ethers.utils.parseEther("5")
        beforeEach(async () => {
            let tx = await fundraiser.startCampaign(tokenURI, requiredAmt)
            await tx.wait()
            tx = await fundraiser.connect(user).donate(1, { value: donateAmt })
        })
        it("check onlyOwner modifier - only owner can end Campaign", async () => {
            await expect(fundraiser.connect(user).endCampaign(1)).to.be.revertedWithCustomError(
                fundraiser,
                "Fundraiser__NotOwner"
            )
        })
        it("check notCompleted modifier - can't complete already completed Campaign", async () => {
            let tx = await fundraiser.endCampaign(1)
            await tx.wait()
            await expect(fundraiser.endCampaign(1)).to.be.revertedWithCustomError(
                fundraiser,
                "Fundraiser__Completed"
            )
        })
        it("check campaign change", async () => {
            let oldCampaign = await fundraiser.getCampaign(1)
            let tx = await fundraiser.endCampaign(1)
            await tx.wait()
            let newCampaign = await fundraiser.getCampaign(1)
            assert.equal(oldCampaign.completed, false)
            assert.equal(newCampaign.completed, true)
        })
        it("check balance change", async () => {
            let oldBalance = await ethers.provider.getBalance(deployer.address)
            let tx = await fundraiser.endCampaign(1)
            let res = await tx.wait()
            let newBalance = await ethers.provider.getBalance(deployer.address)

            let transactionFee = tx.gasPrice?.mul(res.gasUsed)
            if (transactionFee) {
                let calculatedBalance = oldBalance.add(donateAmt).sub(transactionFee)
                assert.equal(calculatedBalance.toString(), newBalance.toString())
            }
        })
    })
})
