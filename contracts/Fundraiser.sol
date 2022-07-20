// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
error Fundraiser__DonatedZero();
error Fundraiser__OverPayment();
error Fundraiser__NotOwner();
error Fundraiser__NotEnoughBalance();
error Fundraiser__TransferFailed();
error Fundraiser__DoesNotExist();
error Fundraiser__Completed();

/**
 * @author Buildit Team
 * @title Fundraiser
 */
contract Fundraiser is ERC721URIStorage {
    struct Campaign {
        uint256 currAmt;
        uint256 requiredAmt;
        bool completed;
    }

    mapping(uint256 => Campaign) private s_idToCampaign;
    // NFT variables
    uint256 private s_tokenId;
    // Events

    event StartCampaign(address indexed owner, uint256 indexed tokenId, uint256 requiredAmt);
    event ExtendCampaign(address indexed owner, uint256 indexed tokenId, uint256 extendAmt);
    event Donation(address indexed from, uint256 indexed tokenId, uint256 amount);
    event Withdraw(uint256 indexed tokenId, uint256 withdrawedAmt);
    event EndCampaign(uint256 indexed tokenId);

    constructor() ERC721("Fundraiser Collection", "FRC") {}

    // Modifiers
    modifier onlyOwnerOfNFT(uint256 tokenId) {
        if (ownerOf(tokenId) != msg.sender) {
            revert Fundraiser__NotOwner();
        }
        _;
    }
    modifier notCompleted(uint256 tokenId) {
        if (s_idToCampaign[tokenId].completed) {
            revert Fundraiser__Completed();
        }
        _;
    }

    /**
     * Starts a campaign
     * @param _tokenURI IPFS hash of metadata
     * @param _requiredAmt the total required amount
     * @dev mints a Fundraiser NFT with given metadata &
     * Stores requiredAmt to Struct mapped using tokenId
     */
    function startCampaign(string calldata _tokenURI, uint256 _requiredAmt) external {
        s_tokenId++;
        _safeMint(msg.sender, s_tokenId);
        _setTokenURI(s_tokenId, _tokenURI);
        s_idToCampaign[s_tokenId].requiredAmt = _requiredAmt;
        emit StartCampaign(msg.sender, s_tokenId, _requiredAmt);
    }

    /**
     * Extends a campaign
     * @param tokenId used to identify token
     * @param extendAmt add extra amount to existing Campaign
     * @dev mints a Fundraiser NFT with given metadata &
     * Stores requiredAmt to Struct mapped using tokenId
     */
    function extendCampaign(uint256 tokenId, uint256 extendAmt)
        external
        notCompleted(tokenId)
        onlyOwnerOfNFT(tokenId)
    {
        s_idToCampaign[s_tokenId].requiredAmt += extendAmt;
        emit ExtendCampaign(msg.sender, tokenId, extendAmt);
    }

    /**
     * Donate to a campaign
     * @param tokenId used to identify campaign
     * @dev adds up msg.value received to campaign
     */
    function donate(uint256 tokenId) external payable notCompleted(tokenId) {
        if (msg.value == 0) {
            revert Fundraiser__DonatedZero();
        }
        if (!_exists(tokenId)) {
            revert Fundraiser__DoesNotExist();
        }
        Campaign storage campaign = s_idToCampaign[tokenId];
        if (campaign.requiredAmt - campaign.currAmt < msg.value) {
            revert Fundraiser__OverPayment();
        }
        campaign.currAmt += msg.value;
        emit Donation(msg.sender, tokenId, msg.value);
    }

    /**
     * Withdraw amount from campaign
     * @param tokenId used to identify campaign
     * @param amount specify amount to withdraw
     * @dev withdraw give amount,also reduce that from required & currAmt
     */
    function withdraw(uint256 tokenId, uint256 amount)
        external
        notCompleted(tokenId)
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
        emit Withdraw(tokenId, amount);
    }

    /**
     * end the campaign and withdraw all
     * @param tokenId used to identify campaign
     * @dev marks campaign as completed & sends amount to owner
     */
    function endCampaign(uint256 tokenId) external onlyOwnerOfNFT(tokenId) notCompleted(tokenId) {
        s_idToCampaign[tokenId].completed = true;
        (bool success, ) = msg.sender.call{value: s_idToCampaign[tokenId].currAmt}("");
        if (!success) {
            revert Fundraiser__TransferFailed();
        }
        emit EndCampaign(tokenId);
    }

    // Getter functions
    /**
     * get Campaign details
     * @param tokenId used to identify campaign
     * @dev identify Campaign from s_idToCampaign & return
     */
    function getCampaign(uint256 tokenId) external view returns (Campaign memory) {
        return s_idToCampaign[tokenId];
    }

    /**
     * get last minted tokenId
     * @dev returns s_tokenId private variable
     */
    function getLastTokenId() external view returns (uint256) {
        return s_tokenId;
    }
}
