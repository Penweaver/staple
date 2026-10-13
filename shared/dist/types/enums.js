/**
 * STAPLE LIMITED — Core Enums
 * Authoritative system enums matching PostgreSQL database schema (v1.1)
 */
// Identity & Roles
export var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["CHAMPION"] = "champion";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (UserRole = {}));
export var ChampionStatus;
(function (ChampionStatus) {
    ChampionStatus["INACTIVE"] = "inactive";
    ChampionStatus["ACTIVE"] = "active";
    ChampionStatus["SUSPENDED"] = "suspended";
})(ChampionStatus || (ChampionStatus = {}));
export var ChampionApplicationStatus;
(function (ChampionApplicationStatus) {
    ChampionApplicationStatus["PENDING"] = "pending";
    ChampionApplicationStatus["APPROVED"] = "approved";
    ChampionApplicationStatus["REJECTED"] = "rejected";
})(ChampionApplicationStatus || (ChampionApplicationStatus = {}));
// Group Buying
export var GroupBuyType;
(function (GroupBuyType) {
    GroupBuyType["REGULAR"] = "regular";
    GroupBuyType["FESTIVE"] = "festive";
})(GroupBuyType || (GroupBuyType = {}));
export var GroupBuyStatus;
(function (GroupBuyStatus) {
    GroupBuyStatus["DRAFT"] = "draft";
    GroupBuyStatus["PENDING_ACTIVATION"] = "pending_activation";
    GroupBuyStatus["LIVE"] = "live";
    GroupBuyStatus["TARGET_REACHED"] = "target_reached";
    GroupBuyStatus["LIFESPAN_EXPIRED"] = "lifespan_expired";
    GroupBuyStatus["DELIVERY_FULFILMENT"] = "delivery_fulfilment";
    GroupBuyStatus["COMPLETED"] = "completed";
    GroupBuyStatus["CLOSED"] = "closed";
})(GroupBuyStatus || (GroupBuyStatus = {}));
export var GroupBuyCreatorType;
(function (GroupBuyCreatorType) {
    GroupBuyCreatorType["ADMIN"] = "admin";
    GroupBuyCreatorType["CHAMPION"] = "champion";
})(GroupBuyCreatorType || (GroupBuyCreatorType = {}));
// Orders & Refunds
export var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PAYMENT_PROCESSING"] = "payment_processing";
    OrderStatus["PAID"] = "paid";
    OrderStatus["FULFILMENT_READY"] = "fulfilment_ready";
    OrderStatus["IN_FULFILMENT"] = "in_fulfilment";
    OrderStatus["FULFILLED"] = "fulfilled";
    OrderStatus["COLLECTED"] = "collected";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (OrderStatus = {}));
export var RefundReason;
(function (RefundReason) {
    RefundReason["USER_CANCELLED"] = "user_cancelled";
    RefundReason["MVFQ_NOT_MET"] = "mvfq_not_met";
    RefundReason["FULFILMENT_FAILED"] = "fulfilment_failed";
    RefundReason["FESTIVE_SEASON_CANCELLED"] = "festive_season_cancelled";
})(RefundReason || (RefundReason = {}));
// Payments
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["INITIATED"] = "initiated";
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["SUCCESSFUL"] = "successful";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["ABANDONED"] = "abandoned";
})(PaymentStatus || (PaymentStatus = {}));
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["GATEWAY"] = "gateway";
    PaymentMethod["WALLET"] = "wallet";
    PaymentMethod["SPLIT"] = "split";
})(PaymentMethod || (PaymentMethod = {}));
export var PaymentGatewayProvider;
(function (PaymentGatewayProvider) {
    PaymentGatewayProvider["PAYSTACK"] = "paystack";
    PaymentGatewayProvider["FLUTTERWAVE"] = "flutterwave";
})(PaymentGatewayProvider || (PaymentGatewayProvider = {}));
// Wallet
export var WalletTransactionType;
(function (WalletTransactionType) {
    WalletTransactionType["CREDIT_PRICE_ADJUSTMENT"] = "credit_price_adjustment";
    WalletTransactionType["CREDIT_PROMOTIONAL"] = "credit_promotional";
    WalletTransactionType["CREDIT_OPERATIONAL"] = "credit_operational";
    WalletTransactionType["CREDIT_CHAMPION_MILESTONE"] = "credit_champion_milestone";
    WalletTransactionType["CREDIT_REFUND"] = "credit_refund";
    WalletTransactionType["DEBIT_PURCHASE"] = "debit_purchase";
    WalletTransactionType["DEBIT_REVERSAL"] = "debit_reversal";
})(WalletTransactionType || (WalletTransactionType = {}));
export var WalletEntrySide;
(function (WalletEntrySide) {
    WalletEntrySide["DEBIT"] = "debit";
    WalletEntrySide["CREDIT"] = "credit";
})(WalletEntrySide || (WalletEntrySide = {}));
// Festive
export var FestiveCategory;
(function (FestiveCategory) {
    FestiveCategory["CHRISTMAS"] = "christmas";
    FestiveCategory["ILEYA"] = "ileya";
    FestiveCategory["OWAMBE_PARTY"] = "owambe_party";
})(FestiveCategory || (FestiveCategory = {}));
export var FestivePaymentType;
(function (FestivePaymentType) {
    FestivePaymentType["OUTRIGHT"] = "outright";
    FestivePaymentType["INSTALMENT"] = "instalment";
})(FestivePaymentType || (FestivePaymentType = {}));
export var InstalmentStatus;
(function (InstalmentStatus) {
    InstalmentStatus["PENDING"] = "pending";
    InstalmentStatus["PAID"] = "paid";
    InstalmentStatus["OVERDUE"] = "overdue";
    InstalmentStatus["CANCELLED"] = "cancelled";
})(InstalmentStatus || (InstalmentStatus = {}));
// Fulfilment
export var FulfilmentStatus;
(function (FulfilmentStatus) {
    FulfilmentStatus["PENDING"] = "pending";
    FulfilmentStatus["PREPARING"] = "preparing";
    FulfilmentStatus["READY_FOR_COLLECTION"] = "ready_for_collection";
    FulfilmentStatus["IN_DELIVERY"] = "in_delivery";
    FulfilmentStatus["COLLECTED"] = "collected";
    FulfilmentStatus["DELIVERED"] = "delivered";
    FulfilmentStatus["FAILED"] = "failed";
})(FulfilmentStatus || (FulfilmentStatus = {}));
export var FulfilmentMethod;
(function (FulfilmentMethod) {
    FulfilmentMethod["COLLECTION"] = "collection";
    FulfilmentMethod["DELIVERY"] = "delivery";
})(FulfilmentMethod || (FulfilmentMethod = {}));
// Communication & Support
export var NotificationType;
(function (NotificationType) {
    NotificationType["GROUP_BUY_CREATED"] = "group_buy_created";
    NotificationType["GROUP_BUY_LIVE"] = "group_buy_live";
    NotificationType["GROUP_BUY_SHARED"] = "group_buy_shared";
    NotificationType["PRICING_TIER_REACHED"] = "pricing_tier_reached";
    NotificationType["WALLET_CREDITED"] = "wallet_credited";
    NotificationType["TARGET_APPROACHING"] = "target_approaching";
    NotificationType["TARGET_REACHED"] = "target_reached";
    NotificationType["GROUP_BUY_EXPIRING"] = "group_buy_expiring";
    NotificationType["GROUP_BUY_FULFILMENT"] = "group_buy_fulfilment";
    NotificationType["ORDER_CONFIRMED"] = "order_confirmed";
    NotificationType["PAYMENT_SUCCESSFUL"] = "payment_successful";
    NotificationType["PAYMENT_FAILED"] = "payment_failed";
    NotificationType["FULFILMENT_READY"] = "fulfilment_ready";
    NotificationType["COLLECTION_READY"] = "collection_ready";
    NotificationType["FESTIVE_INSTALMENT_REMINDER"] = "festive_instalment_reminder";
    NotificationType["CHAMPION_APPROVED"] = "champion_approved";
    NotificationType["CHAMPION_SUSPENDED"] = "champion_suspended";
    NotificationType["SUPPORT_RESPONSE"] = "support_response";
    NotificationType["GENERAL"] = "general";
})(NotificationType || (NotificationType = {}));
export var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["IN_APP"] = "in_app";
})(NotificationChannel || (NotificationChannel = {}));
export var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["IN_PROGRESS"] = "in_progress";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (TicketStatus = {}));
//# sourceMappingURL=enums.js.map