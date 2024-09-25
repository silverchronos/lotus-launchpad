// app.js

let web3;
let contract;
const contractAddress = 'YOUR_CONTRACT_ADDRESS';
const contractABI = [ /* Your Contract ABI here */ ];

window.addEventListener('load', async () => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.enable();
            initContract();
            loadSales();
        } catch (error) {
            console.error("User denied account access...");
        }
    } else if (window.web3) {
        web3 = new Web3(web3.currentProvider);
        initContract();
        loadSales();
    } else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
});

function initContract() {
    contract = new web3.eth.Contract(contractABI, contractAddress);
}

async function createSale() {
    const accounts = await web3.eth.getAccounts();
    const tokenBalance = document.getElementById('token-balance').value;
    const pricePerToken = document.getElementById('price-per-token').value;
    const saleDuration = document.getElementById('sale-duration').value;
    const vestingSchedule = document.getElementById('vesting-schedule').value.split(',').map(Number);
    const maxInvestment = document.getElementById('max-investment').value;
    const whitelistedInvestors = document.getElementById('whitelisted-investors').value.split(',');

    await contract.methods.create_sale(
        tokenBalance, 
        pricePerToken,
        saleDuration,
        vestingSchedule,
        maxInvestment,
        whitelistedInvestors,
        {} /* Optional token data-specific to your project */
    ).send({ from: accounts[0] });
}

async function loadSales() {
    const sales = await contract.methods.getSales().call();
    const salesList = document.getElementById('sales');
    salesList.innerHTML = '';

    sales.forEach((sale, index) => {
        salesList.innerHTML += `
            <div class="sale">
                <p>Sale ID: ${index}</p>
                <p>Token Balance: ${sale.token_balance}</p>
                <p>Price per Token: ${sale.price_per_token}</p>
                <p>Sale End Time: ${new Date(sale.sale_end * 1000).toLocaleString()}</p>
                <p>Vesting Schedule: ${sale.vesting_schedule.join(', ')}</p>
                <p>Max Investment Per User: ${sale.max_investment_per_user}</p>
                <p>Whitelisted Investors: ${sale.whitelisted_investors.join(', ')}</p>
                <button onclick="purchaseTokens(${index})">Invest</button>
            </div>
        `;
    });
}

async function purchaseTokens(saleId) {
    const accounts = await web3.eth.getAccounts();
    const amount = prompt("Enter the amount you want to invest:");

    try {
        await contract.methods.purchase_tokens(contractAddress, saleId, amount).send({ from: accounts[0] });
        alert('Tokens purchased successfully!');
        loadSales();
    } catch (error) {
        console.error("Purchase failed", error);
        alert('Purchase failed. Please try again.');
    }
}