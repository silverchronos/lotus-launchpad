// app.js

let web3;
let contract;
const contractAddress = 'YOUR_CONTRACT_ADDRESS';
const contractABI = [ /* Your Contract ABI here */ ];

async function loadWeb3() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
    } else if (window.web3) {
        web3 = new Web3(web3.currentProvider);
    } else {
        displayNotification('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
}

async function loadContract() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
}

async function load() {
    await loadWeb3();
    await loadContract();
    await loadSales();
}

function displayNotification(message) {
    const notification = document.getElementById('notification');
    notification.innerText = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

async function createSale() {
    const tokenBalance = document.getElementById('token-balance').value;
    const pricePerToken = document.getElementById('price-per-token').value;
    const saleDuration = document.getElementById('sale-duration').value;
    const vestingSchedule = document.getElementById('vesting-schedule').value.split(',').map(Number);
    const maxInvestment = document.getElementById('max-investment').value;
    const whitelistedInvestors = document.getElementById('whitelisted-investors').value.split(',');

    // Input validation
    if (tokenBalance <= 0 || pricePerToken <= 0 || saleDuration <= 0 || maxInvestment <= 0 || whitelistedInvestors.length === 0) {
        displayNotification('Please fill in all fields correctly.');
        return;
    }

    try {
        const tx = await contract.create_sale(
            tokenBalance, 
            pricePerToken,
            saleDuration,
            vestingSchedule,
            maxInvestment,
            whitelistedInvestors,
            {} // Optional token data-specific to your project
        );
        await tx.wait();
        displayNotification('Sale created successfully.');
        loadSales();
    } catch (error) {
        console.error(error);
        displayNotification('Error creating sale.');
    }
}

async function loadSales() {
    try {
        const sales = await contract.getSales();
        const salesList = document.getElementById('sales');
        salesList.innerHTML = '';

        sales.forEach((sale, index) => {
            salesList.innerHTML += `
                <div class="sale">
                    <p>Sale ID: ${index}</p>
                    <p>Token Balance: ${sale.token_balance}</p>
                    <p>Price per Token: ${sale.price_per_token}</p>
                    <p>Sale End Time: ${new Date(sale.sale_end * 1000).toLocaleString()}</p>
                    <p>Vesting Schedule: ${sale.vesting_schedule.map(sec => new Date(sec * 1000).toLocaleString()).join(', ')}</p>
                    <p>Max Investment Per User: ${sale.max_investment_per_user}</p>
                    <p>Whitelisted Investors: ${sale.whitelisted_investors.join(', ')}</p>
                    <button onclick="purchaseTokens(${index})">Invest</button>
                </div>
            `;
        });
    } catch (error) {
        console.error(error);
        displayNotification('Error loading sales.');
    }
}

async function purchaseTokens(saleId) {
    const amount = prompt("Enter the amount you want to invest:");

    // Input validation
    if (isNaN(amount) || amount <= 0) {
        displayNotification('Please enter a valid amount.');
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        const tx = await contract.purchase_tokens(contractAddress, saleId, amount).send({ from: accounts[0] });
        await tx.wait();
        displayNotification('Tokens purchased successfully.');
        loadSales();
    } catch (error) {
        console.error(error);
        displayNotification('Error purchasing tokens. Please try again.');
    }
}

document.getElementById('create-sale-button').addEventListener('click', createSale);

window.addEventListener('load', load);