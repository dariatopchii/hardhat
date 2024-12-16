const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const nock = require('nock');
const { expect } = chai;
chai.use(chaiHttp);

const app = require('../webhook-server'); // Убедитесь, что путь к вашему серверу верный

describe('Server API Tests', () => {
  const mockIpfsResponse = {
    Hash: 'QmTestHash123',
  };

  const mockTxResponse = {
    hash: '0xTestTransactionHash',
  };

  let contractMock;

  beforeEach(() => {
    // Подмена методов контракта
    contractMock = {
      addContent: sinon.stub().resolves(mockTxResponse),
      updateContent: sinon.stub().resolves(mockTxResponse),
      removeContent: sinon.stub().resolves(mockTxResponse),
      getAllContents: sinon.stub().resolves([
        ['QmTestHash123', 'QmAnotherTestHash'],
        ['0xMockAddress1', '0xMockAddress2'],
      ]),
    };

    sinon.replace(app.locals, 'contract', contractMock);

    // Мокаем запросы к IPFS
    nock('http://127.0.0.1:5001')
      .persist() // Указывает, что мок будет активен для всех запросов
      .post('/api/v0/add')
      .reply(200, mockIpfsResponse);
  });

  afterEach(() => {
    sinon.restore(); // Восстанавливает оригинальные методы
    nock.cleanAll(); // Очищает мок запросов
  });

  it('should add content to IPFS and blockchain', (done) => {
    chai
      .request(app)
      .post('/webhook')
      .send({ data: 'Test data for IPFS' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('ipfsHash', mockIpfsResponse.Hash);
        expect(res.body).to.have.property('sha256Hash');
        expect(res.body).to.have.property('message', 'Data stored on blockchain');
        done();
      });
  });

  it('should fetch all contents from the blockchain', (done) => {
    chai
      .request(app)
      .get('/contents')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body[0]).to.have.property('content', mockIpfsResponse.Hash);
        expect(res.body[0]).to.have.property('uploader', '0xMockAddress1');
        done();
      });
  });

  it('should update content on the blockchain', (done) => {
    chai
      .request(app)
      .put('/content/0')
      .send({ data: 'Updated IPFS Content' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message', 'Content updated on blockchain');
        expect(res.body).to.have.property('ipfsHash', mockIpfsResponse.Hash);
        done();
      });
  });

  it('should remove content from the blockchain', (done) => {
    chai
      .request(app)
      .delete('/content/0')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message', 'Content removed from blockchain');
        expect(res.body).to.have.property('id', '0');
        done();
      });
  });
});
