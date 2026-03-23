import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Order "mo:core/Order";
import List "mo:core/List";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Principal "mo:core/Principal";

import Stripe "stripe/stripe";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // === Types ===

  type Product = {
    name : Text;
    description : Text;
    price : Nat; // in cents
    imageUrl : Text;
    category : Text;
    deliveryType : {
      #twoHours;
      #twoDays;
    };
    stock : Nat;
    isActive : Bool;
  };

  module Product {
    public func compare(product1 : Product, product2 : Product) : Order.Order {
      Text.compare(product1.name, product2.name);
    };
  };

  type CartItem = {
    productId : Nat;
    quantity : Nat;
  };

  type OrderItem = {
    productId : Nat;
    quantity : Nat;
    priceAtPurchase : Nat;
  };

  type Order = {
    userId : Principal;
    items : [OrderItem];
    totalAmount : Nat;
    paymentMethod : {
      #cod;
      #stripe;
    };
    paymentStatus : {
      #pending;
      #paid;
      #failed;
    };
    deliveryStatus : {
      #processing;
      #confirmed;
      #shipped;
      #outForDelivery;
      #delivered;
    };
    createdAt : Int;
    stripePaymentIntentId : ?Text;
  };

  type ContactMessage = {
    name : Text;
    email : Text;
    message : Text;
    createdAt : Int;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
  };

  // === State ===

  // Access control
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Products storage
  let products = Map.empty<Nat, Product>();
  var nextProductId = 1;

  // Carts
  let carts = Map.empty<Principal, List.List<CartItem>>();

  // Orders
  let orders = Map.empty<Nat, Order>();
  var nextOrderId = 1;

  // Contact messages
  let contactMessages = Map.empty<Nat, ContactMessage>();
  var nextContactMessageId = 1;

  // Stripe config
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // === Auto Admin Registration ===

  // First caller becomes admin automatically (tokens both empty = always match on first call).
  // Subsequent callers are registered as regular users.
  public shared ({ caller }) func registerOrAutoAdmin() : async Bool {
    if (caller.isAnonymous()) {
      return false;
    };
    AccessControl.initialize(accessControlState, caller, "", "");
    AccessControl.isAdmin(accessControlState, caller);
  };

  // === User Profile Functions ===

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // === Product Functions ===

  public shared ({ caller }) func createProduct(p : Product) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };

    let productId = nextProductId;
    products.add(
      productId,
      {
        p with
        isActive = true;
      },
    );
    nextProductId += 1;
    productId;
  };

  public shared ({ caller }) func updateProduct(id : Nat, p : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };

    if (not products.containsKey(id)) {
      Runtime.trap("Product not found");
    };

    products.add(
      id,
      {
        p with
        isActive = true;
      },
    );
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    products.remove(id);
  };

  public query ({ caller }) func getProducts() : async [Product] {
    // Public access - anyone can list products
    products.values().toArray().sort();
  };

  public query ({ caller }) func getProduct(id : Nat) : async Product {
    // Public access - anyone can get a product
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };
  };

  // === Cart Functions ===

  public shared ({ caller }) func addToCart(productId : Nat, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };

    if (quantity <= 0) {
      Runtime.trap("Quantity must be greater than 0");
    };

    if (not products.containsKey(productId)) {
      Runtime.trap("Product not found");
    };

    let currentCart = carts.get(caller);
    switch (currentCart) {
      case (null) {
        let newCart = List.singleton<CartItem>({ productId; quantity });
        carts.add(caller, newCart);
      };
      case (?list) {
        let filteredList = list.filter(
          func(item) { item.productId != productId }
        );
        filteredList.add({ productId; quantity });
        carts.add(caller, filteredList);
      };
    };
  };

  public shared ({ caller }) func removeFromCart(productId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };

    let currentCart = carts.get(caller);
    switch (currentCart) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?list) {
        let filteredList = list.filter(
          func(item) { item.productId != productId }
        );
        if (filteredList.isEmpty()) {
          carts.remove(caller);
        } else {
          carts.add(caller, filteredList);
        };
      };
    };
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access cart");
    };

    switch (carts.get(caller)) {
      case (null) { [] };
      case (?cart) { cart.toArray() };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };

    carts.remove(caller);
  };

  // === Order Functions ===

  public shared ({ caller }) func placeOrder(paymentMethod : { #cod; #stripe }, stripePaymentIntentId : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    let cart = getCartInternal(caller);
    if (cart.isEmpty()) {
      Runtime.trap("Cart is empty");
    };

    // Calculate total amount
    var totalAmount = 0;
    let orderItems = cart.map<CartItem, OrderItem>(
      func(item) {
        let price = switch (products.get(item.productId)) {
          case (null) { Runtime.trap("Product not found") };
          case (?p) { p.price };
        };
        totalAmount += price * item.quantity;
        {
          productId = item.productId;
          quantity = item.quantity;
          priceAtPurchase = price;
        };
      }
    );

    // Create order
    let orderId = nextOrderId;
    let order : Order = {
      userId = caller;
      items = orderItems.toArray();
      totalAmount;
      paymentMethod;
      paymentStatus = #pending;
      deliveryStatus = #processing;
      createdAt = Time.now();
      stripePaymentIntentId;
    };

    // Store order and clear cart
    orders.add(orderId, order);
    nextOrderId += 1;
    carts.remove(caller);

    orderId;
  };

  public query ({ caller }) func getOrders() : async [Order] {
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      // Admins can see all orders
      orders.values().toArray();
    } else if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      // Users can see only their own orders
      orders.values().toArray().filter(
        func(order) { order.userId == caller }
      );
    } else {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
  };

  public query ({ caller }) func getOrder(id : Nat) : async Order {
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        // Users can only see their own orders, admins can see all
        if (order.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        order;
      };
    };
  };

  public shared ({ caller }) func updateDeliveryStatus(orderId : Nat, status : { #processing; #confirmed; #shipped; #outForDelivery; #delivered }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder : Order = {
          order with
          deliveryStatus = status;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func updatePaymentStatus(orderId : Nat, status : { #pending; #paid; #failed }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder : Order = {
          order with
          paymentStatus = status;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  // === Contact Form Functions ===

  public shared ({ caller }) func submitMessage(name : Text, email : Text, message : Text) : async Nat {
    // Public access - anyone including guests can submit messages
    let messageId = nextContactMessageId;
    let contactMessage : ContactMessage = {
      name;
      email;
      message;
      createdAt = Time.now();
    };
    contactMessages.add(messageId, contactMessage);
    nextContactMessageId += 1;
    messageId;
  };

  public query ({ caller }) func getContactMessages() : async [ContactMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    contactMessages.values().toArray();
  };

  // === Stripe Integration ===

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    stripeConfig := ?config;
  };

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe not configured") };
      case (?value) { value };
    };
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    // Public access - required for HTTP outcalls
    OutCall.transform(input);
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    // Public access - needed for payment verification
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  // === Helper Functions ===

  func getCartInternal(userId : Principal) : List.List<CartItem> {
    switch (carts.get(userId)) {
      case (null) { List.empty<CartItem>() };
      case (?cart) { cart };
    };
  };

  // === Seed Data ===

  system func preupgrade() {};
  system func postupgrade() {
    // Seed 10 sample products
    let sampleProducts : [Product] = [
      {
        name = "R134a Refrigerant";
        description = "1kg can of R134a automotive refrigerant";
        price = 2999;
        imageUrl = "https://example.com/images/r134a.jpg";
        category = "Refrigerants";
        deliveryType = #twoDays;
        stock = 100;
        isActive = true;
      },
      {
        name = "R410A Refrigerant";
        description = "2kg cylinder of R410A refrigerant for HVAC";
        price = 5999;
        imageUrl = "https://example.com/images/r410a.jpg";
        category = "Refrigerants";
        deliveryType = #twoDays;
        stock = 50;
        isActive = true;
      },
      {
        name = "R22 Refrigerant";
        description = "500g can of R22 for older systems";
        price = 1999;
        imageUrl = "https://example.com/images/r22.jpg";
        category = "Refrigerants";
        deliveryType = #twoDays;
        stock = 75;
        isActive = true;
      },
      {
        name = "Copper Tube 1/4 Inch";
        description = "10 meter roll of 1/4 inch copper tubing";
        price = 1299;
        imageUrl = "https://example.com/images/copper-tube.jpg";
        category = "Pipes";
        deliveryType = #twoDays;
        stock = 200;
        isActive = true;
      },
      {
        name = "Refrigerant Hoses Set";
        description = "Set of 3 colored refrigerant charging hoses";
        price = 499;
        imageUrl = "https://example.com/images/hoses.jpg";
        category = "Tools";
        deliveryType = #twoHours;
        stock = 35;
        isActive = true;
      },
      {
        name = "R32 Refrigerant";
        description = "1kg can of R32 refrigerant for new systems";
        price = 2499;
        imageUrl = "https://example.com/images/r32.jpg";
        category = "Refrigerants";
        deliveryType = #twoDays;
        stock = 90;
        isActive = true;
      },
      {
        name = "Vacuum Pump 2CFM";
        description = "2 cubic feet per minute vacuum pump";
        price = 8999;
        imageUrl = "https://example.com/images/vacuum-pump.jpg";
        category = "Tools";
        deliveryType = #twoDays;
        stock = 20;
        isActive = true;
      },
      {
        name = "Gauge Set";
        description = "Manifold gauge set with case";
        price = 3499;
        imageUrl = "https://example.com/images/gauge-set.jpg";
        category = "Tools";
        deliveryType = #twoHours;
        stock = 40;
        isActive = true;
      },
      {
        name = "Thermostat";
        description = "Universal temperature thermostat";
        price = 799;
        imageUrl = "https://example.com/images/thermostat.jpg";
        category = "Parts";
        deliveryType = #twoHours;
        stock = 120;
        isActive = true;
      },
      {
        name = "Compressor Oil";
        description = "1 liter bottle of compressor oil";
        price = 1599;
        imageUrl = "https://example.com/images/compressor-oil.jpg";
        category = "Parts";
        deliveryType = #twoDays;
        stock = 60;
        isActive = true;
      },
    ];

    let range = Nat.range(0, sampleProducts.size());
    for (i in range) {
      products.add(nextProductId, sampleProducts[i]);
      nextProductId += 1;
    };
  };
};
