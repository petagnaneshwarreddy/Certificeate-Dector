import CryptoJS from 'https://cdn.skypack.dev/crypto-js';

// Blockchain class (same as in script.js)
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
    return this.chain.find(block => 
      block.hash === hash || 
      (block.data && block.data.certificateHash === hash)
    );
  }
}

// Load blockchain from localStorage
function loadBlockchain() {
  const savedChain = localStorage.getItem('certificateChain');
  if (savedChain) {
    const certificateChain = new Blockchain();
    certificateChain.chain = JSON.parse(savedChain);
    return certificateChain;
  }
  return new Blockchain();
}

// Verify certificate
function verifyCertificate(hash) {
  const certificateChain = loadBlockchain();
  
  // Check if chain is valid
  if (!certificateChain.isChainValid()) {
    return { 
      valid: false, 
      message: "Blockchain integrity compromised. Certificates cannot be verified.", 
      status: "FAKE"
    };
  }
  
  // Find certificate in blockchain
  const block = certificateChain.findBlockByHash(hash);
  
  if (!block) {
    return { 
      valid: false, 
      message: "Certificate not found in blockchain.", 
      status: "FAKE"
    };
  }
  
  // If it's not the certificate hash but the block hash that matched
  if (block.hash === hash) {
    return { 
      valid: true, 
      message: "Block verified successfully.", 
      block: block,
      status: "REAL"
    };
  }
  
  // If it's the certificate hash that matched
  if (block.data && block.data.certificateHash === hash) {
    // Verify certificate hash
    const certificateData = { ...block.data };
    const certificateHash = certificateData.certificateHash;
    
    // Remove hash property for verification
    delete certificateData.certificateHash;
    
    // Calculate hash again
    const calculatedHash = CryptoJS.SHA256(JSON.stringify(certificateData)).toString();
    
    // Add hash back
    certificateData.certificateHash = certificateHash;
    
    if (calculatedHash !== certificateHash) {
      return { 
        valid: false, 
        message: "Certificate data has been tampered with.", 
        status: "FAKE"
      };
    }
    
    return { 
      valid: true, 
      message: "Certificate verified successfully.", 
      block: block,
      status: "REAL"
    };
  }
  
  return { 
    valid: false, 
    message: "Certificate verification failed.", 
    status: "FAKE"
  };
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const verifyBtn = document.getElementById('verify-btn');
  
  verifyBtn.addEventListener('click', () => {
    const certificateHash = document.getElementById('certificate-hash').value.trim();
    
    if (!certificateHash) {
      alert('Please enter a certificate hash');
      return;
    }
    
    const result = verifyCertificate(certificateHash);
    const resultElement = document.getElementById('result-status');
    const certificateDetails = document.getElementById('certificate-details');
    
    if (result.valid) {
      resultElement.innerHTML = `
        <div class="valid-result">
          <i class="fas fa-check-circle"></i> ${result.message}
          <div class="certificate-status real">
            <i class="fas fa-shield-alt"></i> STATUS: ${result.status}
          </div>
        </div>`;
      
      // Display certificate details
      const block = result.block;
      const certificate = block.data;
      
      document.getElementById('verify-name').textContent = certificate.name;
      document.getElementById('verify-course').textContent = certificate.course;
      document.getElementById('verify-date').textContent = new Date(certificate.date).toLocaleDateString();
      document.getElementById('verify-grade').textContent = certificate.grade;
      document.getElementById('verify-hash').textContent = certificate.certificateHash;
      
      document.getElementById('block-number').textContent = block.index;
      document.getElementById('block-timestamp').textContent = new Date(block.timestamp).toLocaleString();
      
      certificateDetails.classList.remove('hidden');
      certificateDetails.querySelector('.certificate').classList.add('real');
    } else {
      resultElement.innerHTML = `
        <div class="invalid-result">
          <i class="fas fa-times-circle"></i> ${result.message}
          <div class="certificate-status fake">
            <i class="fas fa-exclamation-triangle"></i> STATUS: ${result.status}
          </div>
        </div>`;
      certificateDetails.classList.add('hidden');
      certificateDetails.querySelector('.certificate')?.classList.remove('real');
    }
    
    document.getElementById('verification-result').classList.remove('hidden');
  });
});