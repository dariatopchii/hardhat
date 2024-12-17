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
    mapping(uint256 => uint256) public strapiToBlockchain; // Маппинг Strapi ID -> Blockchain ID
    uint256 public contentCount;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event ContentAdded(uint256 indexed id, uint256 strapiId, string data, address indexed uploader);
    event ContentUpdated(uint256 indexed id, uint256 strapiId, string data);
    event ContentRemoved(uint256 indexed id, uint256 strapiId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Access denied: Requires ADMIN_ROLE");
        _;
    }

    // Добавление новой записи с использованием Strapi ID
    function addContent(uint256 _strapiId, string memory _data) public onlyAdmin {
        require(bytes(_data).length > 0, "Invalid content"); // Проверка на пустую строку
        require(strapiToBlockchain[_strapiId] == 0 && _strapiId != 0, "Strapi ID already exists"); // Проверка уникальности Strapi ID

        contents[contentCount] = Content({
            data: _data,
            uploader: msg.sender,
            exists: true
        });

        strapiToBlockchain[_strapiId] = contentCount; // Связываем Strapi ID с Blockchain ID
        emit ContentAdded(contentCount, _strapiId, _data, msg.sender);

        contentCount++;
    }

    // Обновление записи с использованием Strapi ID
    function updateContent(uint256 _strapiId, string memory _data) public onlyAdmin {
        uint256 blockchainId = strapiToBlockchain[_strapiId];
        require(contents[blockchainId].exists, "Content ID does not exist");
        require(bytes(_data).length > 0, "Invalid content"); // Проверка на пустую строку

        contents[blockchainId].data = _data;

        emit ContentUpdated(blockchainId, _strapiId, _data);
    }

    // Удаление записи с использованием Strapi ID
    function removeContent(uint256 _strapiId) public onlyAdmin {
        uint256 blockchainId = strapiToBlockchain[_strapiId];
        require(contents[blockchainId].exists, "Content ID does not exist");

        delete contents[blockchainId];
        delete strapiToBlockchain[_strapiId];

        emit ContentRemoved(blockchainId, _strapiId);
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

    // Получение записи по Strapi ID
    function getContent(uint256 _strapiId) public view returns (string memory, address) {
        uint256 blockchainId = strapiToBlockchain[_strapiId];
        require(contents[blockchainId].exists, "Content ID does not exist");
        Content memory content = contents[blockchainId];
        return (content.data, content.uploader);
    }

    // Получение общего количества записей
    function getContentCount() public view returns (uint256) {
        return contentCount;
    }
}
