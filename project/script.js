import CryptoJS from 'https://cdn.skypack.dev/crypto-js';

// Blockchain class
class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return CryptoJS.SHA256(
      this.index + 
      this.timestamp + 
      JSON.stringify(this.data) + 
      this.previousHash
    ).toString();
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), { message: "Genesis Block" }, "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  findBlockByHash(hash) {
    return this.chain.find(block => block.hash === hash || 
                                   (block.data && block.data.certificateHash === hash));
  }
}

// Initialize blockchain
let certificateChain = new Blockchain();

// Load blockchain from localStorage if available
function loadBlockchain() {
  const savedChain = localStorage.getItem('certificateChain');
  if (savedChain) {
    const parsedChain = JSON.parse(savedChain);
    certificateChain.chain = parsedChain;
  }
  renderBlockchain();
}

// Save blockchain to localStorage
function saveBlockchain() {
  localStorage.setItem('certificateChain', JSON.stringify(certificateChain.chain));
}

// Generate certificate hash
function generateCertificateHash(certificate) {
  return CryptoJS.SHA256(JSON.stringify(certificate)).toString();
}

// Render blockchain blocks
function renderBlockchain() {
  const blockchainContainer = document.getElementById('blockchain-blocks');
  blockchainContainer.innerHTML = '';

  certificateChain.chain.forEach(block => {
    const blockElement = document.createElement('div');
    blockElement.className = 'block';
    
    const blockHeader = document.createElement('div');
    blockHeader.className = 'block-header';
    blockHeader.innerHTML = `
      <span><i class="fas fa-cube"></i> Block #${block.index}</span>
      <span><i class="fas fa-clock"></i> ${new Date(block.timestamp).toLocaleString()}</span>
    `;
    
    const blockData = document.createElement('div');
    blockData.className = 'block-data';
    blockData.textContent = JSON.stringify(block.data, null, 2);
    
    const blockHash = document.createElement('div');
    blockHash.className = 'block-hash';
    blockHash.innerHTML = `<strong><i class="fas fa-fingerprint"></i> Hash:</strong> <span class="hash-value">${block.hash}</span>`;
    
    blockElement.appendChild(blockHeader);
    blockElement.appendChild(blockData);
    blockElement.appendChild(blockHash);
    
    blockchainContainer.appendChild(blockElement);
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadBlockchain();
  
  const generateBtn = document.getElementById('generate-btn');
  const addToBlockchainBtn = document.getElementById('add-to-blockchain');
  
  generateBtn.addEventListener('click', () => {
    const name = document.getElementById('name').value;
    const course = document.getElementById('course').value;
    const date = document.getElementById('date').value;
    const grade = document.getElementById('grade').value;
    
    if (!name || !course || !date || !grade) {
      alert('Please fill in all fields');
      return;
    }
    
    const certificate = {
      name,
      course,
      date,
      grade,
      issueDate: new Date().toISOString()
    };
    
    const certificateHash = generateCertificateHash(certificate);
    certificate.certificateHash = certificateHash;
    
    // Display certificate
    document.getElementById('cert-name').textContent = name;
    document.getElementById('cert-course').textContent = course;
    document.getElementById('cert-date').textContent = new Date(date).toLocaleDateString();
    document.getElementById('cert-grade').textContent = grade;
    document.getElementById('cert-hash').textContent = certificateHash;
    
    document.getElementById('certificate-display').classList.remove('hidden');
    
    // Store certificate data for blockchain
    addToBlockchainBtn.dataset.certificate = JSON.stringify(certificate);
  });
  
  addToBlockchainBtn.addEventListener('click', () => {
    const certificateData = JSON.parse(addToBlockchainBtn.dataset.certificate);
    
    // Add to blockchain
    const newBlock = new Block(
      certificateChain.chain.length,
      new Date().toISOString(),
      certificateData
    );
    
    certificateChain.addBlock(newBlock);
    saveBlockchain();
    
    // Show blockchain info
    document.getElementById('blockchain-info').classList.remove('hidden');
    renderBlockchain();
    
    alert('Certificate added to blockchain successfully!');
  });
});