// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
error Fundraiser__DonatedZero();
error Fundraiser__OverPayment();
error Fundraiser__NotOwner();
error Fundraiser__NotEnoughBalance();
error Fundraiser__TransferFailed();

contract Fundraiser is ERC721URIStorage {
    struct Campaign {
        uint256 currAmt;
        uint256 requiredAmt;
    }

    uint256 private s_tokenId;
    mapping(uint256 => Campaign) private s_idToCampaign;

    constructor() ERC721("Fundraiser Collection", "FRC") {}

    function startCampaign(string calldata _tokenURI, uint256 _requiredAmt)
        external
    {
        s_tokenId++;
        _safeMint(msg.sender, s_tokenId);
        _setTokenURI(s_tokenId, _tokenURI);
        s_idToCampaign[s_tokenId].requiredAmt = _requiredAmt;
    }

    function donate(uint256 tokenId) external payable {
        if (msg.value == 0) {
            revert Fundraiser__DonatedZero();
        }
        Campaign storage campaign = s_idToCampaign[tokenId];
        if (campaign.requiredAmt - campaign.currAmt < msg.value) {
            revert Fundraiser__OverPayment();
        }
        campaign.currAmt += msg.value;
    }

    modifier onlyOwnerOfNFT(uint256 tokenId) {
        if (ownerOf(tokenId) != msg.sender) {
            revert Fundraiser__NotOwner();
        }
        _;
    }

    function withdraw(uint256 tokenId, uint256 amount)
        external
        onlyOwnerOfNFT(tokenId)
    {
        Campaign storage campaign = s_idToCampaign[tokenId];
        if (campaign.currAmt < amount) {
            revert Fundraiser__NotEnoughBalance();
        }
        campaign.currAmt -= amount;
        campaign.requiredAmt -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert Fundraiser__TransferFailed();
        }
    }

    function endCampaign(uint256 tokenId) external onlyOwnerOfNFT(tokenId) {
        Campaign memory campaign = s_idToCampaign[tokenId];
        delete s_idToCampaign[tokenId];
        _burn(tokenId);
        (bool success, ) = msg.sender.call{value: campaign.currAmt}("");
        if (!success) {
            revert Fundraiser__TransferFailed();
        }
    }
}
