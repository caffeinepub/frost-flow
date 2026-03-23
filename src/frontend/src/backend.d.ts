import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface OrderItem {
    productId: bigint;
    quantity: bigint;
    priceAtPurchase: bigint;
}
export interface Order {
    paymentStatus: Variant_pending_paid_failed;
    paymentMethod: Variant_cod_stripe;
    userId: Principal;
    createdAt: bigint;
    deliveryStatus: Variant_shipped_outForDelivery_delivered_confirmed_processing;
    totalAmount: bigint;
    stripePaymentIntentId?: string;
    items: Array<OrderItem>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ContactMessage {
    name: string;
    createdAt: bigint;
    email: string;
    message: string;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface CartItem {
    productId: bigint;
    quantity: bigint;
}
export interface Product {
    name: string;
    description: string;
    deliveryType: Variant_twoHours_twoDays;
    isActive: boolean;
    stock: bigint;
    imageUrl: string;
    category: string;
    price: bigint;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_cod_stripe {
    cod = "cod",
    stripe = "stripe"
}
export enum Variant_pending_paid_failed {
    pending = "pending",
    paid = "paid",
    failed = "failed"
}
export enum Variant_shipped_outForDelivery_delivered_confirmed_processing {
    shipped = "shipped",
    outForDelivery = "outForDelivery",
    delivered = "delivered",
    confirmed = "confirmed",
    processing = "processing"
}
export enum Variant_twoHours_twoDays {
    twoHours = "twoHours",
    twoDays = "twoDays"
}
export interface backendInterface {
    addToCart(productId: bigint, quantity: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCart(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createProduct(p: Product): Promise<bigint>;
    deleteProduct(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getContactMessages(): Promise<Array<ContactMessage>>;
    getOrder(id: bigint): Promise<Order>;
    getOrders(): Promise<Array<Order>>;
    getProduct(id: bigint): Promise<Product>;
    getProducts(): Promise<Array<Product>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    placeOrder(paymentMethod: Variant_cod_stripe, stripePaymentIntentId: string | null): Promise<bigint>;
    removeFromCart(productId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitMessage(name: string, email: string, message: string): Promise<bigint>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateDeliveryStatus(orderId: bigint, status: Variant_shipped_outForDelivery_delivered_confirmed_processing): Promise<void>;
    updatePaymentStatus(orderId: bigint, status: Variant_pending_paid_failed): Promise<void>;
    updateProduct(id: bigint, p: Product): Promise<void>;
}
