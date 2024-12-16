// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ContentBridge is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Content {
        string data;       // IPFS CID або хеш контенту
        address uploader;  // Адреса того, хто завантажив контент
        bool exists;       // Перевірка існування
    }

    mapping(uint256 => Content) public contents;
    uint256 public contentCount;

    event ContentAdded(uint256 indexed id, string data, address indexed uploader);
    event ContentRemoved(uint256 indexed id);
    event ContentUpdated(uint256 indexed id, string data);

    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Додавання нового контенту
    function addContent(string memory _data) public onlyRole(ADMIN_ROLE) {
        require(bytes(_data).length > 0, "Invalid content");

        contents[contentCount] = Content(_data, msg.sender, true);
        emit ContentAdded(contentCount, _data, msg.sender);
        contentCount++;
    }

    // Отримати всі контенти
    function getAllContents() public view returns (string[] memory, address[] memory) {
        string[] memory allData = new string[](contentCount);
        address[] memory allUploaders = new address[](contentCount);

        for (uint256 i = 0; i < contentCount; i++) {
            if (contents[i].exists) {
                allData[i] = contents[i].data;
                allUploaders[i] = contents[i].uploader;
            }
        }

        return (allData, allUploaders);
    }

    // Отримати контент за ID
    function getContent(uint256 _id) public view returns (string memory, address) {
        require(contents[_id].exists, "Content ID does not exist");
        return (contents[_id].data, contents[_id].uploader);
    }

    // Оновлення контенту
    function updateContent(uint256 _id, string memory _data) public onlyRole(ADMIN_ROLE) {
        require(contents[_id].exists, "Content ID does not exist");
        require(bytes(_data).length > 0, "Invalid content");

        contents[_id].data = _data;
        emit ContentUpdated(_id, _data);
    }

    // Видалення контенту
    function removeContent(uint256 _id) public onlyRole(ADMIN_ROLE) {
        require(contents[_id].exists, "Content ID does not exist");

        delete contents[_id];
        emit ContentRemoved(_id);
    }
}
