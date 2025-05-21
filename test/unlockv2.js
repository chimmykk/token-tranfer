const { ethers } = require("hardhat");
const { erc20Transfer } = require("./transfer"); // Import the transfer function

async function main() {
    // --- Configuration ---
    // Replace with your TokenPool contract address
    const TOKEN_POOL_ADDRESS = "0x0Ea7f06D7694058B82d46Fb5c9281e1843Aa8702"; 
    // Replace with the ERC20 token address you want to transfer
    const ERC20_TOKEN_ADDRESS = "0x95b303987a60c71504d99aa1b13b4da07b0790ab"; 
    // The recipient address for the ERC20 transfer
    const RECIPIENT_ADDRESS = "0xea1752EFc3Bf0B88Bf3c8bc62B112A5E33261404";
    // The amount of ERC20 tokens to transfer.
    // IMPORTANT: This is in the smallest unit (e.g., wei for 18 decimal tokens).
    // For example, to transfer 10 tokens with 18 decimals, use ethers.parseUnits("10", 18).
    // For simplicity, we'll try to transfer the entire balance after withdrawal.
    // If you want to transfer a fixed amount, replace this with a specific value.
    let amountToTransfer; // This will be set to the full balance later

    // Get the signer (your account)
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    // Get the TokenPool contract instance
    const tokenPool = await ethers.getContractAt(
        "TokenPool", // The contract name from your Solidity file
        TOKEN_POOL_ADDRESS,
        signer
    );

    console.log("Connected to TokenPool at:", tokenPool.target);

    // --- Unlock Operation ---
    console.log("\nAttempting to unlock tokens...");
    try {
        const userInfo = await tokenPool.userInfo(signer.address);
        if (userInfo.locked) {
            console.log(`User ${signer.address} has locked tokens. Lock End Time: ${new Date(Number(userInfo.lockEndTime) * 1000)}`);
            // Only attempt unlock if current time is past lock end time + free duration
            // This logic is based on the contract's `updateUserShare`
            // For a forced unlock, you might need to adjust the contract or wait.
            // Assuming `unlock` function in contract handles timing or is for admin.
            // If `unlock` is user-callable and only works after lockEndTime,
            // you might need to wait or ensure the lock period has passed.
            const txUnlock = await tokenPool.unlock(signer.address);
            await txUnlock.wait();
            console.log("Unlock transaction successful! Transaction hash:", txUnlock.hash);
        } else {
            console.log("Tokens are not locked, no unlock operation needed.");
        }
    } catch (error) {
        console.error("Error during unlock operation:", error.message);
    }

    // --- Withdraw All Operation ---
    console.log("\nAttempting to withdraw all tokens...");
    try {
        const txWithdrawAll = await tokenPool.withdrawAll();
        await txWithdrawAll.wait();
        console.log("Withdraw all transaction successful! Transaction hash:", txWithdrawAll.hash);

        // After withdrawal, fetch the balance of the ERC20 token
        const erc20Contract = new ethers.Contract(ERC20_TOKEN_ADDRESS, ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"], signer);
        const currentERC20Balance = await erc20Contract.balanceOf(signer.address);
        const tokenDecimals = await erc20Contract.decimals();
        console.log(`Balance of ERC20 token (${ERC20_TOKEN_ADDRESS}) after withdrawal: ${ethers.formatUnits(currentERC20Balance, tokenDecimals)}`);
        amountToTransfer = currentERC20Balance; // Set amount to transfer to the full balance
        
    } catch (error) {
        console.error("Error during withdraw all operation:", error.message);
        // If withdrawal fails, we might not want to proceed with transfer
        process.exit(1); 
    }

    // --- ERC20 Transfer Operation (with 1ms delay) ---
    // The 1ms delay is symbolic here as `await tx.wait()` ensures the previous transaction is mined.
    // For real-world scenarios, if there were external dependencies, a longer delay might be considered.
    console.log("\nWaiting 1ms before ERC20 transfer...");
    await new Promise(resolve => setTimeout(resolve, 1)); 

    if (amountToTransfer && amountToTransfer > 0) {
        await erc20Transfer(signer, ERC20_TOKEN_ADDRESS, RECIPIENT_ADDRESS, amountToTransfer);
    } else {
        console.log("No ERC20 tokens to transfer or balance is zero after withdrawal.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
