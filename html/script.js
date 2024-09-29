// ... (Assume you have functions to interact with your smart contracts)

// Fetch and display projects on page load
window.onload = fetchProjects();

async function fetchProjects() {
  try {
    const projects = await getProjectsFromBlockchain(); // Replace with your actual data fetching logic
    displayProjects(projects);
  } catch (error) {
    displayError("Error fetching projects: " + error.message);
  }
}

function displayProjects(projects) {
  const projectGrid = document.getElementById('project-grid');
  projectGrid.innerHTML = ''; // Clear previous projects

  projects.forEach(project => {
    const projectCard = `
      <div class="project-card" onclick="viewSaleDetails('${project.address}')"> 
        <h4>${project.name}</h4>
        <p>${project.description}</p>
      </div>
    `;
    projectGrid.innerHTML += projectCard;
  });
}

async function viewSaleDetails(saleAddress) {
  try {
    const saleDetails = await getSaleDetails(saleAddress); // Fetch sale details
    displaySaleDetails(saleDetails);

    // ... (Show/hide sections, potentially enable/disable buttons based on sale status)
  } catch (error) {
    displayError("Error fetching sale details: " + error.message);
  }
}

function displaySaleDetails(saleDetails) {
  const saleInfo = document.getElementById('sale-info');
  // ... (Populate saleInfo with details like project name, token price, etc.)

  // ... (Show/hide user input and claim button based on sale status)
}

async function participateInSale() {
  try {
    const amount = document.getElementById('amount').value;
    await participate(saleAddress, amount); // Call your smart contract function
    // ... (Update UI to reflect participation, e.g., show success message)
  } catch (error) {
    displayError("Error participating in sale: " + error.message);
  }
}

async function claimTokens() {
  try {
    await claim(saleAddress); // Call your smart contract function
    // ... (Update UI to reflect claimed tokens)
  } catch (error) {
    displayError("Error claiming tokens: " + error.message);
  }
}

function displayError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}