import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import List "mo:core/List";
import Principal "mo:core/Principal";

import Stripe "stripe/stripe";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type Product = {
    name : Text;
    description : Text;
    price : Nat;
    imageUrl : Text;
    category : Text;
    deliveryType : { #twoHours; #twoDays };
    stock : Nat;
    isActive : Bool;
  };

  type CartItem = { productId : Nat; quantity : Nat };
  type OrderItem = { productId : Nat; quantity : Nat; priceAtPurchase : Nat };

  type Order = {
    userId : Principal;
    items : [OrderItem];
    totalAmount : Nat;
    paymentMethod : { #cod; #stripe };
    paymentStatus : { #pending; #paid; #failed };
    deliveryStatus : { #processing; #confirmed; #shipped; #outForDelivery; #delivered };
    createdAt : Int;
    stripePaymentIntentId : ?Text;
  };

  type ContactMessage = { name : Text; email : Text; message : Text; createdAt : Int };

  public type UserProfile = { name : Text; email : Text };

  // Caffeine authorization mixin
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Secret admin code - user must enter this to claim admin
  let ADMIN_SECRET_CODE : Text = "FROSTFLOW2024";

  // FIXED: stable keyword added so admin list survives upgrades
  stable var adminListStable : [(Principal, Bool)] = [];
  let adminList = Map.empty<Principal, Bool>();

  let userProfiles = Map.empty<Principal, UserProfile>();
  let products = Map.empty<Nat, Product>();
  var nextProductId = 1;
  let carts = Map.empty<Principal, List.List<CartItem>>();
  let orders = Map.empty<Nat, Order>();
  var nextOrderId = 1;
  let contactMessages = Map.empty<Nat, ContactMessage>();
  var nextContactMessageId = 1;
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Safe admin check
  func isAdminPrincipal(p : Principal) : Bool {
    if (p.isAnonymous()) { return false };
    switch (adminList.get(p)) {
      case (?true) { true };
      case _ { false };
    };
  };

  func assertAdminCaller(caller : Principal) {
    if (not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
  };

  // Claim admin by entering the secret code.
  // FIXED: Simplified - no filter() call, no existing-admin check.
  // Anyone with the correct code can claim admin.
  public shared ({ caller }) func claimAdminWithCode(code : Text) : async Bool {
    if (caller.isAnonymous()) { return false };
    if (code != ADMIN_SECRET_CODE) { return false };
    adminList.add(caller, true);
    true;
  };

  // Safe check - never traps
  public query ({ caller }) func checkAdminAccess() : async Bool {
    isAdminPrincipal(caller);
  };

  // Add additional admin (only existing admin can do this)
  public shared ({ caller }) func addAdmin(newAdmin : Principal) : async () {
    assertAdminCaller(caller);
    adminList.add(newAdmin, true);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdminPrincipal(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createProduct(p : Product) : async Nat {
    assertAdminCaller(caller);
    let productId = nextProductId;
    products.add(productId, { p with isActive = true });
    nextProductId += 1;
    productId;
  };

  public shared ({ caller }) func updateProduct(id : Nat, p : Product) : async () {
    assertAdminCaller(caller);
    if (not products.containsKey(id)) { Runtime.trap("Product not found") };
    products.add(id, { p with isActive = true });
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    assertAdminCaller(caller);
    products.remove(id);
  };

  public query func getProducts() : async [Product] {
    products.values().toArray();
  };

  public query func getProductsWithIds() : async [(Nat, Product)] {
    products.entries().toArray();
  };

  public query func getProduct(id : Nat) : async Product {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };
  };

  public shared ({ caller }) func addToCart(productId : Nat, quantity : Nat) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    if (quantity == 0) { Runtime.trap("Quantity must be greater than 0") };
    if (not products.containsKey(productId)) { Runtime.trap("Product not found") };
    switch (carts.get(caller)) {
      case (null) {
        carts.add(caller, List.singleton<CartItem>({ productId; quantity }));
      };
      case (?list) {
        let filtered = list.filter(func(item) { item.productId != productId });
        filtered.add({ productId; quantity });
        carts.add(caller, filtered);
      };
    };
  };

  public shared ({ caller }) func removeFromCart(productId : Nat) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    switch (carts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?list) {
        let filtered = list.filter(func(item) { item.productId != productId });
        if (filtered.isEmpty()) { carts.remove(caller) } else { carts.add(caller, filtered) };
      };
    };
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (caller.isAnonymous()) { return [] };
    switch (carts.get(caller)) {
      case (null) { [] };
      case (?cart) { cart.toArray() };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    carts.remove(caller);
  };

  public shared ({ caller }) func placeOrder(paymentMethod : { #cod; #stripe }, stripePaymentIntentId : ?Text) : async Nat {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    let cart = getCartInternal(caller);
    if (cart.isEmpty()) { Runtime.trap("Cart is empty") };
    var totalAmount = 0;
    let orderItems = cart.map<CartItem, OrderItem>(
      func(item) {
        let price = switch (products.get(item.productId)) {
          case (null) { Runtime.trap("Product not found") };
          case (?p) { p.price };
        };
        totalAmount += price * item.quantity;
        { productId = item.productId; quantity = item.quantity; priceAtPurchase = price };
      }
    );
    let orderId = nextOrderId;
    orders.add(orderId, {
      userId = caller;
      items = orderItems.toArray();
      totalAmount;
      paymentMethod;
      paymentStatus = #pending;
      deliveryStatus = #processing;
      createdAt = Time.now();
      stripePaymentIntentId;
    });
    nextOrderId += 1;
    carts.remove(caller);
    orderId;
  };

  public query ({ caller }) func getOrders() : async [Order] {
    if (isAdminPrincipal(caller)) {
      orders.values().toArray();
    } else if (not caller.isAnonymous()) {
      orders.values().toArray().filter(func(o) { o.userId == caller });
    } else {
      Runtime.trap("Unauthorized: Must be logged in");
    };
  };

  public query ({ caller }) func getOrdersWithIds() : async [(Nat, Order)] {
    if (isAdminPrincipal(caller)) {
      orders.entries().toArray();
    } else if (not caller.isAnonymous()) {
      orders.entries().toArray().filter(func(e) { e.1.userId == caller });
    } else {
      Runtime.trap("Unauthorized: Must be logged in");
    };
  };

  public query ({ caller }) func getOrder(id : Nat) : async Order {
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        if (order.userId != caller and not isAdminPrincipal(caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        order;
      };
    };
  };

  public shared ({ caller }) func updateDeliveryStatus(orderId : Nat, status : { #processing; #confirmed; #shipped; #outForDelivery; #delivered }) : async () {
    assertAdminCaller(caller);
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { orders.add(orderId, { order with deliveryStatus = status }) };
    };
  };

  public shared ({ caller }) func updatePaymentStatus(orderId : Nat, status : { #pending; #paid; #failed }) : async () {
    assertAdminCaller(caller);
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { orders.add(orderId, { order with paymentStatus = status }) };
    };
  };

  public shared func submitMessage(name : Text, email : Text, message : Text) : async Nat {
    let messageId = nextContactMessageId;
    contactMessages.add(messageId, { name; email; message; createdAt = Time.now() });
    nextContactMessageId += 1;
    messageId;
  };

  public query ({ caller }) func getContactMessages() : async [ContactMessage] {
    assertAdminCaller(caller);
    contactMessages.values().toArray();
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    assertAdminCaller(caller);
    stripeConfig := ?config;
  };

  public query func isStripeConfigured() : async Bool { stripeConfig != null };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe not configured") };
      case (?value) { value };
    };
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  func getCartInternal(userId : Principal) : List.List<CartItem> {
    switch (carts.get(userId)) {
      case (null) { List.empty<CartItem>() };
      case (?cart) { cart };
    };
  };

  system func preupgrade() {
    adminListStable := adminList.entries().toArray();
  };

  system func postupgrade() {
    for ((p, v) in adminListStable.vals()) {
      adminList.add(p, v);
    };
    if (products.size() > 0) { return };
    let samples : [Product] = [
      { name = "R134a Refrigerant"; description = "1kg can of R134a automotive refrigerant"; price = 2999; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"; category = "Refrigerants"; deliveryType = #twoDays; stock = 100; isActive = true },
      { name = "R410A Refrigerant"; description = "2kg cylinder of R410A refrigerant for HVAC"; price = 5999; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"; category = "Refrigerants"; deliveryType = #twoDays; stock = 50; isActive = true },
      { name = "R22 Refrigerant"; description = "500g can of R22 for older systems"; price = 1999; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"; category = "Refrigerants"; deliveryType = #twoDays; stock = 75; isActive = true },
      { name = "Copper Tube 1/4 Inch"; description = "10 meter roll of 1/4 inch copper tubing"; price = 1299; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"; category = "Pipes"; deliveryType = #twoDays; stock = 200; isActive = true },
      { name = "Refrigerant Hoses Set"; description = "Set of 3 colored refrigerant charging hoses"; price = 499; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"; category = "Tools"; deliveryType = #twoHours; stock = 35; isActive = true },
      { name = "R32 Refrigerant"; description = "1kg can of R32 refrigerant for new systems"; price = 2499; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"; category = "Refrigerants"; deliveryType = #twoDays; stock = 90; isActive = true },
      { name = "Vacuum Pump 2CFM"; description = "2 cubic feet per minute vacuum pump"; price = 8999; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"; category = "Tools"; deliveryType = #twoDays; stock = 20; isActive = true },
      { name = "Gauge Set"; description = "Manifold gauge set with case"; price = 3499; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"; category = "Tools"; deliveryType = #twoHours; stock = 40; isActive = true },
      { name = "Thermostat"; description = "Universal temperature thermostat"; price = 799; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"; category = "Parts"; deliveryType = #twoHours; stock = 120; isActive = true },
      { name = "Compressor Oil"; description = "1 liter bottle of compressor oil"; price = 1599; imageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"; category = "Parts"; deliveryType = #twoDays; stock = 60; isActive = true },
    ];
    let range = Nat.range(0, samples.size());
    for (i in range) {
      products.add(nextProductId, samples[i]);
      nextProductId += 1;
    };
  };
};
