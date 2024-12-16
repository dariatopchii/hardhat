// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ContentBridge is AccessControl {
    struct Content {
        string data; // Полное содержимое записи в JSON формате
        address uploader;
        bool exists; // Флаг для проверки существования записи
    }

    mapping(uint256 => Content) public contents;
    uint256 public contentCount;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event ContentAdded(uint256 indexed id, string data, address indexed uploader);
    event ContentUpdated(uint256 indexed id, string data);
    event ContentRemoved(uint256 indexed id);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Access denied: Requires ADMIN_ROLE");
        _;
    }

    // Добавление новой записи
    function addContent(string memory _data) public onlyAdmin {
        require(bytes(_data).length > 0, "Invalid content"); // Проверка на пустую строку
        contents[contentCount] = Content({
            data: _data,
            uploader: msg.sender,
            exists: true
        });
        emit ContentAdded(contentCount, _data, msg.sender);
        contentCount++;
    }

    // Обновление существующей записи
    function updateContent(uint256 _id, string memory _data) public onlyAdmin {
        require(contents[_id].exists, "Content ID does not exist");
        require(bytes(_data).length > 0, "Invalid content"); // Проверка на пустую строку
        contents[_id].data = _data;

        emit ContentUpdated(_id, _data);
    }

    // Удаление записи
    function removeContent(uint256 _id) public onlyAdmin {
        require(contents[_id].exists, "Content ID does not exist");
        delete contents[_id];

        emit ContentRemoved(_id);
    }

    // Получение всех записей
    function getAllContents() public view returns (string[] memory, address[] memory) {
        string[] memory allData = new string[](contentCount);
        address[] memory allUploaders = new address[](contentCount);

        for (uint256 i = 0; i < contentCount; i++) {
            if (contents[i].exists) {
                Content memory content = contents[i];
                allData[i] = content.data;
                allUploaders[i] = content.uploader;
            }
        }

        return (allData, allUploaders);
    }

    // Получение одной записи по ID
    function getContent(uint256 _id) public view returns (string memory, address) {
        require(contents[_id].exists, "Content ID does not exist");
        Content memory content = contents[_id];
        return (content.data, content.uploader);
    }

    // Получение общего количества записей
    function getContentCount() public view returns (uint256) {
        return contentCount;
    }
}
