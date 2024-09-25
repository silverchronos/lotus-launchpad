// Launchpad.move

module Launchpad {
    use 0x1::Account;
    use 0x1::LotusCoin; // Replace with your token
    use 0x1::Event;
    use 0x1::LotusTimestamp;
    use 0x1::Signer;
    use 0x1::Vector;

// Define structures for TokenSale, sales events, vesting schedule, whitelisting, and sale manager.
    
// Information about a token sale
    struct TokenSale has key {
        creator: address,
        token_balance: u64,
        price_per_token: u64,
        sale_end: u64,
        vesting_schedule: vector<u64>, // Vesting times in seconds
        funds_raised: u64,
        max_investment_per_user: u64,
        whitelisted_investors: vector<address>,
        token: LotusCoin.T,
    }

// Event to log new sales
    struct NewSaleEvent has copy, drop, store {
        sale_id: u64,
        creator: address,
        price_per_token: u64,
        sale_end: u64,
    }

// Resource for tracking sales
    struct SalesManager has key {
        sales: vector<TokenSale>,
        new_sale_event_handle: EventHandle<NewSaleEvent>,
    }

// Initialize SalesManager
    public fun initialize(account: &signer) {
        let sales_manager = SalesManager {
            sales: vector<TokenSale>::empty(),
            new_sale_event_handle: Event::new_event_handle<NewSaleEvent>(account),
        };
        move_to(account, sales_manager);
    }
    
// Create a new sale
    public fun create_sale(
        account: &signer,
        token_balance: u64,
        price_per_token: u64,
        sale_duration: u64,
        vesting_schedule: vector<u64>,
        max_investment_per_user: u64,
        whitelisted_investors: vector<address>,
        token: LotusCoin.T
    ) {
        let creator = Signer::address_of(account);
        let current_time = LotusTimestamp::now_seconds();
        let sale_end = current_time + sale_duration;

// Create a new sale instance
        let new_sale = TokenSale {
            creator,
            token_balance,
            price_per_token,
            sale_end,
            vesting_schedule,
            funds_raised: 0,
            max_investment_per_user,
            whitelisted_investors,
            token,
        };

// Obtain reference to the sales manager
        let sales_manager_ref = borrow_global_mut<SalesManager>(creator);

// Emit the new sale event
        Event::emit_event(&mut sales_manager_ref.new_sale_event_handle, NewSaleEvent {
            sale_id: Vector::length(&sales_manager_ref.sales) as u64,
            creator,
            price_per_token,
            sale_end,
        });

// Add the new sale instance to the manager
        Vector::push_back(&mut sales_manager_ref.sales, new_sale);
    }

// Investors purchase tokens
    public fun purchase_tokens(
        sales_manager_addr: address,
        investor: &signer,
        sale_id: u64,
        amount: u64
    ) {
        let sales_manager_ref = borrow_global_mut<SalesManager>(sales_manager_addr);
        let sale_ref = &mut sales_manager_ref.sales[sale_id];
        let investor_addr = Signer::address_of(investor);

// Check if sale is still ongoing
        assert!(LotusTimestamp::now_seconds() <= sale_ref.sale_end, 1001);
        
// Check if sale has enough tokens
        assert!(sale_ref.token_balance >= amount, 1002);
        
// Check if investor is whitelisted
        assert!(is_whitelisted(&sale_ref.whitelisted_investors, investor_addr), 1003);
        
// Check if investor investment exceeds maximum investment limit
        assert!(amount <= sale_ref.max_investment_per_user, 1004);

        let cost = amount * sale_ref.price_per_token;
        LotusCoin::burn(investor, cost);
        LotusCoin::deposit(&sale_ref.creator, cost);

        sale_ref.token_balance -= amount;
        sale_ref.funds_raised += cost;

// Apply vesting schedule to the tokens
        apply_vesting_schedule(investor, amount, &sale_ref.vesting_schedule);
    }

// Helper function to check if an investor is whitelisted
    public fun is_whitelisted(whitelist: &vector<address>, investor: address): bool {
        let len = Vector::length(whitelist);
        let mut i = 0;
        while (i < len) {
            if (Vector::borrow(whitelist, i) == investor) {
                return true;
            }
            i = i + 1;
        }
        return false;
    }


// Helper function to apply vesting schedule to tokens
    public fun apply_vesting_schedule(investor: &signer, amount: u64, vesting_schedule: &vector<u64>) {
        // Implement vesting logic here.}

// Close the sale and return remaining tokens to creator
    public fun close_sale(sales_manager_addr: address, sale_id: u64, creator_account: &signer) {
        let sales_manager_ref = borrow_global_mut<SalesManager>(sales_manager_addr);
        let sale_ref = &mut sales_manager_ref.sales[sale_id];

        assert!(Signer::address_of(creator_account) == sale_ref.creator, 1005); // Only creator can close the sale

        let remaining_tokens = sale_ref.token_balance;
        sale_ref.token_balance = 0;

        LotusCoin::deposit(creator_account, remaining_tokens);
    }
}