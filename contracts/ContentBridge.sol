// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";

contract ContentBridge is AccessControl {
    struct Content {
        string hash;
        string metadata;
        address uploader;
    }

    mapping(uint256 => Content) public contents;
    uint256 public contentCount;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event ContentAdded(uint256 indexed id, string hash, string metadata, address indexed uploader);

    constructor() {
        // Встановлення адміністративної ролі для творця контракту
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Access denied: Requires ADMIN_ROLE");
        _;
    }

    function addContent(string memory _hash, string memory _metadata) public onlyAdmin {
        contents[contentCount] = Content(_hash, _metadata, msg.sender);
        emit ContentAdded(contentCount, _hash, _metadata, msg.sender);
        contentCount++;
    }

    function verifyContent(uint256 _id, string memory _hash) public view returns (bool) {
        return keccak256(abi.encodePacked(contents[_id].hash)) == keccak256(abi.encodePacked(_hash));
    }

function getAllContents() public view returns (string[] memory, string[] memory, address[] memory) {
    string[] memory hashes = new string[](contentCount);
    string[] memory metadataList = new string[](contentCount);
    address[] memory uploaders = new address[](contentCount);

    for (uint256 i = 0; i < contentCount; i++) {
        Content memory content = contents[i];
        hashes[i] = content.hash;
        metadataList[i] = content.metadata;
        uploaders[i] = content.uploader;
    }

    return (hashes, metadataList, uploaders);
}



    function removeContent(uint256 _id) public onlyAdmin {
        require(_id < contentCount, "Content does not exist");
        delete contents[_id];
        contentCount--;
    }
}
