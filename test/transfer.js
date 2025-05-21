const { ethers } = require("hardhat");

// Minimal ERC20 ABI for transfer, balanceOf, and decimals
const ERC20_ABI = [
    // Function to get token balance
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    // Function to transfer tokens
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Function to get token decimals (optional but useful for display)
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

/**
 * Transfers a specified amount of ERC20 tokens from the signer's account
 * to a recipient address.
 * @param {ethers.Signer} signer The ethers signer object (your account).
 * @param {string} tokenAddress The address of the ERC20 token contract.
 * @param {string} toAddress The recipient address.
 * @param {ethers.BigNumberish} amount The amount of tokens to transfer (in wei/smallest unit).
 */
async function erc20Transfer(signer, tokenAddress, toAddress, amount) {
    console.log(`\nAttempting to transfer ERC20 tokens from ${signer.address} to ${toAddress}...`);
    try {
        // Get the ERC20 contract instance
        const erc20Contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

        // Fetch token details for logging
        let tokenSymbol = "Unknown";
        let tokenDecimals = 18; // Default to 18 if decimals() is not available

        try {
            tokenDecimals = await erc20Contract.decimals();
            // You might want to add a call to erc20Contract.symbol() here if available
        } catch (e) {
            console.warn(`Could not fetch decimals for token ${tokenAddress}. Assuming 18 decimals.`);
        }

        // Check current balance before transfer
        const balance = await erc20Contract.balanceOf(signer.address);
        console.log(`Current balance of token at ${tokenAddress} for ${signer.address}: ${ethers.formatUnits(balance, tokenDecimals)}`);

        if (balance < amount) {
            console.error(`Insufficient balance. Attempting to send ${ethers.formatUnits(amount, tokenDecimals)}, but only have ${ethers.formatUnits(balance, tokenDecimals)}.`);
            return; // Exit if balance is insufficient
        }

        // Perform the transfer
        const tx = await erc20Contract.transfer(toAddress, amount);
        await tx.wait(); // Wait for the transaction to be mined

        console.log(`ERC20 transfer successful!`);
        console.log(`Transferred ${ethers.formatUnits(amount, tokenDecimals)} ${tokenSymbol} tokens to ${toAddress}`);
        console.log("Transaction hash:", tx.hash);
    } catch (error) {
        console.error("Error during ERC20 transfer:", error.message);
    }
}

module.exports = {
    erc20Transfer,
    ERC20_ABI // Export ABI in case it's needed elsewhere
};
